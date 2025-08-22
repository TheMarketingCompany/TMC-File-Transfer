import type { CloudflareEnv } from '../../../types';

type Env = CloudflareEnv;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  try {
    const fileId = params.fileId as string;
    console.log('Debug: fileId received:', fileId);
    
    // Check if DB is available
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not available',
        env_keys: Object.keys(env)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Debug: Database available');
    
    // Try a simple query first
    try {
      const simpleResult = await env.DB.prepare('SELECT 1 as test').first();
      console.log('Debug: Simple query result:', simpleResult);
    } catch (error) {
      console.error('Debug: Simple query failed:', error);
      return new Response(JSON.stringify({
        error: 'Simple database query failed',
        details: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Try the actual query
    try {
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
      
      console.log('Debug: Query result:', dbResult);
      
      return new Response(JSON.stringify({
        success: true,
        fileId: fileId,
        dbResult: dbResult,
        dbAvailable: !!env.DB,
        envKeys: Object.keys(env)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (queryError) {
      console.error('Debug: Main query failed:', queryError);
      return new Response(JSON.stringify({
        error: 'Main database query failed',
        details: queryError instanceof Error ? queryError.message : String(queryError),
        fileId: fileId
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Debug: General error:', error);
    return new Response(JSON.stringify({
      error: 'General error in debug endpoint',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};