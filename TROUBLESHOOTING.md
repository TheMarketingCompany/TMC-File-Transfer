# 🔧 Troubleshooting Guide

Common issues and solutions for TMC File Transfer deployment, configuration, and operation.

## 📋 Quick Diagnostic Checklist

Before diving into specific issues, run this quick diagnostic:

```bash
# Check Wrangler authentication
wrangler whoami

# Verify resources exist
wrangler d1 list
wrangler r2 bucket list
wrangler kv:namespace list

# Check current deployment status
wrangler pages deployment list

# Test local build
npm run build
ls -la dist/
```

## 🚀 Deployment Issues

### ❌ "Database not found" Error

**Symptoms:**
- Error: `D1_ERROR: no such table: uploads_v2`
- 500 errors when uploading files
- Migration endpoint returns database errors

**Solutions:**

1. **Verify database exists and ID is correct:**
```bash
# List all databases
wrangler d1 list

# Check your wrangler.toml has correct database_id
grep -A 5 "d1_databases" wrangler.toml
```

2. **Run database migrations:**
```bash
# Deploy first, then migrate
npm run build
npx wrangler pages deploy dist

# Run migration (replace with your deployment URL)
curl -X POST https://your-deployment.pages.dev/api/db/migrate \
  -H "Authorization: Bearer your-migration-auth-token" \
  -H "Content-Type: application/json"
```

3. **Create database if missing:**
```bash
# Create new database
wrangler d1 create tmc-file-transfer

# Update wrangler.toml with new database_id
# Redeploy and migrate
```

---

### ❌ "R2 Bucket not accessible" Error

**Symptoms:**
- Upload fails with storage errors
- Files upload but can't be downloaded
- R2 access denied errors

**Solutions:**

1. **Verify bucket exists:**
```bash
wrangler r2 bucket list
```

2. **Check bucket permissions:**
```bash
# List objects in bucket (should not error)
wrangler r2 object list your-bucket-name --limit 1
```

3. **Verify wrangler.toml configuration:**
```toml
[[r2_buckets]]
binding = "TRANSFER_BUCKET"
bucket_name = "your-actual-bucket-name"  # Must match exactly
```

4. **Create bucket if missing:**
```bash
wrangler r2 bucket create tmc-transfers
```

---

### ❌ Build/Deploy Failures

**Symptoms:**
- `npm run build` fails
- Deployment succeeds but site shows errors
- TypeScript compilation errors

**Solutions:**

1. **Clear build cache:**
```bash
# Clear everything and rebuild
rm -rf node_modules package-lock.json dist/
npm install
npm run build
```

2. **Check Node.js version:**
```bash
node --version  # Should be 18+
npm --version   # Should be recent
```

3. **Fix TypeScript errors:**
```bash
# Check for type errors
npx vue-tsc --noEmit

# Common fixes
npm install --save-dev @types/node
```

4. **Verify build output:**
```bash
ls -la dist/
# Should contain: index.html, assets/, _headers, _redirects
```

---

### ❌ Function/API Errors

**Symptoms:**
- API endpoints return 500 errors
- Functions don't execute
- Middleware not working

**Solutions:**

1. **Check function logs:**
```bash
# View real-time logs
npx wrangler pages deployment tail

# View specific deployment logs
npx wrangler pages deployment tail --deployment-id=xyz
```

2. **Verify function structure:**
```
functions/
├── _middleware.ts
├── types.ts
├── api/
│   ├── config.ts
│   ├── db/
│   │   └── migrate.ts
│   └── transfer/
│       ├── upload.ts
│       ├── upload-multipart.ts
│       ├── download/
│       │   └── [fileId].ts
│       ├── validate/
│       │   └── [fileId].ts
│       └── info/
│           └── [fileId].ts
```

3. **Check TypeScript compilation:**
```bash
# Functions should compile without errors
npx tsc --noEmit functions/**/*.ts
```

---

## 🔒 Security & Access Issues

### ❌ CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail from frontend
- "Access-Control-Allow-Origin" errors

**Solutions:**

1. **Check ALLOWED_ORIGINS setting:**
```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://your-domain.com"

[env.development.vars]
ALLOWED_ORIGINS = "*"  # Allow all for development
```

2. **Verify _headers file:**
```
# public/_headers should include:
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

3. **Test with curl:**
```bash
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-deployment.pages.dev/api/transfer/upload
```

---

### ❌ Turnstile Bot Protection Issues

**Symptoms:**
- Users getting blocked by Turnstile verification
- Turnstile widget not loading
- Bot protection too sensitive or not working

**Solutions:**

1. **Verify Turnstile configuration:**
```toml
# Check wrangler.toml has correct keys
[env.production.vars]
TURNSTILE_SITE_KEY = "your_turnstile_site_key_here"
TURNSTILE_SECRET_KEY = "your_turnstile_secret_key_here"
```

2. **Test Turnstile verification:**
```bash
# Check if verification endpoint works
curl -X POST https://your-deployment.pages.dev/api/transfer/upload \
  -H "Content-Type: application/json" \
  -d '{"turnstileToken":"test-token"}'
```

3. **Configure sensitivity in Cloudflare dashboard:**
- Go to Security > Turnstile
- Adjust challenge sensitivity
- Review visitor challenges and false positives

---

### ❌ File Upload/Validation Errors

**Symptoms:**
- Files rejected with "File type not allowed"
- Valid files fail validation
- Upload progress stuck

**Solutions:**

1. **Check file validation (all types supported):**
```typescript
// src/utils/security.ts - no file type restrictions
// All file types are supported with comprehensive security validation
static validateFile(file: File, maxFileSize?: number): { valid: boolean; error?: string } {
  // Only checks file size - no type restrictions
  if (maxFileSize && file.size > maxFileSize) {
    return { valid: false, error: `File size exceeds limit` };
  }
  return { valid: true };
}
```

2. **Test file validation:**
```javascript
// Test in browser console
const file = document.querySelector('input[type="file"]').files[0];
console.log('File type:', file.type);
console.log('File size:', file.size);
console.log('File name:', file.name);
```

3. **Increase file size limit:**
```toml
# wrangler.toml
[env.production.vars]
MAX_FILE_SIZE = "5368709120"  # 5GB default (supports large files via multipart upload)
```

---

## 🔄 Runtime Issues

### ❌ Files Not Cleaning Up

**Symptoms:**
- Expired files still downloadable
- Storage usage keeps growing
- Cleanup worker not running

**Solutions:**

1. **Check cleanup worker status:**
```bash
# List worker deployments
wrangler deployments list

# Check worker logs
wrangler tail your-cleanup-worker
```

2. **Manually trigger cleanup:**
```bash
# Call cleanup worker directly
curl -X POST https://your-cleanup-worker.your-subdomain.workers.dev \
  -H "Authorization: Bearer your-cleanup-secret"
```

3. **Verify cleanup schedule:**
```bash
# Check cron triggers in Cloudflare Dashboard:
# Workers & Pages > Your Worker > Triggers > Cron Triggers
```

4. **Manual cleanup query:**
```sql
-- See what should be cleaned up
wrangler d1 execute your-db --command "
  SELECT COUNT(*) as expired_files
  FROM uploads_v2 
  WHERE expires_at < strftime('%s', 'now')
     OR (is_one_time = 1 AND download_count > 0)
"
```

---

### ❌ Performance Issues

**Symptoms:**
- Slow file uploads/downloads
- Database query timeouts
- High CPU usage in Workers

**Solutions:**

1. **Monitor performance metrics:**
```bash
# Check Workers analytics in Cloudflare Dashboard
# Look for CPU time, memory usage, and request duration
```

2. **Optimize database queries:**
```sql
-- Add missing indexes
wrangler d1 execute your-db --command "
  CREATE INDEX IF NOT EXISTS idx_uploads_status 
  ON uploads_v2(expires_at, download_count, max_downloads)
"
```

3. **Enable caching:**
```toml
# wrangler.toml - add KV for caching
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

4. **Reduce file size limits:**
```toml
[env.production.vars]
MAX_FILE_SIZE = "52428800"  # Reduce to 50MB
```

---

## 🗄️ Database Issues

### ❌ Database Connection Errors

**Symptoms:**
- "Failed to connect to database"
- Intermittent database errors
- Query timeouts

**Solutions:**

1. **Check D1 status:**
- Visit [Cloudflare Status](https://www.cloudflarestatus.com/)
- Check D1 service health

2. **Implement retry logic:**
```javascript
async function queryWithRetry(query, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await env.DB.prepare(query).bind(...params).first();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

3. **Optimize queries:**
```sql
-- Use prepared statements only
-- Avoid complex JOINs
-- Use indexes for WHERE clauses
```

---

### ❌ Data Integrity Issues

**Symptoms:**
- Files exist but no database record
- Database records but no files in storage
- Inconsistent download counts

**Solutions:**

1. **Run integrity check:**
```javascript
// Custom endpoint to check data integrity
export const onRequestPost = async (context) => {
  const dbFiles = await env.DB.prepare("SELECT file_name FROM uploads_v2").all();
  const orphanedFiles = [];
  
  for (const file of dbFiles.results) {
    const exists = await env.TRANSFER_BUCKET.head(file.file_name);
    if (!exists) {
      orphanedFiles.push(file.file_name);
    }
  }
  
  return Response.json({ orphanedFiles });
};
```

2. **Clean up orphaned records:**
```sql
-- Remove database records for missing files
-- (Run this carefully and only after verification)
DELETE FROM uploads_v2 
WHERE file_id IN (
  'id1', 'id2', 'id3'  -- IDs of orphaned records
);
```

---

## 🔍 Debugging Tools

### Enable Debug Mode

1. **Add debug environment variable:**
```toml
[env.development.vars]
DEBUG = "true"
LOG_LEVEL = "debug"
```

2. **Add debug logging in functions:**
```javascript
if (env.DEBUG === 'true') {
  console.log('Debug info:', {
    fileId,
    clientIP: request.headers.get('CF-Connecting-IP'),
    timestamp: Date.now()
  });
}
```

### Local Testing

1. **Test locally with Wrangler:**
```bash
# Start local development environment
npm run build
npx wrangler pages dev dist --port 3000

# Test API endpoints
curl -X POST http://localhost:3000/api/db/migrate
```

2. **Test individual functions:**
```bash
# Create test files
echo "test content" > test-file.txt

# Test upload
curl -X POST http://localhost:3000/api/transfer/upload \
  -F "file=@test-file.txt" \
  -F 'options={"lifetime":"1","passwordEnabled":false}'
```

### Monitoring and Alerts

1. **Set up Cloudflare alerts:**
- Go to Notifications in Cloudflare Dashboard
- Create alerts for:
  - High error rates (>5%)
  - CPU time exceeding limits
  - Storage usage approaching quota

2. **Custom monitoring endpoint:**
```javascript
// functions/api/health.ts
export const onRequestGet = async (context) => {
  const { env } = context;
  
  // Check database connectivity
  const dbTest = await env.DB.prepare("SELECT 1").first();
  
  // Check R2 connectivity
  const r2Test = await env.TRANSFER_BUCKET.head("non-existent-file");
  
  return Response.json({
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      database: !!dbTest,
      storage: r2Test !== undefined  // undefined means accessible
    }
  });
};
```

## 🆘 Emergency Procedures

### Complete Reset (Nuclear Option)

⚠️ **WARNING: This will delete ALL data!**

```bash
# 1. Delete all files from R2
wrangler r2 object delete-batch your-bucket-name --delete-all

# 2. Drop all database tables
wrangler d1 execute your-db --command "
  DROP TABLE IF EXISTS uploads_v2;
  DROP TABLE IF EXISTS rate_limits;
  DROP TABLE IF EXISTS metadata;
"

# 3. Redeploy and migrate
npm run build
npx wrangler pages deploy dist
curl -X POST https://your-deployment.pages.dev/api/db/migrate \
  -H "Authorization: Bearer your-migration-auth-token"
```

### Rollback Deployment

```bash
# List recent deployments
npx wrangler pages deployment list

# Rollback to previous deployment
npx wrangler pages deployment retry [DEPLOYMENT_ID]
```

## 📞 Getting Help

### Before Seeking Help

Gather this information:
- Exact error messages
- Browser console logs
- Wrangler deployment logs
- Steps to reproduce
- Environment (dev/staging/production)

### Support Channels

1. **Check existing issues:** [GitHub Issues](https://github.com/TheMarketingCompany/TMC-File-Transfer/issues)
2. **Cloudflare Community:** [community.cloudflare.com](https://community.cloudflare.com)
3. **Documentation:** [developers.cloudflare.com](https://developers.cloudflare.com)

### Creating a Bug Report

Include:
```
## Environment
- Node.js version: 
- Wrangler version:
- Environment: development/staging/production

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior


## Actual Behavior


## Error Logs
```

---

Most issues can be resolved by following this guide systematically. Start with the quick diagnostic checklist and work through the relevant sections based on your symptoms.