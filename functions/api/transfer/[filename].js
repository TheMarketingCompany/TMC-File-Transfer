export async function onRequestPost({ request, params, env }){
    const options = await request.json();
    const filename = params.filename;
    const uuid = crypto.randomUUID();

    await tableExists(env.DB)

    const currentDate = new Date();
    let timeout;

    switch (options.lifetime) {
        case '1':
            timeout = (Math.round(+new Date() / 1000)) + 86400 // 86400 => 1 day
            break;
        case '7':
            timeout = (Math.round(+new Date() / 1000)) + 604800 // 604800 => 1 week
            break;
        case '30':
            timeout = (Math.round(+new Date() / 1000)) + 2592000 // 2592000 => 1 month
            break;
        default:
            timeout = (Math.round(+new Date() / 1000)) + 604800 // 604800 => 1 week
            break;
    }

    let unixTimestamp = Math.floor(Date.now() / 1000);

    const result = await env.DB.prepare(`INSERT INTO uploads (fileId, filename, timeout, downloadCount, options, uploadTimestamp) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(uuid, filename, timeout, 0, JSON.stringify(options), unixTimestamp)
        .run();

    if (result.success) {
        return new Response(JSON.stringify({
            fileId: uuid
        }))
    } else {
        console.log(result)
        return new Response(null, {
            status: 500
        })
    }
}

async function tableExists(DB) {

    await DB.prepare(`
        CREATE TABLE IF NOT EXISTS uploads (
            filename TEXT,
            timeout INTEGER,
            downloadCount INTEGER,
            options TEXT,
            fileId TEXT PRIMARY KEY,
            uploadTimestamp INTEGER
        );
    `).run()

    //await DB.query(query);
}