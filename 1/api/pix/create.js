const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept"
};

module.exports = async function handler(req, res) {
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido." });

    const duttyUrl = process.env.DUTTYFY_PIX_URL_ENCRYPTED;
    if (!duttyUrl) return res.status(500).json({ error: "Configure DUTTYFY_PIX_URL_ENCRYPTED na hospedagem." });

    let body = req.body || {};
    if (typeof body === "string") {
        try {
            body = JSON.parse(body || "{}");
        } catch (error) {
            return res.status(400).json({ error: "JSON invalido." });
        }
    }

    const payload = normalizePayload(body);
    const validationError = validatePayload(payload);
    if (validationError) return res.status(400).json({ error: validationError });

    try {
        const gatewayResponse = await postWithRetry(duttyUrl, payload);
        return res.status(gatewayResponse.status).json(gatewayResponse.data);
    } catch (error) {
        return res.status(502).json({ error: error.message || "Falha ao gerar Pix." });
    }
};

function normalizePayload(input) {
    const amount = toInteger(input.amount);
    const quantity = Math.max(1, toInteger(input.item?.quantity || input.quantity || 1));
    const title = String(input.item?.title || input.description || "Pagamento via Pix").trim();

    return {
        amount,
        description: String(input.description || title).trim(),
        customer: {
            name: String(input.customer?.name || "").trim(),
            document: onlyDigits(input.customer?.document),
            email: String(input.customer?.email || "").trim(),
            phone: onlyDigits(input.customer?.phone)
        },
        item: {
            title,
            price: toInteger(input.item?.price || amount),
            quantity
        },
        paymentMethod: "PIX",
        utm: String(input.utm || "")
    };
}

function validatePayload(payload) {
    if (!Number.isInteger(payload.amount) || payload.amount < 100) return "Valor minimo de R$ 1,00.";
    if (!payload.customer.name) return "Nome do cliente obrigatorio.";
    if (!/^\d{11}$|^\d{14}$/.test(payload.customer.document)) return "CPF/CNPJ invalido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer.email)) return "E-mail invalido.";
    if (!/^\d{10,11}$/.test(payload.customer.phone)) return "Telefone invalido.";
    if (!payload.item.title) return "Titulo do item obrigatorio.";
    if (!Number.isInteger(payload.item.price) || payload.item.price < 1) return "Preco do item invalido.";
    if (!Number.isInteger(payload.item.quantity) || payload.item.quantity < 1) return "Quantidade invalida.";
    return "";
}

async function postWithRetry(url, payload) {
    const delays = [1000, 2000, 4000];
    let lastError;

    for (let attempt = 0; attempt < delays.length; attempt += 1) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15000)
            });
            const data = await parseGatewayJson(response);

            if (response.status >= 500 && attempt < delays.length - 1) {
                lastError = new Error(getGatewayError(data) || `Dutty retornou erro ${response.status}.`);
                await wait(delays[attempt]);
                continue;
            }

            if (!response.ok) {
                throw new Error(getGatewayError(data) || `Dutty retornou erro ${response.status}.`);
            }

            return { status: response.status, data };
        } catch (error) {
            lastError = error;
            if (attempt >= delays.length - 1) break;
            await wait(delays[attempt]);
        }
    }

    throw lastError || new Error("Falha ao chamar a Dutty.");
}

async function parseGatewayJson(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Resposta invalida da Dutty (${response.status}).`);
    }
}

function getGatewayError(data) {
    if (!data || typeof data !== "object") return "";
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    return "";
}

function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
}

function toInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : 0;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
