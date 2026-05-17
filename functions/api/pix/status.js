const responseHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
};

export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: responseHeaders });
}

export async function onRequestGet({ request, env }) {
    const duttyUrl = env.DUTTYFY_PIX_URL_ENCRYPTED;
    if (!duttyUrl) {
        return json({ error: "Configure DUTTYFY_PIX_URL_ENCRYPTED na hospedagem." }, 500);
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get("transactionId");
    if (!transactionId) return json({ error: "transactionId obrigatorio." }, 400);

    try {
        const statusUrl = new URL(duttyUrl);
        statusUrl.searchParams.set("transactionId", transactionId);
        const response = await fetch(statusUrl.toString(), {
            method: "GET",
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(10000)
        });
        const data = await response.json();
        return json(data, response.status);
    } catch (error) {
        return json({ error: "Falha ao consultar pagamento." }, 502);
    }
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), { status, headers: responseHeaders });
}
