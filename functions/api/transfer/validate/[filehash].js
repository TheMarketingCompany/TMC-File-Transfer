const S3 = require('aws-sdk/clients/s3')


export async function onRequestPost({request, params, env}) {
    const pw = await request.json()

    const fileInfo = await env.transfer.get(params.filehash)

    if (fileInfo.options.passwordHash === pw.passwordHash) {

        const fileName = params.filehash + '.' + fileInfo.filename.split('.').pop()

        const signedDownloadUrl = await fetch(env.workerUrl + '/' + fileName)

        return new Response(JSON.stringify({signedDownload: signedDownloadUrl.url}), {status: 200})
    } else if (fileInfo.options.passwordEnabled === false) {
        const fileName = params.filehash + '.' + fileInfo.filename.split('.').pop()

        const signedDownloadUrl = await fetch(env.workerUrl + '/' + fileName)
        return new Response(JSON.stringify({signedDownload: signedDownloadUrl.url}), {status: 200})
    } else {
        return new Response(null, {status: 401})
    }

}
