export async function onRequestPost({request, params, env}) {
    const pw = await request.json()

    const fileInfo = JSON.parse(await env.transfer.get(params.filehash))

    return new Response(JSON.stringify(fileInfo), null)

    if (fileInfo.options.passwordHash === pw.passwordHash) {

        const fileName = params.filehash + '.' + fileInfo.filename.split('.').pop()

        const signedDownloadUrl = await fetch(env.workerUrl + '/sign?file=' + fileName)

        const data = await signedDownloadUrl.json()


        return new Response(JSON.stringify(data), {status: 200})
    } else if (fileInfo.options.passwordEnabled === false) {
        const fileName = params.filehash + '.' + fileInfo.filename.split('.').pop()

        const signedDownloadUrl = await fetch(env.workerUrl + '/' + fileName)
        return new Response(JSON.stringify({signedDownload: signedDownloadUrl.url}), {status: 200})
    } else {
        return new Response(null, {status: 401})
    }

}
