# Plano de Refatoração — Pão do Ciso

> Cada fase deve terminar com o site testado no browser (mobile e desktop).
> Commitar ao final de cada iteração.

---

## 🔴 FASE 01 — SEGURANÇA E BUGS CRÍTICOS

- [x] 1. Dados sensíveis removidos do repositório público
  - `js/config.js` esvaziado dos dados sensíveis
  - `js/config.local.js` criado localmente (no .gitignore)
  - `js/config.local.exemplo.js` adicionado como template

- [x] 2. `sincronizarProdutoNoCarrinho` exportada para `window`
  - `js/produto-modal.js`

- [x] 3. Timeout e fallback no fetch da ViaCEP
  - `js/cep-frete.js`: AbortController 5s + mostrarErroCEP() no catch

- [x] 4. Número do pedido e horário preenchidos dinamicamente
  - `js/envio.js`: timestamp e hora real no modal de sucesso

- [x] 5. `user-scalable=no` removido
  - `index.html`: meta viewport simplificada

- [x] 6. Badge ESGOTADO duplicado resolvido
  - `js/cardapio.js`: `<div class="badge-esgotado">` removido
  - `css/cardapio.css`: mantido apenas CSS `::after`

---

## 🟡 FASE 02 — PERFORMANCE E CARREGAMENTO

- [x] 7. Imagens — **deixar para o final** (Squoosh.app)

- [x] 8. `defer` adicionado em 17 scripts
  - `index.html`: config.js e config.local.js sem defer (dependência base)

- [ ] 9. Font Awesome completo — **não faremos**

- [ ] 10. Service Worker com cache insuficiente
  - `sw.js`: adicionar imagens ao cache, limpeza de caches antigos no activate

- [ ] 11. `setTimeout(inicializarSistema, 100)` sem comentário
  - `js/main.js`: documentar ou resolver a condição de corrida

- [ ] 12. `reiniciarFluxoCompra()` usa `location.reload()`
  - `js/envio.js`: substituir por resetarEstado() + renderizarCardapio() + fecharTodosModais()

---

## 🏗️ FASE 03 — ORGANIZAÇÃO E ARQUITETURA

- [ ] 13. Tudo em `window.*` sem namespace
  - Vários JS: agrupar em `window.PaoDoCiso = {}`

- [ ] 14. `mostrarNotificacao()` definida em dois arquivos
  - `js/cardapio.js`: remover implementação local (manter só notificacoes.js)

- [ ] 15. `abrirModal` sobrescrita com monkey-patch
  - `js/main.js` + `js/modais.js`: mover lógica para dentro de abrirModal()

- [ ] 16. Dados do negócio hardcoded
  - `js/dados.js`: transformar em dados.json com fetch()

- [ ] 17. Testes para funções financeiras — **pouquíssima prioridade**

---

## 🎨 FASE 04 — CSS E LAYOUT

- [ ] 18. ~35 ocorrências de `!important`
  - Vários CSS: revisar cascata e aumentar especificidade

- [ ] 19. `@keyframes fadeIn` duplicado
  - `css/modal-carrinho.css`: remover; renomear para fadeInSuave se necessário

- [x] 20. Estilos inline nos botões removidos
  - `index.html`: 3 botões limpos (finalizar, voltar, entendi-fornada)

- [ ] 21. Cores hardcoded misturadas com variáveis CSS
  - Vários CSS: substituir hex por variáveis de style.css

- [ ] 22. `html, body { overflow-x: hidden }` duplicado
  - `css/cardapio.css`: remover (já está em style.css)

---

## ⚪ FASE 05 — LIMPEZA FINAL

- [x] 23. `.gitignore` criado
  - Raiz do projeto: config.local.js, node_modules/, *.bkp, .DS_Store

- [ ] 24. `console.log` diretos fora do wrapper `log()`
  - `js/cep-frete.js`, `js/address-manager.js`, `js/recuperacao-carrinho.js`, `js/dados-cliente.js`

- [ ] 25. Código morto a remover
  - `js/utils.js`: calcularTotalCarrinho(), validarEmail()
  - `js/produto-modal.js`: window.ajustarAlinhamentoOpcionais
  - `js/address-manager.js`: this.enderecoAtual
  - `css/modal-produto.css`: #modal-zoom-imagem (verificar se ainda usado)
  - `css/overlay-modal.css`: @keyframes modalEntrada

- [ ] 26. Meta tag `theme-color` duplicada
  - `index.html`: manter apenas uma ocorrência

---

## Agrupamentos sugeridos para próximas iterações

| Iteração | Itens | Arquivos | Risco |
|---|---|---|---|
| A | 19 + 22 | style.css, modal-carrinho.css, cardapio.css | 🟢 baixo |
| B | 26 + 14 | index.html, cardapio.js | 🟢 baixo |
| C | 24 | cep-frete.js, address-manager.js, recuperacao-carrinho.js, dados-cliente.js | 🟢 baixo |
| D | 11 + 15 | main.js, modais.js | 🟡 médio |
| E | 12 | envio.js | 🟡 médio |
| F | 18 + 21 | vários CSS | 🟡 médio |
| G | 10 | sw.js | 🟡 médio |
| H | 25 | utils.js, produto-modal.js, address-manager.js, CSS | 🟡 médio |
| I | 13 | todos os JS | 🔴 alto — deixar para o fim |
| J | 16 | dados.js | 🔴 alto — impacta todo o sistema |
