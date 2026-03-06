// ============================================
// RENDERIZAÇÃO DO CARDÁPIO - PÃO DO CISO
// ============================================

function criarCardProduto(sessao, indiceSessao, item, indiceItem) {
    const identificador = `item-${indiceSessao}-${indiceItem}`;
    const quantidadeNoCarrinho = carrinho[identificador]?.quantidade || 0;
    const estaEsgotado = !!item.esgotado;

    const card = document.createElement('div');
    card.className = `card ${estaEsgotado ? 'esgotado' : ''}`;
    card.dataset.sessao       = indiceSessao;
    card.dataset.item         = indiceItem;
    card.dataset.identificador = identificador;

    card.innerHTML = `
        <div class="card-imagem-wrapper">
            ${quantidadeNoCarrinho > 0 ? `
            <div class="badge-quantidade" style="display:flex;">${quantidadeNoCarrinho}</div>
            ` : ''}
            <img src="${item.imagem}" alt="${item.nome}" loading="lazy">
        </div>
        <div class="card-content">
            <div class="card-nome">${item.nome}</div>
            <div class="card-footer">
                <span class="coluna-preco">
                    <span class="card-preco">${formatarMoeda(item.preco)}</span>
                </span>
                <span class="coluna-controles"></span>
            </div>
        </div>
    `;

    if (!estaEsgotado) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => configurarProduto(indiceSessao, indiceItem));
    } else {
        card.style.cursor = 'not-allowed';
    }

    return card;
}

function criarSecaoProdutos(sessao, indiceSessao) {
    const itensVisiveis = sessao.itens.filter(item => item.visivel !== false);
    if (itensVisiveis.length === 0) return null;

    log(`📁 Seção ${indiceSessao} — "${sessao.nome}": ${itensVisiveis.length} itens`);

    const secaoDiv = document.createElement('div');
    secaoDiv.innerHTML = `
        <div class="titulo-secao-wrapper">
            <div class="linha-solida"></div>
            <h2 class="titulo-secao">${sessao.nome}</h2>
            <div class="linha-solida"></div>
        </div>
        <div class="grid-produtos"></div>
    `;

    const grid = secaoDiv.querySelector('.grid-produtos');
    sessao.itens.forEach((item, indiceItem) => {
        if (item.visivel === false) return;
        grid.appendChild(criarCardProduto(sessao, indiceSessao, item, indiceItem));
    });

    return secaoDiv;
}

// ===================== RENDERIZAÇÃO COMPLETA =====================
function renderizarCardapio() {
    log('🎯 Renderizando cardápio...');

    const container = elemento('container-aplicativo');
    if (!container || !dadosIniciais.secoes) {
        console.error('❌ Container ou dados não encontrados');
        return;
    }

    const fragment = document.createDocumentFragment();
    dadosIniciais.secoes.forEach((sessao, indiceSessao) => {
        const secaoElement = criarSecaoProdutos(sessao, indiceSessao);
        if (secaoElement) fragment.appendChild(secaoElement);
    });

    container.innerHTML = '';
    container.appendChild(fragment);

    atualizarDatasFornada();
    log('✅ Cardápio renderizado');
}

function atualizarCardUnico(indiceSessao, indiceItem) {
    const seletor = `.card[data-sessao="${indiceSessao}"][data-item="${indiceItem}"]`;
    const card    = document.querySelector(seletor);
    if (!card) return;

    const sessao = dadosIniciais.secoes[indiceSessao];
    const item   = sessao.itens[indiceItem];
    if (!item || item.visivel === false) return;

    card.parentNode.replaceChild(criarCardProduto(sessao, indiceSessao, item, indiceItem), card);
}

// ===================== DATAS DA FORNADA =====================
function atualizarDatasFornada() {
    if (!dadosIniciais.fornada) return;

    const datas = calcularDatasFornada(dadosIniciais.fornada);

    const elementoData   = elemento('texto-data-fornada');
    const elementoLimite = elemento('texto-limite-pedido');

    if (elementoData)   elementoData.innerHTML  = `<i class="fas fa-calendar-alt"></i> PRÓXIMA FORNADA: ${datas.fornada}`;
    if (elementoLimite) elementoLimite.textContent = `Pedidos até: ${datas.limite}`;
}

// ===================== BADGE DE QUANTIDADE =====================
function atualizarBadgeNoCard(indiceSessao, indiceItem) {
    const identificador = `item-${indiceSessao}-${indiceItem}`;
    const quantidade    = carrinho[identificador]?.quantidade || 0;

    log(`🏷️ Badge ${identificador}: ${quantidade}`);

    const card = document.querySelector(`[data-sessao="${indiceSessao}"][data-item="${indiceItem}"]`);
    if (!card) return;

    const badge = card.querySelector('.badge-quantidade');

    if (!badge && quantidade > 0) {
        const imagemWrapper = card.querySelector('.card-imagem-wrapper');
        if (imagemWrapper) {
            const novoBadge = document.createElement('div');
            novoBadge.className   = 'badge-quantidade';
            novoBadge.textContent = quantidade;
            novoBadge.style.display = 'flex';
            imagemWrapper.appendChild(novoBadge);
        }
    } else if (badge) {
        if (quantidade > 0) {
            badge.textContent   = quantidade;
            badge.style.display = 'flex';
        } else {
            badge.remove();
        }
    }
}

function atualizarBadgesAposRemocao() {
    // Atualiza badges dos itens que ainda estão no carrinho
    Object.keys(carrinho)
        .filter(id => carrinho[id].quantidade > 0)
        .forEach(identificador => {
            const match = identificador.match(/item-(\d+)-(\d+)/);
            if (match) atualizarBadgeNoCard(parseInt(match[1]), parseInt(match[2]));
        });

    // Remove badges de itens que saíram do carrinho
    document.querySelectorAll('.badge-quantidade').forEach(badge => {
        const card = badge.closest('.card');
        if (!card) return;
        const id = card.dataset.identificador;
        if (!id || !carrinho[id] || carrinho[id].quantidade === 0) {
            badge.remove();
        }
    });
}

// ===================== VALIDAÇÕES =====================
function validarProduto(produto) {
    if (!produto?.nome?.trim())                      { console.error('❌ Produto sem nome'); return false; }
    if (!produto.preco || typeof produto.preco !== 'number') { console.error('❌ Preço inválido'); return false; }
    return true;
}

function verificarDisponibilidade(indiceSessao, indiceItem) {
    const produto = dadosIniciais.secoes?.[indiceSessao]?.itens?.[indiceItem];
    if (!produto)          { console.error('❌ Produto não encontrado'); return false; }
    if (produto.esgotado)  { mostrarNotificacao('Este produto está esgotado!', 'error'); return false; }
    if (produto.visivel === false) return false;
    return true;
}

// ===================== ADIÇÃO RÁPIDA =====================
function adicionarRapido(indiceSessao, indiceItem) {
    if (!verificarDisponibilidade(indiceSessao, indiceItem)) return;

    const produto       = dadosIniciais.secoes[indiceSessao].itens[indiceItem];
    const identificador = `item-${indiceSessao}-${indiceItem}`;

    if (!validarProduto(produto)) return;

    if (!carrinho[identificador]) {
        carrinho[identificador] = {
            identificador, indiceSessao, indiceItem,
            quantidade: 1, opcionais: {},
            precoUnitario: produto.preco, nome: produto.nome
        };
    } else {
        carrinho[identificador].quantidade += 1;
    }

    salvarCarrinho();
    atualizarBarraCarrinho();
    atualizarBadgeNoCard(indiceSessao, indiceItem);
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`, 'success');
}

// Diagnóstico (dev only — pode mover para dev-tools.js futuramente)
function diagnosticarBadges() {
    const itensComBadge = Object.keys(carrinho).filter(id => carrinho[id].quantidade > 0);
    const badgesDOM     = document.querySelectorAll('.badge-quantidade');
    log(`🩺 Badges — esperados: ${itensComBadge.length}, no DOM: ${badgesDOM.length}`);
    return { itensComBadge, badgesDOM };
}

// ===================== EXPORTAÇÕES =====================
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.renderizarCardapio         = renderizarCardapio;
window.PaoDoCiso.atualizarDatasFornada      = atualizarDatasFornada;
window.PaoDoCiso.adicionarRapido            = adicionarRapido;
window.PaoDoCiso.atualizarBadgeNoCard       = atualizarBadgeNoCard;
window.PaoDoCiso.validarProduto             = validarProduto;
window.PaoDoCiso.verificarDisponibilidade   = verificarDisponibilidade;
window.PaoDoCiso.atualizarCardUnico         = atualizarCardUnico;
window.PaoDoCiso.atualizarBadgesAposRemocao = atualizarBadgesAposRemocao;
window.PaoDoCiso.diagnosticarBadges         = diagnosticarBadges;

log('✅ cardapio.js carregado');
