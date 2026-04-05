// ============================================
// PAINEL ADMINISTRATIVO v5 — PÃO DO CISO
// ============================================
// script.js — ES Module
// Carregado como: <script type="module" src="script.js">
// ============================================

import { initializeApp }                     from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore-lite.js";

// ── Firebase ─────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyBbPOYFCi6IaVMk889zsxEwr8NjKuVTUPk",
    authDomain:        "nanopadariapaodociso.firebaseapp.com",
    projectId:         "nanopadariapaodociso",
    storageBucket:     "nanopadariapaodociso.firebasestorage.app",
    messagingSenderId: "23220999316",
    appId:             "1:23220999316:web:72ceb7cc8f00798524d081"
};

const app = initializeApp(firebaseConfig);
const _db  = getFirestore(app);

// ── ESTADO ───────────────────────────────────────────────────────
const CORES_PADRAO = {
    "bg-creme":       "#fdf5e6",
    "verde-militar":  "#2d3a27",
    "marrom-cafe":    "#2e2610",
    "marrom-detalhe": "#7d4f39",
    "texto":          "#3e2723",
    "red":            "#b22222"
};

const estadoInicial = {
    loja: {
        nome:      "Pão do Ciso",
        instagram: "paodociso",
        whatsapp:  "5511976799866",
        pix:       "paodociso@gmail.com",
        cores:     { ...CORES_PADRAO }
    },
    fornada:   { dataISO: new Date().toISOString().split('T')[0], diasAntecedencia: 2, horaLimite: "23:59h" },
    entrega:   { taxaGeral: 10.00, bairros: [] },
    cupons:    [],
    secoes:    [{ nome: "Pães Artesanais", itens: [] }],
    opcionais: { "Pães Artesanais": [] }
};

let db = JSON.parse(localStorage.getItem('pao_do_ciso_db_v5')) || estadoInicial;
// Garante que campos novos existam em dados antigos
if (!db.loja.instagram) db.loja.instagram = estadoInicial.loja.instagram;
if (!db.loja.pix)       db.loja.pix       = estadoInicial.loja.pix;
if (!db.loja.cores)     db.loja.cores     = { ...CORES_PADRAO };

let secaoAtiva = 'dashboard';
let dragIdx = null, dragProdutoIdx = null, dragOrigemSecaoIdx = null;

// ── TOAST ────────────────────────────────────────────────────────
function toast(msg, tipo = 'info') {
    const area = document.getElementById('toast-area');
    const el   = document.createElement('div');
    el.className = `toast ${tipo}`;

    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    el.innerHTML = `<i class="fas ${icons[tipo] || icons.info}"></i> ${msg}`;
    area.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

// ── FIREBASE ─────────────────────────────────────────────────────
async function carregarDadosFirestore() {
    atualizarBadgeFirebase('Carregando...', '');
    try {
        const snap = await getDoc(doc(_db, "paodociso", "dados"));
        if (snap.exists()) {
            const raw = snap.data();
            const campos = ['loja', 'fornada', 'entrega', 'cupons', 'opcionais', 'secoes'];
            campos.forEach(c => {
                try { if (raw[c]) db[c] = JSON.parse(raw[c]); } catch(_) {}
            });
            // Garante campos novos
            if (!db.loja.cores)     db.loja.cores     = { ...CORES_PADRAO };
            if (!db.loja.instagram) db.loja.instagram  = '';
            if (!db.loja.pix)       db.loja.pix        = '';
            persistir();
            renderizarAtual();
            atualizarBadgeFirebase('Online', 'online');
            toast('Dados carregados do Firebase!', 'success');
        } else {
            atualizarBadgeFirebase('Sem dados', 'offline');
            toast('Nenhum dado no Firebase. Use os dados locais.', 'warning');
        }
    } catch (e) {
        atualizarBadgeFirebase('Offline', 'offline');
        toast('Erro ao conectar ao Firebase: ' + e.message, 'error');
    }
}

async function salvarFirestore() {
    atualizarBadgeFirebase('Salvando...', '');
    try {
        await setDoc(doc(_db, "paodociso", "dados"), {
            loja:      JSON.stringify(db.loja),
            fornada:   JSON.stringify(db.fornada),
            entrega:   JSON.stringify(db.entrega),
            cupons:    JSON.stringify(db.cupons),
            opcionais: JSON.stringify(db.opcionais),
            secoes:    JSON.stringify(db.secoes),
        });
        atualizarBadgeFirebase('Online', 'online');
        toast('Dados salvos no Firebase com sucesso!', 'success');
    } catch (e) {
        atualizarBadgeFirebase('Erro', 'offline');
        toast('Erro ao salvar no Firebase: ' + e.message, 'error');
    }
}

function atualizarBadgeFirebase(texto, classe) {
    const badge = document.getElementById('firebase-status');
    if (!badge) return;
    badge.className = 'firebase-badge' + (classe ? ' ' + classe : '');
    badge.innerHTML = `<i class="fas fa-circle"></i> <span>${texto}</span>`;
}

// ── PERSISTÊNCIA LOCAL ────────────────────────────────────────────
function persistir() {
    localStorage.setItem('pao_do_ciso_db_v5', JSON.stringify(db));
    const btn = document.querySelector('.btn-local');
    if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i><span>Salvo!</span>';
        setTimeout(() => btn.innerHTML = orig, 1500);
    }
}

// ── NAVEGAÇÃO ────────────────────────────────────────────────────
function navegarPara(secao) {
    secaoAtiva = secao;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById('nav-' + secao);
    if (navEl) navEl.classList.add('active');
    renderizarAtual();
}

function renderizarAtual() {
    const container = document.getElementById('conteudo-principal');
    container.innerHTML = '';
    switch (secaoAtiva) {
        case 'dashboard': renderDashboard(container); break;
        case 'loja':      renderLoja(container);      break;
        case 'produtos':  renderProdutos(container);  break;
        case 'opcionais': renderOpcionais(container); break;
        case 'logistica': renderLogistica(container); break;
        case 'cupons':    renderCupons(container);    break;
    }
}

// ── DASHBOARD ────────────────────────────────────────────────────
function renderDashboard(container) {
    const temp = document.getElementById('tmpl-dashboard').content.cloneNode(true);

    const inputData = temp.getElementById('dash-data');
    inputData.value    = db.fornada.dataISO;
    inputData.onchange = () => { db.fornada.dataISO = inputData.value; persistir(); };

    const inputDias = temp.getElementById('dash-dias');
    inputDias.value    = db.fornada.diasAntecedencia;
    inputDias.onchange = () => { db.fornada.diasAntecedencia = parseInt(inputDias.value) || 0; persistir(); };

    const inputHora = temp.getElementById('dash-hora');
    inputHora.value    = db.fornada.horaLimite;
    inputHora.onchange = () => { db.fornada.horaLimite = inputHora.value; persistir(); };

    const totalProdutos = db.secoes.reduce((a, s) => a + s.itens.length, 0);
    const stats = temp.getElementById('dashboard-stats');
    stats.innerHTML = `
        <div class="stat-card" onclick="navegarPara('produtos')" tabindex="0">
            <div class="stat-value">${totalProdutos}</div>
            <div class="stat-label">Produtos</div>
        </div>
        <div class="stat-card" onclick="navegarPara('produtos')" tabindex="0">
            <div class="stat-value">${db.secoes.length}</div>
            <div class="stat-label">Categorias</div>
        </div>
        <div class="stat-card" onclick="navegarPara('cupons')" tabindex="0" style="border-left-color:var(--marrom-detalhe)">
            <div class="stat-value">${db.cupons.length}</div>
            <div class="stat-label">Cupons</div>
        </div>
        <div class="stat-card" onclick="navegarPara('logistica')" tabindex="0">
            <div class="stat-value">${db.entrega.bairros.length}</div>
            <div class="stat-label">Bairros</div>
        </div>
        <div class="stat-card" onclick="navegarPara('logistica')" tabindex="0">
            <div class="stat-value">R$&nbsp;${parseFloat(db.entrega.taxaGeral).toFixed(2)}</div>
            <div class="stat-label">Taxa Geral</div>
        </div>
    `;

    container.appendChild(temp);
}

// ── LOJA ─────────────────────────────────────────────────────────
function renderLoja(container) {
    const temp = document.getElementById('tmpl-loja').content.cloneNode(true);

    // Identidade
    temp.getElementById('loja-nome').value      = db.loja.nome      || '';
    temp.getElementById('loja-instagram').value = db.loja.instagram || '';
    temp.getElementById('loja-whatsapp').value  = db.loja.whatsapp  || '';
    temp.getElementById('loja-pix').value       = db.loja.pix       || '';

    const campos = ['nome', 'instagram', 'whatsapp', 'pix'];
    campos.forEach(c => {
        const el = temp.getElementById('loja-' + c);
        el.onchange = () => { db.loja[c] = el.value; persistir(); };
    });

    // Cores
    const coresMap = {
        'cor-bg-creme':       'bg-creme',
        'cor-verde-militar':  'verde-militar',
        'cor-marrom-cafe':    'marrom-cafe',
        'cor-marrom-detalhe': 'marrom-detalhe',
        'cor-texto':          'texto',
        'cor-red':            'red'
    };

    Object.entries(coresMap).forEach(([inputId, chave]) => {
        const picker = temp.getElementById(inputId);
        const hexEl  = temp.getElementById(inputId + '-hex');
        const valor  = db.loja.cores[chave] || CORES_PADRAO[chave];

        if (picker) picker.value = valor;
        if (hexEl)  hexEl.value  = valor;

        if (picker) picker.oninput = () => {
            if (hexEl) hexEl.value = picker.value;
            db.loja.cores[chave] = picker.value;
            persistir();
        };

        if (hexEl) hexEl.onchange = () => {
            const v = hexEl.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                if (picker) picker.value = v;
                db.loja.cores[chave] = v;
                persistir();
            }
        };
    });

    container.appendChild(temp);
}

// ── PRODUTOS ─────────────────────────────────────────────────────
function renderProdutos(container) {
    container.innerHTML = `
        <header>
            <div>
                <h1><i class="fas fa-utensils"></i> Produtos</h1>
                <p class="header-sub">Gerencie categorias e itens do cardápio</p>
            </div>
            <button class="btn-add" onclick="CRUD.novaSessao()">
                <i class="fas fa-plus"></i> Nova Categoria
            </button>
        </header>
    `;

    db.secoes.forEach((sessao, sIdx) => {
        const temp = document.getElementById('tmpl-secao-produto').content.cloneNode(true);
        const secaoEl = temp.querySelector('.secao-card');

        temp.querySelector('.nome-da-sessao').textContent = sessao.nome;

        const btnArea = temp.querySelector('.botoes-sessao');
        btnArea.innerHTML = `
            <button class="btn-icon" title="Renomear"><i class="fas fa-pen"></i></button>
            <button class="btn-icon" title="Novo produto"><i class="fas fa-plus-circle"></i></button>
            <button class="btn-icon danger" title="Apagar categoria"><i class="fas fa-trash"></i></button>
        `;
        btnArea.querySelectorAll('.btn-icon')[0].onclick = () => CRUD.editarSessao(sIdx);
        btnArea.querySelectorAll('.btn-icon')[1].onclick = () => CRUD.novoProduto(sIdx);
        btnArea.querySelectorAll('.btn-icon')[2].onclick = () => CRUD.removerSessao(sIdx);

        // Drag seção
        secaoEl.ondragstart = (e) => { dragIdx = sIdx; e.dataTransfer.effectAllowed = 'move'; };
        secaoEl.ondragover  = (e) => e.preventDefault();
        secaoEl.ondrop      = (e) => {
            e.preventDefault();
            if (dragIdx === null || dragIdx === sIdx) return;
            const item = db.secoes.splice(dragIdx, 1)[0];
            db.secoes.splice(sIdx, 0, item);
            dragIdx = null;
            renderizarAtual(); persistir();
        };

        const tbody = temp.querySelector('.corpo-produtos');
        if (sessao.itens.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#bbb;padding:24px;">Categoria vazia — clique em <strong>+</strong> para adicionar um produto.</td></tr>`;
        } else {
            sessao.itens.forEach((item, iIdx) => {
                tbody.appendChild(criarLinhaProduto(sIdx, iIdx, item));
            });
        }

        container.appendChild(temp);
    });
}

function criarLinhaProduto(sIdx, iIdx, item) {
    const tr = document.createElement('tr');
    tr.draggable = true;
    tr.ondragstart = (e) => { e.stopPropagation(); dragProdutoIdx = iIdx; dragOrigemSecaoIdx = sIdx; };
    tr.ondragover  = (e) => e.preventDefault();
    tr.ondrop      = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (dragOrigemSecaoIdx !== sIdx || dragProdutoIdx === null || dragProdutoIdx === iIdx) return;
        const lista = db.secoes[sIdx].itens;
        lista.splice(iIdx, 0, lista.splice(dragProdutoIdx, 1)[0]);
        dragProdutoIdx = null;
        renderizarAtual(); persistir();
    };

    const tagsHtml = (item.opcionais_ativos || []).slice(0, 3)
        .map(o => `<span class="tag-mini">${o}</span>`).join('');
    const mais = (item.opcionais_ativos || []).length > 3
        ? `<span class="tag-mini">+${(item.opcionais_ativos || []).length - 3}</span>` : '';

    const visivelClass  = item.visivel  ? 'ativo'    : '';
    const visivelIcon   = item.visivel  ? 'fa-eye'   : 'fa-eye-slash';
    const esgotadoClass = item.esgotado ? 'esgotado' : 'ativo';
    const esgotadoIcon  = item.esgotado ? 'fa-ban'   : 'fa-check';

    const descTruncada = (item.descricao || '').substring(0, 50) + (item.descricao?.length > 50 ? '…' : '');

    tr.innerHTML = `
        <td class="col-drag"><i class="fas fa-bars drag-handle"></i></td>
        <td class="col-prod">
            <div class="produto-info">
                <img class="produto-thumb"
                     src="../${item.imagem}" alt="${item.nome}"
                     onerror="this.style.background='#f0ece4'; this.src='';">
                <div>
                    <div class="produto-nome">${item.nome}</div>
                    <div class="produto-desc">${descTruncada}</div>
                    <div class="mini-tags">${tagsHtml}${mais}</div>
                </div>
            </div>
        </td>
        <td class="col-preco preco-cell">R$ ${parseFloat(item.preco || 0).toFixed(2)}</td>
        <td class="col-status">
            <button class="btn-toggle ${visivelClass} btn-vis" title="Visibilidade">
                <i class="fas ${visivelIcon}"></i>
            </button>
            <button class="btn-toggle ${esgotadoClass} btn-esg" title="Disponibilidade">
                <i class="fas ${esgotadoIcon}"></i>
            </button>
        </td>
        <td class="col-acoes">
            <button class="btn-icon btn-edit" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn-icon btn-copy" title="Duplicar"><i class="fas fa-copy"></i></button>
            <button class="btn-icon danger btn-del" title="Excluir"><i class="fas fa-trash"></i></button>
        </td>
    `;

    tr.querySelector('.btn-vis').onclick  = () => CRUD.toggleVisibilidade(sIdx, iIdx);
    tr.querySelector('.btn-esg').onclick  = () => CRUD.toggleEsgotado(sIdx, iIdx);
    tr.querySelector('.btn-edit').onclick = () => CRUD.editarProduto(sIdx, iIdx);
    tr.querySelector('.btn-copy').onclick = () => CRUD.duplicarProduto(sIdx, iIdx);
    tr.querySelector('.btn-del').onclick  = () => CRUD.removerProduto(sIdx, iIdx);

    return tr;
}

// ── OPCIONAIS ─────────────────────────────────────────────────────
function renderOpcionais(container) {
    const temp = document.getElementById('tmpl-gestao-opcionais').content.cloneNode(true);
    const lista = temp.getElementById('container-lista-mestra-ops');

    // Opcionais globais (chaves que não correspondem a nenhuma seção)
    const nomesSecoes = db.secoes.map(s => s.nome);
    const todasChaves = Object.keys(db.opcionais);

    // Renderizar por ordem: seções primeiro, depois globais
    const chaves = [
        ...nomesSecoes.filter(n => db.opcionais[n] !== undefined),
        ...todasChaves.filter(n => !nomesSecoes.includes(n))
    ];

    chaves.forEach(nomeChave => {
        const ops = db.opcionais[nomeChave];
        lista.appendChild(criarCardOpcional(nomeChave, ops));
    });

    container.appendChild(temp);
}

function criarCardOpcional(nomeChave, ops) {
    const secaoEl = document.createElement('div');
    secaoEl.className = 'opcional-secao';

    const header = document.createElement('div');
    header.className = 'opcional-secao-header';
    header.innerHTML = `
        <div class="opcional-secao-titulo">
            <i class="fas fa-folder-open"></i>
            ${nomeChave.toUpperCase()}
        </div>
        <button class="btn-sub-add" onclick="CRUD.addNovoSubgrupo('${nomeChave}')">
            <i class="fas fa-plus"></i> Novo Subgrupo
        </button>
    `;
    secaoEl.appendChild(header);

    const corpo = document.createElement('div');

    if (Array.isArray(ops)) {
        // Lista simples
        corpo.style.cssText = 'padding:16px;';
        const card = criarGrupoOpcional(nomeChave, ops, null);
        corpo.appendChild(card);
    } else if (typeof ops === 'object' && ops !== null) {
        // Com subgrupos
        corpo.className = 'opcional-grupos-grid';
        Object.entries(ops).forEach(([grupo, itens]) => {
            corpo.appendChild(criarGrupoOpcional(nomeChave, itens, grupo));
        });
    }

    secaoEl.appendChild(corpo);
    return secaoEl;
}

function criarGrupoOpcional(secao, itens, grupo) {
    const card = document.createElement('div');
    card.className = 'opcional-grupo-card';

    if (grupo) {
        card.innerHTML = `
            <div class="opcional-grupo-header">
                ${grupo}
                <button class="btn-icon danger" style="font-size:0.8rem;" title="Remover grupo"
                    onclick="CRUD.removerSubgrupo('${secao}', '${grupo}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    const body = document.createElement('div');
    body.className = 'opcional-grupo-body';

    (itens || []).forEach((op, idx) => {
        body.appendChild(criarLinhaOp(secao, grupo, idx, op));
    });

    const btnAdd = document.createElement('button');
    btnAdd.className = 'btn-add-op';
    btnAdd.innerHTML = '<i class="fas fa-plus"></i> Adicionar item';
    btnAdd.onclick = () => CRUD.addOpInline(secao, grupo);

    body.appendChild(btnAdd);
    card.appendChild(body);
    return card;
}

function criarLinhaOp(secao, grupo, idx, op) {
    const div = document.createElement('div');
    div.className = 'linha-op';

    const nomeInput = document.createElement('input');
    nomeInput.type      = 'text';
    nomeInput.value     = op.nome;
    nomeInput.className = 'op-nome-input';
    nomeInput.onchange  = () => CRUD.atualizarDadoOp(secao, grupo, idx, 'nome', nomeInput.value);

    const precoWrap = document.createElement('div');
    precoWrap.className = 'op-preco-wrap';
    precoWrap.innerHTML = 'R$';

    const precoInput = document.createElement('input');
    precoInput.type      = 'number';
    precoInput.step      = '0.5';
    precoInput.min       = '0';
    precoInput.value     = op.preco;
    precoInput.className = 'op-preco-input';
    precoInput.onchange  = () => CRUD.atualizarDadoOp(secao, grupo, idx, 'preco', precoInput.value);
    precoWrap.appendChild(precoInput);

    const btnDel = document.createElement('button');
    btnDel.className = 'btn-icon danger';
    btnDel.title     = 'Remover';
    btnDel.style.fontSize = '0.8rem';
    btnDel.innerHTML = '<i class="fas fa-times"></i>';
    btnDel.onclick   = () => CRUD.removerOpInline(secao, grupo, idx);

    div.appendChild(nomeInput);
    div.appendChild(precoWrap);
    div.appendChild(btnDel);
    return div;
}

// ── LOGÍSTICA ─────────────────────────────────────────────────────
function renderLogistica(container) {
    const temp = document.getElementById('tmpl-logistica').content.cloneNode(true);

    const inputTaxa = temp.getElementById('log-taxa-geral');
    inputTaxa.value    = db.entrega.taxaGeral;
    inputTaxa.onchange = (e) => { db.entrega.taxaGeral = parseFloat(e.target.value) || 0; persistir(); };

    container.innerHTML = '';
    container.appendChild(temp);
    atualizarTabelaBairros();
}

function atualizarTabelaBairros() {
    const corpo  = document.getElementById('corpo-tabela-bairros');
    const badge  = document.getElementById('bairros-count');
    if (!corpo) return;
    if (badge) badge.textContent = db.entrega.bairros.length;

    let html = '';
    db.entrega.bairros.forEach((b, idx) => {
        html += `
            <tr>
                <td><input class="bairro-input" type="text" value="${b.nome}"
                    onchange="db.entrega.bairros[${idx}].nome = this.value; persistir();"></td>
                <td><input class="bairro-input" type="number" step="0.5" value="${b.taxa || 0}"
                    onchange="db.entrega.bairros[${idx}].taxa = parseFloat(this.value); persistir();"
                    style="max-width:100px;"></td>
                <td><button class="btn-icon danger" onclick="CRUD.removerBairro(${idx})">
                    <i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });

    // Linha de adição
    html += `
        <tr class="bairro-row-nova">
            <td><input class="bairro-input" type="text" id="novo-bairro-nome" placeholder="Nome do bairro…"></td>
            <td><input class="bairro-input" type="number" step="0.5" id="novo-bairro-taxa" placeholder="0.00"
                onkeydown="if(event.key==='Enter') tentarAdicionarBairro()"></td>
            <td><button class="btn-icon" onclick="tentarAdicionarBairro()" title="Adicionar">
                <i class="fas fa-plus-circle" style="color:var(--verde-militar);"></i></button></td>
        </tr>
    `;

    corpo.innerHTML = html;
}

function tentarAdicionarBairro() {
    const nome = document.getElementById('novo-bairro-nome')?.value.trim();
    const taxa = document.getElementById('novo-bairro-taxa')?.value;
    if (nome && taxa !== '') {
        db.entrega.bairros.push({ nome, taxa: parseFloat(taxa) || 0 });
        persistir();
        atualizarTabelaBairros();
        setTimeout(() => document.getElementById('novo-bairro-nome')?.focus(), 50);
    }
}

// ── CUPONS ────────────────────────────────────────────────────────
function renderCupons(container) {
    const temp = document.getElementById('tmpl-cupons').content.cloneNode(true);
    temp.getElementById('btn-novo-cupom').onclick = () => CRUD.modalCupom();

    const tbody = temp.getElementById('corpo-tabela-cupons');

    if (db.cupons.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#bbb;padding:24px;">Nenhum cupom cadastrado.</td></tr>`;
    } else {
        db.cupons.forEach((c, idx) => {
            const tr = document.createElement('tr');
            const tipoCls  = c.tipo === 'porcentagem' ? 'tipo-pct' : 'tipo-fixo';
            const tipoText = c.tipo === 'porcentagem' ? 'Porcentagem' : 'Valor Fixo';
            const valorTxt = c.tipo === 'porcentagem' ? `${c.valor}%` : `R$ ${parseFloat(c.valor).toFixed(2)}`;

            tr.innerHTML = `
                <td><span class="cupom-code">${c.codigo}</span></td>
                <td><span class="tipo-badge ${tipoCls}">${tipoText}</span></td>
                <td><strong>${valorTxt}</strong></td>
                <td>
                    <button class="btn-icon danger" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tr.querySelector('.btn-icon').onclick = () => CRUD.removerCupom(idx);
            tbody.appendChild(tr);
        });
    }

    container.innerHTML = '';
    container.appendChild(temp);
}

// ── CRUD ─────────────────────────────────────────────────────────
const CRUD = {
    // Sessões
    novaSessao: () => {
        const nome = prompt('Nome da nova categoria:');
        if (nome?.trim()) {
            db.secoes.push({ nome: nome.trim(), itens: [] });
            db.opcionais[nome.trim()] = [];
            persistir(); renderizarAtual();
        }
    },
    editarSessao: (idx) => {
        const nome = prompt('Novo nome:', db.secoes[idx].nome);
        if (nome?.trim() && nome !== db.secoes[idx].nome) {
            db.opcionais[nome.trim()] = db.opcionais[db.secoes[idx].nome];
            delete db.opcionais[db.secoes[idx].nome];
            db.secoes[idx].nome = nome.trim();
            persistir(); renderizarAtual();
        }
    },
    removerSessao: (idx) => {
        if (confirm(`Apagar a categoria "${db.secoes[idx].nome}" e todos os seus produtos?`)) {
            delete db.opcionais[db.secoes[idx].nome];
            db.secoes.splice(idx, 1);
            persistir(); renderizarAtual();
        }
    },

    // Produtos
    novoProduto: (sIdx) => {
        db.secoes[sIdx].itens.push({
            nome: 'Novo Produto', descricao: '', preco: 0,
            imagem: 'img/padrao.jpg', visivel: true, esgotado: false, opcionais_ativos: []
        });
        persistir();
        CRUD.editarProduto(sIdx, db.secoes[sIdx].itens.length - 1);
    },
    toggleVisibilidade: (sIdx, pIdx) => {
        db.secoes[sIdx].itens[pIdx].visivel = !db.secoes[sIdx].itens[pIdx].visivel;
        persistir(); renderizarAtual();
    },
    toggleEsgotado: (sIdx, pIdx) => {
        db.secoes[sIdx].itens[pIdx].esgotado = !db.secoes[sIdx].itens[pIdx].esgotado;
        persistir(); renderizarAtual();
    },
    editarProduto: (sIdx, pIdx) => {
        const item = db.secoes[sIdx].itens[pIdx];
        const nomeSessao = db.secoes[sIdx].nome;
        const todosOps = db.opcionais[nomeSessao] || [];
        const temp = document.getElementById('tmpl-modal-produto').content.cloneNode(true);

        temp.getElementById('prod-nome').value  = item.nome;
        temp.getElementById('prod-desc').value  = item.descricao;
        temp.getElementById('prod-preco').value = item.preco;
        temp.getElementById('prod-img').value   = item.imagem;

        // Botões toggle
        const setupToggle = (id, estado, iconOn, iconOff, txtOn, txtOff, classeOn) => {
            const btn = temp.getElementById(id);
            if (estado) { btn.classList.add(classeOn); btn.innerHTML = `<i class="fas ${iconOn}"></i> <span>${txtOn}</span>`; }
            else { btn.innerHTML = `<i class="fas ${iconOff}"></i> <span>${txtOff}</span>`; }
            btn.onclick = function() {
                const ativo = this.classList.toggle(classeOn);
                this.innerHTML = ativo
                    ? `<i class="fas ${iconOn}"></i> <span>${txtOn}</span>`
                    : `<i class="fas ${iconOff}"></i> <span>${txtOff}</span>`;
            };
        };

        setupToggle('btn-modal-vis', item.visivel,  'fa-eye', 'fa-eye-slash', 'Visível',    'Oculto',     'ativo');
        setupToggle('btn-modal-esg', item.esgotado, 'fa-ban', 'fa-check',    'Esgotado', 'Disponível',  'esgotado');

        // Opcionais — flatten de todos
        const containerOps = temp.getElementById('opcionais-container');
        const listaPlana = Array.isArray(todosOps)
            ? todosOps
            : Object.values(todosOps).flat();

        listaPlana.forEach(op => {
            const sel = (item.opcionais_ativos || []).includes(op.nome);
            const b = document.createElement('div');
            b.className   = `badge-select${sel ? ' selected' : ''}`;
            b.dataset.val = op.nome;
            b.textContent = `${op.nome} (+R$${parseFloat(op.preco || 0).toFixed(2)})`;
            b.onclick = () => b.classList.toggle('selected');
            containerOps.appendChild(b);
        });

        temp.getElementById('btn-salvar-produto').onclick = () => CRUD.salvarProduto(sIdx, pIdx);

        const mc = document.getElementById('modal-container');
        mc.innerHTML = '<div class="modal"></div>';
        mc.querySelector('.modal').appendChild(temp);
        mc.style.display = 'flex';

        // Google Image Search
        mc.querySelector('.btn-google-search').onclick = () => {
            const q = encodeURIComponent((document.getElementById('prod-nome').value || 'pão artesanal') + ' webp');
            window.open(`https://www.google.com/search?tbm=isch&q=${q}&tbs=itp:photo,isz:m`, '_blank');
        };

        // File input
        const fileInput = mc.querySelector('#file-input');
        mc.querySelector('.btn-open-file').onclick = () => fileInput.click();
        fileInput.onchange = () => {
            if (fileInput.files[0]) document.getElementById('prod-img').value = 'img/' + fileInput.files[0].name;
        };
    },
    salvarProduto: (sIdx, pIdx) => {
        const item = db.secoes[sIdx].itens[pIdx];
        item.nome      = document.getElementById('prod-nome').value;
        item.descricao = document.getElementById('prod-desc').value;
        item.preco     = parseFloat(document.getElementById('prod-preco').value) || 0;
        item.imagem    = document.getElementById('prod-img').value;
        item.visivel   = document.getElementById('btn-modal-vis').classList.contains('ativo');
        item.esgotado  = document.getElementById('btn-modal-esg').classList.contains('esgotado');
        item.opcionais_ativos = Array.from(document.querySelectorAll('.badge-select.selected')).map(el => el.dataset.val);
        fecharModal(); renderizarAtual(); persistir();
        toast('Produto salvo!', 'success');
    },
    duplicarProduto: (sIdx, pIdx) => {
        const novo = JSON.parse(JSON.stringify(db.secoes[sIdx].itens[pIdx]));
        novo.nome += ' (Cópia)';
        db.secoes[sIdx].itens.push(novo);
        persistir(); renderizarAtual();
    },
    removerProduto: (sIdx, pIdx) => {
        if (confirm(`Excluir "${db.secoes[sIdx].itens[pIdx].nome}"?`)) {
            db.secoes[sIdx].itens.splice(pIdx, 1);
            persistir(); renderizarAtual();
        }
    },

    // Opcionais
    addNovoSubgrupo: (secao) => {
        const nome = prompt('Nome do novo subgrupo:');
        if (nome?.trim()) {
            if (Array.isArray(db.opcionais[secao])) db.opcionais[secao] = {};
            db.opcionais[secao][nome.trim()] = [];
            persistir(); renderizarAtual();
        }
    },
    removerSubgrupo: (secao, grupo) => {
        if (confirm(`Remover o grupo "${grupo}"?`)) {
            delete db.opcionais[secao][grupo];
            persistir(); renderizarAtual();
        }
    },
    addOpInline: (secao, grupo = null) => {
        const item = { nome: 'Novo Item', preco: 0 };
        if (grupo && grupo !== 'null') {
            db.opcionais[secao][grupo].push(item);
        } else {
            if (!Array.isArray(db.opcionais[secao])) db.opcionais[secao] = [];
            db.opcionais[secao].push(item);
        }
        persistir(); renderizarAtual();
    },
    atualizarDadoOp: (secao, grupo, idx, campo, valor) => {
        if (campo === 'preco') valor = parseFloat(valor) || 0;
        if (grupo && grupo !== 'null') db.opcionais[secao][grupo][idx][campo] = valor;
        else db.opcionais[secao][idx][campo] = valor;
        persistir();
    },
    removerOpInline: (secao, grupo, idx) => {
        if (grupo && grupo !== 'null') db.opcionais[secao][grupo].splice(idx, 1);
        else db.opcionais[secao].splice(idx, 1);
        persistir(); renderizarAtual();
    },

    // Bairros
    removerBairro: (idx) => {
        if (confirm('Excluir bairro?')) {
            db.entrega.bairros.splice(idx, 1);
            persistir(); atualizarTabelaBairros();
        }
    },

    // Cupons
    modalCupom: () => {
        const html = `
            <h2 class="modal-title">Novo Cupom</h2>
            <div class="form-group">
                <label>Código</label>
                <input id="c-cod" placeholder="EX: PROMO10" style="text-transform:uppercase">
            </div>
            <div class="form-group">
                <label>Tipo</label>
                <select id="c-tipo">
                    <option value="porcentagem">Porcentagem (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Valor</label>
                <input id="c-val" type="number" min="0" step="0.5" placeholder="10">
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="fecharModal()">Cancelar</button>
                <button class="btn-confirm" onclick="CRUD.salvarCupom()">Salvar Cupom</button>
            </div>
        `;
        abrirModalContent(html);
    },
    salvarCupom: () => {
        const codigo = document.getElementById('c-cod')?.value.trim().toUpperCase();
        const tipo   = document.getElementById('c-tipo')?.value;
        const valor  = parseFloat(document.getElementById('c-val')?.value);
        if (!codigo || isNaN(valor)) { toast('Preencha todos os campos.', 'warning'); return; }
        db.cupons.push({ codigo, tipo, valor });
        fecharModal(); renderizarAtual(); persistir();
        toast(`Cupom ${codigo} criado!`, 'success');
    },
    removerCupom: (idx) => {
        if (confirm(`Excluir o cupom "${db.cupons[idx].codigo}"?`)) {
            db.cupons.splice(idx, 1);
            renderizarAtual(); persistir();
        }
    },

    // Cores
    resetarCores: () => {
        db.loja.cores = { ...CORES_PADRAO };
        persistir();
        navegarPara('loja');
        toast('Cores restauradas ao padrão.', 'info');
    }
};

// ── MODAL HELPERS ────────────────────────────────────────────────
function abrirModalContent(html) {
    const mc = document.getElementById('modal-container');
    mc.innerHTML = `<div class="modal">${html}</div>`;
    mc.style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modal-container').style.display = 'none';
}

// ── GERADOR DE dados.js ─────────────────────────────────────────
function gerarConteudoDadosJS() {
    let s = "// ============================================\n";
    s += "// DADOS DO SISTEMA - PÃO DO CISO\n";
    s += "// Gerado automaticamente pelo Painel v5\n";
    s += "// ============================================\n\n";
    s += "window.dadosIniciais = {\n";
    s += `    loja: ${JSON.stringify({ nome: db.loja.nome, telefone: db.loja.whatsapp, whatsapp: db.loja.whatsapp, email: db.loja.pix, instagram: '@' + (db.loja.instagram || ''), endereco: '' }, null, 2)},\n\n`;
    s += `    fornada: ${JSON.stringify(db.fornada, null, 2)},\n\n`;
    s += `    entrega: {\n        "taxaGeral": ${db.entrega.taxaGeral},\n        "bairros": [\n`;
    db.entrega.bairros.forEach((b, i) => {
        s += `            ${JSON.stringify(b)}${i < db.entrega.bairros.length - 1 ? ',' : ''}\n`;
    });
    s += `        ]\n    },\n\n`;
    s += `    cupons: [\n`;
    db.cupons.forEach((c, i) => {
        s += `        ${JSON.stringify(c)}${i < db.cupons.length - 1 ? ',' : ''}\n`;
    });
    s += `    ],\n\n`;
    s += `    opcionais: {\n`;
    const cats = Object.keys(db.opcionais);
    cats.forEach((cat, ci) => {
        const v = db.opcionais[cat];
        if (Array.isArray(v)) {
            s += `        "${cat}": [\n`;
            v.forEach((it, ii) => { s += `            ${JSON.stringify(it)}${ii < v.length - 1 ? ',' : ''}\n`; });
            s += `        ]${ci < cats.length - 1 ? ',' : ''}\n`;
        } else {
            s += `        "${cat}": {\n`;
            const subs = Object.keys(v);
            subs.forEach((sub, si) => {
                s += `            "${sub}": [\n`;
                v[sub].forEach((it, ii) => { s += `                ${JSON.stringify(it)}${ii < v[sub].length - 1 ? ',' : ''}\n`; });
                s += `            ]${si < subs.length - 1 ? ',' : ''}\n`;
            });
            s += `        }${ci < cats.length - 1 ? ',' : ''}\n`;
        }
    });
    s += `    },\n\n`;
    s += `    secoes: ${JSON.stringify(db.secoes, null, 2)}\n`;
    s += `};\n`;
    return s;
}

function baixarDados() {
    const blob = new Blob([gerarConteudoDadosJS()], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'dados.js' });
    a.click();
    URL.revokeObjectURL(url);
    toast('dados.js baixado!', 'success');
}

// ── EVENTOS GLOBAIS ──────────────────────────────────────────────
document.getElementById('modal-container').addEventListener('click', (e) => {
    if (e.target.id === 'modal-container') fecharModal();
});

// Expõe para onclick inline nos templates
window.navegarPara           = navegarPara;
window.fecharModal           = fecharModal;
window.CRUD                  = CRUD;
window.tentarAdicionarBairro = tentarAdicionarBairro;
window.db                    = db;
window.persistir             = persistir;
window.salvarFirestore       = salvarFirestore;
window.carregarDadosFirestore = carregarDadosFirestore;
window.baixarDados           = baixarDados;
window.atualizarTabelaBairros = atualizarTabelaBairros;

// ── INICIALIZAÇÃO ────────────────────────────────────────────────
window.onload = () => {
    navegarPara('dashboard');
    // Tenta carregar do Firebase em background
    carregarDadosFirestore().catch(() => {});
};
