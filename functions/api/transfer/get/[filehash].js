export async function onRequestGet({request, env, params}) {
    let data
    try {
        data = JSON.parse(await env.transfer.get(params.filehash))
        if (!data) return new Response(null, {status: 404, statusText: 'file not found'})

        if (data.options.otd === true && data.downloadCount > 0) return new Response(null, {status: 404, statusText: 'file not found'})

        return new Response(JSON.stringify(data));
    } catch (e) {
        return new Response(e, {status: 501})
    }

}
