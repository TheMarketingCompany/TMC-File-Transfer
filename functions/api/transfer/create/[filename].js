export async function onRequestPost({request, params, env}) {
    const options = await request.json()
    const filename = params.filename
    const uuid = crypto.randomUUID()

    const currentDate = new Date()
    let timeout

    switch(options.lifetime) {
        case "1 week":
            timeout = (Math.round(+new Date() / 1000)) + 604800 // 604800 => 1 week

    }

    await env.transfer.put(uuid, JSON.stringify({
        filename: filename,
        timeout: timeout,
        options: options
    }))
    return new Response(JSON.stringify({fileId: uuid}))
}
