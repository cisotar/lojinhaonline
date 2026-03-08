# Refatoração — Pão do Ciso

## 🔒 Segurança Imediata

- [ ] **1.** **Verificar se `config.local.js` já foi commitado**
        - Executar `git log --all --full-history -- js/config.local.js`
        - `js/config.local.js`
   
- [ ] **2.** **Confirmar entrada no `.gitignore`**
        - Verificar que `js/config.local.js` está listado
        - `.gitignore`

- [ ] **3.** **Limpar histórico Git se necessário**
        - Rodar `git filter-repo --path js/config.local.js --invert-paths` e force-push
        - `js/config.local.js`

- [ ] **4.** **Revogar dados expostos se necessário**
        - Recriar URL do Google Apps Script
        - Considerar troca do número de contato do site

---

## Fase 1 — Unificar cálculo financeiro

- [ ] **5.** **Criar função unificada `calcularTotaisPedido()`**
        - Criar em `utils.js` retornando `{ subtotal, desconto, frete, total }`
        - `js/utils.js`

- [ ] **6.** **Substituir cálculo em carrinho.js**
        - Substituir `calcularSubtotalProdutos()` e o cálculo em `atualizarResumoFinanceiroCarrinho()` pela nova função
        - `js/carrinho.js`

- [ ] **7.** **Substituir cálculo em envio.js**
        - Substituir a lógica local em `gerarMensagemWhatsApp()` pela mesma função unificada
        - `js/envio.js`

- [ ] **8.** **Adicionar novos testes**
        - Cobrir: divergência opcional×quantidade, cupom fixo com entrega, total negativo por desconto alto
        - `js/testes/financeiro.test.mjs`

- [ ] **9.** **Validar todos os testes**
        - Rodar `node --test js/testes/financeiro.test.mjs`
        - Os 16 testes existentes + novos devem passar
        - `js/testes/financeiro.test.mjs`

---

## Fase 2 — Centralizar aliases de exportação

- [ ] **10.** **Criar `compat.js`**
    - Lista explícita de todos os aliases necessários para o HTML: `window.X = window.PaoDoCiso.X`
    - `js/compat.js`

- [ ] **11.** **Limpar aliases dos módulos**
    - Em cada módulo JS: remover o bloco de aliases globais (`window.X = X`), mantendo apenas `window.PaoDoCiso.X = X`
    - `js/carrinho.js` `js/cardapio.js` `js/modais.js` `js/envio.js` `js/utils.js` `js/fornada.js` `js/cep-frete.js`

- [ ] **12.** **Registrar `compat.js` no HTML**
    - Adicionar como último script no `index.html`, sem `defer`, após todos os módulos
    - `index.html`

- [ ] **13.** **Cachear `compat.js` no Service Worker**
    - Incluir na lista `ASSETS_ESSENCIAIS` do `sw.js`
    - `js/sw.js`

- [ ] **14.** **Verificar compatibilidade manual**
    - Testar todos os botões, banners e modais do index.html
    - `index.html`

---

## Fase 3 — Limpar logs e código de diagnóstico

- [ ] **15.** **Condensar logs de `atualizarBadgeNoCard()`**
    - Reduzir de ~25 para 3 chamadas log() essenciais: entrada, ação, resultado
    - Função deve passar de ~60 para ~25 linhas
    - `js/cardapio.js`

- [ ] **16.** **Isolar função de diagnóstico**
    - Mover `diagnosticarBadges()` para `js/dev-tools.js`
    - Remover `dev-tools.js` da lista de cache do `sw.js`
    - `js/cardapio.js` `js/dev-tools.js` `sw.js`

- [ ] **17.** **Remover código comentado em dados-cliente.js**
    - Remover o bloco comentado de `testarAddressManager()` (~120 linhas)
    - `js/dados-cliente.js`

- [ ] **18.** **Remover comentários obsoletos em address-manager.js**
    - Remover comentários sobre código já removido como `// ✅ setInterval removido`
    - `js/address-manager.js`

- [ ] **19.** **Remover definição CSS duplicada**
    - Remover `.notificacao-flutuante` de `modal-carrinho.css` — já definida em `notificacoes.css`
    - `css/modal-carrinho.css` `css/notificacoes.css`

---

## Fase 4 — Migrar HTML inline para CSS

- [ ] **20.** **Criar classes dos banners PWA**
    - Criar `.banner-pwa-fixo` e `.banner-pwa-notif` em `layout-base.css`
    - `css/layout-base.css`

- [ ] **21.** **Limpar style="" dos banners no HTML**
    - Substituir ~80 linhas de `style=""` nos banners pelos novos atributos de classe
    - `index.html`

- [ ] **22.** **Migrar logo do header para classe**
    - Substituir `<img style="...">` no header pela classe `.logo-cabecalho` já definida
    - `index.html` `css/layout-base.css`

- [ ] **23.** **Limpar style="" em `gerarHTMLResumo()`**
    - Usar `.resumo-carrinho-container`, `.resumo-linha`, `.resumo-divisor` já definidas em `modal-pagamento.css`
    - `js/carrinho.js` `css/modal-pagamento.css`

- [ ] **24.** **Limpar style="" em `gerarHTMLOpcoesEntregaCupom()`**
    - Substituir style="" inline do botão APLICAR pelas classes existentes
    - `js/carrinho.js`

- [ ] **25.** **Remover style="" da div `.botoes-acao` no modal de pagamento**
    - O comentário no HTML já diz "conferir se essa div pode ser removida para o CSS gerir"
    - `index.html` `css/modal-pagamento.css`

---

## Fase 5 — Resolver carregamento e acoplamentos

- [ ] **26.** **Remover `defer` de `dados.js`**
    - É arquivo de dados puros — não manipula DOM, não precisa aguardar o DOMContentLoaded
    - `index.html`

- [ ] **27.** **Remover `setTimeout(100ms)` de `main.js`**
    - Chamar `inicializarSistema()` diretamente após remover o defer de `dados.js`
    - `js/main.js`

- [ ] **28.** **Desacoplar `buscarCEP()` de `renderizarCarrinho()`**
    - Remover a chamada `renderizarCarrinho()` de dentro de `buscarEnderecoPorCodigoPostal()`
    - `js/cep-frete.js`

- [ ] **29.** **Confirmar preservação do CEP no re-render**
    - Verificar que `gerarHTMLOpcoesEntregaCupom()` já preserva o CEP via `estadoAplicativo.cepCalculado`
    - `js/carrinho.js` `js/cep-frete.js`

- [ ] **30.** **Testar fluxo de CEP completo**
    - Digitar CEP → buscar endereço → alterar modo de entrega → CEP deve permanecer no campo

---

## Próximas Iterações

- [ ] **31.** **Substituir Font Awesome por SVG inline**
    - Elimina ~150KB de CSS + fonte e ~1.5s de carregamento bloqueante
    - Apenas ~8 ícones são usados no projeto
    - `index.html`

- [ ] **32.** **Ampliar cobertura de testes**
    - Extrair parâmetros de `calcularFretePorBairro()` e `gerarMensagemWhatsApp()` para permitir testes em Node
    - `js/cep-frete.js` `js/envio.js` `js/testes/financeiro.test.mjs`

- [ ] **33.** **Painel administrativo — edição de dados da loja**
    - Editar `whatsappVendedor`, Instagram e nome da loja diretamente pelo painel
    - `painelDeGestao/painelDeGestao-v4.0.html` `painelDeGestao/script.js`

- [ ] **34.** **Lazy loading de seções do cardápio**
    - Usar `IntersectionObserver` para renderizar seções sob demanda
    - Melhora o LCP quando houver muitos produtos
    - `js/cardapio.js`

- [ ] **35.** **Documentar processo de deploy**
    - Garantir que `CACHE_NAME` em `sw.js` seja incrementado a cada deploy com mudanças de JS/CSS
    - `sw.js` `readme.md`
