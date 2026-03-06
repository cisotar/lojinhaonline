const CACHE_NAME = 'pao-do-ciso-v8';

const ASSETS_ESSENCIAIS = [
    './',
    './index.html',
    './css/01.default/style.css',
    './css/layout-base.css',
    './css/botoes.css',
    './css/cardapio.css',
    './css/notificacoes.css',
    './css/overlay-modal.css',
    './css/modal-produto.css',
    './css/modal-carrinho.css',
    './css/modal-dados-cliente.css',
    './css/modal-pagamento.css',
    './css/modal-recuperar-carrinho.css',
    './css/modal-informacoes-fornada.css',
    './css/modal-sucesso.css',
    './js/config.js',
    './js/dados.js',
    './js/state.js',
    './js/utils.js',
    './js/fornada.js',
    './js/notificacoes.js',
    './js/modais.js',
    './js/cardapio.js',
    './js/carrinho.js',
    './js/produto-modal.js',
    './js/cep-frete.js',
    './js/address-manager.js',
    './js/dados-cliente.js',
    './js/envio.js',
    './js/recuperacao-carrinho.js',
    './js/main.js',
];

const IMAGENS_CACHE = [
    './img/logo192x192.png',
    './img/logo512x512.png',
];

// ── INSTALL: salva todos os assets essenciais e imagens no cache ──
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log(`[SW] Instalando cache: ${CACHE_NAME}`);
            return cache.addAll([...ASSETS_ESSENCIAIS, ...IMAGENS_CACHE]);
        })
    );
    self.skipWaiting();
});

// ── ACTIVATE: remove caches de versões anteriores ────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log(`[SW] Removendo cache antigo: ${name}`);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// ── FETCH: cache-first para imagens, network-first para o resto ──
self.addEventListener('fetch', event => {
    // Ignora requisições de outros domínios
    // (ex: ViaCEP, OneSignal) — deixa o browser tratar normalmente
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    // Imagens: serve do cache imediatamente, busca na rede só se não tiver
    if (event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(resposta => {
                    const respostaClonada = resposta.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, respostaClonada);
                    });
                    return resposta;
                }).catch(() => caches.match(event.request)
                    .then(c => c || new Response('Offline', { status: 503 }))
                );
            })
        );
        return;
    }

    // Demais recursos: network-first, cai no cache se offline
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request)
                .then(cached => cached || new Response('Offline', { status: 503 }))
            )
    );
});
