export async function onRequestPost({request, params, env}) {
    const pw = await request.json()

    const fileInfo = JSON.parse(await env.transfer.get(params.filehash))

    if (fileInfo.options.otd === true && fileInfo.downloadCount > 0) return new Response(null, {status: 404, statusText: 'file not found'})

    if (fileInfo.options.passwordEnabled) {
        if (fileInfo.options.passwordHash === pw.passwordHash) {

            try {
                const fileName = params.filehash + '.' + fileInfo.filename.split('.').pop()

                const signedDownloadUrl = await fetch(env.workerUrl + '/sign?file=' + fileName)

                const data = await signedDownloadUrl.json()


                return new Response(JSON.stringify(data), {status: 200})
            } catch (e) {
                return new Response(e, {status: 501})
            }
        } else {
            return new Response(null, {status: 401})
        }
    } else {
        const fileName = params.filehash + '.' + fileInfo.filename.split('.').pop()

        const signedDownloadUrl = await fetch(env.workerUrl + '/sign?file=' + fileName)
        return new Response(JSON.stringify({signedDownload: signedDownloadUrl.url}), {status: 200})
    }


}
