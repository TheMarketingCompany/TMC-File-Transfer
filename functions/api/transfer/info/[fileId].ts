import type { CloudflareEnv } from '../../../types';
import { safeCastToDatabaseRecord } from '../../../types';

type Env = CloudflareEnv;

export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return new Response(null, { status: 200, headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  try {
    const fileId = params.fileId as string;
    console.log('Info endpoint called for fileId:', fileId);
    
    if (!fileId || typeof fileId !== 'string') {
      return errorResponse('INVALID_FILE_ID', 'Invalid file ID', 400, corsHeaders);
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(fileId)) {
      return errorResponse('INVALID_FILE_ID', 'Invalid file ID format', 400, corsHeaders);
    }
    
    console.log('Executing database query for fileId:', fileId);
    const dbResult = await env.DB.prepare(`
      SELECT 
        file_id,
        original_name,
        file_size,
        content_type,
        expires_at,
        download_count,
        max_downloads,
        has_password,
        is_one_time,
        upload_timestamp
      FROM uploads_v2 
      WHERE file_id = ?
    `).bind(fileId).first();
    
    console.log('Database query result:', dbResult);
    
    if (!dbResult) {
      return errorResponse('FILE_NOT_FOUND', 'File not found', 404, corsHeaders);
    }
    
    // Skip the complex type casting and use the result directly
    const result = dbResult as any;
    if (!result || !result.file_id) {
      return errorResponse('DATABASE_ERROR', 'Invalid database record', 500, corsHeaders);
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if file has expired
    if (result.expires_at < currentTime) {
      return errorResponse('FILE_EXPIRED', 'File has expired', 410, corsHeaders);
    }
    
    // Check if one-time download has been used
    if (result.is_one_time && result.download_count > 0) {
      return errorResponse('FILE_CONSUMED', 'File has already been downloaded', 410, corsHeaders);
    }
    
    // Check if max downloads reached
    if (result.download_count >= result.max_downloads) {
      return errorResponse('DOWNLOAD_LIMIT_REACHED', 'Download limit reached', 410, corsHeaders);
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
        hasPassword: Boolean(result.has_password),
        isOneTime: Boolean(result.is_one_time),
        uploadedAt: result.upload_timestamp,
        timeRemaining: result.expires_at - currentTime,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('File info error:', error);
    return errorResponse('INTERNAL_ERROR', 'An internal error occurred', 500, corsHeaders);
  }
};

function errorResponse(code: string, message: string, status: number, corsHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message },
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
