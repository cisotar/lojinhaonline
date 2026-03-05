// ============================================
// RENDERIZAÇÃO DO CARDÁPIO - PÃO DO CISO
// ============================================

// ===================== FUNÇÕES AUXILIARES MODULARIZADAS =====================

function criarCardProduto(sessao, indiceSessao, item, indiceItem) {
    const identificador = `item-${indiceSessao}-${indiceItem}`;
    const quantidadeNoCarrinho = carrinho[identificador]?.quantidade || 0;
    const estaEsgotado = !!item.esgotado; 
    
    const card = document.createElement('div');
    card.className = `card ${estaEsgotado ? 'esgotado' : ''}`;
    card.dataset.sessao = indiceSessao;
    card.dataset.item = indiceItem;
    card.dataset.identificador = identificador;
    
    // HTML Limpo: Sem descrição, sem divisor e sem botão +
    card.innerHTML = `
        <div class="card-imagem-wrapper">
            
            
            ${quantidadeNoCarrinho > 0 ? `
            <div class="badge-quantidade" style="display: flex;">
                ${quantidadeNoCarrinho}
            </div>
            ` : ''}
            <img src="${item.imagem}" alt="${item.nome}" loading="lazy">
        </div>
        
        <div class="card-content">
            <div class="card-nome">${item.nome}</div>
            <div class="card-footer">
                <span class="coluna-preco">
                    <span class="card-preco">${formatarMoeda(item.preco)}</span>
                </span>
                <span class="coluna-controles">
                </span>
            </div>
        </div>
    `;
    
    // Evento de clique no CARD TODO (apenas se não estiver esgotado)
    if (!estaEsgotado) {
        card.style.cursor = 'pointer'; // Garante o cursor de clique
        card.addEventListener('click', () => {
            configurarProduto(indiceSessao, indiceItem);
        });
    } else {
        card.style.cursor = 'not-allowed';
    }
    
    return card;
}

function criarSecaoProdutos(sessao, indiceSessao) {
    const itensVisiveis = sessao.itens.filter(item => item.visivel !== false);
    if (itensVisiveis.length === 0) return null;
    
    log(`📁 Criando seção ${indiceSessao} - "${sessao.nome}": ${itensVisiveis.length} itens`);
    
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
    let cardsCriados = 0;
    
    sessao.itens.forEach((item, indiceItem) => {
        if (item.visivel === false) return;
        
        const card = criarCardProduto(sessao, indiceSessao, item, indiceItem);
        grid.appendChild(card);
        cardsCriados++;
    });
    
    log(`   ✅ ${cardsCriados} cards criados na seção "${sessao.nome}"`);
    return secaoDiv;
}

// ===================== RENDERIZAÇÃO DO CARDÁPIO (OTIMIZADA) =====================

function renderizarCardapio() {
    log("🎯 RENDERIZANDO CARDÁPIO COMPLETO");
    log("Carrinho atual:", carrinho);
    log("Quantidade de itens no carrinho:", Object.keys(carrinho).length);
    
    const container = elemento('container-aplicativo');
    if (!container || !dadosIniciais.secoes) {
        console.error("❌ Container ou dados iniciais não encontrados");
        return;
    }

    log(`📊 Renderizando ${dadosIniciais.secoes.length} seções`);
    
    // Usar DocumentFragment para reduzir reflows
    const fragment = document.createDocumentFragment();
    
    dadosIniciais.secoes.forEach((sessao, indiceSessao) => {
        const secaoElement = criarSecaoProdutos(sessao, indiceSessao);
        if (secaoElement) {
            fragment.appendChild(secaoElement);
        }
    });
    
    // Limpar e adicionar tudo de uma vez
    container.innerHTML = '';
    container.appendChild(fragment);
    
    log("✅ Renderização do cardápio concluída");
    atualizarDatasFornada();
}

// Função para renderizar APENAS UM CARD específico (para atualizações)
function atualizarCardUnico(indiceSessao, indiceItem) {
    log(`🎯 ATUALIZANDO CARD ÚNICO: seção ${indiceSessao}, item ${indiceItem}`);
    
    const seletor = `.card[data-sessao="${indiceSessao}"][data-item="${indiceItem}"]`;
    const card = document.querySelector(seletor);
    
    if (!card) {
        log(`❌ Card não encontrado para atualização: ${seletor}`);
        return;
    }
    
    const sessao = dadosIniciais.secoes[indiceSessao];
    const item = sessao.itens[indiceItem];
    
    if (!item || item.visivel === false) {
        log(`❌ Item não disponível para atualização`);
        return;
    }
    
    // Substituir apenas este card
    const novoCard = criarCardProduto(sessao, indiceSessao, item, indiceItem);
    card.parentNode.replaceChild(novoCard, card);
    
    log(`✅ Card atualizado: ${item.nome}`);
}

// Função para atualizar APENAS OS BADGES sem re-renderizar tudo - VERSÃO CORRIGIDA
function atualizarBadgesAposRemocao() {
    log("🔄 ATUALIZANDO BADGES APÓS REMOÇÃO (VERSÃO CORRIGIDA)");
    
    // 1. Primeiro: Coletar todos os identificadores que DEVEM ter badge
    const itensComQuantidadePositiva = Object.keys(carrinho).filter(id => carrinho[id].quantidade > 0);
    log(`📊 Itens que DEVEM ter badge: ${itensComQuantidadePositiva.length}`);
    
    // 2. Para cada item que DEVE ter badge, atualize-o
    itensComQuantidadePositiva.forEach(identificador => {
        const item = carrinho[identificador];
        const match = identificador.match(/item-(\d+)-(\d+)/);
        if (match) {
            const indiceSessao = parseInt(match[1]);
            const indiceItem = parseInt(match[2]);
            atualizarBadgeNoCard(indiceSessao, indiceItem);
        }
    });
    
    // 3. AGORA A PARTE CRÍTICA: Remover badges de itens que NÃO estão mais no carrinho
    //    ou estão com quantidade = 0
    const todosBadgesNoDOM = document.querySelectorAll('.badge-quantidade');
    log(`🔍 Verificando ${todosBadgesNoDOM.length} badges no DOM...`);
    
    todosBadgesNoDOM.forEach(badge => {
        const card = badge.closest('.card');
        if (!card) return;
        
        const identificador = card.dataset.identificador;
        if (!identificador) return;
        
        const quantidadeNoCarrinho = carrinho[identificador]?.quantidade || 0;
        
        // Se NÃO está no carrinho OU quantidade = 0, REMOVER badge
        if (!carrinho[identificador] || quantidadeNoCarrinho === 0) {
            log(`🗑️ Removendo badge obsoleto: ${identificador}`);
            badge.remove();
        }
    });
    
    // 4. Verificação final
    setTimeout(() => {
        const badgesRestantes = document.querySelectorAll('.badge-quantidade').length;
        log(`✅ Badges após limpeza: ${badgesRestantes}`);
    }, 100);
}

// ===================== DATAS DA FORNADA =====================
function atualizarDatasFornada() {
    log("📅 Atualizando datas da fornada...");
    
    if (!dadosIniciais.fornada) {
        console.warn("⚠️ Dados da fornada não encontrados");
        return;
    }

    const datas = calcularDatasFornada(dadosIniciais.fornada);
    log("📅 Datas calculadas:", datas);
    
    const elementoData = elemento('texto-data-fornada');
    const elementoLimite = elemento('texto-limite-pedido');
    
    if (elementoData) {
        elementoData.innerHTML = `
            <i class="fas fa-calendar-alt"></i> PRÓXIMA FORNADA: ${datas.fornada}
        `;
        log(`✅ Data da fornada atualizada: ${datas.fornada}`);
    } else {
        console.warn("⚠️ Elemento 'texto-data-fornada' não encontrado");
    }
    
    if (elementoLimite) {
        elementoLimite.textContent = `Pedidos até: ${datas.limite}`;
        log(`✅ Limite de pedido atualizado: ${datas.limite}`);
    } else {
        console.warn("⚠️ Elemento 'texto-limite-pedido' não encontrado");
    }
}

// ===================== FUNÇÕES RÁPIDAS DE ADIÇÃO =====================

// Função para validar dados do produto
function validarProduto(produto) {
    log("🔍 Validando produto:", produto);
    
    if (!produto) {
        console.error("❌ Produto não definido");
        return false;
    }
    
    if (!produto.nome || produto.nome.trim() === '') {
        console.error("❌ Produto sem nome");
        return false;
    }
    
    if (!produto.preco || typeof produto.preco !== 'number') {
        console.error("❌ Produto sem preço válido:", produto.preco);
        return false;
    }
    
    log("✅ Produto validado com sucesso");
    return true;
}

// Função para verificar disponibilidade do produto
function verificarDisponibilidade(indiceSessao, indiceItem) {
    log(`🔍 Verificando disponibilidade: seção ${indiceSessao}, item ${indiceItem}`);
    
    if (!dadosIniciais.secoes?.[indiceSessao]?.itens?.[indiceItem]) {
        console.error(`❌ Produto não encontrado: seção ${indiceSessao}, item ${indiceItem}`);
        return false;
    }
    
    const produto = dadosIniciais.secoes[indiceSessao].itens[indiceItem];
    log(`📦 Produto encontrado: "${produto.nome}"`, {
        esgotado: produto.esgotado,
        visivel: produto.visivel
    });
    
    if (produto.esgotado) {
        console.warn(`⚠️ Produto esgotado: "${produto.nome}"`);
        mostrarNotificacao('Este produto está esgotado!', 'error');
        return false;
    }
    
    if (produto.visivel === false) {
        console.warn(`⚠️ Produto não está visível: "${produto.nome}"`);
        return false;
    }
    
    log(`✅ Produto disponível: "${produto.nome}"`);
    return true;
}


// ÚNICA VERSÃO DA FUNÇÃO adicionarRapido (a versão otimizada)
function adicionarRapido(indiceSessao, indiceItem) {
    log(`🛒 ADICIONAR RÁPIDO: seção ${indiceSessao}, item ${indiceItem}`);
    
    // Validação
    if (!verificarDisponibilidade(indiceSessao, indiceItem)) {
        console.error(`❌ Produto não disponível: seção ${indiceSessao}, item ${indiceItem}`);
        return;
    }
    
    const produto = dadosIniciais.secoes[indiceSessao].itens[indiceItem];
    log(`📦 Produto para adicionar: "${produto.nome}"`);
    
    if (!validarProduto(produto)) {
        console.error(`❌ Validação do produto falhou: "${produto.nome}"`);
        mostrarNotificacao('Erro ao adicionar produto', 'error');
        return;
    }
    
    const identificador = `item-${indiceSessao}-${indiceItem}`;
    log(`🔑 Identificador do produto: ${identificador}`);
    
    // Adiciona ao carrinho
    if (!carrinho[identificador]) {
        log(`🆕 Criando novo item no carrinho: ${identificador}`);
        carrinho[identificador] = {
            identificador: identificador,
            indiceSessao: indiceSessao,
            indiceItem: indiceItem,
            quantidade: 1,
            opcionais: {},
            precoUnitario: produto.preco,
            nome: produto.nome
        };
    } else {
        carrinho[identificador].quantidade += 1;
        log(`🔢 Incrementando quantidade: ${identificador} = ${carrinho[identificador].quantidade}`);
    }
    
    log(`🛒 Estado atual do carrinho:`, carrinho);
    
    salvarCarrinho();
    log(`💾 Carrinho salvo no localStorage`);
    
    atualizarBarraCarrinho();
    log(`📊 Barra do carrinho atualizada`);
    
    atualizarBadgeNoCard(indiceSessao, indiceItem);
    
    // Feedback visual
    mostrarNotificacao(`${produto.nome} adicionado ao carrinho!`, 'success');
}

function atualizarBadgeNoCard(indiceSessao, indiceItem) {
    const identificador = `item-${indiceSessao}-${indiceItem}`;
    const quantidade = carrinho[identificador]?.quantidade || 0;
    
    log(`🔍 DIAGNÓSTICO: atualizarBadgeNoCard chamada`);
    log(`   Identificador: ${identificador}`);
    log(`   Quantidade no carrinho: ${quantidade}`);
    log(`   Produto: ${dadosIniciais.secoes[indiceSessao]?.itens[indiceItem]?.nome || 'Desconhecido'}`);
    log(`🔄 ATUALIZAR BADGE: ${identificador}, quantidade: ${quantidade}`, {
        carrinhoItem: carrinho[identificador]
    });
    
    // Usar data attributes para encontrar o card específico
    const seletor = `[data-sessao="${indiceSessao}"][data-item="${indiceItem}"]`;
    log(`   Seletor usado: ${seletor}`);
    log(`🔍 Buscando card com seletor: ${seletor}`);
    
    const card = document.querySelector(seletor);
        log(`   Card encontrado? ${!!card}`);
    if (card) {
        log(`   Nome do card: ${card.querySelector('.card-nome')?.textContent}`);
    } else {
        log(`   ❌ Card NÃO encontrado com seletor: ${seletor}`);
    }

    if (!card) {
        console.error(`❌ Card não encontrado: seção ${indiceSessao}, item ${indiceItem}`);
        log(`   Todos os cards no DOM:`, document.querySelectorAll('[data-sessao]').length);
        return;
    }
    
    log(`✅ Card encontrado:`, card);
    
    const badge = card.querySelector('.badge-quantidade');
        log(`   Badge encontrado no card? ${!!badge}`);
    if (badge) {
        log(`   Texto atual do badge: "${badge.textContent}"`);
    }    
    log(`🔍 Badge atual:`, badge);
    
    if (!badge && quantidade > 0) {
        log(`   AÇÃO: Criando novo badge (não existia)`);
        // Criar badge se não existir
        log(`🆕 Criando novo badge para ${identificador}: quantidade ${quantidade}`);
        const imagemWrapper = card.querySelector('.card-imagem-wrapper');
        if (imagemWrapper) {
            const novoBadge = document.createElement('div');
            novoBadge.className = 'badge-quantidade';
            novoBadge.textContent = quantidade;
            
            // 🔥 IMPORTANTE: Definir o estilo display: flex
            novoBadge.style.display = 'flex';
            
            // Adicionar animação
            novoBadge.classList.add('updated');
            setTimeout(() => {
                novoBadge.classList.remove('updated');
            }, 300);
            
            imagemWrapper.appendChild(novoBadge);
            log(`✅ Badge criado e adicionado:`, novoBadge);
            log(`✅ Estilo do badge:`, novoBadge.style.cssText);
        } else {
            console.error(`❌ Não encontrou .card-imagem-wrapper no card`);
        }
    } else if (badge) {
        if (quantidade > 0) {
            log(`✏️ Atualizando badge existente: ${quantidade}`);
            log(`   AÇÃO: Atualizando badge existente de "${badge.textContent}" para "${quantidade}"`);
            badge.textContent = quantidade;
            badge.style.display = 'flex';
            
            // Adicionar animação de atualização
            badge.classList.add('updated');
            setTimeout(() => {
                badge.classList.remove('updated');
            }, 300);
        } else {
            log(`🗑️ Removendo badge (quantidade = 0)`);
            log(`   AÇÃO: Removendo badge do card`);
            badge.remove();
        }
    } else {
        log(`ℹ️ Nenhuma ação necessária para badge (quantidade: ${quantidade})`);
    }
    
    log(`✅ Badge atualizado para ${identificador}: ${quantidade}`);
}

// ===================== FUNÇÃO DE DIAGNÓSTICO =====================
function diagnosticarBadges() {
    log("=== 🩺 DIAGNÓSTICO COMPLETO DE BADGES ===");
    
    // 1. Carrinho atual
    log("📦 CARRINHO ATUAL:");
    const itensCarrinho = Object.keys(carrinho);
    
    if (itensCarrinho.length === 0) {
        log("   (Carrinho vazio)");
    } else {
        itensCarrinho.forEach(id => {
            const item = carrinho[id];
            log(`   ${id}: ${item.nome || 'Sem nome'} - ${item.quantidade} un.`);
        });
    }
    
    // 2. Itens que DEVEM ter badge (quantidade > 0)
    const itensComBadge = itensCarrinho.filter(id => carrinho[id].quantidade > 0);
    log(`🎯 Itens que DEVEM ter badge: ${itensComBadge.length}`);
    
    // 3. Badges no DOM
    const badgesDOM = document.querySelectorAll('.badge-quantidade');
    log(`🏷️ Badges visíveis no DOM: ${badgesDOM.length}`);
    
    if (badgesDOM.length === 0) {
        log("   (Nenhum badge visível)");
    } else {
        badgesDOM.forEach((badge, i) => {
            const card = badge.closest('.card');
            const nomeProduto = card?.querySelector('.card-nome')?.textContent || 'Desconhecido';
            const identificador = card?.dataset?.identificador || 'Sem ID';
            log(`   Badge ${i+1}: "${badge.textContent}" em "${nomeProduto}" (${identificador})`);
        });
    }
    
    // 4. Comparação
    log(`📊 COMPARAÇÃO: ${itensComBadge.length} itens no carrinho vs ${badgesDOM.length} badges visíveis`);
    
    if (itensComBadge.length === badgesDOM.length) {
        log("✅ CORRESPONDÊNCIA PERFEITA!");
    } else {
        log(`⚠️ DESCASAMENTO: Esperados ${itensComBadge.length}, encontrados ${badgesDOM.length}`);
    }
    
    log("=== FIM DIAGNÓSTICO ===");
    return { itensComBadge, badgesDOM };
}

// EXPORTAR FUNÇÕES
// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.renderizarCardapio       = renderizarCardapio;
window.PaoDoCiso.atualizarDatasFornada    = atualizarDatasFornada;
window.PaoDoCiso.adicionarRapido          = adicionarRapido;
window.PaoDoCiso.atualizarBadgeNoCard     = atualizarBadgeNoCard;
window.PaoDoCiso.validarProduto           = validarProduto;
window.PaoDoCiso.verificarDisponibilidade = verificarDisponibilidade;
window.PaoDoCiso.atualizarCardUnico       = atualizarCardUnico;
window.PaoDoCiso.atualizarBadgesAposRemocao = atualizarBadgesAposRemocao;
window.PaoDoCiso.diagnosticarBadges       = diagnosticarBadges;

// Aliases de compatibilidade
window.renderizarCardapio = renderizarCardapio;
window.atualizarDatasFornada = atualizarDatasFornada;
window.adicionarRapido = adicionarRapido;
window.atualizarBadgeNoCard = atualizarBadgeNoCard;
window.validarProduto = validarProduto;
window.verificarDisponibilidade = verificarDisponibilidade;
// window.mostrarNotificacao — exportada por notificacoes.js (fonte única)
window.atualizarCardUnico = atualizarCardUnico;
window.atualizarBadgesAposRemocao = atualizarBadgesAposRemocao;
window.diagnosticarBadges = diagnosticarBadges;

log("✅ cardapio.js carregado e funções exportadas");