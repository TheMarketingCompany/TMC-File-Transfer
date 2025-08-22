import type { CloudflareEnv, RateLimitCheck, ApiResponse } from '../src/types/cloudflare';
import { ERROR_CODES, HTTP_STATUS } from '../src/types/cloudflare';

type Env = CloudflareEnv;

// Rate limiting configuration (temporarily increased for testing)
const RATE_LIMITS = {
  upload: { requests: 100, window: 3600 }, // 100 uploads per hour (testing)
  download: { requests: 1000, window: 3600 }, // 1000 downloads per hour (testing)
  validate: { requests: 500, window: 3600 }, // 500 validations per hour (testing)
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  
  // Add security headers and rate limiting
  const response = await addSecurityHeaders(request, next, env);
  return response;
};

async function addSecurityHeaders(
  request: Request,
  next: () => Promise<Response>,
  env: Env
): Promise<Response> {
  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(request, env);
    if (!rateLimitResult.allowed) {
        const errorResponse: ApiResponse = {
        success: false,
        error: { 
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED, 
          message: 'Rate limit exceeded. Please try again later.' 
        },
        metadata: {
          timestamp: Date.now(),
          rateLimit: {
            allowed: rateLimitResult.limit || 10,
            remaining: rateLimitResult.remaining || 0,
            resetTime: rateLimitResult.resetTime || 0,
          },
        },
      };
      
      return new Response(JSON.stringify(errorResponse), {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
          'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '0'
        },
      });
    }

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

async function checkRateLimit(
  request: Request,
  env: Env
): Promise<RateLimitCheck> {
  try {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Determine rate limit type based on endpoint
    let limitConfig = RATE_LIMITS.validate; // default
    if (url.pathname.includes('/upload')) {
      limitConfig = RATE_LIMITS.upload;
    } else if (url.pathname.includes('/download')) {
      limitConfig = RATE_LIMITS.download;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const windowStart = currentTime - limitConfig.window;
    const key = `${clientIP}:${url.pathname.split('/')[2] || 'api'}`;

    // Clean old entries
    await env.DB.prepare(`
      DELETE FROM rate_limits 
      WHERE timestamp < ? AND client_key = ?
    `).bind(windowStart, key).run();

    // Get current count
    const result = await env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM rate_limits 
      WHERE client_key = ? AND timestamp >= ?
    `).bind(key, windowStart).first();

    const currentCount = (result?.count as number) || 0;

    if (currentCount >= limitConfig.requests) {
      return {
        allowed: false,
        remaining: 0,
        limit: limitConfig.requests,
        resetTime: currentTime + limitConfig.window,
        retryAfter: limitConfig.window,
      };
    }

    // Log this request
    await env.DB.prepare(`
      INSERT INTO rate_limits (client_key, timestamp) 
      VALUES (?, ?)
    `).bind(key, currentTime).run();

    return {
      allowed: true,
      remaining: limitConfig.requests - currentCount - 1,
      limit: limitConfig.requests,
      resetTime: currentTime + limitConfig.window,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Allow request if rate limit check fails
    return { allowed: true };
  }
}