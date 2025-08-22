import type { CloudflareEnv } from '../../src/types/cloudflare';

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
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const config = {
      turnstileSiteKey: env.TURNSTILE_SITE_KEY || '1x00000000000000000000AA', // Fallback to test key
      maxFileSize: env.MAX_FILE_SIZE ? parseInt(env.MAX_FILE_SIZE) : 5 * 1024 * 1024 * 1024,
      environment: env.ENVIRONMENT || 'development'
    };

    return new Response(JSON.stringify({
      success: true,
      data: config
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Config endpoint error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: { 
        code: 'CONFIG_ERROR', 
        message: 'Failed to load configuration' 
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};