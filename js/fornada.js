// ============================================
// CONFIGURAÇÃO DE FORNADA - PÃO DO CISO
// ============================================

function configurarDatasFornada() {
    log('⚙️ Configurando datas da fornada...');
    
    // Verifica se temos dados de fornada
    if (!window.dadosIniciais || !window.dadosIniciais.fornada) {
        console.error('❌ Dados da fornada não encontrados!');
        return;
    }
    
    const { dataISO, diasAntecedencia, horaLimite } = window.dadosIniciais.fornada;
    
    try {
        // Parse da data da fornada
        // ⚠️ T12:00:00 é intencional: sem hora explícita, JS interpreta dataISO como
        // UTC meia-noite, que no fuso de Brasília (UTC-3) recua para o dia anterior.
        const dataFornada = new Date(dataISO + 'T12:00:00');
        
        // Data limite para pedidos (data da fornada menos dias de antecedência)
        const dataLimite = new Date(dataFornada);
        dataLimite.setDate(dataFornada.getDate() - diasAntecedencia);
        
        // Formatar datas para exibição SEM ANO
        const formatarDataSemAno = (data) => {
            return data.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long'
                // Removemos o 'year: 'numeric' para não mostrar o ano
            });
        };
        
        const dataFornadaFormatada = formatarDataSemAno(dataFornada);
        const dataLimiteFormatada = formatarDataSemAno(dataLimite);
        
        log('📅 Datas formatadas (sem ano):', {
            fornada: dataFornadaFormatada,
            limite: dataLimiteFormatada + ' às ' + horaLimite
        });
        
        // Atualizar elementos no banner
        const elementoDataFornada = document.getElementById('texto-data-fornada');
        const elementoLimitePedido = document.getElementById('texto-limite-pedido');
        
        if (elementoDataFornada) {
            elementoDataFornada.innerHTML = `<i class="fas fa-calendar-alt"></i> PRÓXIMA FORNADA: ${dataFornadaFormatada.toUpperCase()}`;
        }
        
        if (elementoLimitePedido) {
            elementoLimitePedido.textContent = `Pedidos até: ${dataLimiteFormatada} às ${horaLimite}`;
        }
        
        // Atualizar elementos no modal
        const elementoDataFornadaModal = document.getElementById('data-fornada-modal');
        const elementoLimiteFornadaModal = document.getElementById('limite-fornada-modal');
        
        if (elementoDataFornadaModal) {
            elementoDataFornadaModal.textContent = dataFornadaFormatada;
        }
        
        if (elementoLimiteFornadaModal) {
            elementoLimiteFornadaModal.textContent = dataLimiteFormatada + ' às ' + horaLimite;
        }
        
        log('✅ Datas da fornada configuradas com sucesso!');
        
        // VERIFICAR SE JÁ PASSOU DO PRAZO
        const agora = new Date();
        const dataLimiteComHora = new Date(dataLimite);
        
        // Extrair hora e minutos da string horaLimite (suporta "12h", "12:30", etc)
        let horas = 12, minutos = 0;
        if (horaLimite.includes(':')) {
            [horas, minutos] = horaLimite.split(':').map(Number);
        } else {
            horas = parseInt(horaLimite.replace('h', ''), 10) || 12;
        }
        dataLimiteComHora.setHours(horas, minutos, 0, 0);
        
        if (agora > dataLimiteComHora) {
            console.warn('⚠️ Prazo da fornada já expirou!');
            desabilitarFornada();
        } else {
            log('✅ Fornada ainda disponível para pedidos!');
            habilitarFornada();
        }
        
    } catch (error) {
        console.error('❌ Erro ao configurar datas da fornada:', error);
    }
}

function desabilitarFornada() {
    const bannerFornada = document.querySelector('.banner-fornada');
    if (bannerFornada) {
        bannerFornada.style.opacity = '0.6';
        bannerFornada.style.cursor = 'not-allowed';
        bannerFornada.onclick = null;
        
        // Atualizar texto do banner
        const elementoDataFornada = document.getElementById('texto-data-fornada');
        if (elementoDataFornada) {
            elementoDataFornada.innerHTML = `<i class="fas fa-exclamation-triangle"></i> FORNADA ENCERRADA`;
        }
        
        const elementoLimitePedido = document.getElementById('texto-limite-pedido');
        if (elementoLimitePedido) {
            elementoLimitePedido.textContent = 'Próxima data em breve!';
        }
    }
}

function habilitarFornada() {
    const bannerFornada = document.querySelector('.banner-fornada');
    if (bannerFornada) {
        bannerFornada.style.opacity = '1';
        bannerFornada.style.cursor = 'pointer';
        bannerFornada.onclick = function() {
            if (typeof abrirModal === 'function') {
                abrirModal('modal-informacoes-fornada');
            }
        };
    }
}


// ✅ Migrado de: cardapio.js
// Calcula e formata as datas de fornada e limite de pedido
function calcularDatasFornada(infoFornada) {
    log('📅 Calculando datas da fornada:', infoFornada);

    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Data da Fornada
    const dataFornada       = new Date(infoFornada.dataISO + 'T12:00:00');
    const diaFornada        = diasSemana[dataFornada.getDay()];
    const dataFornadaFormatada = `${dataFornada.getDate().toString().padStart(2, '0')}/${(dataFornada.getMonth() + 1).toString().padStart(2, '0')}`;

    // Data Limite
    const dataLimite       = new Date(dataFornada);
    dataLimite.setDate(dataFornada.getDate() - infoFornada.diasAntecedencia);
    const diaLimite        = diasSemana[dataLimite.getDay()];
    const dataLimiteFormatada = `${dataLimite.getDate().toString().padStart(2, '0')}/${(dataLimite.getMonth() + 1).toString().padStart(2, '0')}`;

    const resultado = {
        fornada: `${diaFornada}, ${dataFornadaFormatada}`,
        limite:  `${diaLimite}, ${dataLimiteFormatada} às ${infoFornada.horaLimite}`
    };

    log('📅 Resultado do cálculo:', resultado);
    return resultado;
}

// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.configurarDatasFornada = configurarDatasFornada;
window.PaoDoCiso.calcularDatasFornada   = calcularDatasFornada;
window.PaoDoCiso.desabilitarFornada     = desabilitarFornada;
window.PaoDoCiso.habilitarFornada       = habilitarFornada;

// Aliases de compatibilidade
window.configurarDatasFornada = configurarDatasFornada;
window.calcularDatasFornada    = calcularDatasFornada;
window.desabilitarFornada = desabilitarFornada;
window.habilitarFornada = habilitarFornada;