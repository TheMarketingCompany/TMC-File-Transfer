/**
 * Legacy authentication endpoint converted to TypeScript
 * 
 * DEPRECATED: This endpoint exposes sensitive credentials and should not be used.
 * Modern implementations use server-side operations with proper security.
 * 
 * Security Issues:
 * - Exposes access keys to client-side
 * - No authentication or authorization
 * - Credentials transmitted in plain text
 * 
 * This endpoint is disabled by default for security reasons.
 */

import type { CloudflareEnv } from '../../../src/types/cloudflare';

interface LegacyAuthResponse {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
}

interface LegacyCloudflareEnv extends CloudflareEnv {
  KEY_ID?: string;
  KEY?: string;
  endpoint?: string;
  bucket?: string;
}

/**
 * Legacy authentication handler - DISABLED FOR SECURITY
 * @deprecated This endpoint is disabled due to security concerns
 */
export const onRequest: PagesFunction<LegacyCloudflareEnv> = async (context) => {
  const { env } = context;
  
  // Security: Disable this endpoint in production
  if (env.ENVIRONMENT === 'production') {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'ENDPOINT_DISABLED',
        message: 'This endpoint has been disabled for security reasons. Use server-side upload endpoints instead.'
      },
      migration: {
        newEndpoint: '/api/transfer/upload',
        documentation: 'See DEPLOYMENT.md for migration instructions'
      }
    }), {
      status: 410, // Gone
      headers: {
        'Content-Type': 'application/json',
        'X-Deprecated': 'true',
        'X-Security-Warning': 'This endpoint exposes credentials and has been disabled',
      },
    });
  }
  
  // Development mode warning
  if (env.ENVIRONMENT === 'development') {
    console.warn('⚠️ Legacy auth endpoint accessed in development mode - this is insecure!');
    
    // Only return dummy credentials in development
    const auth: LegacyAuthResponse = {
      accessKeyId: 'development-dummy-key',
      secretAccessKey: 'development-dummy-secret',
      endpoint: 'development-endpoint',
      bucket: 'development-bucket'
    };
    
    return Response.json({
      ...auth,
      warning: 'Development mode only - do not use in production',
      migration: 'Use /api/transfer/upload for secure uploads'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Deprecated': 'true',
        'X-Development-Only': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
  
  // Default: return error
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: 'ENDPOINT_DEPRECATED',
      message: 'This endpoint has been deprecated for security reasons'
    }
  }), {
    status: 410,
    headers: {
      'Content-Type': 'application/json',
      'X-Deprecated': 'true',
    },
  });
};