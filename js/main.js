// ============================================
// INICIALIZAÇÃO PRINCIPAL - PÃO DO CISO
// ============================================
function inicializarSistema() {
    log('Inicializando sistema Pão do Ciso...');
    
    // 1. CARREGAR CARRINHO PRIMEIRO (IMPORTANTE!)
    if (typeof carregarCarrinhoSalvo === 'function') {
        carregarCarrinhoSalvo();
    }
    
    // 1.1 CARREGAR DADOS DO CLIENTE (NOME, TEL, CEP) SALVOS
    if (typeof carregarDadosCliente === 'function') {
        carregarDadosCliente();
    }
    
    // 2. RENDERIZAR CARDÁPIO
    if (typeof renderizarCardapio === 'function') {
        renderizarCardapio();
    }
    
    // 3. CONFIGURAR DATAS DA FORNADA
    if (typeof configurarDatasFornada === 'function') {
        configurarDatasFornada();
    }
    
    // 4. ATUALIZAR BARRA DO CARRINHO
    if (typeof atualizarBarraCarrinho === 'function') {
        atualizarBarraCarrinho();
    }
    
    // 5. CONFIGURAR EVENTOS GERAIS
    if (typeof configurarEventosGerais === 'function') {
        configurarEventosGerais();
    }
    
    // 6. CONFIGURAR EVENTOS DE CEP
    if (typeof configurarEventosCEP === 'function') {
        configurarEventosCEP();
    }
    
    // 7. LINK WHATSAPP NO CABEÇALHO
    const linkWA  = document.getElementById('link-whatsapp-contato');
    const textoWA = document.getElementById('texto-whatsapp-contato');
    const num = window.config?.whatsappVendedor || '';
    if (linkWA)  linkWA.href = `https://wa.me/${num}`;
    if (textoWA) textoWA.textContent = num.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');

    // 8. BARRA DO CARRINHO (evento de clique)
    const barraCarrinho = elemento('barra-carrinho');
    if (barraCarrinho) {
        barraCarrinho.addEventListener('click', function() {
            if (typeof abrirModalCarrinho === 'function') {
                abrirModalCarrinho();
            }
        });
    }
    
    // 9. RECUPERAÇÃO DE CARRINHO (após render do cardápio)
    const temItens = window.carrinho && Object.keys(window.carrinho).length > 0;
    if (temItens && window.iniciarRecuperacaoCarrinho) {
        // Pequeno delay para garantir que o DOM do cardápio está pintado
        setTimeout(() => window.iniciarRecuperacaoCarrinho(), 400);
    }

    log('✅ Sistema inicializado. Carrinho:', carrinho);
}

// ── INICIALIZAÇÃO ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    log('DOM carregado, iniciando...');

    // Garante fallbacks mínimos caso utils.js não tenha carregado ainda
    if (!window.elemento) {
        window.elemento = id => document.getElementById(id);
    }
    if (!window.formatarMoeda) {
        window.formatarMoeda = valor =>
            parseFloat(valor || 0).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
    }

    // Aguarda firebase.js (módulo ES) terminar de inicializar
    if (window._firebasePromise) {
        await window._firebasePromise;
    }

    // Tenta carregar dados do Firestore; fallback para dados.js
    if (typeof window.carregarDadosFirestore === 'function') {
        try {
            const dadosRemoto = await window.carregarDadosFirestore();
            if (dadosRemoto) {
                Object.keys(dadosRemoto).forEach(chave => {
                    if (dadosRemoto[chave] !== null) {
                        window.dadosIniciais[chave] = dadosRemoto[chave];
                    }
                });
                log('✅ Dados carregados do Firestore.');
            } else {
                log('ℹ️ Nenhum dado no Firestore. Usando dados.js.');
            }
        } catch (err) {
            console.warn('⚠️ Falha ao buscar Firestore. Usando dados.js.', err);
        }
    }

    // Verifica se dados essenciais estão disponíveis
    if (!window.dadosIniciais) {
        console.error('❌ Dados iniciais não carregados. Verifique dados.js');
        const container = document.getElementById('container-aplicativo');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#cc0000;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem; margin-bottom:20px;"></i>
                    <h2>Erro ao carregar o cardápio</h2>
                    <p>Por favor, recarregue a página.</p>
                </div>
            `;
        }
        return;
    }

    // ✅ Sem setTimeout — dados.js não tem defer, carrega sincrônico
    inicializarSistema();
});

// ── HELPERS ──────────────────────────────────────────────────────
function ajustarAlturaModal() {
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.modal').forEach(modal => {
            const conteudo = modal.querySelector(
                '.conteudo-modal, .conteudo-modal-produto, .conteudo-modal-carrinho'
            );
            if (conteudo) {
                const alturaConteudo = conteudo.scrollHeight;
                const alturaMaxima   = window.innerHeight * 0.8;
                modal.style.maxHeight    = alturaConteudo > alturaMaxima ? '80vh' : 'auto';
                conteudo.style.maxHeight = alturaConteudo > alturaMaxima
                    ? 'calc(80vh - 60px)' : 'auto';
            }
        });
    }
}

function atualizarDadosModalFornada() {
    const elData   = document.getElementById('data-fornada-info');
    const elLimite = document.getElementById('limite-fornada-info');
    if (!elData || !elLimite) return;

    if (typeof calcularDatasFornada === 'function') {
        try {
            const config = window.dadosIniciais?.fornada;
            if (config) {
                const datas = calcularDatasFornada(config);
                elData.textContent   = datas.fornada || 'A definir';
                elLimite.textContent = datas.limite  || 'A definir';
            }
        } catch (e) {
            elData.textContent   = 'A definir';
            elLimite.textContent = 'A definir';
        }
    }
}

// OneSignal — pede permissão só após o primeiro item adicionado
function solicitarPermissaoNotificacao() {
    if (!window.OneSignalDeferred) return;
    if (localStorage.getItem('onesignal-permissao-solicitada')) return;
    localStorage.setItem('onesignal-permissao-solicitada', '1');
    OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.Notifications.requestPermission();
    });
}

window.addEventListener('resize', ajustarAlturaModal);

// ── NAMESPACE ─────────────────────────────────────────────────────
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.inicializarSistema           = inicializarSistema;
window.PaoDoCiso.atualizarDadosModalFornada   = atualizarDadosModalFornada;
window.PaoDoCiso.solicitarPermissaoNotificacao = solicitarPermissaoNotificacao;
