export async function onRequest({env}) {

    const test = await env.transfer.get('testKey')

    return new Response(JSON.stringify(test));
}
