import type { CloudflareEnv, FileUploadRequest, ApiResponse, SecurityValidation, ERROR_CODES } from '../../../src/types/cloudflare';

type Env = CloudflareEnv;

type UploadOptions = FileUploadRequest;

// No artificial file size limit - use environment variable or default to 5GB (R2 single upload limit)
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB default
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  'audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'
]);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    await ensureTablesExist(env.DB);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsStr = formData.get('options') as string;
    
    if (!file || !optionsStr) {
      return errorResponse('FILE_MISSING', 'File and options are required', 400);
    }
    
    // Get max file size from environment or use default
    const maxFileSize = env.MAX_FILE_SIZE ? parseInt(env.MAX_FILE_SIZE, 10) : DEFAULT_MAX_FILE_SIZE;
    
    // Validate file
    const fileValidation = validateFile(file, maxFileSize);
    if (!fileValidation.valid) {
      return errorResponse('FILE_INVALID', fileValidation.error!, 400);
    }
    
    let options: UploadOptions;
    try {
      options = JSON.parse(optionsStr);
    } catch {
      return errorResponse('OPTIONS_INVALID', 'Invalid options format', 400);
    }
    
    // Validate options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.valid) {
      return errorResponse('OPTIONS_INVALID', optionsValidation.error!, 400);
    }
    
    // Generate secure identifiers
    const fileId = crypto.randomUUID();
    const fileName = crypto.randomUUID() + '.' + getFileExtension(file.name);
    const salt = crypto.randomUUID();
    
    // Calculate expiration
    const currentTime = Math.floor(Date.now() / 1000);
    const lifetimeSeconds = getLifetimeSeconds(options.lifetime);
    const expiresAt = currentTime + lifetimeSeconds;
    
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
        uploadTime: currentTime.toString(),
      },
    });
    
    if (!uploadResult) {
      return errorResponse('UPLOAD_FAILED', 'Failed to upload file to storage', 500);
    }
    
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
      currentTime,
      request.headers.get('CF-Connecting-IP') || 'unknown'
    ).run();
    
    if (!dbResult.success) {
      // Cleanup uploaded file if database insert fails
      await env.TRANSFER_BUCKET.delete(fileName);
      return errorResponse('DB_ERROR', 'Failed to save file metadata', 500);
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
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
};

function validateFile(file: File, maxSize: number = DEFAULT_MAX_FILE_SIZE): SecurityValidation {
  if (file.size > maxSize) {
    const maxSizeGB = maxSize / (1024 * 1024 * 1024);
    return { valid: false, error: `File size exceeds ${maxSizeGB}GB limit` };
  }
  
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  
  const extension = getFileExtension(file.name);
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'vbs', 'js', 'jar'];
  if (dangerousExtensions.includes(extension.toLowerCase())) {
    return { valid: false, error: `File extension .${extension} is not allowed for security reasons` };
  }
  
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
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function ensureTablesExist(db: D1Database): Promise<void> {
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      client_key TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_expires_at ON uploads_v2(expires_at)
  `).run();
  
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON rate_limits(client_key, timestamp)
  `).run();
}

function errorResponse(code: keyof typeof ERROR_CODES, message: string, status: number): Response {
  const response: ApiResponse = {
    success: false,
    error: { code, message },
    metadata: { timestamp: Date.now() },
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}