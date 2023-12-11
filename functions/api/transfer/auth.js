export async function onRequest(context) {
    const {
        env
    } = context;

    const auth = {
        accessKeyId: env.KEY_ID,
        secretAccessKey: env.KEY,
        endpoint: env.ENDPOINT,
        bucket: env.bucket
    }

    return new Response(JSON.stringify(auth));
}
