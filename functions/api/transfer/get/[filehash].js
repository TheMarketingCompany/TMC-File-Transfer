export async function onRequestGet({request, env, params}) {
    let data
    try {
        data = await env.transfer.get(params.filehash)
        return new Response(data);
    } catch (e) {
        return new Response(e, {status: 404})
    }

}
