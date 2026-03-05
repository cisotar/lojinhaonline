// ============================================
// SISTEMA DE NOTIFICAÇÕES - PÃO DO CISO
// ============================================
// FONTE ÚNICA — esta é a implementação canônica de mostrarNotificacao().
// A versão local que existia em cardapio.js foi removida; todos os arquivos
// devem chamar window.mostrarNotificacao() que aponta para esta função.
// ============================================

/**
 * Exibe uma notificação flutuante na tela.
 *
 * @param {string} mensagem - Texto a exibir.
 * @param {'success'|'error'|'aviso'|'info'} tipo - Estilo visual da notificação.
 */
function mostrarNotificacao(mensagem, tipo = 'info') {
    log(`💬 Exibindo notificação [${tipo}]: ${mensagem}`);

    // Remove notificação anterior para não empilhar
    const antiga = document.querySelector('.notificacao-flutuante');
    if (antiga) {
        log('🗑️ Removendo notificação anterior');
        antiga.remove();
    }

    const notificacao = document.createElement('div');
    notificacao.className = `notificacao-flutuante notificacao-${tipo}`;
    notificacao.innerHTML = `<span>${mensagem}</span>`;

    document.body.appendChild(notificacao);
    log(`✅ Notificação criada: "${mensagem}"`);

    // Animação de entrada
    setTimeout(() => {
        notificacao.classList.add('ativo');
        log('🎬 Animação de entrada ativada');
    }, 10);

    // Remove após 3 segundos
    setTimeout(() => {
        log(`⏰ Removendo notificação: "${mensagem}"`);
        notificacao.classList.remove('ativo');
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.remove();
                log('🗑️ Notificação removida do DOM');
            }
        }, 300);
    }, 3000);
}


// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.mostrarNotificacao = mostrarNotificacao;

// Alias de compatibilidade — mantém chamadas diretas funcionando
window.mostrarNotificacao = mostrarNotificacao;
