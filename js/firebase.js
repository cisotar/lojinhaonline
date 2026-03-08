// ============================================
// FIREBASE — PÃO DO CISO
// Inicialização e funções de persistência
// ============================================

import { initializeApp }                    from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore-lite.js";

const firebaseConfig = {
    apiKey:            "AIzaSyBbPOYFCi6IaVMk889zsxEwr8NjKuVTUPk",
    authDomain:        "nanopadariapaodociso.firebaseapp.com",
    projectId:         "nanopadariapaodociso",
    storageBucket:     "nanopadariapaodociso.firebasestorage.app",
    messagingSenderId: "23220999316",
    appId:             "1:23220999316:web:72ceb7cc8f00798524d081"
};

const _app = initializeApp(firebaseConfig);
const _db  = getFirestore(_app);

// ── Carregar dados do Firestore ──────────────────────────────
// Retorna os dados salvos ou null se não existir ainda
async function carregarDadosFirestore() {
    try {
        const snap = await getDoc(doc(_db, "paodociso", "dados"));
        if (snap.exists()) {
            const raw = snap.data();
            return {
                loja:      JSON.parse(raw.loja      || "null"),
                fornada:   JSON.parse(raw.fornada   || "null"),
                entrega:   JSON.parse(raw.entrega   || "null"),
                cupons:    JSON.parse(raw.cupons    || "null"),
                opcionais: JSON.parse(raw.opcionais || "null"),
                secoes:    JSON.parse(raw.secoes    || "null"),
            };
        }
    } catch (err) {
        console.warn("⚠️ Firebase: erro ao carregar dados. Usando fallback local.", err);
    }
    return null;
}

// ── Salvar dados no Firestore ────────────────────────────────
// Chamada pelo painel de gestão ao salvar alterações
async function salvarDadosFirestore(dados) {
    try {
        await setDoc(doc(_db, "paodociso", "dados"), {
            loja:      JSON.stringify(dados.loja      || null),
            fornada:   JSON.stringify(dados.fornada   || null),
            entrega:   JSON.stringify(dados.entrega   || null),
            cupons:    JSON.stringify(dados.cupons    || null),
            opcionais: JSON.stringify(dados.opcionais || null),
            secoes:    JSON.stringify(dados.secoes    || null),
        });
        console.log("✅ Dados salvos no Firestore.");
        return true;
    } catch (err) {
        console.error("❌ Firebase: erro ao salvar dados.", err);
        return false;
    }
}

// Expõe globalmente para uso pelo painel e pelo main.js
window._firebaseDB             = _db;
window.carregarDadosFirestore  = carregarDadosFirestore;
window.salvarDadosFirestore    = salvarDadosFirestore;

// Sinaliza que o módulo terminou de inicializar
if (window._firebaseResolve) window._firebaseResolve();
