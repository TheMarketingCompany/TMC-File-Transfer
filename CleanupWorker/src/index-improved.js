/**
 * Enhanced Cleanup Worker for TMC File Transfer
 * - Handles file expiration and cleanup
 * - Manages one-time downloads
 * - Maintains rate limiting data
 * - Implements proper error handling and logging
 */

export default {
  /**
   * Scheduled event handler for periodic cleanup operations
   * Runs at configured intervals to clean expired files and data
   */
  async scheduled(event, env, ctx) {
    console.log('Starting scheduled cleanup job...');
    
    try {
      await performCleanup(env, ctx);
      console.log('Cleanup job completed successfully');
    } catch (error) {
      console.error('Cleanup job failed:', error);
      // Don't throw to prevent worker from being marked as failed
    }
  },

  /**
   * Manual cleanup trigger via HTTP request
   * Useful for debugging and manual maintenance
   */
  async fetch(request, env, ctx) {
    // Only allow POST requests for security
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Simple authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.CLEANUP_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const stats = await performCleanup(env, ctx);
      return new Response(JSON.stringify({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Manual cleanup failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Performs comprehensive cleanup operations
 * @param {Object} env - Environment bindings
 * @param {Object} ctx - Execution context
 * @returns {Object} Cleanup statistics
 */
async function performCleanup(env, ctx) {
  const currentTime = Math.floor(Date.now() / 1000);
  const stats = {
    filesProcessed: 0,
    filesDeleted: 0,
    rateLimitEntriesDeleted: 0,
    storageSpaceFreed: 0,
    errors: 0
  };

  try {
    // Clean up expired files and consumed one-time downloads
    await cleanupFiles(env, currentTime, stats);
    
    // Clean up old rate limiting entries
    await cleanupRateLimits(env, currentTime, stats);
    
    // Optimize database
    await optimizeDatabase(env);
    
  } catch (error) {
    console.error('Error during cleanup operations:', error);
    stats.errors++;
    throw error;
  }

  return stats;
}

/**
 * Cleans up expired files and consumed one-time downloads
 * @param {Object} env - Environment bindings
 * @param {number} currentTime - Current Unix timestamp
 * @param {Object} stats - Statistics object to update
 */
async function cleanupFiles(env, currentTime, stats) {
  try {
    // Get all files that need cleanup
    const query = `
      SELECT file_id, file_name, original_name, file_size, expires_at, download_count, max_downloads, is_one_time
      FROM uploads_v2 
      WHERE expires_at < ? 
         OR (is_one_time = 1 AND download_count > 0)
         OR download_count >= max_downloads
      ORDER BY expires_at ASC
    `;
    
    const result = await env.DB.prepare(query).bind(currentTime).all();
    
    if (!result.success) {
      throw new Error('Failed to query files for cleanup');
    }

    console.log(`Found ${result.results.length} files to clean up`);
    stats.filesProcessed = result.results.length;

    // Process files in batches to avoid timeout
    const batchSize = 50;
    for (let i = 0; i < result.results.length; i += batchSize) {
      const batch = result.results.slice(i, i + batchSize);
      await processBatch(env, batch, stats);
    }

  } catch (error) {
    console.error('Error cleaning up files:', error);
    stats.errors++;
    throw error;
  }
}

/**
 * Processes a batch of files for cleanup
 * @param {Object} env - Environment bindings
 * @param {Array} files - Batch of files to process
 * @param {Object} stats - Statistics object to update
 */
async function processBatch(env, files, stats) {
  const filesToDelete = [];
  
  for (const file of files) {
    try {
      // Try to delete from R2 storage
      const deleteResult = await env.TRANSFER_BUCKET.delete(file.file_name);
      
      // Track storage space freed (approximate)
      if (file.file_size) {
        stats.storageSpaceFreed += file.file_size;
      }
      
      filesToDelete.push(file.file_id);
      stats.filesDeleted++;
      
      console.log(`Deleted file: ${file.original_name} (${file.file_id})`);
      
    } catch (error) {
      console.error(`Failed to delete file ${file.file_name}:`, error);
      stats.errors++;
      
      // Still add to database deletion list since file might not exist in storage
      filesToDelete.push(file.file_id);
    }
  }

  // Remove database records for all processed files
  if (filesToDelete.length > 0) {
    try {
      const placeholders = filesToDelete.map(() => '?').join(',');
      const deleteQuery = `DELETE FROM uploads_v2 WHERE file_id IN (${placeholders})`;
      
      const dbResult = await env.DB.prepare(deleteQuery).bind(...filesToDelete).run();
      
      if (!dbResult.success) {
        console.error('Failed to delete database records for batch');
        stats.errors++;
      } else {
        console.log(`Deleted ${dbResult.changes} database records`);
      }
      
    } catch (error) {
      console.error('Error deleting database records:', error);
      stats.errors++;
    }
  }
}

/**
 * Cleans up old rate limiting entries
 * @param {Object} env - Environment bindings
 * @param {number} currentTime - Current Unix timestamp
 * @param {Object} stats - Statistics object to update
 */
async function cleanupRateLimits(env, currentTime, stats) {
  try {
    // Remove rate limit entries older than 24 hours
    const cutoffTime = currentTime - 86400;
    
    const result = await env.DB.prepare(`
      DELETE FROM rate_limits 
      WHERE timestamp < ?
    `).bind(cutoffTime).run();
    
    if (result.success) {
      stats.rateLimitEntriesDeleted = result.changes || 0;
      console.log(`Deleted ${stats.rateLimitEntriesDeleted} old rate limit entries`);
    } else {
      console.error('Failed to clean up rate limit entries');
      stats.errors++;
    }
    
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    stats.errors++;
  }
}

/**
 * Optimizes database by running maintenance commands
 * @param {Object} env - Environment bindings
 */
async function optimizeDatabase(env) {
  try {
    // Run VACUUM to reclaim space (be careful with frequency)
    // Only run if it's been a while since last vacuum
    const lastVacuum = await env.DB.prepare(`
      SELECT value FROM metadata WHERE key = 'last_vacuum'
    `).first();
    
    const currentTime = Math.floor(Date.now() / 1000);
    const shouldVacuum = !lastVacuum || (currentTime - parseInt(lastVacuum.value)) > 604800; // 1 week
    
    if (shouldVacuum) {
      console.log('Running database VACUUM...');
      await env.DB.exec('VACUUM');
      
      // Update last vacuum time
      await env.DB.prepare(`
        INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_vacuum', ?)
      `).bind(currentTime.toString()).run();
      
      console.log('Database VACUUM completed');
    }
    
    // Update statistics
    await env.DB.prepare(`
      INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_cleanup', ?)
    `).bind(currentTime.toString()).run();
    
  } catch (error) {
    console.error('Error optimizing database:', error);
    // Don't throw since this is not critical
  }
}