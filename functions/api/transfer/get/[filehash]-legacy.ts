/**
 * Legacy file hash retrieval endpoint converted to TypeScript
 * 
 * DEPRECATED: This endpoint has multiple security vulnerabilities.
 * Use /api/transfer/info/[fileId] instead.
 * 
 * Security Issues Fixed:
 * - SQL injection vulnerability (using string concatenation)
 * - Improper error handling that leaks information
 * - No input validation
 * - Inconsistent response format
 */

import type { CloudflareEnv } from '../../../../src/types/cloudflare';

interface LegacyUploadRecord {
  fileId: string;
  filename: string;
  timeout: number;
  downloadCount: number;
  options: string;
  uploadTimestamp: number;
}

interface LegacyOptions {
  otd?: boolean;
  password?: string;
  [key: string]: unknown;
}

interface RequestContext {
  request: Request;
  env: CloudflareEnv;
  params: { filehash: string };
}

/**
 * Legacy file hash getter - DEPRECATED
 * @deprecated Use /api/transfer/info/[fileId] instead
 */
export const onRequestGet: PagesFunction<CloudflareEnv> = async (context) => {
  const { env, params } = context as unknown as RequestContext;
  
  try {
    // Input validation
    const filehash = params?.filehash;
    if (!filehash || typeof filehash !== 'string') {
      return createLegacyErrorResponse('Invalid file hash parameter', 400);
    }
    
    // Validate UUID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(filehash)) {
      return createLegacyErrorResponse('Invalid file hash format', 400);
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
    
    const dataset = result.results[0] as unknown as LegacyUploadRecord;
    
    // Parse options safely
    let options: LegacyOptions = {};
    try {
      options = JSON.parse(dataset.options) as LegacyOptions;
    } catch (error) {
      console.warn('Failed to parse options JSON:', error);
      options = {};
    }
    
    // Check if one-time download was already used
    if (options.otd === true && dataset.downloadCount > 0) {
      return createLegacyErrorResponse('file not found', 404);
    }
    
    // Check if file has expired (convert seconds to milliseconds)
    if (isExpired(dataset.timeout * 1000)) {
      return createLegacyErrorResponse('file not found', 404);
    }
    
    // Return legacy format with parsed options
    const responseData = {
      ...dataset,
      options
    };
    
    return Response.json(responseData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Deprecated': 'true',
        'X-Migration-Info': 'Use /api/transfer/info/[fileId] instead',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Legacy file hash retrieval error:', error);
    return createLegacyErrorResponse('Internal server error', 500);
  }
};

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
 * Check if a timestamp has expired
 */
function isExpired(endTime: number): boolean {
  const endDate = new Date(endTime);
  const now = new Date();
  return endDate.getTime() < now.getTime();
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
      'X-Migration-Info': 'Use /api/transfer/info/[fileId] instead',
    },
  });
}