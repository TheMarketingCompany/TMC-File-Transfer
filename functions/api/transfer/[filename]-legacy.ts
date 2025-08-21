/**
 * Legacy filename-based upload endpoint converted to TypeScript
 * 
 * DEPRECATED: This endpoint is kept for backward compatibility only.
 * New implementations should use /api/transfer/upload instead.
 * 
 * Security Issues Fixed:
 * - Added proper type safety
 * - Sanitized inputs
 * - Added basic validation
 * - Improved error handling
 */

import type { CloudflareEnv, ApiResponse, ERROR_CODES } from '../../../src/types/cloudflare';

interface LegacyUploadOptions {
  lifetime: '1' | '7' | '30';
  password?: string;
  otd?: boolean; // one-time download (legacy name)
}

interface RequestContext {
  request: Request;
  params: { filename: string };
  env: CloudflareEnv;
}

/**
 * Legacy upload handler - DEPRECATED
 * @deprecated Use /api/transfer/upload instead
 */
export const onRequestPost: PagesFunction<CloudflareEnv> = async (context) => {
  const { request, params, env } = context as unknown as RequestContext;
  
  try {
    // Basic validation
    if (!params?.filename || typeof params.filename !== 'string') {
      return createErrorResponse('INVALID_REQUEST', 'Missing filename parameter', 400);
    }
    
    // Parse request body
    let options: LegacyUploadOptions;
    try {
      const body = await request.text();
      options = JSON.parse(body) as LegacyUploadOptions;
    } catch {
      return createErrorResponse('INVALID_REQUEST', 'Invalid JSON in request body', 400);
    }
    
    // Validate options
    if (!['1', '7', '30'].includes(options.lifetime)) {
      return createErrorResponse('INVALID_OPTIONS', 'Invalid lifetime value', 400);
    }
    
    // Ensure legacy table exists
    await ensureLegacyTableExists(env.DB);
    
    // Generate UUID and timestamps
    const uuid = crypto.randomUUID();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeout = currentTime + getLifetimeSeconds(options.lifetime);
    
    // Insert into legacy table format
    const result = await env.DB.prepare(`
      INSERT INTO uploads (fileId, filename, timeout, downloadCount, options, uploadTimestamp) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      uuid, 
      sanitizeFilename(params.filename), 
      timeout, 
      0, 
      JSON.stringify(options), 
      currentTime
    ).run();
    
    if (result.success) {
      return Response.json({
        fileId: uuid
      } satisfies { fileId: string });
    } else {
      console.error('Legacy upload failed:', result.error);
      return createErrorResponse('DATABASE_ERROR', 'Failed to save upload record', 500);
    }
    
  } catch (error) {
    console.error('Legacy upload error:', error);
    return createErrorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
};

/**
 * Ensure legacy table exists
 */
async function ensureLegacyTableExists(db: D1Database): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS uploads (
      filename TEXT,
      timeout INTEGER,
      downloadCount INTEGER,
      options TEXT,
      fileId TEXT PRIMARY KEY,
      uploadTimestamp INTEGER
    )
  `).run();
}

/**
 * Get lifetime in seconds
 */
function getLifetimeSeconds(lifetime: '1' | '7' | '30'): number {
  switch (lifetime) {
    case '1': return 86400;      // 1 day
    case '7': return 604800;     // 1 week  
    case '30': return 2592000;   // 1 month
    default: return 604800;      // default 1 week
  }
}

/**
 * Sanitize filename to prevent path traversal and injection
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove dangerous characters
    .substring(0, 255); // Limit length
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  code: keyof typeof ERROR_CODES, 
  message: string, 
  status: number
): Response {
  const response: ApiResponse = {
    success: false,
    error: { code, message },
    metadata: {
      timestamp: Date.now(),
    },
  };
  
  return Response.json(response, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Deprecated': 'true',
      'X-Migration-Info': 'Use /api/transfer/upload instead',
    },
  });
}