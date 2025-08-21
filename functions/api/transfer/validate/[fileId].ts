interface Env {
  DB: D1Database;
  TRANSFER_BUCKET: R2Bucket;
}

interface ValidateRequest {
  password?: string;
}

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
    
    let requestData: ValidateRequest = {};
    try {
      const body = await request.text();
      if (body) {
        requestData = JSON.parse(body);
      }
    } catch {
      return errorResponse('INVALID_REQUEST', 'Invalid request body', 400);
    }
    
    // Get file metadata
    const result = await env.DB.prepare(`
      SELECT 
        file_id,
        original_name,
        file_size,
        content_type,
        expires_at,
        download_count,
        max_downloads,
        has_password,
        password_hash,
        salt,
        is_one_time,
        upload_timestamp
      FROM uploads_v2 
      WHERE file_id = ?
    `).bind(fileId).first();
    
    if (!result) {
      return errorResponse('FILE_NOT_FOUND', 'File not found', 404);
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if file has expired
    if (result.expires_at < currentTime) {
      return errorResponse('FILE_EXPIRED', 'File has expired', 410);
    }
    
    // Check if one-time download has been used
    if (result.is_one_time && result.download_count > 0) {
      return errorResponse('FILE_CONSUMED', 'File has already been downloaded', 410);
    }
    
    // Check if max downloads reached
    if (result.download_count >= result.max_downloads) {
      return errorResponse('DOWNLOAD_LIMIT_REACHED', 'Download limit reached', 410);
    }
    
    // Check password if required
    if (result.has_password) {
      if (!requestData.password) {
        return new Response(JSON.stringify({
          success: false,
          requiresPassword: true,
          error: { code: 'PASSWORD_REQUIRED', message: 'Password required' },
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const hashedPassword = await hashPassword(requestData.password, result.salt);
      if (hashedPassword !== result.password_hash) {
        return errorResponse('INVALID_PASSWORD', 'Invalid password', 401);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        fileId: result.file_id,
        filename: result.original_name,
        fileSize: result.file_size,
        contentType: result.content_type,
        downloadCount: result.download_count,
        maxDownloads: result.max_downloads,
        expiresAt: result.expires_at,
        isOneTime: Boolean(result.is_one_time),
        uploadedAt: result.upload_timestamp,
        timeRemaining: result.expires_at - currentTime,
        downloadUrl: `/api/transfer/download/${fileId}`,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Validate error:', error);
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

function errorResponse(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message },
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}