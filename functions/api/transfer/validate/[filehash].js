const S3 = require('aws-sdk/clients/s3')


export async function onRequestPost({request, params, env}) {
    const pw = await request.json()

    const fileInfo = await env.transfer.get(params.filehash)

    if (fileInfo.options.passwordHash === pw.passwordHash) {
        const s3client = new S3({
            endpoint: 'https://' + env.endpoint + '.r2.cloudflarestorage.com',
            accessKeyId: env.accessKeyId,
            secretAccessKey: env.secretAccessKey,
            s3ForcePathStyle: true,
            signatureVersion: 'v4'
        })

        const url = s3client.getSignedUrl('getObject', {
            Bucket: 'transfer',
            Key: params.filehash + '.' + fileInfo.filename.split('.').pop(),
            Expires: 3600
        })
        return new Response(JSON.stringify({signedDownload: url}), {status: 200})
    } else {

        return new Response(null, {status: 401})
    }

}
