// ============================================
// FUNÇÕES UTILITÁRIAS - PÃO DO CISO
// ============================================

// UTILITÁRIOS (APENAS SE NÃO EXISTIREM)
if (!window.elemento) {
    window.elemento = id => document.getElementById(id);
}

if (!window.formatarMoeda) {
    window.formatarMoeda = valor => {
        return parseFloat(valor || 0).toLocaleString('pt-br', {
            style: 'currency',
            currency: 'BRL'
        });
    };
}

// FUNÇÕES DE FORMATAÇÃO
function formatarWhatsApp(valor) {
    let numeros = valor.replace(/\D/g, '');
    if (numeros.length > 11) numeros = numeros.substring(0, 11);

    if (numeros.length > 0) {
        numeros = numeros.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})$/, '($1) $2 $3-$4');
    }

    return numeros;
}

// ✅ FONTE ÚNICA DE MÁSCARA DE CEP
// Utilizada por: cep-frete.js, address-manager.js, carrinho.js
// Aceita string ou event.target, retorna string formatada (00000-000)
function formatarCEP(valor) {
    let numeros = (typeof valor === 'string' ? valor : valor?.value ?? '').replace(/\D/g, '');
    if (numeros.length > 8) numeros = numeros.substring(0, 8);

    if (numeros.length > 5) {
        numeros = numeros.substring(0, 5) + '-' + numeros.substring(5);
    }

    return numeros;
}

// FUNÇÕES DE VALIDAÇÃO
function validarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    return numeros.length === 11;
}

// ✅ FONTE ÚNICA DE VALIDAÇÃO DE ENDEREÇO
// Substitui as implementações de cep-frete.js e address-manager.js
// Parâmetros:
//   camposObrigatorios (opcional): array de { id, nome } para sobrescrever o padrão
//   dadosExtras (opcional): objeto adicional para incluir no retorno (ex: estadoAplicativo.dadosCliente)
function validarEnderecoCompleto(camposObrigatorios, dadosExtras) {
    const campos = camposObrigatorios || [
        { id: 'codigo-postal-cliente', nome: 'CEP' },
        { id: 'logradouro-cliente',    nome: 'Rua' },
        { id: 'bairro-cliente',        nome: 'Bairro' },
        { id: 'numero-residencia-cliente', nome: 'Número' }
    ];

    const camposInvalidos = [];

    campos.forEach(campo => {
        const el = window.elemento(campo.id);
        if (el) {
            const valor = el.value.trim();
            if (!valor) {
                camposInvalidos.push(campo.nome);
                el.classList.add('campo-invalido');
            } else {
                el.classList.remove('campo-invalido');
                el.classList.add('campo-valido');
            }
        }
    });

    if (camposInvalidos.length > 0) {
        return {
            valido: false,
            mensagem: `Preencha os campos obrigatórios: ${camposInvalidos.join(', ')}`,
            camposFaltantes: camposInvalidos
        };
    }

    return {
        valido: true,
        mensagem: 'Endereço válido',
        dados: {
            ...(dadosExtras || {}),
            numero:      window.elemento('numero-residencia-cliente')?.value.trim() || '',
            complemento: window.elemento('complemento-residencia-cliente')?.value.trim() || '',
            referencia:  window.elemento('ponto-referencia-entrega')?.value.trim() || ''
        }
    };
}

// ✅ Alias para compatibilidade com carrinho.js e address-manager.js
// Aplica a máscara de CEP diretamente num elemento input
function aplicarMascaraCEP(input) {
    input.value = formatarCEP(input.value);
}

// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.formatarWhatsApp       = formatarWhatsApp;
window.PaoDoCiso.formatarCEP            = formatarCEP;
window.PaoDoCiso.aplicarMascaraCEP      = aplicarMascaraCEP;
window.PaoDoCiso.validarTelefone        = validarTelefone;
window.PaoDoCiso.validarEnderecoCompleto = validarEnderecoCompleto;

// Aliases de compatibilidade
window.elemento               = window.elemento;
window.formatarMoeda          = window.formatarMoeda;
window.formatarWhatsApp       = formatarWhatsApp;
window.formatarCEP            = formatarCEP;
window.aplicarMascaraCEP      = aplicarMascaraCEP;
window.validarTelefone        = validarTelefone;
window.validarEnderecoCompleto = validarEnderecoCompleto;
