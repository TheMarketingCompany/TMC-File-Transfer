export async function onRequestPost({request, params, env}) {
    const options = await request.json()
    const filename = params.filename
    const uuid = crypto.randomUUID()

    await env.transfer.put(uuid, JSON.stringify({
        filename: filename,
        options: options
    }))
    return new Response(JSON.stringify({fileId: uuid}))
}
