export async function onRequestGet({request, env, params}) {
    const data = await env.transfer.get(params.filehash)

    return new Response(JSON.stringify({
        filename: data.filename,
        options: {
            lifetime: data.lifetime,
            otd: data.otd,
            passwordEnabled: data.passwordEnabled
        }
    }));
}
