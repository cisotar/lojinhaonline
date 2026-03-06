// ============================================
// COMPAT.JS — ALIASES GLOBAIS CENTRALIZADOS
// ============================================
// Este arquivo é o ÚNICO responsável por expor funções no escopo
// global para uso nos atributos onclick="" do index.html.
//
// Carregado como ÚLTIMO script, sem defer.
// Não adicione lógica de negócio aqui.
// ============================================

(function registrarAliases() {
    const PDC = window.PaoDoCiso;
    if (!PDC) {
        console.error('[compat.js] window.PaoDoCiso não encontrado. Verifique a ordem dos scripts.');
        return;
    }

    // ── utils.js ──────────────────────────────────────────────────
    window.elemento               = window.elemento               || PDC.elemento;
    window.formatarMoeda          = window.formatarMoeda          || PDC.formatarMoeda;
    window.formatarWhatsApp       = PDC.formatarWhatsApp;
    window.formatarCEP            = PDC.formatarCEP;
    window.aplicarMascaraCEP      = PDC.aplicarMascaraCEP;
    window.validarTelefone        = PDC.validarTelefone;
    window.validarEnderecoCompleto = PDC.validarEnderecoCompleto;

    // ── modais.js ─────────────────────────────────────────────────
    window.abrirModal              = PDC.abrirModal;
    window.fecharModal             = PDC.fecharModal;
    window.fecharTodosModais       = PDC.fecharTodosModais;
    window.configurarEventosGerais = PDC.configurarEventosGerais;

    // ── notificacoes.js ───────────────────────────────────────────
    window.mostrarNotificacao = PDC.mostrarNotificacao;

    // ── fornada.js ────────────────────────────────────────────────
    window.configurarDatasFornada = PDC.configurarDatasFornada;
    window.calcularDatasFornada   = PDC.calcularDatasFornada;
    window.desabilitarFornada     = PDC.desabilitarFornada;
    window.habilitarFornada       = PDC.habilitarFornada;

    // ── cardapio.js ───────────────────────────────────────────────
    window.renderizarCardapio         = PDC.renderizarCardapio;
    window.atualizarDatasFornada      = PDC.atualizarDatasFornada;
    window.adicionarRapido            = PDC.adicionarRapido;
    window.atualizarBadgeNoCard       = PDC.atualizarBadgeNoCard;
    window.validarProduto             = PDC.validarProduto;
    window.verificarDisponibilidade   = PDC.verificarDisponibilidade;
    window.atualizarCardUnico         = PDC.atualizarCardUnico;
    window.atualizarBadgesAposRemocao = PDC.atualizarBadgesAposRemocao;
    window.diagnosticarBadges         = PDC.diagnosticarBadges;

    // ── opcionais.js ──────────────────────────────────────────────
    window.alterarQuantidadeOpcional = PDC.alterarQuantidadeOpcional;

    // ── produto-modal.js ──────────────────────────────────────────
    window.configurarProduto        = PDC.configurarProduto;
    window.renderizarModalProduto   = PDC.renderizarModalProduto;
    window.alterarQuantidadeProduto = PDC.alterarQuantidadeProduto;
    window.gerarHTMLSecaoOpcionais  = PDC.gerarHTMLSecaoOpcionais;
    window.adicionarItemAoCarrinho  = PDC.adicionarItemAoCarrinho;
    window.adicionarEIrParaCarrinho = PDC.adicionarEIrParaCarrinho;
    window.sincronizarProdutoNoCarrinho = PDC.sincronizarProdutoNoCarrinho;

    // ── carrinho.js ───────────────────────────────────────────────
    window.atualizarBarraCarrinho        = PDC.atualizarBarraCarrinho;
    window.abrirModalCarrinho            = PDC.abrirModalCarrinho;
    window.removerItemDoCarrinho         = PDC.removerItemDoCarrinho;
    window.aplicarCupom                  = PDC.aplicarCupom;
    window.alterarModoEntrega            = PDC.alterarModoEntrega;
    window.prosseguirParaDadosCliente    = PDC.prosseguirParaDadosCliente;
    window.calcularTotalFinal            = PDC.calcularTotalFinal;
    window.atualizarResumoPagamentoFinal = PDC.atualizarResumoPagamentoFinal;
    window.atualizarDisplayFreteCarrinho = PDC.atualizarDisplayFreteCarrinho;
    window.formatarCampoCEP             = PDC.formatarCampoCEP;
    window.validarCEPAuto               = PDC.validarCEPAuto;

    // ── cep-frete.js ──────────────────────────────────────────────
    window.obterTaxaEntregaAtual           = PDC.obterTaxaEntregaAtual;
    window.configurarRemocaoDestaqueCampos = PDC.configurarRemocaoDestaqueCampos;
    window.formatarCodigoPostal            = PDC.formatarCodigoPostal;
    window.buscarEnderecoPorCodigoPostal   = PDC.buscarEnderecoPorCodigoPostal;
    window.calcularFretePorBairro          = PDC.calcularFretePorBairro;
    window.obterDadosEnderecoCliente       = PDC.obterDadosEnderecoCliente;
    window.limparEnderecoCliente           = PDC.limparEnderecoCliente;
    window.configurarEventosCEP            = PDC.configurarEventosCEP;

    // ── dados-cliente.js ──────────────────────────────────────────
    window.validarDadosCliente  = PDC.validarDadosCliente;
    window.salvarDadosCliente   = PDC.salvarDadosCliente;
    window.carregarDadosCliente = PDC.carregarDadosCliente;
    window.diagnosticarCep      = PDC.diagnosticarCep;

    // ── pagamento.js ──────────────────────────────────────────────
    window.abrirModalPagamento = PDC.abrirModalPagamento;
    window.selecionarPagamento = PDC.selecionarPagamento;
    window.copiarChavePix      = PDC.copiarChavePix;
    window.finalizarPedido     = PDC.finalizarPedido;

    // ── envio.js ──────────────────────────────────────────────────
    window.processarFinalizacaoPedido = PDC.processarFinalizacaoPedido;
    window.reiniciarFluxoCompra       = PDC.reiniciarFluxoCompra;
    window.reenviarPedidoWhatsapp     = PDC.reenviarPedidoWhatsapp;

    // ── state.js ──────────────────────────────────────────────────
    window.carregarCarrinhoSalvo = PDC.carregarCarrinhoSalvo;
    window.salvarCarrinho        = PDC.salvarCarrinho;
    window.resetarEstado         = PDC.resetarEstado;

    // ── recuperacao-carrinho.js ───────────────────────────────────
    window.verificarCarrinhoRecuperado = PDC.verificarCarrinhoRecuperado;
    window.limparCarrinhoRecuperado    = PDC.limparCarrinhoRecuperado;
    window.iniciarRecuperacaoCarrinho  = PDC.iniciarRecuperacaoCarrinho;

    // ── main.js ───────────────────────────────────────────────────
    window.inicializarSistema           = PDC.inicializarSistema;
    window.atualizarDadosModalFornada   = PDC.atualizarDadosModalFornada;
    window.solicitarPermissaoNotificacao = PDC.solicitarPermissaoNotificacao;

    // ── firebase.js ───────────────────────────────────────────────
    // carregarDadosFirestore e salvarDadosFirestore são exportados
    // diretamente pelo módulo ES — não precisam de alias aqui.

    log('[compat.js] ✅ Todos os aliases registrados com sucesso.');
})();
