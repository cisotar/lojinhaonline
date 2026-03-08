# 🚀 Deploy — Pão do Ciso fora do GitHub Pages

## O que foi alterado nesta versão (2.1.0)

### Performance
- **Font Awesome carregado de forma não-bloqueante** — usa `media="print"` trick, elimina ~200ms de bloqueio de renderização
- **`preconnect` + `dns-prefetch`** para todos os domínios externos (cdnjs, GTM, OneSignal, Firebase)
- **`dados.js` sem `defer`** — carrega sincrônico pois são dados puros, sem manipulação de DOM. Elimina o `setTimeout(100ms)` workaround que existia em `main.js`
- **`renderizarCarrinho()` desacoplado de `buscarEnderecoPorCodigoPostal()`** — CEP agora preservado via `estadoAplicativo.cepCalculado` sem forçar re-render do carrinho
- **Logs de debug condensados** em `cardapio.js` (`atualizarBadgeNoCard` era ~25 chamadas `log()`, agora é 1)

### Portabilidade
- **`js/compat.js`** — arquivo centralizado com todos os aliases globais (`window.X = window.PaoDoCiso.X`). Cada módulo JS agora só precisa exportar via namespace. Carregado por último com `defer`.
- **`js/config.js` com validação de runtime** — avisa no console (e visualmente em localhost) se `config.local.js` estiver faltando
- **`sw.js` usa `Promise.allSettled`** — instalação não falha mais se uma imagem de produto ainda não existir
- **Banners PWA com classes CSS** — removidos ~80 linhas de `style=""` inline

---

## Checklist para novo servidor

### 1. Criar config.local.js (OBRIGATÓRIO)
```bash
cp js/config.local.exemplo.js js/config.local.js
```
Edite `js/config.local.js`:
```js
window.config.whatsappVendedor = '55119XXXXXXXX';  // número com DDI
window.config.chavePix         = 'sua@chave.pix';
window.config.urlPlanilha      = 'https://script.google.com/...';
window.config.DEBUG            = false;
```

### 2. Configurar Firebase (domínio autorizado)
1. Acesse https://console.firebase.google.com
2. Projeto: **pao-do-ciso**
3. Authentication → Settings → **Authorized domains**
4. Adicione o novo domínio (ex: `meusite.com.br`)

### 3. Configurar OneSignal (domínio autorizado)
1. Acesse https://app.onesignal.com
2. Seu app → Settings → **Web Configuration**
3. Adicione o novo domínio
4. Se o App ID mudar, atualize em `index.html`:
   ```
   appId: "a6e252da-0dc0-494d-baa6-a79812543154"
   ```

### 4. Incrementar o cache do Service Worker
Sempre que fizer deploy com mudanças em JS/CSS, incremente `CACHE_NAME` em `sw.js`:
```js
const CACHE_NAME = 'pao-do-ciso-v7'; // era v6, vire v7
```

### 5. Incluir o novo CSS no style.css principal
Se `css/pwa-banners.css` não estiver importado pelo `css/01.default/style.css`, adicione:
```css
@import '../pwa-banners.css';
```
Ou adicione a tag no `<head>` do index.html:
```html
<link rel="stylesheet" href="css/pwa-banners.css">
```

### 6. Google Analytics (opcional)
O GA registra por domínio. Se quiser separar os dados:
- Crie uma nova propriedade no Google Analytics para o novo domínio
- Substitua `G-MT57NGKSM8` pelo novo ID no `index.html`

---

## Teste rápido após deploy

Abra o console do browser e verifique:
1. `[compat.js] ✅ Todos os aliases registrados` — confirma que todos os módulos carregaram
2. Sem avisos `⚠️ config.local.js incompleto`
3. Service Worker registrado: `Service Worker registrado!`
4. Cardápio carrega sem erros
5. Adicionar produto ao carrinho → badge aparece
6. Finalizar pedido → WhatsApp abre com mensagem correta

---

## Servidores testados

| Servidor | Compatível | Observações |
|---|---|---|
| GitHub Pages | ✅ | Ambiente original |
| Netlify | ✅ | Drop da pasta funciona |
| Vercel | ✅ | Projeto estático |
| Apache/Nginx | ✅ | Qualquer servidor estático |
| `npx serve .` (local) | ✅ | Para desenvolvimento |

Para testar localmente:
```bash
npx serve . -p 3000
# ou
python3 -m http.server 3000
```
