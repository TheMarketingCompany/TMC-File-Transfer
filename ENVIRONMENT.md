# 🌍 Environment Configuration Guide

This guide covers environment-specific configurations for TMC File Transfer across development, staging, and production environments.

## 📁 Environment Structure

```
TMC-File-Transfer/
├── wrangler.toml              # Main configuration
├── .env.example              # Environment template
├── environments/
│   ├── development.toml      # Development overrides
│   ├── staging.toml          # Staging configuration
│   └── production.toml       # Production configuration
└── scripts/
    ├── setup-dev.sh         # Development setup script
    └── deploy.sh            # Deployment script
```

## 🔧 Base Configuration (wrangler.toml)

```toml
name = "tmc-file-transfer"
compatibility_date = "2024-08-21"

# Default configuration
pages_build_output_dir = "./dist"

# Global settings
[vars]
APP_NAME = "TMC File Transfer"
VERSION = "2.0.0"
MAX_FILE_SIZE = "104857600"  # 100MB

# Rate limiting defaults
RATE_LIMIT_UPLOAD = "10"     # uploads per hour
RATE_LIMIT_DOWNLOAD = "100"  # downloads per hour
RATE_LIMIT_VALIDATE = "50"   # validations per hour

# Security defaults
SESSION_TIMEOUT = "3600"     # 1 hour
PASSWORD_MIN_LENGTH = "8"
PASSWORD_MAX_LENGTH = "128"

# File cleanup settings
CLEANUP_INTERVAL = "21600"   # 6 hours
CLEANUP_BATCH_SIZE = "50"
```

## 🧪 Development Environment

### Configuration (environments/development.toml)

```toml
[env.development]

[env.development.vars]
ENVIRONMENT = "development"
DEBUG = "true"
LOG_LEVEL = "debug"

# Relaxed security for development
ALLOWED_ORIGINS = "*"
CORS_ENABLED = "true"

# Development-specific settings
MAX_FILE_SIZE = "52428800"   # 50MB for faster testing
RATE_LIMIT_UPLOAD = "100"    # More lenient for testing
RATE_LIMIT_DOWNLOAD = "1000"
CLEANUP_SECRET = "dev-cleanup-secret-key"

# Database
[[env.development.d1_databases]]
binding = "DB"
database_name = "tmc-file-transfer-dev"
database_id = "your-dev-database-id"

# Storage
[[env.development.r2_buckets]]
binding = "TRANSFER_BUCKET"
bucket_name = "tmc-transfers-dev"

# Optional: Separate KV for development
[[env.development.kv_namespaces]]
binding = "CACHE"
id = "your-dev-kv-id"
preview_id = "your-dev-kv-preview-id"
```

### Development Setup Script

Create `scripts/setup-dev.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Setting up development environment..."

# Check prerequisites
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler@latest
fi

# Login check
if ! wrangler whoami &> /dev/null; then
    echo "🔑 Please login to Cloudflare:"
    wrangler login
fi

# Create development database
echo "📊 Creating development database..."
if ! wrangler d1 list | grep -q "tmc-file-transfer-dev"; then
    wrangler d1 create tmc-file-transfer-dev
    echo "✅ Development database created"
else
    echo "✅ Development database already exists"
fi

# Create development R2 bucket
echo "🗄️ Creating development R2 bucket..."
if ! wrangler r2 bucket list | grep -q "tmc-transfers-dev"; then
    wrangler r2 bucket create tmc-transfers-dev
    echo "✅ Development bucket created"
else
    echo "✅ Development bucket already exists"
fi

# Create KV namespace for development
echo "🔄 Creating development KV namespace..."
wrangler kv:namespace create "CACHE" --env development
wrangler kv:namespace create "CACHE" --env development --preview

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run migrations
echo "🔄 Running development migrations..."
npm run build
wrangler pages deploy dist --env development
sleep 5  # Wait for deployment

# Run migration
DEV_URL=$(wrangler pages deployment list --env development | head -2 | tail -1 | awk '{print $4}')
curl -X POST "${DEV_URL}/api/db/migrate" \
  -H "Authorization: Bearer dev-cleanup-secret-key" \
  -H "Content-Type: application/json"

echo "🎉 Development environment setup complete!"
echo "🌐 Development URL: ${DEV_URL}"
```

### Local Development Commands

```bash
# Start local development
npm run dev

# Test with local Wrangler
wrangler pages dev dist --env development

# Run database migrations locally
curl -X POST http://localhost:8788/api/db/migrate \
  -H "Authorization: Bearer dev-cleanup-secret-key"

# Query development database
wrangler d1 execute tmc-file-transfer-dev --env development \
  --command "SELECT COUNT(*) as total_files FROM uploads_v2"
```

## 🧹 Staging Environment

### Configuration (environments/staging.toml)

```toml
[env.staging]

[env.staging.vars]
ENVIRONMENT = "staging"
DEBUG = "false"
LOG_LEVEL = "info"

# Production-like security
ALLOWED_ORIGINS = "https://staging-files.your-domain.com"
CORS_ENABLED = "true"

# Production-like limits
MAX_FILE_SIZE = "104857600"  # 100MB
RATE_LIMIT_UPLOAD = "10"
RATE_LIMIT_DOWNLOAD = "100"
CLEANUP_SECRET = "staging-cleanup-secret-key"

# Staging database
[[env.staging.d1_databases]]
binding = "DB"
database_name = "tmc-file-transfer-staging"
database_id = "your-staging-database-id"

# Staging storage
[[env.staging.r2_buckets]]
binding = "TRANSFER_BUCKET"
bucket_name = "tmc-transfers-staging"

# Staging cache
[[env.staging.kv_namespaces]]
binding = "CACHE"
id = "your-staging-kv-id"
preview_id = "your-staging-kv-preview-id"
```

### Staging Deployment

```bash
# Deploy to staging
npm run build
wrangler pages deploy dist --env staging

# Run staging migrations
STAGING_URL="https://staging.tmc-file-transfer.pages.dev"
curl -X POST "${STAGING_URL}/api/db/migrate" \
  -H "Authorization: Bearer staging-cleanup-secret-key"

# Test staging deployment
curl -X POST "${STAGING_URL}/api/transfer/upload" \
  -F "file=@test-file.txt" \
  -F 'options={"lifetime":"1","passwordEnabled":false}'
```

## 🚀 Production Environment

### Configuration (environments/production.toml)

```toml
[env.production]

[env.production.vars]
ENVIRONMENT = "production"
DEBUG = "false"
LOG_LEVEL = "warn"

# Strict production security
ALLOWED_ORIGINS = "https://files.your-domain.com"
CORS_ENABLED = "false"

# Production limits
MAX_FILE_SIZE = "104857600"  # 100MB
RATE_LIMIT_UPLOAD = "10"
RATE_LIMIT_DOWNLOAD = "100"
RATE_LIMIT_VALIDATE = "50"

# Strong cleanup secret
CLEANUP_SECRET = "your-very-secure-production-key-here"

# Additional security
FORCE_HTTPS = "true"
STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains; preload"
CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"

# Production database
[[env.production.d1_databases]]
binding = "DB"
database_name = "tmc-file-transfer-production"
database_id = "your-production-database-id"

# Production storage
[[env.production.r2_buckets]]
binding = "TRANSFER_BUCKET"
bucket_name = "tmc-transfers-production"

# Production cache
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-production-kv-id"
preview_id = "your-production-kv-preview-id"

# Production headers
[env.production.headers]
"/*" = [
  { name = "X-Frame-Options", value = "DENY" },
  { name = "X-Content-Type-Options", value = "nosniff" },
  { name = "X-XSS-Protection", value = "1; mode=block" },
  { name = "Strict-Transport-Security", value = "max-age=31536000; includeSubDomains; preload" },
  { name = "Referrer-Policy", value = "strict-origin-when-cross-origin" }
]

# Production caching
[env.production.caching]
"/assets/*" = { edge_ttl = 31536000, browser_ttl = 31536000 }
"*.js" = { edge_ttl = 31536000, browser_ttl = 31536000 }
"*.css" = { edge_ttl = 31536000, browser_ttl = 31536000 }
```

### Production Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying to ${ENVIRONMENT} environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Security check for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: You have uncommitted changes"
fi

# Build application
echo "🏗️  Building application..."
npm run build

# Run tests (if available)
if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Deploy to Cloudflare Pages
echo "📤 Deploying to Cloudflare Pages..."
wrangler pages deploy dist --env "$ENVIRONMENT"

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 10

# Get deployment URL
DEPLOYMENT_URL=$(wrangler pages deployment list --env "$ENVIRONMENT" | head -2 | tail -1 | awk '{print $4}')
echo "🌐 Deployment URL: $DEPLOYMENT_URL"

# Run database migrations
echo "🔄 Running database migrations..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    SECRET="your-very-secure-production-key-here"
else
    SECRET="staging-cleanup-secret-key"
fi

curl -X POST "${DEPLOYMENT_URL}/api/db/migrate" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json"

# Health check
echo "🏥 Running health check..."
if curl -f -s "${DEPLOYMENT_URL}/api/transfer/info/test" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed (expected for missing file)"
fi

# Deploy cleanup worker
echo "🧹 Deploying cleanup worker..."
cd CleanupWorker
wrangler deploy --env "$ENVIRONMENT"
cd ..

echo "🎉 Deployment to ${ENVIRONMENT} complete!"
echo "🌐 URL: ${DEPLOYMENT_URL}"

# Production-specific post-deployment tasks
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "  □ Update DNS records if needed"
    echo "  □ Configure monitoring alerts"
    echo "  □ Update documentation"
    echo "  □ Notify team of deployment"
fi
```

## 🔒 Environment Variables Management

### Using .env Files

Create `.env.example`:

```bash
# Database Configuration
DATABASE_ID_DEV=your-dev-database-id
DATABASE_ID_STAGING=your-staging-database-id
DATABASE_ID_PRODUCTION=your-production-database-id

# R2 Bucket Names
BUCKET_NAME_DEV=tmc-transfers-dev
BUCKET_NAME_STAGING=tmc-transfers-staging
BUCKET_NAME_PRODUCTION=tmc-transfers-production

# KV Namespaces
KV_ID_DEV=your-dev-kv-id
KV_ID_STAGING=your-staging-kv-id
KV_ID_PRODUCTION=your-production-kv-id

# Security Secrets
CLEANUP_SECRET_DEV=dev-cleanup-secret-key
CLEANUP_SECRET_STAGING=staging-cleanup-secret-key
CLEANUP_SECRET_PRODUCTION=your-very-secure-production-key-here

# Domain Configuration
DOMAIN_DEV=localhost:3000
DOMAIN_STAGING=staging-files.your-domain.com
DOMAIN_PRODUCTION=files.your-domain.com
```

### Environment Variable Validation

Create `scripts/validate-env.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const environments = ['development', 'staging', 'production'];
const requiredVars = [
  'DATABASE_ID',
  'BUCKET_NAME',
  'CLEANUP_SECRET',
  'ALLOWED_ORIGINS'
];

console.log('🔍 Validating environment configurations...');

environments.forEach(env => {
  console.log(`\n📋 Checking ${env} environment:`);
  
  const configPath = path.join(__dirname, '..', 'environments', `${env}.toml`);
  
  if (!fs.existsSync(configPath)) {
    console.log(`  ❌ Configuration file missing: ${configPath}`);
    return;
  }
  
  const config = fs.readFileSync(configPath, 'utf8');
  
  requiredVars.forEach(varName => {
    if (config.includes(varName)) {
      console.log(`  ✅ ${varName} configured`);
    } else {
      console.log(`  ❌ ${varName} missing`);
    }
  });
});

console.log('\n🎉 Environment validation complete!');
```

## 🔄 Environment Switching

### Quick Environment Commands

```bash
# Development
npm run dev:local          # Local development
npm run deploy:dev          # Deploy to development

# Staging
npm run deploy:staging      # Deploy to staging
npm run test:staging        # Run tests against staging

# Production
npm run deploy:production   # Deploy to production
npm run rollback:production # Rollback production deployment
```

### Add to package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    
    "dev:local": "wrangler pages dev dist --env development",
    "deploy:dev": "npm run build && wrangler pages deploy dist --env development",
    "deploy:staging": "./scripts/deploy.sh staging",
    "deploy:production": "./scripts/deploy.sh production",
    
    "migrate:dev": "curl -X POST http://localhost:8788/api/db/migrate -H 'Authorization: Bearer dev-cleanup-secret-key'",
    "migrate:staging": "curl -X POST https://staging.tmc-file-transfer.pages.dev/api/db/migrate -H 'Authorization: Bearer staging-cleanup-secret-key'",
    
    "validate:env": "node scripts/validate-env.js",
    "setup:dev": "./scripts/setup-dev.sh"
  }
}
```

## 🔐 Secrets Management

### Cloudflare Secrets

For sensitive values, use Wrangler secrets instead of environment variables:

```bash
# Set secrets per environment
echo "your-production-secret" | wrangler secret put CLEANUP_SECRET --env production
echo "your-db-password" | wrangler secret put DB_PASSWORD --env production

# List secrets
wrangler secret list --env production
```

### Environment-Specific Security

| Environment | Security Level | Features Enabled |
|-------------|----------------|------------------|
| Development | Low | Debug logging, relaxed CORS, higher rate limits |
| Staging | Medium | Production-like security, test data |
| Production | High | Strict security, monitoring, backups |

## 📊 Monitoring Per Environment

### Environment-Specific Monitoring

```javascript
// In functions/_middleware.ts
const environment = env.ENVIRONMENT || 'development';

// Log differently based on environment
if (environment === 'development') {
  console.log('Debug:', requestDetails);
} else if (environment === 'production') {
  // Send to external monitoring service
  await logToMonitoring(requestDetails);
}
```

### Analytics Configuration

Each environment should have separate analytics:

```toml
# Development - minimal analytics
[env.development.analytics_engine_datasets]
binding = "ANALYTICS"
dataset = "tmc_file_transfer_dev"

# Production - comprehensive analytics
[env.production.analytics_engine_datasets] 
binding = "ANALYTICS"
dataset = "tmc_file_transfer_prod"
```

This comprehensive environment configuration ensures proper separation of concerns and security across all deployment stages.

---

**Next Steps**: Review [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step deployment instructions and [SECURITY.md](SECURITY.md) for security considerations.