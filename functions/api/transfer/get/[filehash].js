export async function onRequestGet({ request, env, params }) {

    await tableExists(env.DB);

    let query = 'SELECT * FROM uploads';

    query += ` where fileId = '${params.filehash}'`;


    const result = await env.DB.prepare(query).run();

    if (result.success) {
        console.log(JSON.stringify(result))

        if (result.results.length > 0) {
            const dataset = result.results[0];

            dataset.options = JSON.parse(dataset.options);

            if (dataset.options.otd === true && dataset.downloadCount > 0) return new Response(null, {
                status: 404,
                statusText: 'file not found'
            });

            if (expired(dataset.timeout * 1000) === true) return new Response(null, {
                status: 404,
                statusText: 'file not found'
            });

            return new Response(JSON.stringify(dataset));
        }
        return new Response(JSON.stringify(result));
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

function expired(endTime) {
    const endDate = new Date(endTime);
    const now = new Date();

    const distance = endDate - now;
    return distance < 0;
}