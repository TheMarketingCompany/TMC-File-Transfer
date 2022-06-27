export async function onRequestGet({request, env, params}) {
    let data
    try {
        data = await env.transfer.get(params.filehash)
        if (!data) return new Response(null, {status: 404, statusText: 'file not found'})
        return new Response(data);
    } catch (e) {
        return new Response(e, {status: 501})
    }

}
