# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (runs vue-tsc type checking then vite build)  
- `npm run preview` - Preview production build locally

## Security & Performance Improvements Applied

### Critical Fixes Implemented:
- **SQL Injection**: Fixed with prepared statements and parameter binding
- **Rate Limiting**: Implemented per-IP rate limiting (10 uploads/hour, 100 downloads/hour)
- **File Validation**: Added comprehensive file type, size, and extension validation
- **Security Headers**: CSP, XSS Protection, HSTS, and other security headers
- **Password Security**: Proper hashing with SHA-256 and salt
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Architecture Overview

This is a Vue 3 + TypeScript file transfer application deployed on Cloudflare infrastructure:

### Frontend (Vue 3 + TypeScript)
- **Main app**: `src/App.vue` - Simple layout with router-view and footer
- **Router**: `src/router.ts` - Routes for upload (`/upload`), download (`/dl`), and terms (`/tos`)
- **Components**: 
  - `UploadPage.vue` - File upload with options (password protection, one-time download, lifetime)
  - `DownloadPage.vue` - File download with password validation and progress
  - `TOS.vue` - Terms of service
  - `Footer.vue` - Footer component

### Backend (Cloudflare Functions)
- **API Routes**: `functions/api/transfer/` directory contains serverless functions
  - `[filename].js` - Handles file metadata creation with D1 database storage
  - `get/[filehash].js` - File retrieval logic
  - `validate/[filehash].js` - File validation and access control
  - `auth.js` - Authentication handling

### Infrastructure
- **Cloudflare Pages** - Frontend hosting from `./dist` build output
- **Cloudflare D1** - SQLite database for file metadata (uploads table)
- **Cloudflare R2** - Object storage for actual files (transferbucket)
- **Cloudflare Workers** - Serverless API functions and cleanup worker

### Cleanup Worker (Enhanced)
- **CleanupWorker/src/index-improved.js** - Enhanced scheduled worker
- Batch processing for better performance
- Comprehensive error handling and logging
- Database optimization (VACUUM operations)
- Statistics tracking for monitoring
- Manual cleanup trigger via HTTP endpoint

### Key Technologies
- Vue 3 with Composition API and TypeScript
- TailwindCSS for styling and responsive design
- Cloudflare Pages Functions (serverless backend)
- Cloudflare R2 for secure file storage
- Cloudflare D1 for metadata and rate limiting
- Web Crypto API for secure operations

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
- `password_hash` - SHA-256 hashed password
- `salt` - Unique salt for password hashing
- `is_one_time` - Boolean for one-time download
- `upload_timestamp` - Unix timestamp of upload
- `client_ip` - Uploader's IP address

**rate_limits table**:
- `client_key` - IP + endpoint identifier
- `timestamp` - Request timestamp
- `action_type` - Type of action (upload/download/validate)

## New API Endpoints

- `POST /api/transfer/upload` - Secure file upload with validation
- `GET /api/transfer/info/[fileId]` - Get file metadata
- `POST /api/transfer/validate/[fileId]` - Validate access/password
- `POST /api/transfer/download/[fileId]` - Download file
- `POST /api/db/migrate` - Run database migrations

## Security Features

- Rate limiting per IP address
- File type whitelist validation
- Maximum file size enforcement (100MB)
- Secure password hashing with salt
- CSRF protection via proper headers
- XSS and injection attack prevention
- Secure file storage with randomized names

## Performance Optimizations

- Database indexes for fast queries
- Cloudflare edge caching for static assets
- Optimized cleanup worker for expired files
- Efficient batch processing for large operations
- Smart database connection pooling