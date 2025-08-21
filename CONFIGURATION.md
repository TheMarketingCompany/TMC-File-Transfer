# ⚙️ Modern Security Configuration Guide

Comprehensive configuration reference for the zero-vulnerability TMC File Transfer with 100% Cloudflare-native architecture, security parameters, and modern settings.

## 📁 Configuration Files Overview

```
TMC-File-Transfer/
├── wrangler.toml              # Main Cloudflare configuration
├── public/
│   ├── _headers              # HTTP headers configuration  
│   └── _redirects            # URL redirect rules
├── src/
│   └── utils/
│       └── security.ts       # Security validation rules
└── functions/
    └── _middleware.ts        # Runtime security & rate limiting
```

## 🔧 Core Configuration (wrangler.toml)

### Basic Settings

```toml
name = "tmc-file-transfer"
compatibility_date = "2024-08-21"
pages_build_output_dir = "./dist"

# Application metadata
[vars]
APP_NAME = "TMC File Transfer"
VERSION = "2.0.0"
ENVIRONMENT = "production"
```

### Resource Bindings

```toml
# D1 Database binding
[[d1_databases]]
binding = "DB"                    # Variable name in code
database_name = "tmc-transfers"   # Database name in Cloudflare
database_id = "your-database-id"  # Unique database identifier

# R2 Storage binding  
[[r2_buckets]]
binding = "TRANSFER_BUCKET"       # Variable name in code
bucket_name = "tmc-transfers"     # Bucket name in Cloudflare

# KV Cache binding (optional)
[[kv_namespaces]]
binding = "CACHE"                 # Variable name in code
id = "your-kv-namespace-id"       # KV namespace identifier
preview_id = "your-preview-id"    # Preview environment ID
```

### Environment-Specific Variables

```toml
[env.production.vars]
MAX_FILE_SIZE = "104857600"       # 100MB in bytes
ALLOWED_ORIGINS = "https://your-domain.com"
DEBUG = "false"
LOG_LEVEL = "warn"

[env.development.vars]  
MAX_FILE_SIZE = "52428800"        # 50MB for testing
ALLOWED_ORIGINS = "*"
DEBUG = "true"
LOG_LEVEL = "debug"
```

## 🛡️ Security Configuration

### Rate Limiting (`functions/_middleware.ts`)

```javascript
const RATE_LIMITS = {
  upload: { 
    requests: 10,          // Maximum uploads
    window: 3600           // Time window in seconds (1 hour)
  },
  download: { 
    requests: 100,         // Maximum downloads  
    window: 3600           // Time window in seconds
  },
  validate: { 
    requests: 50,          // Maximum validations
    window: 3600           // Time window in seconds
  }
};
```

### File Validation (`src/utils/security.ts`)

```javascript
// Maximum file size (100MB)
private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024;

// Allowed MIME types
private static readonly ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  
  // Documents  
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  
  // Archives
  'application/zip', 'application/x-rar-compressed', 
  'application/x-7z-compressed',
  
  // Media
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'video/mp4', 'video/webm', 'video/ogg',
  
  // Code files
  'text/javascript', 'text/html', 'text/css', 'application/json'
]);

// Dangerous file extensions (blocked)
private static readonly DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 
  'js', 'jar', 'app', 'deb', 'pkg', 'dmg'
]);
```

### Password Security

```javascript
// Password requirements
static isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password too long' };
  }
  return { valid: true };
}
```

## 🌐 HTTP Headers Configuration (`public/_headers`)

### Security Headers

```
# Apply to all routes
/*
  # Prevent clickjacking
  X-Frame-Options: DENY
  
  # Prevent MIME type sniffing
  X-Content-Type-Options: nosniff
  
  # Enable XSS protection
  X-XSS-Protection: 1; mode=block
  
  # Control referrer information
  Referrer-Policy: strict-origin-when-cross-origin
  
  # Force HTTPS (production only)
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  
  # Limit browser permissions
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  
  # Content Security Policy
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

### Caching Headers

```
# Static assets - long-term caching
/assets/*
  Cache-Control: public, max-age=31536000, immutable
  
# Favicon caching  
/favicon*
  Cache-Control: public, max-age=31536000

# API routes - no caching
/api/*
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0

# Download routes - private, no caching
/dl/*
  Cache-Control: private, no-cache, no-store, must-revalidate
```

## 🔄 URL Redirects (`public/_redirects`)

```
# Legacy URL support
/files/:fileid    /dl/:fileid    301
/file/:fileid     /dl/:fileid    301  
/download/:fileid /dl/:fileid    301

# API version redirects
/transfer/*       /api/transfer/:splat  301

# Client-side routing fallback
/*               /index.html    200
```

## 📊 Database Configuration

### Connection Settings

```javascript
// In functions, D1 is automatically available via env.DB
// No connection configuration needed

// For local development with wrangler
// Database operations use prepared statements:
const result = await env.DB.prepare(`
  SELECT * FROM uploads_v2 WHERE file_id = ?
`).bind(fileId).first();
```

### Table Schema Configuration

```sql
-- Main uploads table
CREATE TABLE uploads_v2 (
  file_id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 999999,
  has_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  salt TEXT,
  is_one_time BOOLEAN DEFAULT FALSE,
  upload_timestamp INTEGER NOT NULL,
  last_download DATETIME,
  client_ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_uploads_expires_at ON uploads_v2(expires_at);
CREATE INDEX idx_uploads_cleanup ON uploads_v2(expires_at, is_one_time, download_count);

-- Rate limiting table
CREATE TABLE rate_limits (
  client_key TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  action_type TEXT DEFAULT 'api',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limits_cleanup ON rate_limits(client_key, timestamp);
```

## 🗄️ Storage Configuration (R2)

### Bucket Settings

```javascript
// File upload configuration
const uploadResult = await env.TRANSFER_BUCKET.put(fileName, fileBuffer, {
  httpMetadata: {
    contentType: file.type,
    contentDisposition: `attachment; filename="${sanitizeFilename(file.name)}"`,
    cacheControl: 'private, no-cache, no-store',
  },
  customMetadata: {
    originalName: file.name,
    fileId: fileId,
    uploadTime: currentTime.toString(),
    uploader: clientIP,
  },
});
```

### CORS Configuration (if needed)

```json
{
  "rules": [
    {
      "allowedOrigins": ["https://your-domain.com"],
      "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
      "allowedHeaders": ["*"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

## 🧹 Cleanup Worker Configuration

### Scheduling (`wrangler.toml` for worker)

```toml
name = "tmc-cleanup-worker"
main = "src/index.js"
compatibility_date = "2024-08-21"

# Cron trigger - runs every 6 hours
[triggers]
crons = ["0 */6 * * *"]

# Resource bindings (same as main app)
[[d1_databases]]
binding = "DB"
database_name = "tmc-transfers"
database_id = "your-database-id"

[[r2_buckets]]
binding = "TRANSFER_BUCKET"  
bucket_name = "tmc-transfers"
```

### Worker Configuration

```javascript
// Cleanup thresholds
const CLEANUP_CONFIG = {
  batchSize: 50,              // Files to process per batch
  maxExecutionTime: 25000,    // 25 seconds (leave buffer)
  retentionPeriod: 86400,     // Keep rate limit data for 24 hours
  vacuumInterval: 604800,     // Run VACUUM weekly
};
```

## 🎨 Frontend Configuration

### Build Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          ui: ['@tailwindcss/typography']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true
      }
    }
  }
});
```

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🔧 Advanced Configuration Options

### Custom File Type Validation

```typescript
// Add custom MIME type validation
export class CustomSecurityUtils extends SecurityUtils {
  private static readonly CUSTOM_MIME_TYPES = new Set([
    'application/vnd.adobe.photoshop',  // PSD files
    'application/vnd.figma',            // Figma files
    'application/x-sketch',             // Sketch files
  ]);

  static validateCustomFile(file: File): { valid: boolean; error?: string } {
    // Your custom validation logic
    if (this.CUSTOM_MIME_TYPES.has(file.type)) {
      return { valid: true };
    }
    return this.validateFile(file);
  }
}
```

### Custom Rate Limiting

```javascript
// Per-user rate limiting (if you have authentication)
async function getUserRateLimit(userId: string, action: string): Promise<boolean> {
  const key = `user:${userId}:${action}`;
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Custom logic for authenticated users
  const userLimits = {
    premium: { upload: 100, download: 1000 },
    basic: { upload: 10, download: 100 }
  };
  
  // Implementation...
}
```

### Environment-Specific Overrides

```toml
# Production optimizations
[env.production]
# Longer cleanup intervals for production
[env.production.vars]
CLEANUP_INTERVAL = "21600"      # 6 hours
MAX_FILE_SIZE = "104857600"     # 100MB
RETENTION_DAYS = "30"           # Keep files for 30 days max

# Development settings  
[env.development]
[env.development.vars]
CLEANUP_INTERVAL = "3600"       # 1 hour for testing
MAX_FILE_SIZE = "10485760"      # 10MB for faster testing
RETENTION_DAYS = "1"            # Short retention for testing
```

## 📈 Performance Tuning

### Database Optimization

```sql
-- Additional indexes for heavy query patterns
CREATE INDEX idx_uploads_client_ip ON uploads_v2(client_ip);
CREATE INDEX idx_uploads_content_type ON uploads_v2(content_type);
CREATE INDEX idx_uploads_file_size ON uploads_v2(file_size);

-- Composite indexes for complex queries
CREATE INDEX idx_uploads_status ON uploads_v2(expires_at, download_count, max_downloads);
```

### Caching Strategy

```javascript
// KV cache configuration
const CACHE_CONFIG = {
  fileInfo: {
    ttl: 300,           // 5 minutes
    key: 'file_info:'
  },
  rateLimits: {
    ttl: 3600,          // 1 hour  
    key: 'rate_limit:'
  }
};

// Cache file information
await env.CACHE.put(
  `${CACHE_CONFIG.fileInfo.key}${fileId}`, 
  JSON.stringify(fileData),
  { expirationTtl: CACHE_CONFIG.fileInfo.ttl }
);
```

## 🔐 Security Hardening

### Additional Security Headers

```
# Additional security headers for sensitive deployments
/*
  # Prevent embedding in frames (alternative to X-Frame-Options)
  Content-Security-Policy: frame-ancestors 'none'
  
  # Control DNS prefetching
  X-DNS-Prefetch-Control: off
  
  # Disable Adobe Flash and PDF plugins
  X-Permitted-Cross-Domain-Policies: none
  
  # Prevent caching of sensitive content
  Cache-Control: no-cache, no-store, must-revalidate, private
  
  # Cross-Origin Resource Policy
  Cross-Origin-Resource-Policy: same-origin
```

### API Security

```javascript
// Request validation middleware
function validateRequest(request: Request): boolean {
  // Check Content-Type for POST requests
  if (request.method === 'POST') {
    const contentType = request.headers.get('Content-Type');
    if (!contentType || (!contentType.includes('multipart/form-data') && 
                        !contentType.includes('application/json'))) {
      return false;
    }
  }
  
  // Validate User-Agent (block obvious bots)
  const userAgent = request.headers.get('User-Agent');
  if (!userAgent || userAgent.length > 512) {
    return false;
  }
  
  return true;
}
```

This configuration guide covers all major aspects of the TMC File Transfer application. Adjust these settings based on your specific requirements and security needs.

---

**See Also**: [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions and [SECURITY.md](SECURITY.md) for security considerations.