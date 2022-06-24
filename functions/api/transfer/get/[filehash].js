export async function onRequestGet({request, env, params}) {
    const data = await env.transfer.get(params.filehash)
    delete data.options.passwordHash
    return new Response(data);
}
