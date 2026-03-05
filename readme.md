# 🍞 Pão do Ciso — Sistema de Pedidos Online

> Sistema web completo para pedidos de pães artesanais de fermentação natural, desenvolvido com HTML, CSS e JavaScript vanilla. Sem frameworks, sem dependências de runtime, sem servidor.

---

## ✨ O que é

O Pão do Ciso é uma loja de pedidos online para uma nanopadaria artesanal de fornada semanal. O cliente acessa o site, monta seu pedido com produtos e opcionais, informa o endereço ou escolhe retirada, seleciona a forma de pagamento e finaliza diretamente pelo WhatsApp — tudo em menos de dois minutos, sem criar conta, sem cadastro.

---

## 🧭 Fluxo do usuário

```
Acessa o site
    ↓
Visualiza o cardápio com produtos, preços e disponibilidade
    ↓
Clica num produto → abre modal com opcionais personalizáveis
    ↓
Adiciona ao carrinho (badge atualizado em tempo real)
    ↓
Abre o carrinho → revisa itens, aplica cupom, escolhe entrega ou retirada
    ↓
Preenche dados pessoais e endereço (CEP preenche automaticamente)
    ↓
Escolhe forma de pagamento (PIX, dinheiro, cartão)
    ↓
Clica em Finalizar → abre WhatsApp com mensagem formatada do pedido
    ↓
Pedido registrado automaticamente na planilha Google Sheets
```

---

## 🏗️ Arquitetura

O sistema é composto por **HTML/CSS/JS vanilla**, organizado em módulos independentes carregados com `defer`. Não há build step, bundler ou framework — o site funciona diretamente no browser, inclusive offline via Service Worker.

```
lojinha/
├── index.html              # Estrutura e todos os modais inline
├── sw.js                   # Service Worker — cache offline completo
├── manifest.json           # PWA — instalável em dispositivos móveis
│
├── css/                    # 13 arquivos CSS modulares por componente
│   ├── layout-base.css     # Estrutura, barra do carrinho, banner da fornada
│   ├── cardapio.css        # Grid de cards de produtos
│   ├── botoes.css          # Sistema de botões reutilizáveis
│   ├── overlay-modal.css   # Base estrutural de todos os modais
│   └── modal-*.css         # Um arquivo por modal
│
├── js/                     # 18 arquivos JS modulares por responsabilidade
│   ├── config.js           # Configurações públicas e wrapper de log
│   ├── config.local.js     # Dados sensíveis (WhatsApp, Pix, planilha) — no .gitignore
│   ├── dados.js            # Cardápio, opcionais, bairros, cupons e fornada
│   ├── state.js            # Estado global (carrinho, estadoAplicativo)
│   ├── utils.js            # Formatação, validação, máscara de CEP
│   ├── modais.js           # Abertura/fechamento de modais
│   ├── notificacoes.js     # Sistema de notificações flutuantes
│   ├── fornada.js          # Lógica de datas e status da fornada
│   ├── cardapio.js         # Renderização dos cards de produtos
│   ├── produto-modal.js    # Modal de produto com opcionais dinâmicos
│   ├── opcionais.js        # Controle de quantidade dos opcionais
│   ├── carrinho.js         # Carrinho, cupons, frete e resumo financeiro
│   ├── cep-frete.js        # Busca de endereço via ViaCEP e cálculo de frete por bairro
│   ├── dados-cliente.js    # Validação e persistência dos dados do cliente
│   ├── pagamento.js        # Seleção de forma de pagamento e PIX
│   ├── envio.js            # Geração da mensagem WhatsApp e envio para planilha
│   ├── address-manager.js  # Gerenciamento do formulário de endereço
│   ├── recuperacao-carrinho.js  # Recuperação de carrinho salvo
│   └── main.js             # Inicialização e orquestração do sistema
│
├── img/                    # Imagens dos produtos em WebP/JPEG otimizados
│
└── painelDeGestao/         # Painel administrativo (ver seção abaixo)
    ├── painelDeGestao-v4.0.html
    ├── script.js
    └── style.css
```

---

## 🧩 Modularidade

Cada arquivo JS tem uma responsabilidade única e bem definida. Todas as funções públicas são exportadas em dois registros:

```js
// Namespace organizado
window.PaoDoCiso.renderizarCardapio = renderizarCardapio;

// Alias de compatibilidade (mantém onclick inline no HTML funcionando)
window.renderizarCardapio = renderizarCardapio;
```

Essa arquitetura permite substituir, testar ou depurar qualquer módulo de forma isolada, sem afetar os demais.

---

## 🛠️ Painel de Gestão

O painel administrativo é uma aplicação separada, sem dependência do site principal. Permite gerenciar todo o conteúdo do cardápio sem tocar em código.

**Funcionalidades:**
- **Dashboard** — visão geral com data da próxima fornada, antecedência e hora limite
- **Produtos** — listagem com thumbnail, status visual (visível/esgotado), edição, duplicação e remoção. Suporte a drag-and-drop para reordenação
- **Opcionais** — gerenciamento de grupos e preços de acompanhamentos por categoria
- **Logística** — taxa geral de entrega e taxas específicas por bairro
- **Cupons** — criação e gestão de cupons de desconto (percentual ou fixo)

**Fluxo do administrador:**
```
Abre o painel → edita o que precisar → clica em "Salvar Local"
    ↓
Clica em "Baixar dados.js" → substitui o arquivo no projeto → deploy
```

---

## 📦 Funcionalidades principais

- **Cardápio dinâmico** com seções, cards de produto, badges de quantidade e marcação de esgotado
- **Modal de produto** com busca em árvore de opcionais por categoria e biblioteca
- **Carrinho persistente** salvo no localStorage — recuperado automaticamente na próxima visita
- **CEP automático** via ViaCEP com timeout de segurança e fallback offline
- **Frete por bairro** com taxa configurável por região de entrega
- **Cupons de desconto** — percentual ou valor fixo, validação case-insensitive
- **Cálculo financeiro** em tempo real: subtotal, desconto, frete, total final
- **Envio por WhatsApp** com mensagem formatada e registro automático em Google Sheets
- **Service Worker** com cache completo para funcionamento offline
- **PWA** — instalável como app no celular
- **Fornada semanal** com banner e modal informativos, desabilitação automática após prazo

---

## 🔒 Segurança e configuração

Dados sensíveis (número do WhatsApp, chave Pix, URL da planilha) ficam em `js/config.local.js`, que está no `.gitignore` e nunca vai para o repositório.

Para configurar em uma nova máquina, copie o arquivo de exemplo:

```bash
cp js/config.local.exemplo.js js/config.local.js
# edite config.local.js com os dados reais
```

---

## ✅ Qualidade

O projeto inclui uma suíte de testes financeiros em `js/testes/financeiro.test.mjs`, cobrindo as funções de maior risco:

```bash
node --test js/testes/financeiro.test.mjs
# 16 testes, 0 falhas
```

Funções testadas: `calcularSubtotalProdutos()`, `aplicarCupom()`, `gerarMensagemWhatsApp()`.

---

## 📊 Performance (Lighthouse — mobile)

| Métrica | Pontuação |
|---|---|
| Performance | 75 |
| Accessibility | 91 |
| Best Practices | 100 |
| SEO | 100 |

---

## 🚀 Como rodar localmente

Qualquer servidor estático funciona. Com a extensão **Live Server** do VSCode, clique com o botão direito em `index.html` → *Open with Live Server*.

---

## 📋 Próximas iterações planejadas

- Painel de gestão: edição do nome da loja, WhatsApp e Instagram diretamente pela interface administrativa
- Font Awesome substituído por SVG inline (ganho de ~1.5s no carregamento)

---

*Desenvolvido com carinho para uma nanopadaria artesanal que vende cerca de 10 pães por semana — e merecia uma arquitetura de software à altura.* 🍞
