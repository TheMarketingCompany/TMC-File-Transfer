export async function onRequestGet({request, env, params}) {
    const data = JSON.parse(await env.transfer.get(params.filehash))

    return new Response(JSON.stringify({
        filename: data.filename,
        options: {
            lifetime: data.options.lifetime,
            otd: data.options.otd,
            passwordEnabled: data.options.passwordEnabled
        }
    }));
}
