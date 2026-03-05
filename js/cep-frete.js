// ============================================
// SISTEMA DE CEP E CÁLCULO DE FRETE
// ============================================

// --- 1. UTILITÁRIOS E FORMATAÇÃO ---

// ✅ Substitui formatarCodigoPostal() — usa window.formatarCEP de utils.js
function formatarCodigoPostal(input) {
    const valorFormatado = window.formatarCEP(input.value);
    input.value = valorFormatado;

    const cepLimpo = valorFormatado.replace(/\D/g, '');
    estadoAplicativo.dadosCliente.cep = cepLimpo;

    if (cepLimpo.length === 8) {
        buscarEnderecoPorCodigoPostal(cepLimpo);
        input.classList.add('campo-valido');
        input.classList.remove('campo-invalido');
    } else if (cepLimpo.length === 0) {
        input.classList.remove('campo-valido', 'campo-invalido');
    } else {
        input.classList.add('campo-invalido');
        input.classList.remove('campo-valido');
    }
}

// --- 2. BUSCA DE ENDEREÇO (API) ---
async function buscarEnderecoPorCodigoPostal(cepCru) {
    const cep = String(cepCru).replace(/\D/g, '');
    log('🚀 [Debug] Iniciando busca para o CEP:', cep);

    if (!cep || cep.length !== 8) {
        console.warn('⚠️ [Debug] CEP inválido ou incompleto detectado:', cep);
        return;
    }

    if (typeof mostrarCarregamentoCEP === 'function') {
        log('⏳ [Debug] Ativando loading...');
        mostrarCarregamentoCEP(true);
    }

    try {
        log('🌐 [Debug] Chamando API ViaCEP...');

        // Timeout de 5s via AbortController — evita spinner preso indefinidamente
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 5000);

        let resposta;
        try {
            resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal });
        } catch (erroFetch) {
            clearTimeout(timeoutId);
            const mensagem = erroFetch.name === 'AbortError'
                ? 'Tempo esgotado. Verifique sua conexão e tente novamente.'
                : 'Sem conexão. Preencha o endereço manualmente.';
            mostrarErroCEP(mensagem);
            return;
        }
        clearTimeout(timeoutId);

        const dados = await resposta.json();

        if (dados.erro) {
            console.warn('❌ [Debug] CEP não encontrado. Aplicando taxa padrão.');

            const taxaPadrao = window.dadosIniciais.entrega.taxaGeral;

            if (window.estadoAplicativo) {
                window.estadoAplicativo.taxaEntrega      = taxaPadrao;
                window.estadoAplicativo.bairroIdentificado = null;
                window.estadoAplicativo.cepCalculado     = cep;
            }

            const divNotificacao = document.getElementById('notificacao-bairro-carrinho');
            const spanNomeBairro = document.getElementById('nome-bairro-info');
            const divResultado   = document.getElementById('resultado-frete-carrinho');

            if (divNotificacao && spanNomeBairro) {
                spanNomeBairro.innerHTML = `
                    <span style="color: #d32f2f; font-weight: bold;">CEP não encontrado.</span><br>
                    <i class="fas fa-truck"></i> Taxa padrão aplicada: <strong>${formatarMoeda(taxaPadrao)}</strong>
                `;
                divNotificacao.style.display = 'block';
            }
            if (divResultado) divResultado.style.display = 'none';

            if (typeof atualizarResumoFinanceiroCarrinho === 'function') {
                atualizarResumoFinanceiroCarrinho();
            }
            return;
        }

        log('✅ [Debug] Dados recebidos da API:', dados);

        if (typeof renderizarCarrinho === 'function') {
            log('🔄 [Debug] Chamando renderizarCarrinho()...');
            renderizarCarrinho();
        }

        if (typeof preencherCamposEndereco === 'function') {
            log('📝 [Debug] Preenchendo campos de endereço...');
            preencherCamposEndereco(dados);
        }

        if (dados.bairro && typeof calcularFretePorBairro === 'function') {
            log(`🚚 [Debug] Calculando frete para: ${dados.bairro}`);
            calcularFretePorBairro(dados.bairro);
        }

        setTimeout(() => {
            const campoNome = document.getElementById('nome-cliente');
            if (campoNome) campoNome.focus();
        }, 1500);

    } catch (erro) {
        console.error('❌ [Debug] Erro na busca:', erro);
        mostrarErroCEP('Erro inesperado ao buscar o CEP. Preencha o endereço manualmente.');
    } finally {
        if (typeof mostrarCarregamentoCEP === 'function') {
            mostrarCarregamentoCEP(false);
            log('🏁 [Debug] Processo finalizado.');
        }
    }
}

function preencherCamposEndereco(dados) {
    estadoAplicativo.dadosCliente = {
        ...estadoAplicativo.dadosCliente,
        logradouro: dados.logradouro || '',
        bairro:     dados.bairro     || '',
        cidade:     dados.localidade || '',
        estado:     dados.uf         || ''
    };

    const campoLogradouro = elemento('logradouro-cliente');
    const campoBairro     = elemento('bairro-cliente');
    const campoCidade     = elemento('cidade-cliente');
    const campoEstado     = elemento('estado-cliente');

    if (campoLogradouro) {
        campoLogradouro.value = dados.logradouro || '';
        campoLogradouro.classList.add('campo-valido');
    }
    if (campoBairro) {
        campoBairro.value = dados.bairro || '';
        campoBairro.classList.add('campo-valido');
    }
    if (campoCidade) {
        campoCidade.value = dados.localidade || '';
        campoCidade.classList.add('campo-valido');
    }
    if (campoEstado) {
        campoEstado.value = dados.uf || '';
        campoEstado.classList.add('campo-valido');
    }

    const campoNumero = elemento('numero-residencia-cliente');
    if (campoNumero) {
        campoNumero.disabled    = false;
        campoNumero.placeholder = 'Digite o número';
    }
}

// --- 3. LÓGICA DE CÁLCULO DE FRETE ---
function calcularFretePorBairro(nomeBairro) {
    if (!nomeBairro) return;

    const bairros         = window.dadosIniciais.entrega.bairros;
    const bairroEncontrado = bairros.find(b =>
        b.nome.toLowerCase().trim() === nomeBairro.toLowerCase().trim()
    );

    const taxaCalculada = bairroEncontrado
        ? bairroEncontrado.taxa
        : window.dadosIniciais.entrega.taxaGeral;

    if (window.estadoAplicativo) {
        window.estadoAplicativo.taxaEntrega       = taxaCalculada;
        window.estadoAplicativo.bairroIdentificado = nomeBairro;
    }

    const divNotificacao = document.getElementById('notificacao-bairro-carrinho');
    const spanNomeBairro = document.getElementById('nome-bairro-info');
    const divResultado   = document.getElementById('resultado-frete-carrinho');

    if (divNotificacao && spanNomeBairro) {
        spanNomeBairro.innerHTML = `
            Bairro encontrado: <strong>${nomeBairro}</strong>.<br>
            <i class="fas fa-truck"></i> Taxa de entrega: <strong>${formatarMoeda(taxaCalculada)}</strong>
        `;
        divNotificacao.style.display = 'block';
    }
    if (divResultado) divResultado.style.display = 'none';

    const divInfoFreteModal   = document.getElementById('informacao-frete');
    const spanValorFreteModal = document.getElementById('valor-frete');
    if (divInfoFreteModal && spanValorFreteModal) {
        spanValorFreteModal.textContent  = formatarMoeda(taxaCalculada);
        divInfoFreteModal.style.display  = 'flex';
    }

    if (typeof atualizarResumoFinanceiroCarrinho === 'function') {
        atualizarResumoFinanceiroCarrinho();
    }
}

function obterTaxaEntregaAtual() {
    return (window.estadoAplicativo && window.estadoAplicativo.taxaEntrega)
        ? window.estadoAplicativo.taxaEntrega
        : window.dadosIniciais.entrega.taxaGeral;
}

// --- 4. VALIDAÇÃO ---
// ✅ Delegada integralmente para window.validarEnderecoCompleto em utils.js.
// Não reexportamos aqui para evitar loop de recursão.

function obterEnderecoFormatado() {
    const validacao = validarEnderecoCompleto();
    if (!validacao.valido) return null;

    const dados = validacao.dados;
    let enderecoFormatado = '';

    if (dados.logradouro && dados.numero) {
        enderecoFormatado += `${dados.logradouro}, ${dados.numero}`;
        if (dados.complemento) enderecoFormatado += ` - ${dados.complemento}`;
        if (dados.bairro)      enderecoFormatado += ` - ${dados.bairro}`;
        if (dados.cidade)      enderecoFormatado += ` - ${dados.cidade}`;
        if (dados.cep)         enderecoFormatado += ` (CEP: ${dados.cep})`;
        if (dados.referencia)  enderecoFormatado += ` [Ref: ${dados.referencia}]`;
    }

    return enderecoFormatado;
}

// --- 5. INTERFACE E FEEDBACK (DOM) ---

function mostrarCarregamentoCEP(mostrar) {
    const campoCEP    = elemento('codigo-postal-cliente');
    const containerCEP = campoCEP?.parentElement;
    if (!containerCEP) return;

    ['.loading-cep', '.sucesso-cep', '.erro-cep'].forEach(classe => {
        const el = containerCEP.querySelector(classe);
        if (el) el.remove();
    });

    if (mostrar) {
        const loading = document.createElement('div');
        loading.className = 'loading-cep';
        loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando endereço...';
        loading.style.cssText = `font-size: 0.75rem; color: var(--marrom-cafe); margin-top: 5px; display: flex; align-items: center; gap: 8px;`;
        containerCEP.appendChild(loading);
    }
}

function mostrarSucessoCEP(mensagem) {
    const campoCEP     = elemento('codigo-postal-cliente');
    const containerCEP = campoCEP?.parentElement;
    if (!containerCEP) return;
    mostrarCarregamentoCEP(false);

    const sucesso = document.createElement('div');
    sucesso.className = 'sucesso-cep';
    sucesso.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    sucesso.style.cssText = `font-size: 0.75rem; color: var(--verde-sucesso); margin-top: 5px; display: flex; align-items: center; gap: 8px;`;
    containerCEP.appendChild(sucesso);
    setTimeout(() => { if (sucesso.parentNode) sucesso.parentNode.removeChild(sucesso); }, 5000);
}

function mostrarErroCEP(mensagem) {
    const campoCEP     = elemento('codigo-postal-cliente');
    const containerCEP = campoCEP?.parentElement;
    if (!containerCEP) return;
    mostrarCarregamentoCEP(false);

    campoCEP.classList.add('campo-invalido');
    campoCEP.classList.remove('campo-valido');

    const erro = document.createElement('div');
    erro.className = 'erro-cep';
    erro.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensagem}`;
    erro.style.cssText = `font-size: 0.75rem; color: var(--vermelho-alerta); margin-top: 5px; display: flex; align-items: center; gap: 8px;`;
    containerCEP.appendChild(erro);
    habilitarCamposManuais();
    setTimeout(() => { if (erro.parentNode) erro.parentNode.removeChild(erro); }, 10000);
}

function habilitarCamposManuais() {
    ['logradouro-cliente', 'bairro-cliente', 'cidade-cliente'].forEach(id => {
        const campo = elemento(id);
        if (campo) {
            campo.readOnly = false;
            campo.classList.remove('campo-leitura');
            campo.placeholder = 'Preencha manualmente';
        }
    });
}

function limparEnderecoCliente() {
    estadoAplicativo.dadosCliente = {
        nome:       estadoAplicativo.dadosCliente.nome,
        telefone:   estadoAplicativo.dadosCliente.telefone,
        cep:        '', logradouro: '', bairro: '',
        cidade:     '', estado: '',    numero: '',
        complemento: '', referencia: ''
    };

    const campos = [
        'codigo-postal-cliente', 'logradouro-cliente', 'bairro-cliente',
        'cidade-cliente', 'numero-residencia-cliente',
        'complemento-residencia-cliente', 'ponto-referencia-entrega'
    ];

    campos.forEach(id => {
        const campo = elemento(id);
        if (campo) {
            campo.value = '';
            campo.classList.remove('campo-valido', 'campo-invalido');

            if (['logradouro-cliente', 'bairro-cliente', 'cidade-cliente'].includes(id)) {
                campo.readOnly    = true;
                campo.classList.add('campo-leitura');
                campo.placeholder = 'Será preenchido automaticamente';
            }

            if (id === 'numero-residencia-cliente') {
                campo.disabled    = true;
                campo.placeholder = 'Digite o CEP primeiro';
            }
        }
    });

    const divNotificacao = document.getElementById('notificacao-bairro-carrinho');
    const divResultado   = document.getElementById('resultado-frete-carrinho');
    if (divNotificacao) divNotificacao.style.display = 'none';
    if (divResultado)   divResultado.style.display   = 'none';
    window.estadoAplicativo.taxaEntrega = 0;
}

// --- 6. CONFIGURAÇÃO DE EVENTOS ---

function configurarRemocaoDestaqueCampos() {
    const campoNumero = elemento('numero-residencia-cliente');
    if (campoNumero) {
        campoNumero.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.classList.remove('campo-invalido');
                this.style.border = '';
                this.style.backgroundColor = '';
            }
        });
    }

    [elemento('nome-cliente'), elemento('whatsapp-cliente')].forEach(campo => {
        if (campo) {
            campo.addEventListener('input', function() {
                this.classList.remove('campo-invalido');
                this.style.border = '';
                this.style.backgroundColor = '';
            });
        }
    });
}

function configurarEventosCEP() {
    const campoCEP = elemento('codigo-postal-cliente');
    if (campoCEP) {
        // ✅ Usa window.formatarCEP de utils.js
        campoCEP.addEventListener('input', function() { formatarCodigoPostal(this); });
        campoCEP.addEventListener('blur', function() {
            const cepNumeros = this.value.replace(/\D/g, '');
            if (cepNumeros.length === 8 && !estadoAplicativo.dadosCliente.logradouro) {
                buscarEnderecoPorCodigoPostal(cepNumeros);
            }
        });
    }

    const campoBairro = elemento('bairro-cliente');
    if (campoBairro) {
        campoBairro.addEventListener('change', function() {
            if (this.value.trim()) {
                estadoAplicativo.dadosCliente.bairro = this.value.trim();
                calcularFretePorBairro(this.value.trim());
            }
        });
    }

    const campoNumero = elemento('numero-residencia-cliente');
    if (campoNumero) {
        campoNumero.addEventListener('change', function() {
            estadoAplicativo.dadosCliente.numero = this.value.trim();
            if (this.value.trim() && estadoAplicativo.dadosCliente.bairro) {
                calcularFretePorBairro(estadoAplicativo.dadosCliente.bairro);
            }
        });
    }
}

// Máscara no campo CEP do carrinho (cep-carrinho)
// ✅ Usa window.formatarCEP de utils.js
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'cep-carrinho') {
        const input = e.target;
        input.value = window.formatarCEP(input.value);

        if (window.estadoAplicativo) {
            estadoAplicativo.cepCalculado = input.value.replace(/\D/g, '');
        }
    }
});

// --- 7. EXPORTAÇÕES ---

// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.obterTaxaEntregaAtual           = obterTaxaEntregaAtual;
window.PaoDoCiso.configurarRemocaoDestaqueCampos = configurarRemocaoDestaqueCampos;
window.PaoDoCiso.formatarCodigoPostal            = formatarCodigoPostal;
window.PaoDoCiso.buscarEnderecoPorCodigoPostal   = buscarEnderecoPorCodigoPostal;
window.PaoDoCiso.calcularFretePorBairro          = calcularFretePorBairro;
window.PaoDoCiso.obterDadosEnderecoCliente       = obterEnderecoFormatado;
window.PaoDoCiso.limparEnderecoCliente           = limparEnderecoCliente;
window.PaoDoCiso.configurarEventosCEP            = configurarEventosCEP;

// Aliases de compatibilidade
window.obterTaxaEntregaAtual           = obterTaxaEntregaAtual;
window.configurarRemocaoDestaqueCampos = configurarRemocaoDestaqueCampos;
window.formatarCodigoPostal            = formatarCodigoPostal;
window.buscarEnderecoPorCodigoPostal   = buscarEnderecoPorCodigoPostal;
window.calcularFretePorBairro          = calcularFretePorBairro;
window.obterDadosEnderecoCliente       = obterEnderecoFormatado;
window.limparEnderecoCliente           = limparEnderecoCliente;
window.configurarEventosCEP            = configurarEventosCEP;
window.obterDadosEnderecoClienteRaw    = obterEnderecoFormatado;
// Nota: window.validarEnderecoCompleto é definida em utils.js — não reexportar aqui