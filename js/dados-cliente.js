// ============================================
// VALIDAÇÃO DE DADOS DO CLIENTE - PÃO DO CISO
// ============================================
function validarDadosCliente() {
    const nome = elemento('nome-cliente').value.trim();
    const whatsapp = elemento('whatsapp-cliente').value.trim();
    
    // Validações básicas
    if (!nome || nome.length < 3) {
        mostrarNotificacao('Por favor, digite seu nome completo.', 'erro');
        elemento('nome-cliente').focus();
        return;
    }

    // Validação de WhatsApp
    if (typeof validarTelefone === 'function' && !validarTelefone(whatsapp)) {
        mostrarNotificacao('Por favor, digite um WhatsApp válido com DDD (ex: 11 98765-4321).', 'erro');
        elemento('whatsapp-cliente').focus();
        return;
    }
    
    // SALVAMENTO OBRIGATÓRIO (Chama a função que salva no localStorage)
    if (typeof salvarDadosCliente === 'function') {
        salvarDadosCliente();
    }

    if (estadoAplicativo.modoEntrega === 'entrega') {
        if (!window.AddressManager || !window.AddressManager.validar().valido) {
            mostrarNotificacao('Por favor, preencha todos os campos de endereço obrigatórios.', 'erro');
            return;
        }
        enderecoCliente = window.AddressManager.getEndereco();

        // ── Sincroniza o frete a partir do CEP informado neste modal ──────────
        // O usuário pode ter alterado o CEP em dados-cliente; garante que o
        // estadoAplicativo.taxaEntrega reflita o bairro/CEP atual antes de
        // abrir o pagamento.
        const cepAtual = estadoAplicativo.cepCalculado
            ? String(estadoAplicativo.cepCalculado).replace(/\D/g, '')
            : '';

        const bairroAtual = estadoAplicativo.dadosCliente?.bairro
            || (window.AddressManager.getEndereco()?.bairro)
            || '';

        if (bairroAtual && typeof calcularFretePorBairro === 'function') {
            // Recalcula silenciosamente — atualiza estadoAplicativo.taxaEntrega
            calcularFretePorBairro(bairroAtual, cepAtual);
        }
    }
    
    fecharModal('modal-dados-cliente');
    abrirModalPagamento();
} 

// ===================== SALVAR E CARREGAR DADOS DO CLIENTE =====================
function salvarDadosCliente() {
    const nomeCampo = elemento('nome-cliente');
    const telefoneCampo = elemento('whatsapp-cliente');
    const cepCampo = elemento('codigo-postal-cliente');
    const ruaCampo = elemento('logradouro-cliente');
    const bairroCampo = elemento('bairro-cliente');
    const numeroCampo = elemento('numero-residencia-cliente');

    if (!nomeCampo || !telefoneCampo) return;
    
    const dados = {
        nome: nomeCampo.value.trim(),
        telefone: telefoneCampo.value.trim(),
        endereco: {
            cep: cepCampo ? cepCampo.value.trim() : '',
            rua: ruaCampo ? ruaCampo.value.trim() : '',
            bairro: bairroCampo ? bairroCampo.value.trim() : '',
            numero: numeroCampo ? numeroCampo.value.trim() : ''
        },
        // Persiste também a taxa de entrega para restaurar corretamente
        taxaEntrega: estadoAplicativo.taxaEntrega || 0,
        timestamp: new Date().getTime()
    };
    
    localStorage.setItem('dados_cliente_pao_do_ciso', JSON.stringify(dados));
    log('💾 Dados do cliente e endereço salvos no LocalStorage');
}

function carregarDadosCliente() {
    log('📂 Tentando recuperar dados do LocalStorage...');
    try {
        const dadosSalvos = localStorage.getItem('dados_cliente_pao_do_ciso');
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            log('✅ Dados encontrados:', dados);

            if (dados.nome) document.getElementById('nome-cliente').value = dados.nome;
            if (dados.telefone) document.getElementById('whatsapp-cliente').value = dados.telefone;
            
            // Se houver endereço salvo e estivermos em modo entrega
            if (dados.endereco) {
                if (dados.endereco.cep) document.getElementById('codigo-postal-cliente').value = dados.endereco.cep;
                if (dados.endereco.rua) document.getElementById('logradouro-cliente').value = dados.endereco.rua;
                if (dados.endereco.bairro) document.getElementById('bairro-cliente').value = dados.endereco.bairro;
                if (dados.endereco.numero) document.getElementById('numero-residencia-cliente').value = dados.endereco.numero;

                // Restaura o bairro/frete no estadoAplicativo a partir dos dados salvos
                if (dados.endereco.bairro && estadoAplicativo.modoEntrega === 'entrega') {
                    if (typeof calcularFretePorBairro === 'function') {
                        calcularFretePorBairro(
                            dados.endereco.bairro,
                            dados.endereco.cep ? dados.endereco.cep.replace(/\D/g, '') : ''
                        );
                    } else if (dados.taxaEntrega) {
                        // Fallback: restaura taxa salva se a função ainda não estiver disponível
                        estadoAplicativo.taxaEntrega = dados.taxaEntrega;
                    }
                }
            }
            return true;
        }
        log('ℹ️ Nenhum dado salvo anteriormente.');
    } catch (error) {
        console.error('❌ Erro no carregamento de dados:', error);
    }
    return false;
}   


// ===================== DIAGNOSTICAR PROBLEMA DE CEP =====================
function diagnosticarCep() {
    log("=== 🩺 DIAGNÓSTICO CEP ===");
    log("1. CEP no estado:", estadoAplicativo.cepCalculado);
    log("2. Modo entrega:", estadoAplicativo.modoEntrega);
    log("3. Endereço salvo:", enderecoCliente);
    log("4. Taxa de entrega atual:", estadoAplicativo.taxaEntrega);
    log("5. Campos visíveis no modal:");
    
    const campos = ['codigo-postal-cliente', 'logradouro-cliente', 'bairro-cliente', 'cidade-cliente'];
    campos.forEach(id => {
        const campo = elemento(id);
        if (campo) {
            log(`   ${id}: "${campo.value}"`);
        }
    });
    log("=== FIM DIAGNÓSTICO ===");
}

// ===================== EXPORTAR FUNÇÕES GLOBAIS =====================
// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.diagnosticarCep = diagnosticarCep;
window.PaoDoCiso.validarDadosCliente = validarDadosCliente;
window.PaoDoCiso.salvarDadosCliente = salvarDadosCliente;
window.PaoDoCiso.carregarDadosCliente = carregarDadosCliente;

// Aliases de compatibilidade
window.diagnosticarCep = diagnosticarCep;
window.validarDadosCliente = validarDadosCliente;
window.salvarDadosCliente = salvarDadosCliente;
window.carregarDadosCliente = carregarDadosCliente;