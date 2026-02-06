import type { CloudflareEnv, FileUploadRequest, ApiResponse, SecurityValidation, ERROR_CODES } from '../../../src/types/cloudflare';
import { SecurityUtils } from '../../../src/utils/security';

type Env = CloudflareEnv;

type UploadOptions = FileUploadRequest;

// No artificial file size limit - use environment variable or default to 5GB (R2 single upload limit)
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB default

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return new Response(null, { status: 200, headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  try {

    await ensureTablesExist(env.DB);
    
    const formData = await request.formData();
    const file = formData.get('file') as unknown as File;
    const optionsStr = formData.get('options') as unknown as string;
    
    if (!file || !optionsStr) {
      return errorResponse('FILE_MISSING', 'File and options are required', 400, corsHeaders);
    }
    
    // Get max file size from environment or use default
    const maxFileSize = env.MAX_FILE_SIZE ? parseInt(env.MAX_FILE_SIZE, 10) : DEFAULT_MAX_FILE_SIZE;
    
    // Validate file
    const fileValidation = validateFile(file, maxFileSize);
    if (!fileValidation.valid) {
      return errorResponse('FILE_INVALID', fileValidation.error!, 400, corsHeaders);
    }
    
    let options: UploadOptions & { turnstileToken?: string };
    try {
      options = JSON.parse(optionsStr);
    } catch {
      return errorResponse('OPTIONS_INVALID', 'Invalid options format', 400, corsHeaders);
    }
    
    // Verify Turnstile token
    if (!options.turnstileToken) {
      return errorResponse('TURNSTILE_MISSING', 'Verification required', 400, corsHeaders);
    }
    
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const turnstileValid = await SecurityUtils.verifyTurnstileToken(options.turnstileToken, clientIP, env.TURNSTILE_SECRET_KEY);
    if (!turnstileValid) {
      return errorResponse('TURNSTILE_INVALID', 'Verification failed', 400, corsHeaders);
    }
    
    // Validate options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.valid) {
      return errorResponse('OPTIONS_INVALID', optionsValidation.error!, 400, corsHeaders);
    }
    
    // Generate secure identifiers
    const fileId = crypto.randomUUID();
    const fileName = crypto.randomUUID() + '.' + getFileExtension(file.name);
    const salt = crypto.randomUUID();
    
    // Hash password if provided
    let passwordHash = null;
    if (options.passwordEnabled && options.password) {
      passwordHash = await hashPassword(options.password, salt);
    }
    
    // Upload file to R2
    const fileBuffer = await file.arrayBuffer();
    const uploadResult = await env.TRANSFER_BUCKET.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `attachment; filename="${sanitizeFilename(file.name)}"`,
      },
      customMetadata: {
        originalName: file.name,
        fileId: fileId,
        uploadTime: Math.floor(Date.now() / 1000).toString(),
      },
    });
    
    if (!uploadResult) {
      return errorResponse('UPLOAD_FAILED', 'Failed to upload file to storage', 500, corsHeaders);
    }
    
    // Calculate expiration AFTER successful upload
    const completionTime = Math.floor(Date.now() / 1000);
    const lifetimeSeconds = getLifetimeSeconds(options.lifetime);
    const expiresAt = completionTime + lifetimeSeconds;
    
    // Store metadata in database
    const dbResult = await env.DB.prepare(`
      INSERT INTO uploads_v2 (
        file_id, file_name, original_name, file_size, content_type,
        expires_at, download_count, max_downloads, has_password, 
        password_hash, salt, is_one_time, upload_timestamp, client_ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileId,
      fileName,
      file.name,
      file.size,
      file.type,
      expiresAt,
      0,
      options.maxDownloads || (options.onetimeDownload ? 1 : 999999),
      options.passwordEnabled,
      passwordHash,
      salt,
      options.onetimeDownload,
      completionTime,
      request.headers.get('CF-Connecting-IP') || 'unknown'
    ).run();
    
    if (!dbResult.success) {
      // Cleanup uploaded file if database insert fails
      await env.TRANSFER_BUCKET.delete(fileName);
      return errorResponse('DB_ERROR', 'Failed to save file metadata', 500, corsHeaders);
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        fileId,
        downloadUrl: `/dl/${fileId}`,
        expiresAt,
        fileSize: file.size,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('INTERNAL_ERROR', 'An internal error occurred', 500, corsHeaders);
  }
};

function validateFile(file: File, maxSize: number = DEFAULT_MAX_FILE_SIZE): SecurityValidation {
  if (file.size > maxSize) {
    const maxSizeGB = maxSize / (1024 * 1024 * 1024);
    return { valid: false, error: `File size exceeds ${maxSizeGB}GB limit` };
  }
  
  // Allow all file types and extensions - no restrictions
  return { valid: true };
}

function validateOptions(options: UploadOptions): SecurityValidation {
  if (!['1', '7', '30'].includes(options.lifetime)) {
    return { valid: false, error: 'Invalid lifetime value' };
  }
  
  if (options.passwordEnabled) {
    if (!options.password || options.password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (options.password.length > 128) {
      return { valid: false, error: 'Password too long' };
    }
  }
  
  if (options.maxDownloads && (options.maxDownloads < 1 || options.maxDownloads > 1000)) {
    return { valid: false, error: 'Max downloads must be between 1 and 1000' };
  }
  
  return { valid: true };
}

function getLifetimeSeconds(lifetime: string): number {
  switch (lifetime) {
    case '1': return 86400; // 1 day
    case '7': return 604800; // 1 week
    case '30': return 2592000; // 1 month
    default: return 604800; // default 1 week
  }
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return 'pbkdf2$' + hex;
}

async function ensureTablesExist(db: D1Database): Promise<void> {
  // Create table if not exists
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS uploads_v2 (
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
      client_ip TEXT,
      multipart_upload_id TEXT,
      upload_status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  // Add missing columns to existing table (if they don't exist)
  try {
    await db.prepare(`ALTER TABLE uploads_v2 ADD COLUMN multipart_upload_id TEXT`).run();
  } catch (error) {
    // Column already exists, ignore error
  }
  
  try {
    await db.prepare(`ALTER TABLE uploads_v2 ADD COLUMN upload_status TEXT DEFAULT 'completed'`).run();
  } catch (error) {
    // Column already exists, ignore error
  }
  
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_expires_at ON uploads_v2(expires_at)
  `).run();
}

function errorResponse(code: keyof typeof ERROR_CODES, message: string, status: number, corsHeaders?: Record<string, string>): Response {
  const response: ApiResponse = {
    success: false,
    error: { code, message },
    metadata: { timestamp: Date.now() },
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}