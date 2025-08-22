import type { CloudflareEnv } from '../src/types/cloudflare';

type Env = CloudflareEnv;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  
  // Add security headers only
  const response = await addSecurityHeaders(request, next, env);
  return response;
};

async function addSecurityHeaders(
  request: Request,
  next: () => Promise<Response>,
  env: Env
): Promise<Response> {
  try {
    const response = await next();
    
    // Add security headers (CSP removed to avoid conflicts with HTML meta CSP)
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...securityHeaders,
      },
    });

    return newResponse;
  } catch (error) {
    console.error('Middleware error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An internal error occurred' 
        }
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}