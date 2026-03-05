// ============================================
// GERENCIAMENTO DE OPCIONAIS - PÃO DO CISO
// ============================================

// opcionais.js

function alterarQuantidadeOpcional(nomeOpcional, precoOpcional, valor) {
    log(`--- ALTERANDO OPCIONAL: ${nomeOpcional} ---`);

    // 1. Se o produto principal for 0, não permite adicionar opcionais
    if (produtoAtual.quantidade === 0 && valor > 0) {
        mostrarNotificacao('Aumente a quantidade do produto antes de adicionar opcionais.', 'aviso');
        return;
    }
    
    // Inicializar opcional se não existir no objeto
    if (!produtoAtual.opcionais[nomeOpcional]) {
        produtoAtual.opcionais[nomeOpcional] = {
            quantidade: 0,
            preco: precoOpcional
        };
    }
    
    const novaQuantidade = produtoAtual.opcionais[nomeOpcional].quantidade + valor;
    
    // Impede quantidade negativa
    if (novaQuantidade < 0) return;
    
    produtoAtual.opcionais[nomeOpcional].quantidade = novaQuantidade;
    log(`✅ Opcional ${nomeOpcional}: ${novaQuantidade}`);
    
    // 2. Se a quantidade do opcional zerar, removemos a chave para limpar o objeto
    if (novaQuantidade === 0) {
        delete produtoAtual.opcionais[nomeOpcional];
        log(`🗑️ Opcional ${nomeOpcional} removido por quantidade zero.`);
    }
    
    // 3. Atualizar o número na tela (ID gerado na nossa nova função modularizada)
    const idDisplay = `quantidade-opcional-${nomeOpcional.replace(/\s+/g, '-')}`;
    const elementoQuantidade = elemento(idDisplay);
    if (elementoQuantidade) {
        elementoQuantidade.textContent = novaQuantidade;
    }
    
    // 4. Recalcular subtotal e sincronizar com o carrinho em tempo real
    const novoSubtotal = calcularSubtotalProduto();
    const elementoSubtotal = elemento('valor-subtotal-produto');
    if (elementoSubtotal) {
        elementoSubtotal.textContent = formatarMoeda(novoSubtotal);
    }

    // Chama a função que já criamos no produto-modal.js
    if (typeof sincronizarProdutoNoCarrinho === 'function') {
        sincronizarProdutoNoCarrinho();
    }
}

// EXPORTAR FUNÇÕES
// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.alterarQuantidadeOpcional = alterarQuantidadeOpcional;

// Alias de compatibilidade
window.alterarQuantidadeOpcional = alterarQuantidadeOpcional;
//window.obterOpcionaisAtivos = obterOpcionaisAtivos;