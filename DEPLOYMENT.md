# 🚀 TMC File Transfer - Secure Deployment Guide

A comprehensive guide for deploying the zero-vulnerability TMC File Transfer on Cloudflare's modern infrastructure with 100% native bindings.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ [Cloudflare account](https://cloudflare.com) with access to:
  - Pages (for frontend hosting)
  - Workers (for serverless functions)
  - D1 (for database)
  - R2 (for file storage)
- ✅ [Node.js 18+](https://nodejs.org/) and npm
- ✅ Git for cloning the repository
- ✅ Domain name (optional, for custom domains)

## 🛠 Step 1: Environment Setup

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/TheMarketingCompany/TMC-File-Transfer.git
cd TMC-File-Transfer

# Install project dependencies
npm install

# Install latest secure Wrangler CLI
npm install -g wrangler@latest

# Verify installation (should be 4.31.0+)
wrangler --version
```

### Authenticate with Cloudflare

```bash
# Login to your Cloudflare account
wrangler login

# This will open a browser window for authentication
# Grant the necessary permissions when prompted
```

## 🗄 Step 2: Create Cloudflare Resources

### Create D1 Database

```bash
# Create a new D1 database
wrangler d1 create tmc-file-transfer

# Output will look like:
# ✅ Successfully created DB 'tmc-file-transfer' in region WEUR
# Created your new D1 database.
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "tmc-file-transfer"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# IMPORTANT: Copy the database_id for the next step
```

### Create R2 Bucket

```bash
# Create an R2 bucket for file storage
wrangler r2 bucket create tmc-transfers

# Verify creation
wrangler r2 bucket list
```

### Optional: Create KV Namespace (for caching)

```bash
# Create KV namespace for caching (optional but recommended)
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "CACHE" --preview

# Copy the namespace IDs for configuration
```

## ⚙️ Step 3: Configuration

### Update wrangler.toml

```bash
# Copy the improved configuration template
cp wrangler-improved.toml wrangler.toml
```

Edit `wrangler.toml` and update the following values:

```toml
name = "tmc-file-transfer"  # Your project name
compatibility_date = "2024-08-21"

# Pages configuration
pages_build_output_dir = "./dist"

# Update with your actual database ID from Step 2
[[d1_databases]]
binding = "DB"
database_name = "tmc-file-transfer"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Replace this

# Update with your bucket name if different
[[r2_buckets]]
binding = "TRANSFER_BUCKET"
bucket_name = "tmc-transfers"  # Your bucket name

# Optional: Add KV namespace if created
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_KV_PREVIEW_ID"
```

### Environment Variables

Update the environment variables in `wrangler.toml`:

```toml
# Production environment
[env.production.vars]
ENVIRONMENT = "production"
MAX_FILE_SIZE = "104857600"  # 100MB in bytes
ALLOWED_ORIGINS = "https://your-domain.com"  # ← Update with your domain
CLEANUP_SECRET = "your-secure-random-string"  # ← Generate a secure token

# Development environment  
[env.development.vars]
ENVIRONMENT = "development"
MAX_FILE_SIZE = "104857600"
ALLOWED_ORIGINS = "*"
CLEANUP_SECRET = "dev-secret-key"
```

## 🏗 Step 4: Build and Deploy

### Build the Application

```bash
# Install dependencies if not already done
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### Deploy to Cloudflare Pages

```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=tmc-file-transfer

# Output will show deployment URL like:
# ✨ Success! Uploaded 15 files (2.34 sec)
# ✨ Deployment complete! Take a look at your site at https://abc123.tmc-file-transfer.pages.dev
```

**Important**: Copy the deployment URL - you'll need it for the next step.

### Run Database Migration

```bash
# Run database migrations using your deployment URL
curl -X POST https://YOUR-DEPLOYMENT-URL.pages.dev/api/db/migrate \
  -H "Authorization: Bearer your-secure-random-string" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "message": "Database migration completed successfully",
#   "timestamp": "2024-08-21T..."
# }
```

## 🧹 Step 5: Setup Cleanup Worker (Recommended)

The cleanup worker automatically removes expired files and maintains the database.

### Deploy Cleanup Worker

```bash
# Navigate to cleanup worker directory
cd CleanupWorker

# Install dependencies
npm install

# Copy the improved worker
cp src/index-improved.js src/index.js

# Deploy the worker
npx wrangler deploy

# Go back to main directory
cd ..
```

### Schedule the Cleanup Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** > **Your Worker**
3. Click **Triggers** tab
4. Click **Add Cron Trigger**
5. Set schedule to `0 */6 * * *` (every 6 hours)
6. Save the trigger

Alternative schedule options:
- `0 */4 * * *` - Every 4 hours (more frequent)
- `0 2 * * *` - Daily at 2 AM
- `0 0 * * 0` - Weekly on Sunday at midnight

## 🔧 Step 6: Configuration & Testing

### Test Basic Functionality

```bash
# Test file upload (replace with your domain)
curl -X POST https://your-domain.pages.dev/api/transfer/upload \
  -F "file=@test-file.txt" \
  -F 'options={"lifetime":"1","passwordEnabled":false,"onetimeDownload":false}'

# Expected response includes fileId for testing downloads
```

### Configure Custom Domain (Optional)

1. Go to **Cloudflare Dashboard** > **Pages** > **Your Project**
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter your domain name
5. Follow DNS configuration instructions

### Update CORS Settings

If using a custom domain, update `ALLOWED_ORIGINS` in `wrangler.toml`:

```toml
[env.production.vars]
ALLOWED_ORIGINS = "https://your-custom-domain.com"
```

Then redeploy:

```bash
npm run build
npx wrangler pages deploy dist
```

## 📊 Step 7: Monitoring & Analytics

### Enable Analytics

1. Go to **Cloudflare Dashboard** > **Analytics & Logs**
2. Enable **Web Analytics** for your Pages project
3. Configure **Workers Analytics** for function monitoring

### Monitor Resource Usage

Check these metrics regularly:
- **D1 Database**: Query count and storage usage
- **R2 Storage**: Object count and bandwidth
- **Pages**: Request count and data transfer
- **Workers**: CPU time and memory usage

### Set up Alerts (Recommended)

Configure alerts in Cloudflare Dashboard:
- High error rates (>5%)
- Storage usage approaching limits
- Unusual traffic patterns

## 🛠 Step 8: Advanced Configuration

### Rate Limiting Adjustment

Edit `functions/_middleware.ts` to adjust rate limits:

```javascript
const RATE_LIMITS = {
  upload: { requests: 20, window: 3600 },    // 20 uploads/hour
  download: { requests: 200, window: 3600 }, // 200 downloads/hour
  validate: { requests: 100, window: 3600 }  // 100 validations/hour
};
```

### File Type Restrictions

Edit `src/utils/security.ts` to modify allowed file types:

```javascript
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf', 'text/plain',
  // Add more types as needed
]);
```

### Security Headers Customization

Edit `public/_headers` to modify security policies:

```
/*
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https:
  # Add or modify other headers as needed
```

## 🔍 Troubleshooting

### Common Deployment Issues

**"Database not found" error**:
```bash
# Verify database exists
wrangler d1 list

# Check database ID in wrangler.toml
# Re-run migration if needed
```

**"R2 bucket not accessible" error**:
```bash
# Verify bucket exists and permissions
wrangler r2 bucket list
wrangler r2 object list tmc-transfers
```

**Build failures**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

**Functions not working**:
```bash
# Check function logs
npx wrangler pages deployment tail

# Verify environment variables
npx wrangler pages deployment list
```

### Performance Issues

**Slow uploads/downloads**:
- Check file size limits
- Verify Cloudflare caching settings
- Monitor R2 regional performance

**Database query timeouts**:
- Review query performance in D1 analytics
- Consider adding indexes for custom queries
- Check cleanup worker efficiency

### Security Concerns

**Rate limiting not working**:
- Verify middleware deployment
- Check Cloudflare WAF settings
- Monitor rate limit table in database

**Suspicious activity**:
- Review access logs
- Check error patterns
- Consider additional WAF rules

## 📈 Scaling Considerations

### High Traffic Preparation

1. **Enable Cloudflare Pro** for enhanced DDoS protection
2. **Configure load balancing** if using multiple regions
3. **Set up monitoring alerts** for usage spikes
4. **Plan database scaling** strategy for growth

### Enterprise Features

Consider these upgrades for production:
- **Cloudflare for SaaS** for white-label deployment
- **Workers KV** for enhanced caching
- **Durable Objects** for real-time features
- **Stream** for video file handling

## 🔄 Updates & Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Review analytics and performance metrics
- Check cleanup worker execution logs
- Monitor storage usage trends

**Monthly**:
- Update dependencies: `npm audit && npm update`
- Review security headers and policies
- Analyze user behavior patterns

**Quarterly**:
- Security audit and penetration testing
- Performance optimization review
- Disaster recovery testing

### Automated Deployment

Set up GitHub Actions for automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: tmc-file-transfer
          directory: dist
```

## 📞 Support

If you encounter issues during deployment:

1. **Check the logs**: `npx wrangler pages deployment tail`
2. **Review documentation**: [Cloudflare Docs](https://developers.cloudflare.com/)
3. **Open an issue**: Include deployment logs and configuration
4. **Community support**: [Cloudflare Community](https://community.cloudflare.com/)

---

**🎉 Congratulations!** Your TMC File Transfer application is now deployed and ready for use.

For ongoing maintenance and advanced features, refer to the [README.md](README.md) and [SECURITY.md](SECURITY.md) files.