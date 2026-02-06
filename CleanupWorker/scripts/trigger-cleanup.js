#!/usr/bin/env node

/**
 * Manual cleanup trigger script
 * Sends a POST request to the cleanup worker to trigger a manual cleanup
 */

const WORKER_URL = process.env.CLEANUP_WORKER_URL || 'https://tmc-file-transfer-cleanup.your-account.workers.dev';
const CLEANUP_SECRET = process.env.CLEANUP_SECRET;

if (!CLEANUP_SECRET) {
  console.error('Error: CLEANUP_SECRET environment variable is required');
  console.error('Usage: CLEANUP_SECRET=your-secret npm run trigger');
  process.exit(1);
}

async function triggerCleanup() {
  try {
    console.log('Triggering manual cleanup...');
    
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLEANUP_SECRET}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cleanup completed successfully!');
      console.log('📊 Statistics:');
      console.log(`   Files processed: ${result.stats.filesProcessed}`);
      console.log(`   Files deleted: ${result.stats.filesDeleted}`);
      console.log(`   Storage freed: ${(result.stats.storageSpaceFreed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Rate limit entries deleted: ${result.stats.rateLimitEntriesDeleted}`);
      console.log(`   Errors: ${result.stats.errors}`);
      console.log(`   Timestamp: ${result.timestamp}`);
    } else {
      console.error('❌ Cleanup failed:');
      console.error(result.error);
    }
    
  } catch (error) {
    console.error('❌ Error triggering cleanup:', error.message);
    process.exit(1);
  }
}

triggerCleanup();