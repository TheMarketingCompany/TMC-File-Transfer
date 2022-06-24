export async function onRequestGet({request, env, params}) {
    const data = await env.transfer.get(params.filehash)
    return new Response(JSON.parse(data));
}
