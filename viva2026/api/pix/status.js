const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
};

module.exports = async function handler(req, res) {
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Metodo nao permitido." });

    const duttyUrl = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
    if (!duttyUrl) return res.status(500).json({ error: "Configure DUTTYFY_PIX_URL_ENCRYPTED na hospedagem." });

    const transactionId = req.query?.transactionId;
    if (!transactionId) return res.status(400).json({ error: "transactionId obrigatorio." });

    try {
        const statusUrl = new URL(duttyUrl);
        statusUrl.searchParams.set("transactionId", transactionId);
        const response = await fetch(statusUrl.toString(), {
            method: "GET",
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(10000)
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(502).json({ error: "Falha ao consultar pagamento." });
    }
};
