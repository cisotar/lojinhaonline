// ============================================
// SISTEMA DE ENVIO DE PEDIDOS - PÃO DO CISO
// ============================================

/**
 * Envia os dados do pedido para o Google Sheets via API
 * FASE 01 - Correção de Bug Crítico: Leitura de config interna
 */
function enviarPedidoParaPlanilha(dadosCliente) {
    // Definindo a URL aqui dentro para evitar erro de carregamento antecipado
    const URL_PLANILHA = window.config ? window.config.urlPlanilha : '';

    if (!URL_PLANILHA) {
        console.error("❌ Erro: URL da planilha não configurada em window.config");
        return;
    }

    // 1. Organizar os itens do pedido com quebra de linha para a célula
    let resumoItens = "";
    if (typeof carrinho !== 'undefined') {
        Object.values(carrinho).forEach(item => {
            const secao = dadosIniciais?.secoes?.[item.indiceSessao];
            const produto = secao?.itens?.[item.indiceItem];
            
            if (produto) {
                resumoItens += `${item.quantidade}x ${produto.nome}\n`;
                
                if (item.opcionais) {
                    Object.keys(item.opcionais).forEach(opc => {
                        resumoItens += `   └ ${item.opcionais[opc].quantidade}x ${opc}\n`;
                    });
                }
            }
        });
    }

    // 2. Preparar o objeto com as colunas exatamente como na planilha
    const dados = {
        data: new Date().toLocaleString('pt-BR'),
        nome: dadosCliente.nome,
        telefone: dadosCliente.whatsapp,
        endereco: dadosCliente.endereco,
        pedido: resumoItens.trim(),
        forma_pagamento: dadosCliente.metodoPagamento,
        total: estadoAplicativo.totalGeral
    };

    // 3. Executar o envio
    log("📤 Enviando para planilha...");
    fetch(URL_PLANILHA, {
        method: 'POST',
        mode: 'no-cors', 
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    })
    .then(() => log("✅ Dados enviados para a planilha com sucesso!"))
    .catch(error => console.error("❌ Erro ao enviar para planilha:", error));
}

function processarFinalizacaoPedido() {
    // Coletar dados dos elementos do DOM
    const nome = document.getElementById('nome-cliente')?.value.trim() || '';
    const whatsapp = document.getElementById('whatsapp-cliente')?.value.trim() || '';
    const metodoPagamento = estadoAplicativo?.formaPagamento;
    
    // Validar dados básicos
    if (!nome || nome.length < 3) {
        mostrarNotificacao('Por favor, digite seu nome completo.', 'erro');
        return;
    }
    
    const whatsappNumeros = whatsapp.replace(/\D/g, '');
    if (whatsappNumeros.length !== 11) {
        mostrarNotificacao('Por favor, digite um WhatsApp válido (11 dígitos).', 'erro');
        return;
    }
    
    if (!metodoPagamento) {
        mostrarNotificacao('Por favor, selecione uma forma de pagamento.', 'erro');
        return;
    }

    // ✅ Validar número do vendedor antes de prosseguir
    const whatsappDestino = window.config?.whatsappVendedor || '';
    if (!whatsappDestino) {
        console.error('❌ whatsappVendedor não configurado em config.local.js');
        mostrarNotificacao('Erro de configuração: número do vendedor não definido.', 'erro');
        return;
    }
    
    // Coletar endereço se for entrega
    let enderecoTexto = 'Retirada no local';
    if (estadoAplicativo?.modoEntrega === 'entrega') {
        const rua = document.getElementById('logradouro-cliente')?.value.trim() || '';
        const bairro = document.getElementById('bairro-cliente')?.value.trim() || '';
        const numero = document.getElementById('numero-residencia-cliente')?.value.trim() || '';
        const complemento = document.getElementById('complemento-residencia-cliente')?.value.trim() || '';
        const referencia = document.getElementById('ponto-referencia-entrega')?.value.trim() || '';
        const cep = document.getElementById('codigo-postal-cliente')?.value.trim() || '';
        
        if (!rua || !bairro || !numero) {
            mostrarNotificacao('Para entrega, preencha todos os campos de endereço obrigatórios.', 'erro');
            return;
        }
        
        enderecoTexto = `${rua}, ${numero}`;
        if (complemento) enderecoTexto += ` - ${complemento}`;
        if (bairro) enderecoTexto += ` - ${bairro}`;
        if (cep) enderecoTexto += ` (CEP: ${cep})`;
        if (referencia) enderecoTexto += ` [Ref: ${referencia}]`;
    }

    // --- CHAMADA PARA A PLANILHA ---
    const dadosClienteParaPlanilha = {
        nome: nome,
        whatsapp: whatsappNumeros,
        endereco: enderecoTexto,
        metodoPagamento: metodoPagamento
    };
    enviarPedidoParaPlanilha(dadosClienteParaPlanilha);
    // -------------------------------
    
    // Gerar mensagem para WhatsApp
    const mensagem = gerarMensagemWhatsApp(nome, whatsappNumeros, enderecoTexto, metodoPagamento);

    log('📱 Número destino:', whatsappDestino);
    log('📝 Mensagem gerada:\n', mensagem);
    
    // Abrir WhatsApp com a URL do config
    const linkWhatsApp = `https://api.whatsapp.com/send?phone=${whatsappDestino}&text=${encodeURIComponent(mensagem)}`;
    window.open(linkWhatsApp, '_blank');

    window.ultimoLinkWhatsapp = linkWhatsApp; 

    // Fechar modais e abrir sucesso
    if (typeof fecharTodosModais === 'function') {
        fecharTodosModais();
    }

    setTimeout(() => {
        if (typeof abrirModal === 'function') {
            abrirModal('modal-sucesso');
        }

        // Preencher número do pedido e horário no modal de sucesso
        const agora = new Date();
        const horario = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const numeroPedido = '#' + String(agora.getTime()).slice(-4);

        const elNumero  = document.getElementById('numero-pedido');
        const elHorario = document.getElementById('horario-pedido');
        if (elNumero)  elNumero.textContent  = numeroPedido;
        if (elHorario) elHorario.textContent = horario;
    }, 300);
}

function gerarMensagemWhatsApp(nome, whatsapp, endereco, metodoPagamento) {
    let totalProdutos = 0;
    let itensTexto = '';
    
    if (typeof carrinho !== 'undefined') {
        Object.values(carrinho).forEach(item => {
            const secao = dadosIniciais?.secoes?.[item.indiceSessao];
            const produto = secao?.itens?.[item.indiceItem];

            if (produto) {
                // ✅ CORREÇÃO: separar preço base dos opcionais.
                // O preço base é por unidade e se multiplica por item.quantidade.
                // Os opcionais já têm sua própria quantidade (ex: 2x Alichella) e
                // NÃO devem ser multiplicados por item.quantidade novamente.
                const precoBase = Number(produto.preco || 0);
                let subtotalOpcionais = 0;
                let listaOpcionaisTexto = '';

                if (item.opcionais && Object.keys(item.opcionais).length > 0) {
                    Object.entries(item.opcionais).forEach(([nomeOpcional, dadosOpcional]) => {
                        const qtdOpc = Number(dadosOpcional.quantidade || 0);
                        const precoOpc = Number(dadosOpcional.preco || 0);
                        subtotalOpcionais += precoOpc * qtdOpc;
                        listaOpcionaisTexto += `   ├ ${qtdOpc}x ${nomeOpcional}\n`;
                    });
                }

                // subtotal = (preço unitário × qtd) + opcionais
                const subtotalItem = (precoBase * item.quantidade) + subtotalOpcionais;
                totalProdutos += subtotalItem;
                
                itensTexto += `• ${item.quantidade}x ${produto.nome} (${formatarMoeda(subtotalItem)})\n`;
                if (listaOpcionaisTexto) {
                    itensTexto += listaOpcionaisTexto;
                }
            }
        });
    }
    
    const taxaEntrega = estadoAplicativo.modoEntrega === 'entrega' ? Number(estadoAplicativo.taxaEntrega || 0) : 0;
    const desconto = Number(estadoAplicativo.descontoCupom || 0);
    const totalGeral = (totalProdutos - desconto) + taxaEntrega;
    
    let mensagem = `*NOVO PEDIDO - PÃO DO CISO*\n`;
    mensagem += `══════════════════════════════\n\n`;
    mensagem += `👤 *Cliente:* ${nome}\n`;
    mensagem += `📱 *WhatsApp:* ${whatsapp}\n`;
    mensagem += `📍 *${estadoAplicativo?.modoEntrega === 'entrega' ? 'Endereço' : 'Retirada'}:* ${endereco}\n`;
    mensagem += `💳 *Pagamento:* ${metodoPagamento}\n\n`;
    
    if (estadoAplicativo?.cupomAplicado) {
        mensagem += `🎫 *Cupom:* ${estadoAplicativo.cupomAplicado}\n\n`;
    }
    
    mensagem += `══════════════════════════════\n`;
    mensagem += `🛒 *ITENS DO PEDIDO:*\n\n`;
    mensagem += itensTexto || 'Nenhum item\n';
    
    mensagem += `\n══════════════════════════════\n`;
    mensagem += `💰 *RESUMO FINANCEIRO:*\n\n`;
    mensagem += `Produtos: ${formatarMoeda(totalProdutos)}\n`;
    
    if (desconto > 0) {
        mensagem += `Desconto: -${formatarMoeda(desconto)}\n`;
    }
    
    if (estadoAplicativo.modoEntrega === 'entrega') {
        mensagem += `Taxa de Entrega: ${taxaEntrega > 0 ? formatarMoeda(taxaEntrega) : 'Grátis'}\n`;
    }
    
    mensagem += `\n*TOTAL FINAL: ${formatarMoeda(totalGeral)}*\n`;
    mensagem += `══════════════════════════════\n`;
    mensagem += `_Pedido gerado via site Pão do Ciso_`;
    
    return mensagem;
}

function reiniciarFluxoCompra() {
    // ✅ Substituído location.reload() por reset de estado em memória
    // Evita: flash branco, recarregamento de assets, perda de contexto

    // 1. Limpar carrinho (memória + localStorage)
    window.carrinho = {};
    localStorage.removeItem('carrinho_pao_do_ciso');

    // 2. Resetar estadoAplicativo para valores iniciais
    if (window.estadoAplicativo) {
        window.estadoAplicativo.dadosCliente      = {};
        window.estadoAplicativo.modoEntrega       = 'retirada';
        window.estadoAplicativo.taxaEntrega       = 0;
        window.estadoAplicativo.cepCalculado      = null;
        window.estadoAplicativo.bairroIdentificado = null;
        window.estadoAplicativo.formaPagamento    = null;
        window.estadoAplicativo.cupomAplicado     = null;
        window.estadoAplicativo.descontoCupom     = 0;
        window.estadoAplicativo.totalGeral        = 0;
    }

    // 3. Fechar todos os modais
    if (typeof fecharTodosModais === 'function') {
        fecharTodosModais();
    }

    // 4. Re-renderizar cardápio com badges zerados
    if (typeof renderizarCardapio === 'function') {
        renderizarCardapio();
    }

    // 5. Zerar barra do carrinho
    if (typeof atualizarBarraCarrinho === 'function') {
        atualizarBarraCarrinho();
    }
}

function reenviarPedidoWhatsapp() {
    if (window.ultimoLinkWhatsapp) {
        window.open(window.ultimoLinkWhatsapp, '_blank');
    } else {
        mostrarNotificacao('Link do pedido não encontrado. Tente enviar novamente.', 'erro');
    }
}

// Exportações para o escopo global
// Namespace
window.PaoDoCiso = window.PaoDoCiso || {};
window.PaoDoCiso.processarFinalizacaoPedido = processarFinalizacaoPedido;
window.PaoDoCiso.reiniciarFluxoCompra = reiniciarFluxoCompra;
window.PaoDoCiso.reenviarPedidoWhatsapp = reenviarPedidoWhatsapp;

// Aliases de compatibilidade
window.processarFinalizacaoPedido = processarFinalizacaoPedido;
window.reiniciarFluxoCompra = reiniciarFluxoCompra;
window.reenviarPedidoWhatsapp = reenviarPedidoWhatsapp;