export async function onRequestPost({request, params, env}) {
    const filename = params.filename
    const uuid = crypto.randomUUID()

    const response = await fetch('https://file-transfer-service.tmc.workers.dev/', {
        method: 'POST',
        body: JSON.stringify({
            filename: filename
        })
    })

    const data = await response.json()


    return new Response(JSON.stringify({uploadId: data.multipartId}))
}
