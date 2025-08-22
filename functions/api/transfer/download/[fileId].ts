import { DatabaseUploadRecord } from '../../../types';

interface Env {
  DB: D1Database;
  TRANSFER_BUCKET: R2Bucket;
}

interface DownloadRequest {
  password?: string;
}

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return new Response(null, { status: 200, headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    const fileId = params.fileId as string;
    
    if (!fileId || typeof fileId !== 'string') {
      return errorResponse('INVALID_FILE_ID', 'Invalid file ID', 400);
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(fileId)) {
      return errorResponse('INVALID_FILE_ID', 'Invalid file ID format', 400);
    }
    
    let requestData: DownloadRequest = {};
    try {
      const body = await request.text();
      if (body) {
        requestData = JSON.parse(body);
      }
    } catch {
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400);
    }
    
    // Get file metadata
    const fileResult = await env.DB.prepare(`
      SELECT 
        file_id,
        file_name,
        original_name,
        file_size,
        content_type,
        expires_at,
        download_count,
        max_downloads,
        has_password,
        password_hash,
        salt,
        is_one_time
      FROM uploads_v2 
      WHERE file_id = ?
    `).bind(fileId).first() as DatabaseUploadRecord | null;
    
    if (!fileResult) {
      return errorResponse('FILE_NOT_FOUND', 'File not found', 404);
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if file has expired
    if (Number(fileResult.expires_at) < currentTime) {
      return errorResponse('FILE_EXPIRED', 'File has expired', 410);
    }
    
    // Check if one-time download has been used
    if (fileResult.is_one_time && Number(fileResult.download_count) > 0) {
      return errorResponse('FILE_CONSUMED', 'File has already been downloaded', 410);
    }
    
    // Check if max downloads reached
    if (Number(fileResult.download_count) >= Number(fileResult.max_downloads)) {
      return errorResponse('DOWNLOAD_LIMIT_REACHED', 'Download limit reached', 410);
    }
    
    // Check password if required
    if (fileResult.has_password) {
      if (!requestData.password) {
        return errorResponse('PASSWORD_REQUIRED', 'Password required', 401);
      }
      
      const hashedPassword = await hashPassword(requestData.password, fileResult.salt || '');
      if (hashedPassword !== fileResult.password_hash) {
        return errorResponse('INVALID_PASSWORD', 'Invalid password', 401);
      }
    }
    
    // Get file from R2
    const object = await env.TRANSFER_BUCKET.get(fileResult.file_name);
    
    if (!object) {
      // File not found in storage, cleanup database record
      await env.DB.prepare(`DELETE FROM uploads_v2 WHERE file_id = ?`)
        .bind(fileId).run();
      return errorResponse('FILE_NOT_FOUND', 'File not found in storage', 404);
    }
    
    // Update download count atomically
    const updateResult = await env.DB.prepare(`
      UPDATE uploads_v2 
      SET download_count = download_count + 1,
          last_download = CURRENT_TIMESTAMP
      WHERE file_id = ? AND download_count < max_downloads
    `).bind(fileId).run();
    
    if (!updateResult.success || (updateResult.meta?.changes && updateResult.meta.changes === 0)) {
      return errorResponse('DOWNLOAD_FAILED', 'Failed to update download count', 500);
    }
    
    // Create response with file content
    const headers = new Headers();
    headers.set('Content-Type', fileResult.content_type);
    headers.set('Content-Length', String(fileResult.file_size));
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(fileResult.original_name)}"`);
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    return new Response(object.body, {
      headers,
    });
    
  } catch (error) {
    console.error('Download error:', error);
    return errorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  
  try {
    const url = new URL(request.url);
    const password = url.searchParams.get('password');
    
    // Create a POST request internally for consistency
    const postRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ password }),
    });
    
    return onRequestPost({ request: postRequest, env, params } as any);
    
  } catch (error) {
    console.error('Download GET error:', error);
    return errorResponse('INTERNAL_ERROR', 'An internal error occurred', 500);
  }
};

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

function errorResponse(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message },
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}