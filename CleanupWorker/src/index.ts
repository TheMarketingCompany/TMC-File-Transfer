/**
 * Enhanced TypeScript Cleanup Worker for TMC File Transfer
 * 
 * Features:
 * - Type-safe operations with comprehensive error handling
 * - Batch processing for performance optimization
 * - Detailed logging and metrics collection
 * - Memory and execution time monitoring
 * - Database maintenance and optimization
 */

interface CleanupEnv {
  DB: D1Database;
  TRANSFER_BUCKET: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
  
  // Environment configuration
  ENVIRONMENT: 'development' | 'staging' | 'production';
  DEBUG: 'true' | 'false';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Cleanup configuration
  BATCH_SIZE?: string;
  MAX_EXECUTION_TIME?: string;
  VACUUM_INTERVAL?: string;
  CLEANUP_SECRET?: string;
}

interface UploadRecord {
  file_id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  expires_at: number;
  download_count: number;
  max_downloads: number;
  is_one_time: boolean;
}

interface CleanupStats {
  filesProcessed: number;
  filesDeleted: number;
  storageSpaceFreed: number;
  rateLimitEntriesDeleted: number;
  errors: number;
  executionTime: number;
  memoryUsed?: number;
}

interface CleanupConfig {
  batchSize: number;
  maxExecutionTime: number;
  retentionPeriod: number;
  vacuumInterval: number;
}

interface CleanupResult {
  success: boolean;
  stats: CleanupStats;
  errors: string[];
  timestamp: string;
}

// Default configuration
const DEFAULT_CONFIG: CleanupConfig = {
  batchSize: 50,
  maxExecutionTime: 25000, // 25 seconds
  retentionPeriod: 86400,  // 24 hours for rate limits
  vacuumInterval: 604800,  // 1 week
};

/**
 * Main Worker Export
 */
export default {
  /**
   * Scheduled event handler for automatic cleanup
   */
  async scheduled(
    event: ScheduledEvent,
    env: CleanupEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    const startTime = Date.now();
    const logger = new Logger(env);
    
    logger.info('Starting scheduled cleanup job', {
      scheduledTime: new Date(event.scheduledTime).toISOString(),
      cron: event.cron,
    });
    
    try {
      const result = await performCleanup(env, ctx, logger);
      
      logger.info('Scheduled cleanup completed successfully', {
        stats: result.stats,
        duration: Date.now() - startTime,
      });
      
      // Send analytics if available
      if (env.ANALYTICS && result.success) {
        await sendAnalytics(env.ANALYTICS, 'cleanup_scheduled', result.stats);
      }
      
    } catch (error) {
      logger.error('Scheduled cleanup failed', {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      
      // Don't throw to prevent worker from being marked as failed
      // The error is already logged for monitoring
    }
  },

  /**
   * HTTP request handler for manual cleanup and health checks
   */
  async fetch(
    request: Request,
    env: CleanupEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const logger = new Logger(env);
    
    try {
      // Health check endpoint
      if (request.method === 'GET' && url.pathname === '/health') {
        return handleHealthCheck(env, logger);
      }
      
      // Manual cleanup endpoint
      if (request.method === 'POST' && url.pathname === '/cleanup') {
        return await handleManualCleanup(request, env, ctx, logger);
      }
      
      // Stats endpoint
      if (request.method === 'GET' && url.pathname === '/stats') {
        return await handleStatsRequest(env, logger);
      }
      
      return new Response('Not Found', { status: 404 });
      
    } catch (error) {
      logger.error('Request handling failed', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : String(error),
      });
      
      return createErrorResponse(
        'INTERNAL_ERROR',
        'An internal error occurred',
        500
      );
    }
  },
};

/**
 * Enhanced Logger with structured logging
 */
class Logger {
  private env: CleanupEnv;
  private logLevel: number;
  
  constructor(env: CleanupEnv) {
    this.env = env;
    this.logLevel = this.getLogLevel(env.LOG_LEVEL || 'info');
  }
  
  private getLogLevel(level: string): number {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level as keyof typeof levels] ?? 1;
  }
  
  private shouldLog(level: number): boolean {
    return level >= this.logLevel;
  }
  
  private formatMessage(level: string, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: this.env.ENVIRONMENT,
      ...data,
    };
    return JSON.stringify(logEntry);
  }
  
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(0)) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
  
  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(1)) {
      console.info(this.formatMessage('info', message, data));
    }
  }
  
  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(2)) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }
  
  error(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(3)) {
      console.error(this.formatMessage('error', message, data));
    }
  }
}

/**
 * Main cleanup orchestrator
 */
async function performCleanup(
  env: CleanupEnv,
  ctx: ExecutionContext,
  logger: Logger
): Promise<CleanupResult> {
  const startTime = Date.now();
  const config = getCleanupConfig(env);
  const stats: CleanupStats = {
    filesProcessed: 0,
    filesDeleted: 0,
    storageSpaceFreed: 0,
    rateLimitEntriesDeleted: 0,
    errors: 0,
    executionTime: 0,
  };
  const errors: string[] = [];
  
  try {
    logger.info('Starting cleanup operations', { config });
    
    // Step 1: Clean up expired and consumed files
    await cleanupExpiredFiles(env, config, stats, errors, logger);
    
    // Step 2: Clean up old rate limiting data
    await cleanupRateLimitData(env, config, stats, errors, logger);
    
    // Step 3: Database maintenance
    await performDatabaseMaintenance(env, config, logger);
    
    // Step 4: Update cleanup metadata
    await updateCleanupMetadata(env, logger);
    
    stats.executionTime = Date.now() - startTime;
    
    logger.info('Cleanup operations completed', { stats, errors: errors.length });
    
    return {
      success: errors.length === 0,
      stats,
      errors,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    stats.executionTime = Date.now() - startTime;
    stats.errors++;
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);
    
    logger.error('Cleanup failed with critical error', {
      error: errorMessage,
      stats,
    });
    
    return {
      success: false,
      stats,
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Clean up expired files and consumed one-time downloads
 */
async function cleanupExpiredFiles(
  env: CleanupEnv,
  config: CleanupConfig,
  stats: CleanupStats,
  errors: string[],
  logger: Logger
): Promise<void> {
  const currentTime = Math.floor(Date.now() / 1000);
  
  try {
    // Query files that need cleanup
    const query = `
      SELECT file_id, file_name, original_name, file_size, expires_at, download_count, max_downloads, is_one_time
      FROM uploads_v2 
      WHERE expires_at < ? 
         OR (is_one_time = 1 AND download_count > 0)
         OR download_count >= max_downloads
      ORDER BY expires_at ASC
      LIMIT ?
    `;
    
    const result = await env.DB.prepare(query)
      .bind(currentTime, config.batchSize * 2) // Get more records than batch size
      .all<UploadRecord>();
    
    if (!result.success) {
      throw new Error(`Database query failed: ${result.error || 'Unknown error'}`);
    }
    
    logger.info(`Found ${result.results.length} files for cleanup`);
    stats.filesProcessed = result.results.length;
    
    if (result.results.length === 0) {
      return;
    }
    
    // Process files in batches to prevent timeout
    for (let i = 0; i < result.results.length; i += config.batchSize) {
      const batch = result.results.slice(i, i + config.batchSize);
      await processBatch(env, batch, stats, errors, logger);
      
      // Check execution time to prevent timeout
      const elapsed = Date.now() - Date.now();
      if (elapsed > config.maxExecutionTime * 0.8) {
        logger.warn('Approaching execution time limit, stopping file cleanup', {
          elapsed,
          limit: config.maxExecutionTime,
        });
        break;
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`File cleanup error: ${errorMessage}`);
    stats.errors++;
    logger.error('File cleanup failed', { error: errorMessage });
  }
}

/**
 * Process a batch of files for deletion
 */
async function processBatch(
  env: CleanupEnv,
  files: UploadRecord[],
  stats: CleanupStats,
  errors: string[],
  logger: Logger
): Promise<void> {
  const filesToDeleteFromDB: string[] = [];
  
  // Delete files from R2 storage
  for (const file of files) {
    try {
      await env.TRANSFER_BUCKET.delete(file.file_name);
      
      stats.filesDeleted++;
      stats.storageSpaceFreed += file.file_size;
      filesToDeleteFromDB.push(file.file_id);
      
      logger.debug('Deleted file from storage', {
        fileId: file.file_id,
        fileName: file.original_name,
        size: file.file_size,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to delete file ${file.file_name}: ${errorMessage}`);
      stats.errors++;
      
      // Still mark for database deletion since file might not exist in storage
      filesToDeleteFromDB.push(file.file_id);
      
      logger.warn('Failed to delete file from storage', {
        fileId: file.file_id,
        fileName: file.file_name,
        error: errorMessage,
      });
    }
  }
  
  // Remove database records in batch
  if (filesToDeleteFromDB.length > 0) {
    try {
      const placeholders = filesToDeleteFromDB.map(() => '?').join(',');
      const deleteQuery = `DELETE FROM uploads_v2 WHERE file_id IN (${placeholders})`;
      
      const result = await env.DB.prepare(deleteQuery)
        .bind(...filesToDeleteFromDB)
        .run();
      
      if (!result.success) {
        throw new Error(`Database deletion failed: ${result.error || 'Unknown error'}`);
      }
      
      logger.debug('Deleted database records', {
        count: result.changes || 0,
        fileIds: filesToDeleteFromDB,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Database cleanup error: ${errorMessage}`);
      stats.errors++;
      logger.error('Failed to delete database records', {
        error: errorMessage,
        fileIds: filesToDeleteFromDB,
      });
    }
  }
}

/**
 * Clean up old rate limiting data
 */
async function cleanupRateLimitData(
  env: CleanupEnv,
  config: CleanupConfig,
  stats: CleanupStats,
  errors: string[],
  logger: Logger
): Promise<void> {
  try {
    const cutoffTime = Math.floor(Date.now() / 1000) - config.retentionPeriod;
    
    const result = await env.DB.prepare(`
      DELETE FROM rate_limits 
      WHERE timestamp < ?
    `).bind(cutoffTime).run();
    
    if (result.success) {
      stats.rateLimitEntriesDeleted = result.changes || 0;
      logger.info('Cleaned up rate limiting data', {
        entriesDeleted: stats.rateLimitEntriesDeleted,
        cutoffTime,
      });
    } else {
      throw new Error(`Rate limit cleanup failed: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`Rate limit cleanup error: ${errorMessage}`);
    stats.errors++;
    logger.error('Rate limit cleanup failed', { error: errorMessage });
  }
}

/**
 * Perform database maintenance operations
 */
async function performDatabaseMaintenance(
  env: CleanupEnv,
  config: CleanupConfig,
  logger: Logger
): Promise<void> {
  try {
    // Check when VACUUM was last run
    const lastVacuum = await env.DB.prepare(`
      SELECT value FROM metadata WHERE key = 'last_vacuum'
    `).first<{ value: string }>();
    
    const currentTime = Math.floor(Date.now() / 1000);
    const shouldVacuum = !lastVacuum || 
      (currentTime - parseInt(lastVacuum.value)) > config.vacuumInterval;
    
    if (shouldVacuum) {
      logger.info('Running database VACUUM operation');
      
      // Run VACUUM to reclaim space
      await env.DB.exec('VACUUM');
      
      // Update last vacuum timestamp
      await env.DB.prepare(`
        INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_vacuum', ?)
      `).bind(currentTime.toString()).run();
      
      logger.info('Database VACUUM completed successfully');
    } else {
      logger.debug('Skipping VACUUM, not due yet', {
        lastVacuum: lastVacuum?.value,
        nextVacuum: parseInt(lastVacuum?.value || '0') + config.vacuumInterval,
      });
    }
    
    // Analyze tables for query optimization
    await env.DB.exec('ANALYZE');
    logger.debug('Database ANALYZE completed');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Database maintenance failed', { error: errorMessage });
    // Don't throw since this is not critical
  }
}

/**
 * Update cleanup metadata
 */
async function updateCleanupMetadata(env: CleanupEnv, logger: Logger): Promise<void> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    
    await env.DB.prepare(`
      INSERT OR REPLACE INTO metadata (key, value) VALUES ('last_cleanup', ?)
    `).bind(currentTime.toString()).run();
    
    logger.debug('Updated cleanup metadata', { timestamp: currentTime });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn('Failed to update cleanup metadata', { error: errorMessage });
  }
}

/**
 * Handle manual cleanup requests
 */
async function handleManualCleanup(
  request: Request,
  env: CleanupEnv,
  ctx: ExecutionContext,
  logger: Logger
): Promise<Response> {
  // Authentication check
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || 
      !env.CLEANUP_SECRET || authHeader.slice(7) !== env.CLEANUP_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  logger.info('Manual cleanup triggered', {
    userAgent: request.headers.get('User-Agent'),
    clientIP: request.headers.get('CF-Connecting-IP'),
  });
  
  const result = await performCleanup(env, ctx, logger);
  
  return Response.json(result, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(env: CleanupEnv, logger: Logger): Promise<Response> {
  try {
    // Test database connectivity
    const dbTest = await env.DB.prepare('SELECT 1 as test').first<{ test: number }>();
    
    // Test R2 connectivity (head request to non-existent file should not error)
    const r2Test = await env.TRANSFER_BUCKET.head('health-check-non-existent');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT,
      services: {
        database: !!dbTest && dbTest.test === 1,
        storage: r2Test !== undefined, // undefined means bucket is accessible
      },
      version: '2.0.0',
    };
    
    const allHealthy = Object.values(health.services).every(Boolean);
    
    return Response.json(health, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

/**
 * Handle statistics requests
 */
async function handleStatsRequest(env: CleanupEnv, logger: Logger): Promise<Response> {
  try {
    // Get basic statistics
    const totalFiles = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM uploads_v2
    `).first<{ count: number }>();
    
    const expiredFiles = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM uploads_v2 
      WHERE expires_at < ?
    `).bind(Math.floor(Date.now() / 1000)).first<{ count: number }>();
    
    const consumedFiles = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM uploads_v2 
      WHERE is_one_time = 1 AND download_count > 0
    `).first<{ count: number }>();
    
    const rateLimitEntries = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM rate_limits
    `).first<{ count: number }>();
    
    const lastCleanup = await env.DB.prepare(`
      SELECT value FROM metadata WHERE key = 'last_cleanup'
    `).first<{ value: string }>();
    
    const stats = {
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT,
      database: {
        totalFiles: totalFiles?.count || 0,
        expiredFiles: expiredFiles?.count || 0,
        consumedFiles: consumedFiles?.count || 0,
        rateLimitEntries: rateLimitEntries?.count || 0,
      },
      cleanup: {
        lastRun: lastCleanup?.value ? 
          new Date(parseInt(lastCleanup.value) * 1000).toISOString() : null,
      },
    };
    
    return Response.json(stats, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
    
  } catch (error) {
    logger.error('Failed to get statistics', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return createErrorResponse(
      'STATS_ERROR',
      'Failed to retrieve statistics',
      500
    );
  }
}

/**
 * Get cleanup configuration from environment
 */
function getCleanupConfig(env: CleanupEnv): CleanupConfig {
  return {
    batchSize: parseInt(env.BATCH_SIZE || String(DEFAULT_CONFIG.batchSize)),
    maxExecutionTime: parseInt(env.MAX_EXECUTION_TIME || String(DEFAULT_CONFIG.maxExecutionTime)),
    retentionPeriod: DEFAULT_CONFIG.retentionPeriod,
    vacuumInterval: parseInt(env.VACUUM_INTERVAL || String(DEFAULT_CONFIG.vacuumInterval)),
  };
}

/**
 * Send analytics data
 */
async function sendAnalytics(
  analytics: AnalyticsEngineDataset,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    analytics.writeDataPoint({
      blobs: [event],
      doubles: [Date.now()],
      indexes: [event],
    });
  } catch (error) {
    // Analytics failures shouldn't break cleanup
    console.warn('Failed to send analytics', error);
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(code: string, message: string, status: number): Response {
  return Response.json({
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  }, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}