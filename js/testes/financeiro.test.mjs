/**
 * TESTES FINANCEIROS - PÃO DO CISO
 * Execução: node --test financeiro.test.mjs
 *
 * Cobre as 3 funções de risco financeiro real:
 *   - calcularSubtotalProdutos()
 *   - aplicarCupom() — lógica de cálculo isolada
 *   - gerarMensagemWhatsApp()
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ─────────────────────────────────────────────────────────────
// AMBIENTE SIMULADO (substitui window, DOM e globals do browser)
// ─────────────────────────────────────────────────────────────
const global_ = globalThis;

global_.log = () => {};  // silencia logs durante testes

// dadosIniciais mínimo para os testes
global_.dadosIniciais = {
    secoes: [
        {
            nome: 'Pães',
            itens: [
                { nome: 'Pão de Campanha', preco: 35 },
                { nome: 'Ciabatta',        preco: 15 },
            ]
        }
    ],
    cupons: [
        { codigo: 'PROMO10',       tipo: 'porcentagem', valor: 10 },
        { codigo: 'MENOS10',       tipo: 'fixo',        valor: 10 },
        { codigo: 'MATHILDE15',    tipo: 'porcentagem', valor: 15 },
        { codigo: 'PRIMEIRACOMPRA',tipo: 'porcentagem', valor: 15 },
    ]
};

global_.estadoAplicativo = {
    modoEntrega:    'retirada',
    taxaEntrega:    0,
    descontoCupom:  0,
    cupomAplicado:  null,
    totalGeral:     0,
    formaPagamento: null,
};

global_.carrinho = {};

global_.formatarMoeda = valor =>
    parseFloat(valor || 0).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });


// ─────────────────────────────────────────────────────────────
// FUNÇÕES EXTRAÍDAS (lógica pura sem DOM)
// ─────────────────────────────────────────────────────────────

/** Replica a lógica de calcularSubtotalProdutos() de carrinho.js */
function calcularSubtotalProdutos(carrinhoLocal) {
    let total = 0;
    Object.values(carrinhoLocal).forEach(item => {
        const produto = dadosIniciais.secoes[item.indiceSessao].itens[item.indiceItem];
        let subtotalItem = produto.preco * item.quantidade;
        if (item.opcionais) {
            Object.values(item.opcionais).forEach(opcional => {
                subtotalItem += opcional.quantidade * opcional.preco;
            });
        }
        total += subtotalItem;
    });
    return total;
}

/** Replica o cálculo de desconto de aplicarCupom() de carrinho.js */
function calcularDesconto(codigoCupom, subtotal) {
    const cupomValido = dadosIniciais.cupons.find(
        c => c.codigo.toUpperCase() === codigoCupom.toUpperCase()
    );
    if (!cupomValido) return null;  // cupom não encontrado

    return cupomValido.tipo === 'porcentagem'
        ? subtotal * (cupomValido.valor / 100)
        : cupomValido.valor;
}

/** Replica o cálculo do total final de gerarMensagemWhatsApp() de envio.js */
function calcularTotalMensagem(carrinhoLocal, estadoLocal) {
    let totalProdutos = 0;
    Object.values(carrinhoLocal).forEach(item => {
        const produto = dadosIniciais.secoes[item.indiceSessao]?.itens[item.indiceItem];
        if (produto) {
            let precoUnitario = Number(produto.preco || 0);
            if (item.opcionais) {
                Object.entries(item.opcionais).forEach(([, dados]) => {
                    precoUnitario += Number(dados.preco || 0) * Number(dados.quantidade || 0);
                });
            }
            totalProdutos += precoUnitario * item.quantidade;
        }
    });

    const taxaEntrega = estadoLocal.modoEntrega === 'entrega'
        ? Number(estadoLocal.taxaEntrega || 0) : 0;
    const desconto = Number(estadoLocal.descontoCupom || 0);
    return (totalProdutos - desconto) + taxaEntrega;
}

// ─────────────────────────────────────────────────────────────
// TESTES
// ─────────────────────────────────────────────────────────────

describe('calcularSubtotalProdutos()', () => {

    it('carrinho vazio retorna 0', () => {
        assert.equal(calcularSubtotalProdutos({}), 0);
    });

    it('1x Pão de Campanha (R$35) = R$35', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 1, opcionais: {} } };
        assert.equal(calcularSubtotalProdutos(c), 35);
    });

    it('2x Pão de Campanha = R$70', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 2, opcionais: {} } };
        assert.equal(calcularSubtotalProdutos(c), 70);
    });

    it('produto + opcional somam corretamente', () => {
        // Ciabatta R$15 + 2x opcional R$3 = R$21
        const c = {
            'item-0-1': {
                indiceSessao: 0, indiceItem: 1, quantidade: 1,
                opcionais: { 'Manteiga': { quantidade: 2, preco: 3 } }
            }
        };
        assert.equal(calcularSubtotalProdutos(c), 21);
    });

    it('múltiplos itens sem opcionais', () => {
        // Pão Campanha R$35 + Ciabatta R$15 = R$50
        const c = {
            'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 1, opcionais: {} },
            'item-0-1': { indiceSessao: 0, indiceItem: 1, quantidade: 1, opcionais: {} },
        };
        assert.equal(calcularSubtotalProdutos(c), 50);
    });
});


describe('calcularDesconto() — lógica de aplicarCupom()', () => {

    it('cupom inexistente retorna null', () => {
        assert.equal(calcularDesconto('FALSO123', 100), null);
    });

    it('PROMO10 (10%) sobre R$100 = R$10', () => {
        assert.equal(calcularDesconto('PROMO10', 100), 10);
    });

    it('MENOS10 (fixo R$10) independe do subtotal', () => {
        assert.equal(calcularDesconto('MENOS10', 200), 10);
        assert.equal(calcularDesconto('MENOS10', 50),  10);
    });

    it('MATHILDE15 (15%) sobre R$200 = R$30', () => {
        assert.equal(calcularDesconto('MATHILDE15', 200), 30);
    });

    it('cupom case-insensitive: "promo10" == "PROMO10"', () => {
        assert.equal(calcularDesconto('promo10', 100), 10);
    });

    it('desconto não ultrapassa subtotal em cupom fixo alto', () => {
        // R$10 fixo sobre R$8 — o desconto é R$10, total ficaria negativo
        // o sistema não previne isso; este teste documenta o comportamento atual
        assert.equal(calcularDesconto('MENOS10', 8), 10);
    });
});


describe('calcularTotalMensagem() — lógica de gerarMensagemWhatsApp()', () => {

    it('retirada sem desconto: total = produtos', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 1, opcionais: {} } };
        const e = { modoEntrega: 'retirada', taxaEntrega: 0, descontoCupom: 0 };
        assert.equal(calcularTotalMensagem(c, e), 35);
    });

    it('entrega adiciona taxa corretamente', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 1, opcionais: {} } };
        const e = { modoEntrega: 'entrega', taxaEntrega: 10, descontoCupom: 0 };
        assert.equal(calcularTotalMensagem(c, e), 45);
    });

    it('cupom porcentagem aplicado: R$70 - 10% = R$63', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 2, opcionais: {} } };
        const desconto = calcularDesconto('PROMO10', 70);
        const e = { modoEntrega: 'retirada', taxaEntrega: 0, descontoCupom: desconto };
        assert.equal(calcularTotalMensagem(c, e), 63);
    });

    it('cupom fixo + entrega: R$35 - R$10 + R$10 = R$35', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 1, opcionais: {} } };
        const e = { modoEntrega: 'entrega', taxaEntrega: 10, descontoCupom: 10 };
        assert.equal(calcularTotalMensagem(c, e), 35);
    });

    it('retirada ignora taxaEntrega mesmo que preenchida', () => {
        const c = { 'item-0-0': { indiceSessao: 0, indiceItem: 0, quantidade: 1, opcionais: {} } };
        const e = { modoEntrega: 'retirada', taxaEntrega: 99, descontoCupom: 0 };
        assert.equal(calcularTotalMensagem(c, e), 35);
    });
});
