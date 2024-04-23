const {AwsClient} = require('aws4fetch')

let r2;

async function generatePresignedUrl(objectKey, endpoint, bucket) {
    console.log(endpoint)
    const url = new URL(`${endpoint}/${bucket}/${objectKey}`)

    console.log(url)

    url.searchParams.set('X-Amz-Expires', '3600')
//
    const signed = await r2.sign(new Request(url, {
        method: 'GET'
    }), {
        headers: {
            'Content-Disposition': 'attachment; filename=' + objectKey
        },
        aws: {
            signQuery: true
        }
    })

    return signed.url
}

export async function onRequestPost({ request, env, params }) {
    r2 = new AwsClient({
        accessKeyId: env.KEY_ID,
        secretAccessKey: env.KEY
    })

    let query = 'SELECT * FROM uploads';

    query += ` where fileId = '${params.filehash}'`;

    const pw = await request.json();

    const result = await env.DB.prepare(query).run();

    if (result.success) {
        console.log(JSON.stringify(result))

        if (result.results.length > 0) {
            const fileinfo = result.results[0];

            fileinfo.options = JSON.parse(fileinfo.options);

            if (fileinfo.options.otd === true && fileinfo.downloadCount > 0) {
                return new Response(null, {
                    status: 404,
                    statusText: 'file not found'
                })
            }

            if (fileinfo.options.passwordEnabled) {
                if (fileinfo.options.passwordHash === pw.passwordHash) {
                    // correct pw
                    // sign download url
                    const signedUrl = await generatePresignedUrl(fileinfo.filename, env.endpoint, env.bucket)

                    // update dl count + 1
                    await updateDlCount(fileinfo.fileId, fileinfo.downloadCount, env)

                    return new Response(JSON.stringify({url: signedUrl}), {status: 200})
                } else {
                    return new Response(null, {status: 401})
                }
            } else {
                // no pw
                // sign download url
                console.log(env)
                const signedUrl = await generatePresignedUrl(fileinfo.filename, env.endpoint, env.bucket)

                // update dl count + 1
                await updateDlCount(fileinfo.fileId, fileinfo.downloadCount, env)

                return new Response(JSON.stringify({url: signedUrl}), {status: 200})
            }
        }
        return new Response(JSON.stringify(result));
    } else {
        console.log(result)
        return new Response(null, {
            status: 500
        })
    }
}

async function updateDlCount(identifier, currentCount, env) {
    let query = 'UPDATE uploads SET downloadCount = ';
    query += currentCount + 1;
    query += ` where fileId = '${identifier}'`;


    const result = await env.DB.prepare(query).run();

    return !!result.success;
}

function expired(endTime) {
    const endDate = new Date(endTime);
    const now = new Date();

    const distance = endDate - now;
    return distance < 0;
}