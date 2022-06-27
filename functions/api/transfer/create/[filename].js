export async function onRequestPost({request, params, env}) {
    const options = await request.json()
    const filename = params.filename
    const uuid = crypto.randomUUID()

    const currentDate = new Date()
    let timeout

    switch(options.lifetime) {
        case "1 week":
            timeout = currentDate.getDate() + 14

    }

    options.timeout = timeout

    await env.transfer.put(uuid, JSON.stringify({
        filename: filename,
        options: options
    }))
    return new Response(JSON.stringify({fileId: uuid}))
}
