(function() {
    const notifyDefaults = { width: "320px", position: "right-top", fontFamily: "Poppins" };

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
            card.addEventListener("click", () => setVal(parseInt(card.dataset.qtd, 10), { redirect: true, silent: false }));
        });

        // Se havia uma seleção anterior, reaplica sem redirecionar
        const saved = parseInt(localStorage.getItem("vs_qtd") || "0", 10);
        if (saved > 0) {
            setVal(saved, { redirect: false, silent: true });
        }
    }

    function setVal(qtd, { redirect = true, silent = false } = {}) {
        const input = document.getElementById("qtdInput");
        if (input) input.value = qtd;

        document.querySelectorAll("[data-qtd]").forEach(c => {
            c.classList.toggle("selected", parseInt(c.dataset.qtd, 10) === qtd);
        });

        localStorage.setItem("vs_qtd", String(qtd));

        if (!silent && window.Notiflix && Notiflix.Notify) {
            Notiflix.Notify.success(`Redirecionando para compra de ${qtd} títulos...`);
        }

        if (redirect) {
            setTimeout(() => redirectToCheckout(qtd), 400);
        }
    }

    function finalizarCompra() {
        const qtd = parseInt(document.getElementById("qtdInput")?.value || "0", 10);
        if (qtd > 0) {
            redirectToCheckout(qtd);
        } else if (window.Notiflix && Notiflix.Notify) {
            Notiflix.Notify.warning("Selecione uma quantidade primeiro!");
        }
    }

    function redirectToCheckout(qtd) {
        const link = `https://vivasortecapitalizacao.com/1/checkout/${qtd}`;
        window.location.href = link;
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
