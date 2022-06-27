export async function onRequestPost({request, params, env}) {
    const options = await request.json()
    const filename = params.filename
    const uuid = crypto.randomUUID()

    const currentDate = new Date()
    let timeout

    switch(options.lifetime) {
        case "1 day":
            timeout = (Math.round(+new Date() / 1000)) + 86400 // 86400 => 1 day
            break;
        case "1 week":
            timeout = (Math.round(+new Date() / 1000)) + 604800 // 604800 => 1 week
            break;
        case "1 month":
            timeout = (Math.round(+new Date() / 1000)) + 2592000 // 2592000 => 1 month
            break;
        default:
            timeout = (Math.round(+new Date() / 1000)) + 604800 // 604800 => 1 week
            break;
    }

    await env.transfer.put(uuid, JSON.stringify({
        filename: filename,
        timeout: timeout,
        options: options
    }))
    return new Response(JSON.stringify({fileId: uuid}))
}
