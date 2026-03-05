// ============================================
// ESTADO DA APLICAÇÃO - PÃO DO CISO
// ============================================

// ESTADO GLOBAL
window.carrinho = {};
window.produtoAtual = null;
window.estadoAplicativo = {
    formaPagamento: null,
    totalGeral: 0,
    modoEntrega: 'retirada',
    taxaEntrega: 0,
    bairroEntrega: null,
    cupomAplicado: null,
    descontoCupom: 0,
    dadosCliente: {
        nome: '',
        telefone: '',
        cep: '',
        logradouro: '',
        bairro: '',
        cidade: '',
        estado: '',
        numero: '',
        complemento: '',
        referencia: ''
    }
};

// FUNÇÕES DE ESTADO
function carregarCarrinhoSalvo() {
    try {
        const carrinhoSalvo = localStorage.getItem('carrinho_pao_do_ciso');
        if (carrinhoSalvo) {
            window.carrinho = JSON.parse(carrinhoSalvo);
            log('🛒 Carrinho carregado do localStorage:', window.carrinho);
        } else {
            window.carrinho = {};
            log('🆕 Carrinho inicializado vazio');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar carrinho:', error);
        window.carrinho = {};
    }
}

function salvarCarrinho() {
    try {
        localStorage.setItem('carrinho_pao_do_ciso', JSON.stringify(window.carrinho));
        log('💾 Carrinho salvo no localStorage:', window.carrinho);
    } catch (error) {
        console.error('❌ Erro ao salvar carrinho:', error);
    }
}

function resetarEstado() {
    window.carrinho = {};
    window.produtoAtual = null;
    window.estadoAplicativo = {
        formaPagamento: null,
        totalGeral: 0,
        modoEntrega: 'retirada',
        taxaEntrega: 0,
        bairroEntrega: null,
        cupomAplicado: null,
        descontoCupom: 0,
            dadosCliente: {
            nome: '',
            telefone: '',
            cep: '',
            logradouro: '',
            bairro: '',
            cidade: '',
            estado: '',
            numero: '',
            complemento: '',
            referencia: ''
        }
    };
    
    localStorage.removeItem('carrinho_pao_do_ciso');
    log('🔄 Estado resetado completamente');
}

// EXPORTAR FUNÇÕES
// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.carregarCarrinhoSalvo = carregarCarrinhoSalvo;
window.PaoDoCiso.salvarCarrinho = salvarCarrinho;
window.PaoDoCiso.resetarEstado = resetarEstado;

// Aliases de compatibilidade
window.carregarCarrinhoSalvo = carregarCarrinhoSalvo;
window.salvarCarrinho = salvarCarrinho;
window.resetarEstado = resetarEstado;