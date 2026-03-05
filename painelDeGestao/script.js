// ===========================================
// 1. ESTADO E DADOS - RODANDO COM CRUD
// ===========================================
const estadoInicial = {
    loja: { nome: "Pão do Ciso", telefone: "", endereco: "" },
    fornada: { dataISO: new Date().toISOString().split('T')[0], diasAntecedencia: 2, horaLimite: "23:59h" },
    entrega: { taxaGeral: 10.00, bairros: [] },
    cupons: [],
    secoes: [{ nome: "Pães Artesanais", itens: [] }],
    opcionais: { "Pães Artesanais": [] }
};

let db = JSON.parse(localStorage.getItem('pao_do_ciso_db')) || estadoInicial;
let secaoAtiva = 'dashboard';

// Variáveis Drag & Drop
let dragIdx = null;
let dragProdutoIdx = null; 
let dragOrigemSecaoIdx = null;


function carregarDadosJS() {
    const scriptsAntigos = document.querySelectorAll('.script-dados-carga');
    scriptsAntigos.forEach(s => s.remove());

    const script = document.createElement('script');
    script.src = '../js/dados.js?v=' + new Date().getTime();
    script.className = 'script-dados-carga';
    
    script.onload = function() {
        if (window.dadosIniciais) {
            db = window.dadosIniciais;
            persistir();
            navegarPara(secaoAtiva);
            alert("Dados carregados com sucesso do arquivo dados.js!");
        }
    };
    document.body.appendChild(script);
}

// ===========================================
// 2. INICIALIZAÇÃO
// ===========================================
window.onload = function() {
    carregarDadosJS();
    
    const dashContainer = document.getElementById('tab-dashboard');
    if (dashContainer) {
        renderDashboard(dashContainer);
    }
    
    navegarPara('dashboard');
};

function navegarPara(secao) {
    secaoAtiva = secao;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + secao).classList.add('active');
    renderizarAtual();
}

function renderizarAtual() {
    const container = document.getElementById('conteudo-principal');
    container.innerHTML = '';

    switch(secaoAtiva) {
        case 'dashboard': renderDashboard(container); break;
        case 'produtos':  renderProdutos(container); break;
        case 'opcionais': renderGestaoOpcionais(container); break;
        case 'logistica': renderLogistica(container); break;
        case 'cupons':    renderCupons(container); break;
    }
}

// ===========================================
// 3. RENDERIZAÇÃO
// ===========================================
function renderDashboard(container) {
    if (!container) return;

    const temp = document.getElementById('tmpl-dashboard').content.cloneNode(true);

    const inputData = temp.getElementById('dash-data');
    inputData.value = db.fornada.dataISO;
    inputData.onchange = () => CRUD.atualizarFornada();

    const inputDias = temp.getElementById('dash-dias');
    inputDias.value = db.fornada.diasAntecedencia;
    inputDias.onchange = () => CRUD.atualizarFornada();

    const inputHora = temp.getElementById('dash-hora');
    inputHora.value = db.fornada.horaLimite;
    inputHora.onchange = () => CRUD.atualizarFornada();

    const totalProdutos = db.secoes.reduce((acc, s) => acc + s.itens.length, 0);
    const totalBairros  = db.entrega.bairros.length;
    const taxaGeral     = parseFloat(db.entrega.taxaGeral).toFixed(2);

    const statsGrid = temp.getElementById('dashboard-stats');

    // Cada card é um <a> real — acessível, clicável, sem JS inline
    statsGrid.innerHTML = `
        <div class="stat-card" role="button" tabindex="0" data-dest="produtos">
            <div class="stat-value">${totalProdutos}</div>
            <div class="stat-label">Produtos <i class="fas fa-chevron-right"></i></div>
        </div>
        <div class="stat-card" role="button" tabindex="0" data-dest="cupons">
            <div class="stat-value">${db.cupons.length}</div>
            <div class="stat-label">Cupons <i class="fas fa-chevron-right"></i></div>
        </div>
        <div class="stat-card" role="button" tabindex="0" data-dest="logistica"
             style="border-left-color: var(--marrom-detalhe);">
            <div class="stat-value">${totalBairros}</div>
            <div class="stat-label">Bairros Atendidos <i class="fas fa-chevron-right"></i></div>
        </div>
        <div class="stat-card" role="button" tabindex="0" data-dest="logistica">
            <div class="stat-value">R$ ${taxaGeral}</div>
            <div class="stat-label">Taxa Geral <i class="fas fa-chevron-right"></i></div>
        </div>
    `;

    // Eventos delegados — um único listener para todos os cards
    statsGrid.querySelectorAll('.stat-card[data-dest]').forEach(card => {
        const dest = card.dataset.dest;
        card.onclick  = () => navegarPara(dest);
        card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') navegarPara(dest); };
    });

    container.innerHTML = '';
    container.appendChild(temp);
}

function renderProdutos(container) {
    container.innerHTML = `
        <header>
            <h1><i class="fas fa-utensils"></i> Gerenciar Cardápio</h1>
            <button class="btn-action btn-add" onclick="CRUD.novaSessao()"><i class="fas fa-plus"></i> Nova Categoria</button>
        </header>
    `;

    db.secoes.forEach((sessao, sIdx) => {
        const temp = document.getElementById('tmpl-secao-produto').content.cloneNode(true);

        temp.querySelector('.nome-da-sessao').textContent = sessao.nome;

        const btnArea = temp.querySelector('.botoes-sessao');
        btnArea.innerHTML = `
            <button class="btn-icon" onclick="CRUD.editarSessao(${sIdx})"><i class="fas fa-cog"></i></button>
            <button class="btn-icon" onclick="CRUD.novoProduto(${sIdx})"><i class="fas fa-plus-circle"></i></button>
            <button class="btn-icon" onclick="CRUD.removerSessao(${sIdx})"><i class="fas fa-trash"></i></button>
        `;

        const tbody = temp.querySelector('.corpo-produtos');
        if (sessao.itens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Categoria vazia.</td></tr>`;
        } else {
            sessao.itens.forEach((item, iIdx) => {
                const tr = criarLinhaProduto(sIdx, iIdx, item);
                tbody.appendChild(tr);
            });
        }

        container.appendChild(temp);
    });
}

function criarLinhaProduto(sIdx, iIdx, item) {
    const tr = document.createElement('tr');
    tr.draggable = true;
    
    tr.ondragstart = (e) => dragProduto(e, sIdx, iIdx);
    tr.ondragover  = (e) => allowDrop(e);
    tr.ondrop      = (e) => dropProduto(e, sIdx, iIdx);

    const tagsHtml = (item.opcionais_ativos || [])
        .map(opt => `<span class="tag-mini">${opt}</span>`).join('');

    const visivelIcon  = item.visivel  ? 'fa-eye'   : 'fa-eye-slash';
    const visivelClass = item.visivel  ? 'ativo'    : '';
    const esgotadoIcon = item.esgotado ? 'fa-ban'   : 'fa-check';
    const esgotadoClass= item.esgotado ? 'esgotado' : 'ativo';

    tr.innerHTML = `
        <td class="col-drag"><i class="fas fa-bars drag-handle" style="color:#ddd"></i></td>
        <td class="col-prod">
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="../${item.imagem}" alt="${item.nome}"
                     style="width:46px; height:46px; object-fit:cover; border-radius:6px; border:1px solid #eee; flex-shrink:0;"
                     onerror="this.style.background='#ffebee'; this.style.border='1px solid #ffcdd2';">
                <div>
                    <div style="font-weight:bold; font-size:0.95rem;">${item.nome}</div>
                    <div style="font-size:0.78rem; color:#666;">${item.descricao.substring(0, 40)}...</div>
                    <div class="mini-tags-container">${tagsHtml}</div>
                </div>
            </div>
        </td>
        <td class="col-preco">R$ ${parseFloat(item.preco).toFixed(2)}</td>
        <td class="col-status">
            <button class="btn-toggle btn-quick-vis ${visivelClass}" title="Mostrar/Ocultar">
                <i class="fas ${visivelIcon}"></i>
            </button>
            <button class="btn-toggle btn-quick-esg ${esgotadoClass}" title="Disponibilidade">
                <i class="fas ${esgotadoIcon}"></i>
            </button>
        </td>
        <td class="col-acoes">
            <button class="btn-icon btn-edit"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-copy"><i class="fas fa-copy"></i></button>
            <button class="btn-icon btn-delete" style="color:var(--red);"><i class="fas fa-trash"></i></button>
        </td>
    `;

    tr.querySelector('.btn-quick-vis').onclick = () => CRUD.toggleVisibilidade(sIdx, iIdx);
    tr.querySelector('.btn-quick-esg').onclick = () => CRUD.toggleEsgotado(sIdx, iIdx);
    tr.querySelector('.btn-edit').onclick       = () => CRUD.editarProduto(sIdx, iIdx);
    tr.querySelector('.btn-copy').onclick       = () => CRUD.duplicarProduto(sIdx, iIdx);
    tr.querySelector('.btn-delete').onclick     = () => CRUD.removerProduto(sIdx, iIdx);

    return tr;
}

function renderGestaoOpcionais(container) {
    const temp = document.getElementById('tmpl-gestao-opcionais').content.cloneNode(true);
    const listaContainer = temp.getElementById('container-lista-mestra-ops');

    db.secoes.forEach((secao, sIdx) => {
        const ops = db.opcionais[secao.nome] || [];
        const card = document.createElement('div');
        card.className = 'secao-container';
        card.style.marginBottom = '25px';

        let htmlHeader = `
            <div class="secao-header" style="background: var(--marrom-detalhe); color: white; display: flex; justify-content: space-between; align-items: center;">
                <div class="secao-titulo" style="color:white">
                    <i class="fas fa-folder-open"></i> ${secao.nome.toUpperCase()}
                </div>
                <button class="btn-action" style="background:rgba(255,255,255,0.2); color:white; border:1px solid white; font-size:0.75rem; width: auto; padding: 5px 15px; margin: 0;" 
                    onclick="CRUD.addNovoSubgrupo('${secao.nome}')">
                    <i class="fas fa-plus"></i> Novo Subgrupo
                </button>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; background: #fff;">
        `;

        let htmlCorpo = '';
        if (!Array.isArray(ops) && typeof ops === 'object') {
            for (const grupo in ops) {
                htmlCorpo += `
                    <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #fafafa; position: relative;">
                        <div style="font-weight:bold; border-bottom: 2px solid var(--verde-militar); margin-bottom: 12px; color: var(--verde-militar); display:flex; justify-content:space-between;">
                            ${grupo}
                            <i class="fas fa-trash" style="color:#ccc; cursor:pointer; font-size:0.8rem;" onclick="CRUD.removerSubgrupo('${secao.nome}', '${grupo}')"></i>
                        </div>
                        <div id="grupo-${secao.nome}-${grupo}">
                            ${ops[grupo].map((op, iIdx) => UI.gerarLinhaEdicaoOp(secao.nome, op.nome, op.preco, grupo, iIdx)).join('')}
                        </div>
                        <button class="btn-action" style="width:100%; margin-top:10px; font-size:0.7rem; background:#eee; color:#666;" 
                            onclick="CRUD.addOpInline('${secao.nome}', '${grupo}')">+ Adicionar Item</button>
                    </div>`;
            }
        } else {
            htmlCorpo += `
                <div style="grid-column: 1 / -1; border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #fafafa;">
                    <div style="font-weight:bold; border-bottom: 2px solid var(--verde-militar); margin-bottom: 12px; color: var(--verde-militar);">Opcionais Gerais</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;">
                        ${ops.map((op, iIdx) => UI.gerarLinhaEdicaoOp(secao.nome, op.nome, op.preco, null, iIdx)).join('')}
                    </div>
                    <button class="btn-action" style="margin-top:15px; width: auto;" onclick="CRUD.addOpInline('${secao.nome}')">+ Adicionar Opcional</button>
                </div>`;
        }

        card.innerHTML = htmlHeader + htmlCorpo + `</div>`;
        listaContainer.appendChild(card);
    });

    container.appendChild(temp);
}

function renderLogistica(container) {
    if (!container) return;

    const temp = document.getElementById('tmpl-logistica').content.cloneNode(true);

    const inputTaxa = temp.getElementById('log-taxa-geral');
    inputTaxa.value = db.entrega.taxaGeral;
    inputTaxa.onchange = (e) => {
        db.entrega.taxaGeral = parseFloat(e.target.value) || 0;
        persistir();
    };

    container.innerHTML = '';
    container.appendChild(temp);

    atualizarTabelaBairros();
}

function atualizarTabelaBairros() {
    const corpo = document.getElementById('corpo-tabela-bairros');
    if (!corpo) return;

    let html = '';
    db.entrega.bairros.forEach((b, idx) => {
        html += `
            <tr style="border-bottom: 1px solid #f4f4f4;">
                <td style="padding: 8px;">
                    <input type="text" value="${b.nome}" 
                        onchange="db.entrega.bairros[${idx}].nome = this.value; persistir();" 
                        style="width: 95%; padding: 5px;">
                </td>
                <td style="padding: 8px;">
                    <input type="number" step="0.5" value="${b.taxa || 0}" 
                        onchange="db.entrega.bairros[${idx}].taxa = parseFloat(this.value); persistir();" 
                        style="width: 95%; padding: 5px;">
                </td>
                <td style="padding: 8px;">
                    <button onclick="db.entrega.bairros.splice(${idx}, 1); persistir(); atualizarTabelaBairros();" 
                        style="background:none; border:none; color:#e74c3c; cursor:pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
        <tr style="background: #fdfdfd;">
            <td style="padding: 8px;">
                <input type="text" id="novo-bairro-nome" placeholder="Nome do bairro..." 
                    style="width: 95%; padding: 5px; border: 1px dashed #ccc;">
            </td>
            <td style="padding: 8px;">
                <input type="number" id="novo-bairro-taxa" step="0.5" placeholder="0.00" 
                    onkeydown="if(event.key==='Enter') tentarAdicionarBairro()" 
                    style="width: 95%; padding: 5px; border: 1px dashed #ccc;">
            </td>
            <td style="padding: 8px;">
                <button onclick="tentarAdicionarBairro()" class="btn-icon" style="color:var(--verde-militar)">
                    <i class="fas fa-plus-circle"></i>
                </button>
            </td>
        </tr>
    `;

    corpo.innerHTML = html;
}

function tentarAdicionarBairro() {
    const inputNome = document.getElementById('novo-bairro-nome');
    const inputTaxa = document.getElementById('novo-bairro-taxa');
    
    const nome    = inputNome.value.trim();
    const taxaStr = inputTaxa.value;

    if (nome !== "" && taxaStr !== "") {
        db.entrega.bairros.push({ nome, taxa: parseFloat(taxaStr) || 0 });
        persistir();
        atualizarTabelaBairros();
        setTimeout(() => {
            const proxNome = document.getElementById('novo-bairro-nome');
            if (proxNome) proxNome.focus();
        }, 50);
    }
}

function renderCupons(container) {
    if (!container) return;

    const temp = document.getElementById('tmpl-cupons').content.cloneNode(true);

    temp.getElementById('btn-novo-cupom').onclick = () => CRUD.modalCupom();

    const tbody = temp.getElementById('corpo-tabela-cupons');
    
    if (db.cupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Nenhum cupom cadastrado.</td></tr>`;
    } else {
        db.cupons.forEach((c, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${c.codigo}</strong></td>
                <td>${c.tipo === 'porcentagem' ? 'Porcentagem (%)' : 'Valor Fixo (R$)'}</td>
                <td>${c.tipo === 'porcentagem' ? c.valor + '%' : 'R$ ' + parseFloat(c.valor).toFixed(2)}</td>
                <td>
                    <button class="btn-icon" style="color:var(--red)"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tr.querySelector('.btn-icon').onclick = () => CRUD.removerCupom(idx);
            tbody.appendChild(tr);
        });
    }

    container.innerHTML = '';
    container.appendChild(temp);
}

// ===========================================
// 4. MÓDULOS DE LÓGICA (CRUD)
// ===========================================

const CRUD = {
    atualizarFornada: () => {
        db.fornada.dataISO         = document.getElementById('dash-data').value;
        db.fornada.diasAntecedencia = parseInt(document.getElementById('dash-dias').value);
        db.fornada.horaLimite      = document.getElementById('dash-hora').value;
        persistir();
    },

    novaSessao: () => {
        const nome = prompt("Nome da nova categoria:");
        if (nome) { db.secoes.push({ nome, itens: [] }); db.opcionais[nome] = []; renderizarAtual(); persistir(); }
    },

    editarSessao: (idx) => {
        const nome = prompt("Novo nome da categoria:", db.secoes[idx].nome);
        if (nome && nome !== db.secoes[idx].nome) {
            db.opcionais[nome] = db.opcionais[db.secoes[idx].nome];
            delete db.opcionais[db.secoes[idx].nome];
            db.secoes[idx].nome = nome;
            renderizarAtual(); persistir();
        }
    },

    removerSessao: (idx) => { 
        if (confirm('Apagar categoria?')) { 
            delete db.opcionais[db.secoes[idx].nome]; 
            db.secoes.splice(idx, 1); 
            renderizarAtual(); persistir(); 
        } 
    },

    addNovoSubgrupo: (secaoNome) => {
        const nomeSub = prompt("Nome do novo subgrupo:");
        if (nomeSub) {
            if (Array.isArray(db.opcionais[secaoNome])) db.opcionais[secaoNome] = {};
            db.opcionais[secaoNome][nomeSub] = [];
            persistir(); renderizarAtual();
        }
    },

    removerSubgrupo: (secaoNome, grupo) => {
        if (confirm(`Remover todo o grupo "${grupo}"?`)) {
            delete db.opcionais[secaoNome][grupo];
            persistir(); renderizarAtual();
        }
    },

    addOpInline: (secaoNome, grupo = null) => {
        const novoItem = { nome: "Novo Item", preco: 0 };
        if (grupo && grupo !== "null") {
            db.opcionais[secaoNome][grupo].push(novoItem);
        } else {
            if (!Array.isArray(db.opcionais[secaoNome])) db.opcionais[secaoNome] = [];
            db.opcionais[secaoNome].push(novoItem);
        }
        persistir(); renderizarAtual();
    },

    atualizarDadoOp: (secaoNome, grupo, idx, campo, valor) => {
        if (campo === 'preco') valor = parseFloat(valor) || 0;
        if (grupo && grupo !== "null") {
            db.opcionais[secaoNome][grupo][idx][campo] = valor;
        } else {
            db.opcionais[secaoNome][idx][campo] = valor;
        }
        persistir();
    },

    removerOpInline: (secaoNome, grupo, idx) => {
        if (grupo && grupo !== "null") {
            db.opcionais[secaoNome][grupo].splice(idx, 1);
        } else {
            db.opcionais[secaoNome].splice(idx, 1);
        }
        persistir(); renderizarAtual();
    },

    novoProduto: (sIdx) => {
        db.secoes[sIdx].itens.push({ nome: "Novo Produto", descricao: "", preco: 0, imagem: "img/padrao.jpg", visivel: true, esgotado: false, opcionais_ativos: [] });
        renderizarAtual();
        CRUD.editarProduto(sIdx, db.secoes[sIdx].itens.length - 1);
    },

    toggleVisibilidade: (sIdx, pIdx) => { db.secoes[sIdx].itens[pIdx].visivel  = !db.secoes[sIdx].itens[pIdx].visivel;  renderizarAtual(); persistir(); },
    toggleEsgotado:     (sIdx, pIdx) => { db.secoes[sIdx].itens[pIdx].esgotado = !db.secoes[sIdx].itens[pIdx].esgotado; renderizarAtual(); persistir(); },

    editarProduto: (sIdx, pIdx) => {
        const item     = db.secoes[sIdx].itens[pIdx];
        const todosOps = db.opcionais[db.secoes[sIdx].nome] || [];
        const temp     = document.getElementById('tmpl-modal-produto').content.cloneNode(true);

        temp.getElementById('prod-nome').value  = item.nome;
        temp.getElementById('prod-desc').value  = item.descricao;
        temp.getElementById('prod-preco').value = item.preco;
        temp.getElementById('prod-img').value   = item.imagem;

        const setupBtn = (id, ativo, iconA, iconB, txtA, txtB) => {
            const btn = temp.getElementById(id);
            if (ativo) btn.classList.add('ativo');
            btn.innerHTML = `<i class="fas ${ativo ? iconA : iconB}"></i> <span>${ativo ? txtA : txtB}</span>`;
            btn.onclick = function() {
                this.classList.toggle('ativo');
                const isA = this.classList.contains('ativo');
                this.querySelector('i').className    = `fas ${isA ? iconA : iconB}`;
                this.querySelector('span').textContent = isA ? txtA : txtB;
            };
        };

        setupBtn('btn-modal-vis', item.visivel,  'fa-eye', 'fa-eye-slash', 'Visível', 'Oculto');
        setupBtn('btn-modal-esg', item.esgotado, 'fa-ban', 'fa-check',     'Esgotado', 'Disponível');

        const containerOps = temp.getElementById('opcionais-container');
        const listaOps = !Array.isArray(todosOps) ? Object.values(todosOps).flat() : todosOps;
        
        listaOps.forEach(op => {
            const isSel = (item.opcionais_ativos || []).includes(op.nome);
            const b = document.createElement('div');
            b.className   = `badge-select ${isSel ? 'selected' : ''}`;
            b.innerHTML   = `${op.nome} (+R$${op.preco})`;
            b.onclick     = () => b.classList.toggle('selected');
            b.dataset.val = op.nome;
            containerOps.appendChild(b);
        });

        temp.getElementById('btn-salvar-produto').onclick = () => CRUD.salvarProduto(sIdx, pIdx);
        
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = '<div class="modal"></div>';
        modalContainer.querySelector('.modal').appendChild(temp);
        modalContainer.style.display = 'flex';

        const btnGoogle = modalContainer.querySelector('.btn-google-search');
        btnGoogle.onclick = () => {
            const nomeProduto = document.getElementById('prod-nome').value.trim() || 'pão artesanal';
            const query = encodeURIComponent(nomeProduto + ' webp');
            const url   = `https://www.google.com/search?tbm=isch&q=${query}&tbs=itp:photo,isz:m`;
            window.open(url, '_blank');
        };

        const campoCaminho = document.getElementById('prod-img');
        campoCaminho.removeAttribute('readonly');
        campoCaminho.style.background = '';
        campoCaminho.style.cursor     = '';

        const fileInput = document.getElementById('file-input');
        const btnAbrir  = modalContainer.querySelector('.btn-open-file');
        btnAbrir.onclick  = () => fileInput.click();
        fileInput.onchange = () => {
            if (fileInput.files.length > 0) {
                campoCaminho.value = 'img/' + fileInput.files[0].name;
            }
        };
    },

    salvarProduto: (sIdx, pIdx) => {
        const item     = db.secoes[sIdx].itens[pIdx];
        item.nome      = document.getElementById('prod-nome').value;
        item.descricao = document.getElementById('prod-desc').value;
        item.preco     = parseFloat(document.getElementById('prod-preco').value);
        item.imagem    = document.getElementById('prod-img').value;
        item.visivel   = document.getElementById('btn-modal-vis').classList.contains('ativo');
        item.esgotado  = document.getElementById('btn-modal-esg').classList.contains('ativo');
        item.opcionais_ativos = Array.from(document.querySelectorAll('.badge-select.selected')).map(el => el.dataset.val);
        fecharModal(); renderizarAtual(); persistir();
    },

    duplicarProduto: (sIdx, pIdx) => {
        const novo = JSON.parse(JSON.stringify(db.secoes[sIdx].itens[pIdx]));
        novo.nome += " (Cópia)";
        db.secoes[sIdx].itens.push(novo);
        renderizarAtual(); persistir();
    },

    removerProduto: (sIdx, pIdx) => { if (confirm('Excluir?')) { db.secoes[sIdx].itens.splice(pIdx, 1); renderizarAtual(); persistir(); } },

    removerBairro: (idx) => { if (confirm('Excluir?')) { db.entrega.bairros.splice(idx, 1); persistir(); atualizarTabelaBairros(); } },
    
    modalCupom: () => {
        const html = `<h2>Cupom</h2><input id="c-cod" placeholder="Código" style="text-transform:uppercase; width:100%; margin-bottom:10px; padding:9px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;"><input id="c-val" type="number" placeholder="Valor" style="width:100%; padding:9px; border:1px solid #ddd; border-radius:5px; box-sizing:border-box;"><div class="modal-footer"><button class="btn-confirm" onclick="CRUD.salvarCupom()">Salvar</button></div>`;
        abrirModalContent(html);
    },

    salvarCupom: () => {
        db.cupons.push({ codigo: document.getElementById('c-cod').value.toUpperCase(), tipo: 'porcentagem', valor: parseFloat(document.getElementById('c-val').value) });
        fecharModal(); renderizarAtual(); persistir();
    },

    removerCupom: (idx) => { db.cupons.splice(idx, 1); renderizarAtual(); persistir(); }
};

// ===========================================
// 5. INTERFACE AUXILIAR (UI)
// ===========================================

const UI = {
    gerarLinhaEdicaoOp: (secao, nome, preco, grupo, idx) => {
        const grupoStr = grupo ? `'${grupo}'` : 'null';
        return `
            <div class="linha-op-ajustada" style="display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dotted #ddd;">
                <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                    <input type="text" value="${nome}" 
                        onchange="CRUD.atualizarDadoOp('${secao}', ${grupoStr}, ${idx}, 'nome', this.value)" 
                        style="border: none; background: transparent; font-size: 0.9rem; color: #444; width: 100%; outline: none;"
                        onfocus="this.style.borderBottom='1px solid var(--verde-claro)'" onblur="this.style.borderBottom='none'">
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="display:flex; align-items:center; color: var(--verde-militar); font-weight: bold; font-size: 0.85rem;">
                        <span style="font-size: 0.7rem; margin-right: 2px;">R$</span>
                        <input type="number" step="0.5" value="${preco}" 
                            onchange="CRUD.atualizarDadoOp('${secao}', ${grupoStr}, ${idx}, 'preco', this.value)" 
                            style="width: 45px; border: none; background: transparent; font-weight: bold; color: inherit; text-align: right; outline: none;">
                    </div>
                    <i class="fas fa-times" style="color: #ddd; cursor: pointer; font-size: 0.8rem;" 
                        onclick="CRUD.removerOpInline('${secao}', ${grupoStr}, ${idx})"
                        onmouseover="this.style.color='#ff7675'" onmouseout="this.style.color='#ddd'"></i>
                </div>
            </div>`;
    }
};

// ===========================================
// 6. DRAG AND DROP & UTILS
// ===========================================
function allowDrop(ev) { ev.preventDefault(); }
function dragSessao(e, idx) { dragIdx = idx; e.dataTransfer.effectAllowed = 'move'; }
function dropSessao(e, tIdx) { e.preventDefault(); if(dragIdx===null || dragIdx===tIdx) return; const i = db.secoes.splice(dragIdx, 1)[0]; db.secoes.splice(tIdx, 0, i); dragIdx=null; renderizarAtual(); persistir(); }

function dragProduto(e, s, i) { e.stopPropagation(); dragProdutoIdx=i; dragOrigemSecaoIdx=s; e.dataTransfer.effectAllowed='move'; }
function dropProduto(e, ts, ti) { e.preventDefault(); e.stopPropagation(); if(dragOrigemSecaoIdx!==ts || dragProdutoIdx===null || dragProdutoIdx===ti) return; const l = db.secoes[ts].itens; l.splice(ti, 0, l.splice(dragProdutoIdx, 1)[0]); dragProdutoIdx=null; renderizarAtual(); persistir(); }

function abrirModalContent(html) { const c = document.getElementById('modal-container'); c.innerHTML = `<div class="modal">${html}</div>`; c.style.display = 'flex'; }
function fecharModal() { document.getElementById('modal-container').style.display = 'none'; }
document.getElementById('modal-container').addEventListener('click', (e) => { if(e.target.id === 'modal-container') fecharModal(); });

function persistir() { localStorage.setItem('pao_do_ciso_db', JSON.stringify(db)); const btn = document.querySelector('.btn-save'); const org = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Salvo!'; setTimeout(() => btn.innerHTML = org, 1500); }

function gerarConteudoDadosJS() {
    let conteudo = "// ============================================\n";
    conteudo += "// DADOS DO SISTEMA - PÃO DO CISO\n";
    conteudo += "// ============================================\n\n";
    conteudo += "window.dadosIniciais = {\n";
    conteudo += `    loja: ${JSON.stringify(db.loja, null, 2)},\n\n`;
    conteudo += `    fornada: ${JSON.stringify(db.fornada, null, 2)},\n\n`;
    conteudo += `    entrega: {\n`;
    conteudo += `        "taxaGeral": ${db.entrega.taxaGeral},\n`;
    conteudo += `        "bairros": [\n`;
    db.entrega.bairros.forEach((bairro, index) => {
        conteudo += `            ${JSON.stringify(bairro)}`;
        if (index < db.entrega.bairros.length - 1) conteudo += ',';
        conteudo += '\n';
    });
    conteudo += `        ]\n    },\n\n`;
    conteudo += `    cupons: [\n`;
    db.cupons.forEach((cupom, index) => {
        conteudo += `        ${JSON.stringify(cupom)}`;
        if (index < db.cupons.length - 1) conteudo += ',';
        conteudo += '\n';
    });
    conteudo += `    ],\n\n`;
    conteudo += `    opcionais: {\n`;
    const categorias = Object.keys(db.opcionais);
    categorias.forEach((categoria, idxCat) => {
        const valor = db.opcionais[categoria];
        if (Array.isArray(valor)) {
            conteudo += `        "${categoria}": [\n`;
            valor.forEach((item, idxItem) => {
                conteudo += `            ${JSON.stringify(item)}`;
                if (idxItem < valor.length - 1) conteudo += ',';
                conteudo += '\n';
            });
            conteudo += `        ]`;
        } else {
            conteudo += `        "${categoria}": {\n`;
            const subgrupos = Object.keys(valor);
            subgrupos.forEach((subgrupo, idxSub) => {
                conteudo += `            "${subgrupo}": [\n`;
                valor[subgrupo].forEach((item, idxItem) => {
                    conteudo += `                ${JSON.stringify(item)}`;
                    if (idxItem < valor[subgrupo].length - 1) conteudo += ',';
                    conteudo += '\n';
                });
                conteudo += `            ]`;
                if (idxSub < subgrupos.length - 1) conteudo += ',';
                conteudo += '\n';
            });
            conteudo += `        }`;
        }
        if (idxCat < categorias.length - 1) conteudo += ',';
        conteudo += '\n';
    });
    conteudo += `    },\n\n`;
    conteudo += `    secoes: ${JSON.stringify(db.secoes, null, 2)}\n`;
    conteudo += "};";
    return conteudo;
}

function baixarDados() {
    const conteudo = gerarConteudoDadosJS();
    const blob = new Blob([conteudo], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'dados.js';
    a.click();
    URL.revokeObjectURL(url);
}
