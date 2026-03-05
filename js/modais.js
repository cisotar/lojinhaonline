// ============================================
// GERENCIAMENTO DE MODAIS
// ============================================

// ✅ abrirModal agora aceita um callback opcional executado após abrir
// Usado por: address-manager.js (elimina o setInterval de sincronizarCEPComModalDados)
// Exemplo: abrirModal('modal-dados-cliente', () => AddressManager.init())
function abrirModal(id, callback) {
    const modal   = elemento(id);
    const overlay = elemento('overlay-modal');

    if (modal) {
        modal.style.display = 'block';
    }

    if (overlay) {
        overlay.style.display = 'block';
    }

    document.body.style.overflow = 'hidden';

    // Atualiza datas ao abrir o modal de informações da fornada
    if (id === 'modal-informacoes-fornada' && typeof atualizarDadosModalFornada === 'function') {
        atualizarDadosModalFornada();
    }

    // Inicializa o AddressManager ao abrir o modal de dados do cliente
    if (id === 'modal-dados-cliente' && window.AddressManager) {
        window.AddressManager.init();
    }

    // Executa callback personalizado se fornecido
    if (typeof callback === 'function') {
        callback();
    }
}

function fecharModal(id) {
    const modal = elemento(id);

    if (modal) {
        modal.style.display = 'none';
    }

    const modaisAbertos = document.querySelectorAll('.modal[style*="display: block"]');
    const overlay = elemento('overlay-modal');

    if (modaisAbertos.length === 0 && overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function fecharTodosModais() {
    const overlay     = elemento('overlay-modal');
    const todosModais = document.querySelectorAll('.modal');

    todosModais.forEach(modal => {
        modal.style.display = 'none';
    });

    if (overlay) {
        overlay.style.display = 'none';
    }

    document.body.style.overflow = 'auto';
}

function configurarEventosGerais() {
    // Prevenir que cliques dentro do modal fechem ele
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => e.stopPropagation());
    });

    // Configurar máscara do WhatsApp
    const inputWhatsApp = elemento('whatsapp-cliente');
    if (inputWhatsApp) {
        inputWhatsApp.addEventListener('input', e => {
            e.target.value = formatarWhatsApp(e.target.value);
        });
    }

    // Overlay fecha todos os modais
    const overlay = elemento('overlay-modal');
    if (overlay) {
        overlay.addEventListener('click', fecharTodosModais);
    }
}

// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.abrirModal              = abrirModal;
window.PaoDoCiso.fecharModal             = fecharModal;
window.PaoDoCiso.fecharTodosModais       = fecharTodosModais;
window.PaoDoCiso.configurarEventosGerais = configurarEventosGerais;

// Aliases de compatibilidade
window.abrirModal             = abrirModal;
window.fecharModal            = fecharModal;
window.fecharTodosModais      = fecharTodosModais;
window.configurarEventosGerais = configurarEventosGerais;
