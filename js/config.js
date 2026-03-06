// ============================================
// CONFIGURAÇÕES GLOBAIS - PÃO DO CISO
// ============================================
// ⚠️  Este arquivo vai para o repositório público.
// Dados sensíveis ficam em config.local.js (não commitado).
// Copie config.local.exemplo.js → config.local.js e preencha.
// ============================================

window.config = {
    nomeLoja:          'PÃO DO CISO',
    taxaEntregaPadrao: 8.00,
    tempoNotificacao:  3000,
    versao:            '2.1.0',

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

// ===================== VALIDAÇÃO DE AMBIENTE =====================
// Executa após DOMContentLoaded para garantir que config.local.js foi carregado
window.addEventListener('DOMContentLoaded', function validarConfiguracao() {
    const problemas = [];

    if (!window.config.whatsappVendedor) {
        problemas.push('whatsappVendedor — pedidos não chegarão por WhatsApp');
    }
    if (!window.config.chavePix) {
        problemas.push('chavePix — QR Code do PIX não será exibido');
    }

    if (problemas.length > 0) {
        console.warn(
            '⚠️ [Pão do Ciso] config.local.js incompleto ou ausente.\n' +
            'Crie o arquivo a partir de config.local.exemplo.js e preencha:\n' +
            problemas.map(p => '  • ' + p).join('\n')
        );

        // Banner visual em desenvolvimento (localhost ou 127.0.0.1)
        const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
        if (isLocal && problemas.length > 0) {
            const banner = document.createElement('div');
            banner.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
                background: #b22222; color: #fff; padding: 10px 16px;
                font: 600 13px/1.4 monospace; text-align: center;
            `;
            banner.innerHTML =
                '⚠️ <strong>config.local.js incompleto:</strong> ' +
                problemas.join(' · ') +
                ' &nbsp;<button onclick="this.parentNode.remove()" ' +
                'style="background:none;border:1px solid rgba(255,255,255,.5);' +
                'color:#fff;padding:2px 8px;cursor:pointer;border-radius:4px;' +
                'margin-left:8px;">OK</button>';
            document.body.prepend(banner);
        }
    }
}, { once: true });
