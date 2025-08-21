import type { PagesFunction, EventContext } from '@cloudflare/workers-types';
import { SecurityUtils } from '../../../src/utils/security';

interface Env {
  DB: D1Database;
  TRANSFER_BUCKET: R2Bucket;
  MAX_FILE_SIZE?: string;
  ALLOWED_ORIGINS?: string;
}

interface MultipartUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  chunkCount: number;
  options?: {
    lifetime?: string;
    password?: string;
    maxDownloads?: number;
  };
}

interface ChunkUploadRequest {
  uploadId: string;
  chunkIndex: number;
  chunk: ArrayBuffer;
}

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks (well under Workers limit)

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'initiate':
        return await initiateMultipartUpload(request, env, corsHeaders);
      case 'upload-chunk':
        return await uploadChunk(request, env, corsHeaders);
      case 'complete':
        return await completeMultipartUpload(request, env, corsHeaders);
      case 'abort':
        return await abortMultipartUpload(request, env, corsHeaders);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Multipart upload error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function initiateMultipartUpload(
  request: Request, 
  env: Env, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const data: MultipartUploadRequest = await request.json();
  
  // Validate file
  const maxFileSize = env.MAX_FILE_SIZE ? parseInt(env.MAX_FILE_SIZE) : 5 * 1024 * 1024 * 1024; // 5GB default
  
  if (data.fileSize > maxFileSize) {
    return new Response(JSON.stringify({ 
      error: `File size exceeds ${maxFileSize / (1024 * 1024 * 1024)}GB limit` 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate file type (basic validation)
  const allowedTypes = [
    'image/', 'application/pdf', 'text/', 'application/msword',
    'application/vnd.openxml', 'application/zip', 'audio/', 'video/'
  ];
  
  if (!allowedTypes.some(type => data.contentType.startsWith(type))) {
    return new Response(JSON.stringify({ 
      error: `File type ${data.contentType} is not allowed` 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Generate unique IDs
  const fileId = SecurityUtils.generateSecureId();
  const uploadId = SecurityUtils.generateSecureId();
  const storageName = `${fileId}_${SecurityUtils.sanitizeFilename(data.fileName)}`;

  // Calculate expiry
  const lifetime = parseInt(data.options?.lifetime || '7');
  const expiresAt = Math.floor(Date.now() / 1000) + (lifetime * 24 * 60 * 60);

  // Handle password if provided
  let passwordHash = '';
  let salt = '';
  let hasPassword = false;

  if (data.options?.password) {
    const passwordValidation = SecurityUtils.isValidPassword(data.options.password);
    if (!passwordValidation.valid) {
      return new Response(JSON.stringify({ error: passwordValidation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    salt = SecurityUtils.generateSalt();
    passwordHash = await SecurityUtils.hashPassword(data.options.password, salt);
    hasPassword = true;
  }

  // Initiate R2 multipart upload
  const multipartUpload = await env.TRANSFER_BUCKET.createMultipartUpload(storageName);
  
  // Store metadata in database
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  await env.DB.prepare(`
    INSERT INTO uploads_v2 (
      file_id, file_name, original_name, file_size, content_type,
      expires_at, download_count, max_downloads, has_password,
      password_hash, salt, upload_timestamp, client_ip,
      multipart_upload_id, upload_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    fileId, storageName, data.fileName, data.fileSize, data.contentType,
    expiresAt, 0, data.options?.maxDownloads || 10, hasPassword,
    passwordHash, salt, Math.floor(Date.now() / 1000), clientIp,
    multipartUpload.uploadId, 'uploading'
  ).run();

  return new Response(JSON.stringify({
    success: true,
    data: {
      fileId,
      uploadId: multipartUpload.uploadId,
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(data.fileSize / CHUNK_SIZE),
      expiresAt
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function uploadChunk(
  request: Request, 
  env: Env, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const formData = await request.formData();
  const uploadId = formData.get('uploadId') as string;
  const chunkIndex = parseInt(formData.get('chunkIndex') as string);
  const chunk = formData.get('chunk') as File;

  if (!uploadId || isNaN(chunkIndex) || !chunk) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get upload metadata
  const upload = await env.DB.prepare(`
    SELECT file_name, multipart_upload_id FROM uploads_v2 
    WHERE multipart_upload_id = ? AND upload_status = 'uploading'
  `).bind(uploadId).first();

  if (!upload) {
    return new Response(JSON.stringify({ error: 'Upload not found or completed' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get the multipart upload object
  const multipartUpload = await env.TRANSFER_BUCKET.resumeMultipartUpload(upload.file_name as string, uploadId);

  // Upload chunk to R2
  const chunkData = await chunk.arrayBuffer();
  const partNumber = chunkIndex + 1; // R2 part numbers start from 1
  
  const uploadedPart = await multipartUpload.uploadPart(partNumber, chunkData);

  return new Response(JSON.stringify({
    success: true,
    data: {
      partNumber,
      etag: uploadedPart.etag
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function completeMultipartUpload(
  request: Request, 
  env: Env, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const data: { uploadId: string; parts: Array<{ partNumber: number; etag: string }> } = await request.json();
  const { uploadId, parts } = data;

  if (!uploadId || !Array.isArray(parts)) {
    return new Response(JSON.stringify({ error: 'Missing uploadId or parts' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get upload metadata
  const upload = await env.DB.prepare(`
    SELECT file_id, file_name FROM uploads_v2 
    WHERE multipart_upload_id = ? AND upload_status = 'uploading'
  `).bind(uploadId).first();

  if (!upload) {
    return new Response(JSON.stringify({ error: 'Upload not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the multipart upload object and complete it
    const multipartUpload = await env.TRANSFER_BUCKET.resumeMultipartUpload(upload.file_name as string, uploadId);
    await multipartUpload.complete(parts);

    // Update database status
    await env.DB.prepare(`
      UPDATE uploads_v2 SET upload_status = 'completed' 
      WHERE multipart_upload_id = ?
    `).bind(uploadId).run();

    return new Response(JSON.stringify({
      success: true,
      data: {
        fileId: upload.file_id,
        message: 'Upload completed successfully'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to complete multipart upload:', error);
    
    // Update status to failed
    await env.DB.prepare(`
      UPDATE uploads_v2 SET upload_status = 'failed' 
      WHERE multipart_upload_id = ?
    `).bind(uploadId).run();

    return new Response(JSON.stringify({ error: 'Failed to complete upload' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function abortMultipartUpload(
  request: Request, 
  env: Env, 
  corsHeaders: Record<string, string>
): Promise<Response> {
  const data: { uploadId: string } = await request.json();
  const { uploadId } = data;

  if (!uploadId) {
    return new Response(JSON.stringify({ error: 'Missing uploadId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get upload metadata
  const upload = await env.DB.prepare(`
    SELECT file_name FROM uploads_v2 
    WHERE multipart_upload_id = ? AND upload_status = 'uploading'
  `).bind(uploadId).first();

  if (!upload) {
    return new Response(JSON.stringify({ error: 'Upload not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get the multipart upload object and abort it
    const multipartUpload = await env.TRANSFER_BUCKET.resumeMultipartUpload(upload.file_name as string, uploadId);
    await multipartUpload.abort();

    // Remove from database
    await env.DB.prepare(`
      DELETE FROM uploads_v2 WHERE multipart_upload_id = ?
    `).bind(uploadId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Upload aborted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Failed to abort multipart upload:', error);
    return new Response(JSON.stringify({ error: 'Failed to abort upload' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}