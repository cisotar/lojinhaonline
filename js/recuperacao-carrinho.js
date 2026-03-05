// ============================================
// RECUPERAÇÃO DE CARRINHO - PÃO DO CISO
// ============================================

log('✅ recuperacao-carrinho.js carregado');

// ===================== VERIFICAR CARRINHO RECUPERADO =====================
// ===================== VERIFICAR CARRINHO RECUPERADO =====================
function verificarCarrinhoRecuperado() {
    log('🔍 VERIFICAR CARRINHO: Iniciando...');
    
    if (!window.carrinho) return;

    const itensCarrinho = Object.keys(window.carrinho).length;
    log(`   📊 Itens encontrados no carrinho: ${itensCarrinho}`);
    
    // CASO TENHA ITENS (ABRIR)
    if (itensCarrinho > 0) {
        log(`🛒 ${itensCarrinho} itens. Mostrando modal...`);
        
        const elementoQuantidade = document.getElementById('quantidade-itens-recuperados');
        if (elementoQuantidade) elementoQuantidade.textContent = itensCarrinho;
        
        // 1. Chama a função padrão (que cria o fundo borrado)
        abrirModal('modal-recuperar-carrinho');
        
        // 2. Atribuição direta (CSS já sem !important)
        const modal = document.getElementById('modal-recuperar-carrinho');
        if (modal) {
            modal.style.display = 'flex';
        }
        
    } else {
        // CASO VAZIO (GARANTIR FECHAMENTO)
        log('✅ Carrinho vazio. Mantendo fechado.');
        
        const modal = document.getElementById('modal-recuperar-carrinho');
        if (modal) {
            modal.style.display = 'none';
        }
        
        if (typeof fecharModal === 'function') {
            fecharModal('modal-recuperar-carrinho');
        }
    }
}

// ===================== LIMPAR CARRINHO RECUPERADO =====================
function limparCarrinhoRecuperado() {
    log('🗑️ LIMPAR CARRINHO: Iniciando limpeza completa...');
    
    // 1. Limpar dados do objeto global
    window.carrinho = {};
    
    // 2. Sincronizar com o localStorage (Garante que não volte ao atualizar a página)
    if (typeof salvarCarrinho === 'function') {
        salvarCarrinho();
        log('   ✅ LocalStorage atualizado (vazio)');
    }
    
    // 3. Limpar elementos visuais (Badges de quantidade no cardápio)
    const todosBadges = document.querySelectorAll('.badge-quantidade');
    todosBadges.forEach(badge => badge.remove());
    log(`   🏷️ ${todosBadges.length} badges removidos.`);
    
    // 4. Atualizar a barra inferior do carrinho
    if (typeof atualizarBarraCarrinho === 'function') {
        atualizarBarraCarrinho();
    }
    
    // 5. FECHAR O MODAL E ESPECIALMENTE O OVERLAY
    // Usamos fecharModal que já gerencia o estado do body e do overlay
    fecharModal('modal-recuperar-carrinho');
    log('   ❌ Modal de recuperação encerrado.');
    
    // 6. Feedback visual para o usuário
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('🛒 Carrinho limpo! Comece uma nova compra.');
    }
}

// ===================== INICIAR VERIFICAÇÃO =====================
// Esta função será chamada do main.js
function iniciarRecuperacaoCarrinho() {
    log('🚀 INICIAR RECUPERAÇÃO: Verificando imediatamente...');
    verificarCarrinhoRecuperado();
}

// ===================== EXPORTAR FUNÇÕES =====================
// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.verificarCarrinhoRecuperado = verificarCarrinhoRecuperado;
window.PaoDoCiso.limparCarrinhoRecuperado = limparCarrinhoRecuperado;
window.PaoDoCiso.iniciarRecuperacaoCarrinho = iniciarRecuperacaoCarrinho;

// Aliases de compatibilidade
window.verificarCarrinhoRecuperado = verificarCarrinhoRecuperado;
window.limparCarrinhoRecuperado = limparCarrinhoRecuperado;
window.iniciarRecuperacaoCarrinho = iniciarRecuperacaoCarrinho;

log('🎯 Funções de recuperação exportadas');