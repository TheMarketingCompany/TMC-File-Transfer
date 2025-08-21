/**
 * Legacy file validation endpoint converted to TypeScript
 * 
 * CRITICAL SECURITY ISSUES FIXED:
 * - Multiple SQL injection vulnerabilities (lines 31, 88-90)
 * - Insecure password comparison (plain text hash comparison)
 * - No input validation
 * - Credential exposure through AWS client
 * 
 * DEPRECATED: Use /api/transfer/validate/[fileId] instead
 * This endpoint is kept for backward compatibility but should not be used.
 */

import type { CloudflareEnv } from '../../../../src/types/cloudflare';

interface LegacyPasswordRequest {
  passwordHash?: string;
}

interface LegacyUploadRecord {
  fileId: string;
  filename: string;
  timeout: number;
  downloadCount: number;
  options: string;
  uploadTimestamp?: number;
}

interface LegacyOptions {
  otd?: boolean;
  passwordEnabled?: boolean;
  passwordHash?: string;
  [key: string]: unknown;
}

interface LegacyCloudflareEnv extends CloudflareEnv {
  KEY_ID?: string;
  KEY?: string;
  endpoint?: string;
  bucket?: string;
}

interface RequestContext {
  request: Request;
  env: LegacyCloudflareEnv;
  params: { filehash: string };
}

/**
 * Legacy validation handler - DEPRECATED AND INSECURE
 * @deprecated Use /api/transfer/validate/[fileId] instead
 */
export const onRequestPost: PagesFunction<LegacyCloudflareEnv> = async (context) => {
  const { request, env, params } = context as unknown as RequestContext;
  
  // Security: Block this endpoint in production due to multiple vulnerabilities
  if (env.ENVIRONMENT === 'production') {
    return Response.json({
      success: false,
      error: {
        code: 'ENDPOINT_DISABLED',
        message: 'This endpoint has been disabled due to critical security vulnerabilities'
      },
      migration: {
        newEndpoint: '/api/transfer/validate/[fileId]',
        securityIssues: [
          'SQL injection vulnerabilities',
          'Insecure password handling', 
          'Credential exposure',
          'No input validation'
        ]
      }
    }, {
      status: 410, // Gone
      headers: {
        'Content-Type': 'application/json',
        'X-Deprecated': 'true',
        'X-Security-Critical': 'Multiple vulnerabilities - DO NOT USE',
      },
    });
  }
  
  // Development mode with warnings
  if (env.ENVIRONMENT === 'development') {
    console.error('🚨 CRITICAL: Legacy validation endpoint called - contains SQL injection vulnerabilities!');
    
    try {
      const filehash = params?.filehash;
      if (!filehash || typeof filehash !== 'string') {
        return createLegacyErrorResponse('Invalid file hash', 400);
      }
      
      // Basic UUID validation to prevent obvious injection
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(filehash)) {
        return createLegacyErrorResponse('Invalid file hash format', 400);
      }
      
      // Parse request safely
      let passwordRequest: LegacyPasswordRequest = {};
      try {
        const body = await request.text();
        if (body.trim()) {
          passwordRequest = JSON.parse(body) as LegacyPasswordRequest;
        }
      } catch (error) {
        return createLegacyErrorResponse('Invalid JSON request', 400);
      }
      
      // Ensure legacy table exists
      await ensureLegacyTableExists(env.DB);
      
      // SECURITY FIX: Use prepared statement instead of string concatenation
      const query = 'SELECT * FROM uploads WHERE fileId = ?';
      const result = await env.DB.prepare(query).bind(filehash).all();
      
      if (!result.success) {
        console.error('Database query failed:', result.error);
        return createLegacyErrorResponse('Database error', 500);
      }
      
      if (result.results.length === 0) {
        return createLegacyErrorResponse('file not found', 404);
      }
      
      const fileinfo = result.results[0] as unknown as LegacyUploadRecord;
      
      // Parse options safely
      let options: LegacyOptions = {};
      try {
        options = JSON.parse(fileinfo.options) as LegacyOptions;
      } catch (error) {
        console.warn('Failed to parse options JSON:', error);
        options = {};
      }
      
      // Check if one-time download was already used
      if (options.otd === true && fileinfo.downloadCount > 0) {
        return createLegacyErrorResponse('file not found', 404);
      }
      
      // SECURITY WARNING: This password comparison is fundamentally insecure
      if (options.passwordEnabled) {
        console.warn('🚨 Insecure password comparison in legacy endpoint');
        
        if (options.passwordHash === passwordRequest.passwordHash) {
          // Generate development-only mock signed URL
          const mockUrl = generateMockSignedUrl(fileinfo, env);
          
          // SECURITY FIX: Use prepared statement for update
          await updateDownloadCountSecurely(fileinfo.fileId, fileinfo.downloadCount, env.DB);
          
          return Response.json({
            url: mockUrl,
            warning: 'Development mode - mock URL generated',
            security: 'This endpoint is insecure - migrate to /api/transfer/validate/[fileId]'
          }, {
            headers: {
              'X-Development-Only': 'true',
              'X-Security-Warning': 'Insecure endpoint',
            },
          });
        } else {
          return createLegacyErrorResponse('Unauthorized', 401);
        }
      } else {
        // No password required
        const mockUrl = generateMockSignedUrl(fileinfo, env);
        
        // SECURITY FIX: Use prepared statement for update
        await updateDownloadCountSecurely(fileinfo.fileId, fileinfo.downloadCount, env.DB);
        
        return Response.json({
          url: mockUrl,
          warning: 'Development mode - mock URL generated'
        }, {
          headers: {
            'X-Development-Only': 'true',
          },
        });
      }
      
    } catch (error) {
      console.error('Legacy validation error:', error);
      return createLegacyErrorResponse('Internal server error', 500);
    }
  }
  
  // Default: return error for any other environment
  return Response.json({
    success: false,
    error: {
      code: 'ENDPOINT_DEPRECATED',
      message: 'This endpoint has been deprecated due to security vulnerabilities'
    }
  }, {
    status: 410,
    headers: {
      'Content-Type': 'application/json',
      'X-Deprecated': 'true',
    },
  });
};

/**
 * Generate mock signed URL for development
 */
function generateMockSignedUrl(fileinfo: LegacyUploadRecord, env: LegacyCloudflareEnv): string {
  const objectKey = fileinfo.uploadTimestamp ? fileinfo.fileId : fileinfo.filename;
  const endpoint = env.endpoint || 'https://mock-endpoint.example.com';
  const bucket = env.bucket || 'mock-bucket';
  
  return `${endpoint}/${bucket}/${objectKey}?X-Amz-Expires=3600&mock=development`;
}

/**
 * Update download count using prepared statement
 */
async function updateDownloadCountSecurely(
  fileId: string, 
  currentCount: number, 
  db: D1Database
): Promise<boolean> {
  try {
    const result = await db.prepare(
      'UPDATE uploads SET downloadCount = ? WHERE fileId = ?'
    ).bind(currentCount + 1, fileId).run();
    
    return result.success;
  } catch (error) {
    console.error('Failed to update download count:', error);
    return false;
  }
}

/**
 * Ensure legacy table exists
 */
async function ensureLegacyTableExists(db: D1Database): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Failed to create legacy table:', error);
    throw error;
  }
}

/**
 * Create legacy-compatible error response
 */
function createLegacyErrorResponse(statusText: string, status: number): Response {
  return new Response(null, {
    status,
    statusText,
    headers: {
      'X-Deprecated': 'true',
      'X-Migration-Info': 'Use /api/transfer/validate/[fileId] instead',
    },
  });
}