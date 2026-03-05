// ============================================
// CONFIGURAÇÕES GLOBAIS - PÃO DO CISO
// ============================================
// ⚠️ Este arquivo vai para o repositório público.
// Dados sensíveis ficam em config.local.js (não commitado).
// Copie config.local.exemplo.js → config.local.js e preencha.
// ============================================

window.config = {
    nomeLoja:          'PÃO DO CISO',
    taxaEntregaPadrao: 8.00,
    tempoNotificacao:  3000,
    versao:            '2.0.0',

    // Preenchidos por config.local.js — não edite aqui
    whatsappVendedor:  '',
    chavePix:          '',
    urlPlanilha:       '',

    // ✅ Flag de debug — mude para true localmente para ver console.logs
    DEBUG: false
};

// Wrapper global de log — use log() no lugar de console.log()
window.log = function(...args) {
    if (window.config?.DEBUG) {
        console.log(...args);
    }
};
