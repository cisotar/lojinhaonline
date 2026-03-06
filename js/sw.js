// ============================================
// SERVICE WORKER — PÃO DO CISO v2.1
// ============================================
// COMO FAZER DEPLOY EM NOVO DOMÍNIO:
//   1. Incremente CACHE_NAME (ex: v6, v7...)
//   2. O SW antigo será descartado automaticamente no activate
// ============================================

const CACHE_NAME = 'pao-do-ciso-v6';

const ASSETS_ESSENCIAIS = [
    './',
    './index.html',
    // CSS
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
    // JS — ordem de carregamento
    './js/config.js',
    './js/dados.js',
    './js/state.js',
    './js/utils.js',
    './js/fornada.js',
    './js/notificacoes.js',
    './js/modais.js',
    './js/cardapio.js',
    './js/opcionais.js',
    './js/carrinho.js',
    './js/produto-modal.js',
    './js/cep-frete.js',
    './js/address-manager.js',
    './js/dados-cliente.js',
    './js/pagamento.js',
    './js/envio.js',
    './js/recuperacao-carrinho.js',
    './js/compat.js',
    './js/main.js',
    // Imagens essenciais
    './img/logo192x192.png',
    './img/logo512x512.png',
    './img/logo-paodociso.png',
];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log(`[SW] Instalando cache: ${CACHE_NAME}`);
            // addAll falha se qualquer asset der 404 — usamos Promise.allSettled
            // para não bloquear a instalação por imagens ainda não existentes
            return Promise.allSettled(
                ASSETS_ESSENCIAIS.map(url =>
                    cache.add(url).catch(err =>
                        console.warn(`[SW] Não cacheado: ${url}`, err.message)
                    )
                )
            );
        })
    );
    self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log(`[SW] Removendo cache antigo: ${name}`);
                        return caches.delete(name);
                    })
            )
        )
    );
    self.clients.claim();
});

// ── FETCH: network-first, fallback para cache ─────────────────────
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Ignora requisições externas (ViaCEP, Firebase, OneSignal, etc.)
    if (url.origin !== self.location.origin) return;

    // Ignora requisições POST (envio de pedido para planilha)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(resposta => {
                // Cache dinâmico de imagens de produto
                if (event.request.destination === 'image') {
                    const clone = resposta.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return resposta;
            })
            .catch(() =>
                caches.match(event.request).then(
                    cached => cached || new Response(
                        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title>' +
                        '<style>body{font-family:sans-serif;display:flex;align-items:center;' +
                        'justify-content:center;height:100vh;margin:0;background:#fdf5e6;color:#2d3a27;}' +
                        'div{text-align:center;}h1{font-size:2rem;}p{color:#666;}</style></head>' +
                        '<body><div><h1>🍞</h1><h1>Sem conexão</h1>' +
                        '<p>Verifique sua internet e tente novamente.</p></div></body></html>',
                        { status: 503, headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
                    )
                )
            )
    );
});
