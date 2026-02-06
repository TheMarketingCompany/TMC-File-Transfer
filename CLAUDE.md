# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Initial Setup

### 1. Configuration Setup

**Copy example configurations:**
```bash
cp example.wrangler.toml wrangler.toml
cp .env.example .env
```

**Update wrangler.toml with your values:**
- Replace `your-project-name` with your project name
- Replace `your-domain.pages.dev` with your actual domain
- Replace `your_turnstile_site_key_here` with your Turnstile site key
- Replace `your_turnstile_secret_key_here` with your Turnstile secret key
- Replace `your_zone_id_here` with your Cloudflare Zone ID
- Replace `your-database-id-here` with your D1 database ID
- Replace `your-bucket-name` with your R2 bucket name
- Generate secure tokens for `MIGRATION_AUTH_TOKEN` and `CLEANUP_SECRET`

**Generate secure tokens:**
```bash
# For MIGRATION_AUTH_TOKEN
openssl rand -hex 32

# For CLEANUP_SECRET
openssl rand -hex 32
```

**Update .env with your values:**
- `CF_WAF_API_TOKEN` - Cloudflare API token for WAF deployment (Cloudflare Dashboard → My Profile → API Tokens)
- `CF_WAF_ZONE_ID` - Your Cloudflare Zone ID (for WAF rules)
- `CLEANUP_SECRET` - Must match the value in `wrangler.toml` (used by cleanup worker deploy script and manual HTTP trigger)
- `VITE_*` variables - Company information displayed in footer

**Important:** The `CLEANUP_SECRET` must be set in **both** `wrangler.toml` and `.env`. The `wrangler.toml` value is used by the Pages runtime, while the `.env` value is read by `CleanupWorker/deploy.js` when deploying the cleanup worker. If `.env` is missing the secret, the deploy script falls back to an insecure default.

### 2. Build Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (fast build without type checking)
- `npm run build:check` - Build with TypeScript type checking (slower but thorough)
- `npm run typecheck` - Run TypeScript type checking only
- `npm run preview` - Preview production build locally
- `npm run deploy` - Complete deployment (build + pages + WAF + cleanup worker) - **DEFAULT**
- `npm run deploy:pages` - Deploy only Pages (frontend)
- `npm run deploy:waf` - Deploy WAF rules for upload protection
- `npm run deploy:cleanup` - Deploy cleanup worker (production)
- `npm run deploy:cleanup:preview` - Deploy cleanup worker (preview)

## Security & Performance Improvements Applied

### Security Fixes Implemented:
- **Zero Vulnerabilities**: All npm audit issues resolved (16 → 0 vulnerabilities)
- **Legacy Removal**: Eliminated all insecure AWS SDK, axios, and legacy dependencies
- **Modern Stack**: 100% Cloudflare-native with Web Crypto API
- **SQL Injection**: Fixed with prepared statements and parameter binding
- **File Validation**: Comprehensive security validation with flexible file type support
- **Security Headers**: CSP, XSS Protection, HSTS, and other security headers
- **Password Security**: PBKDF2 with 100,000 iterations and salt using Web Crypto API
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Bot Protection**: Cloudflare Turnstile integration for human verification
- **Zero Trust Ready**: Optional Cloudflare Zero Trust integration for upload authentication
- **API Response Fix**: Fixed upload response handling to prevent undefined file IDs
- **Environment Separation**: Renamed API environment variables to avoid Wrangler conflicts
- **Timing Fix**: Fixed expiration timing to start countdown after upload completion (not during upload)
- **Material Web Components Integration**: Fixed Vue.js v-model compatibility with Material Web Components
- **UI Consistency**: Resolved font inconsistencies across Material Web Components
- **Form Validation**: Fixed password field visibility and upload button validation logic

## Architecture Overview

This is a Vue 3 + TypeScript file transfer application deployed on Cloudflare infrastructure:

### Frontend (Vue 3 + TypeScript)
- **Main app**: `src/App.vue` - Simple layout with router-view and footer
- **Router**: `src/router.ts` - Routes for upload (`/upload`), download (`/dl`), and terms (`/tos`)
- **Components**: 
  - `UploadPageNew.vue` - Modern Material 3 Expressive file upload with options (password protection, one-time download, lifetime)
  - `DownloadPageNew.vue` - Modern Material 3 Expressive file download with password validation and progress
  - `TOS.vue` - Terms of service with Material 3 design
  - `Footer.vue` - Material 3 footer component with environment variable support
  - **Note**: All components redesigned with Material 3 Expressive design system

### Backend (Cloudflare Functions)
- **API Routes**: `functions/api/transfer/` directory contains secure TypeScript functions
  - `upload.ts` - Handles file upload with D1 database storage, R2 object storage, and Turnstile verification
  - `upload-multipart.ts` - Handles large file uploads (>50MB) with chunked upload and retry logic
  - `download/[fileId].ts` - Secure file retrieval with access control
  - `validate/[fileId].ts` - File validation and password verification
  - `info/[fileId].ts` - File metadata retrieval
  - `config.ts` - Configuration endpoint for Turnstile site keys
  - **Note**: All legacy JavaScript and insecure endpoints have been removed

### Infrastructure
- **Cloudflare Pages** - Frontend hosting from `./dist` build output
- **Cloudflare D1** - SQLite database for file metadata (uploads table)
- **Cloudflare R2** - Object storage for actual files (transferbucket)
- **Cloudflare Workers** - Serverless API functions and cleanup worker
- **Cloudflare WAF** - Web Application Firewall with custom rules for upload protection
- **Cloudflare Turnstile** - Bot protection and human verification

### Cleanup Worker (Enhanced)
- **CleanupWorker/src/index-improved.js** - Enhanced scheduled worker using shared configuration
- **Unified deployment** - Uses main wrangler.toml configuration with automated deployment script
- **R2 + Database cleanup** - Removes both storage files and database records for expired content
- **Batch processing** - Handles large volumes efficiently with 50-file batches
- **Comprehensive triggers** - Expiration time, one-time downloads, download limits
- **Database optimization** - Weekly VACUUM operations for performance
- **Environment isolation** - Production (midnight UTC) and preview (2 AM UTC) schedules
- **Manual trigger** - POST request with `Authorization: Bearer <CLEANUP_SECRET>` to the worker URL
  ```bash
  curl -X POST https://<worker-name>.<subdomain>.workers.dev \
    -H "Authorization: Bearer <CLEANUP_SECRET>"
  ```
  Returns JSON with cleanup stats (files processed, deleted, storage freed, errors)

### Key Technologies (Modern Secure Stack)
- Vue 3 with Composition API and TypeScript
- **Material Web Components (@material/web 2.x)** - Material 3 Expressive design system
- **Custom utility CSS** - Lightweight utility classes (TailwindCSS removed to fix Material Web conflicts)
- Cloudflare Pages Functions (serverless backend)
- **Cloudflare R2** - Native object storage (replaces AWS SDK)
- **Cloudflare D1** - SQLite database with prepared statements
- **Web Crypto API** - Native browser crypto (replaces legacy crypto libraries)
- **Fetch API** - Native HTTP requests (replaces axios)
- **Clipboard API** - Native clipboard access (replaces third-party libraries)
- **Vite 7.x** - Latest secure build tooling
- **Wrangler 4.x** - Latest Cloudflare deployment tools

### Deployment & Scripts
- **scripts/deploy-waf.js** - Automated WAF rule deployment script
- **.env.example** - Environment configuration template with company info and legal links
- **CF_WAF_API_TOKEN** / **CF_WAF_ZONE_ID** - WAF-specific environment variables (avoid Wrangler conflicts)
- **CleanupWorker/** - Cloudflare Worker for automated file cleanup
- **Single wrangler.toml** - Unified configuration for all Cloudflare services
- **Automated deployment scripts** - Deploy all components with single commands

### Environment Configuration
The application supports environment variables for easy customization:
- **VITE_COMPANY_NAME** - Company name displayed in footer
- **VITE_COMPANY_ADDRESS_LINE1** - First line of company address
- **VITE_COMPANY_ADDRESS_LINE2** - Second line of company address  
- **VITE_COMPANY_PHONE** - Company phone number
- **VITE_IMPRINT_URL** - Link to imprint/impressum page
- **VITE_PRIVACY_URL** - Link to privacy policy page

### Database Schema (Updated)

**uploads_v2 table** (new secure schema):
- `file_id` (PRIMARY KEY) - UUID for file identification
- `file_name` - Randomized filename in storage
- `original_name` - User's original filename
- `file_size` - File size in bytes
- `content_type` - MIME type
- `expires_at` - Unix timestamp for expiry
- `download_count` - Current download count
- `max_downloads` - Maximum allowed downloads
- `has_password` - Boolean flag for password protection
- `password_hash` - PBKDF2-hashed password (prefixed with `pbkdf2$`)
- `salt` - Unique salt for password hashing
- `is_one_time` - Boolean for one-time download
- `upload_timestamp` - Unix timestamp of upload
- `client_ip` - Uploader's IP address
- `multipart_upload_id` - R2 multipart upload ID (for large files)
- `upload_status` - Status: 'completed', 'uploading', 'failed'

## API Endpoints

### File Operations
- `POST /api/transfer/upload` - Standard file upload (files ≤50MB) with Turnstile verification
- `POST /api/transfer/upload-multipart` - Multipart upload for large files (>50MB)
  - `?action=initiate` - Start multipart upload with Turnstile verification
  - `?action=upload-chunk` - Upload individual chunks (5MB max per chunk for reliability)
  - `?action=complete` - Finalize upload
  - `?action=abort` - Cancel upload
- `GET /api/transfer/info/[fileId]` - Get file metadata
- `POST /api/transfer/validate/[fileId]` - Validate access/password
- `POST /api/transfer/download/[fileId]` - Download file

### Configuration
- `GET /api/config` - Get public configuration (Turnstile site key, etc.)

### Database
- `POST /api/db/migrate` - Run database migrations

## Security Features

### Zero-Vulnerability Architecture
- **0 npm audit vulnerabilities** (eliminated all 16 previous issues)
- **No legacy dependencies** - All AWS SDK, axios, and insecure packages removed
- **100% Cloudflare-native** - Uses only secure, modern Cloudflare services

### Core Security Controls
- File size validation (no file type restrictions - all types allowed)
- Configurable file size limits (5GB default, supports huge files via chunked upload)
- PBKDF2 password hashing (100,000 iterations) with salt using Web Crypto API
- Bot protection via Cloudflare Turnstile human verification
- Optional Zero Trust authentication for upload restriction (see ZERO_TRUST_SETUP.md)
- CSRF protection via proper headers and same-origin policies
- XSS and injection attack prevention with CSP headers
- Secure file storage with randomized names and UUIDs
- SQL injection prevention via prepared statements
- Input validation and sanitization at all entry points
- Environment variable separation to avoid deployment conflicts
- Fixed expiration timing to prevent premature file deletion

## Performance Optimizations

### Build Performance
- **Fast builds**: ~1.1s without TailwindCSS overhead (improved from ~2.7s)
- **Fast dev server**: 366ms startup (improved from 10+ seconds)
- **Bundle size**: ~616 kB with Material 3 components (rich UI features)
- **Optimized dependencies**: Removed TailwindCSS, legacy packages; using lightweight custom utilities

### Runtime Performance
- Database indexes for fast queries
- Cloudflare edge caching for static assets
- Native Cloudflare R2 bindings (faster than AWS SDK)
- Web Crypto API (faster than legacy crypto libraries)
- Native fetch API (lighter than axios)
- Optimized cleanup worker for expired files
- Efficient batch processing for large operations
- Chunked upload with 5MB chunks for reliability and speed
- Automatic retry logic for failed chunk uploads
- Proper API response unwrapping for faster frontend processing
- Material 3 design system with optimized component loading

## UI/UX Improvements

### Material 3 Expressive Design Implementation
- **Complete UI overhaul** with Material 3 Expressive design system
- **Rich visual hierarchy** using Material Design tokens and components
- **Modern typography** and spacing based on Material 3 specifications with Inter font family
- **Enhanced animations** and micro-interactions for better user experience
- **Responsive design** optimized for mobile and desktop
- **Accessibility improvements** through Material Web component standards
- **Dark theme support** with proper color tokens
- **Consistent branding** with environment variable configuration
- **Material Icons integration** with proper font loading and sizing
- **Form component fixes** for proper Vue.js integration with Material Web Components