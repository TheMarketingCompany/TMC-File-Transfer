# TMC File Transfer - Cleanup Worker

Enhanced Cloudflare Worker that handles automated cleanup of expired files and database maintenance for the TMC File Transfer application.

## Features

- **Automatic file cleanup** based on expiration time
- **One-time download enforcement** - removes files after first download
- **Download limit enforcement** - removes files after max downloads reached
- **R2 storage cleanup** - deletes actual files from Cloudflare R2
- **Database maintenance** - removes expired records and optimizes database
- **Rate limiting cleanup** - removes old rate limiting entries
- **Batch processing** - handles large volumes efficiently
- **Manual trigger support** - HTTP endpoint for manual cleanup
- **Comprehensive logging** - detailed statistics and error reporting

## Deployment

### Prerequisites
- Cloudflare account with Workers enabled
- Access to the same D1 database and R2 bucket as main app
- Wrangler CLI installed and authenticated

### Unified Configuration

The cleanup worker uses the main application's `wrangler.toml` configuration automatically:

```bash
# Deploy to production (from project root)
npm run deploy:cleanup

# Deploy to preview/staging (from project root)  
npm run deploy:cleanup:preview

# Or from CleanupWorker directory
cd CleanupWorker
npm run deploy
npm run deploy:preview
```

### Configuration

The deployment script automatically reads configuration from the main `wrangler.toml`:
- **Database configuration** - Uses same D1 database as main app
- **R2 bucket configuration** - Uses same R2 bucket as main app
- **Environment variables** - Inherits environment-specific settings
- **Cleanup secrets** - Set via deployment script (update `CleanupWorker/deploy.js`)

## Usage

### Automatic Cleanup
- **Production**: Runs daily at midnight (00:00 UTC)
- **Preview**: Runs daily at 2 AM (02:00 UTC) 

### Manual Cleanup
```bash
# Set your cleanup secret
export CLEANUP_SECRET="your-secret-here"
export CLEANUP_WORKER_URL="https://your-worker.workers.dev"

# Trigger manual cleanup
npm run trigger
```

### Monitoring
```bash
# View real-time logs (production)
npm run tail

# View preview logs  
npm run tail:preview
```

## What Gets Cleaned Up

The worker removes files and database records when:

1. **File has expired** (`expires_at < current_time`)
2. **One-time download consumed** (`is_one_time = 1 AND download_count > 0`)  
3. **Download limit reached** (`download_count >= max_downloads`)

For each cleanup operation:
- ✅ File is deleted from R2 storage
- ✅ Database record is removed
- ✅ Storage space is tracked and reported
- ✅ Errors are logged but don't stop the process

## Statistics Reported

Each cleanup run provides:
- `filesProcessed` - Total files evaluated
- `filesDeleted` - Files actually removed  
- `rateLimitEntriesDeleted` - Old rate limit records cleaned
- `storageSpaceFreed` - Bytes freed from storage
- `errors` - Number of errors encountered

## Security

- Manual trigger requires `Authorization: Bearer <CLEANUP_SECRET>` header
- Only accepts POST requests for manual triggers
- All operations are logged with timestamps
- Failed operations don't interrupt the cleanup process

## Integration

This worker is designed to work alongside the main TMC File Transfer application:
- Shares the same D1 database
- Accesses the same R2 storage bucket
- Uses the same database schema (`uploads_v2` table)
- Maintains data consistency with the main app

## Development

```bash
# Local development with preview environment
npm run dev

# Local development with local bindings
npm run dev:local
```

## Troubleshooting

### Common Issues

1. **Database connection errors**: Verify D1 database ID matches main app
2. **R2 access errors**: Ensure bucket name and permissions are correct
3. **Authentication failures**: Check CLEANUP_SECRET matches for manual triggers

### Debug Commands
```bash
# Check worker logs
npm run tail

# Test manual trigger
npm run trigger

# Local testing
npm run dev:local
```