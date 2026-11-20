/* Utilitários comuns: seletores, datas no padrão brasileiro, números e avisos. */
'use strict';

const $ = (sel, raiz) => (raiz || document).querySelector(sel);
const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function novoId(prefixo) {
  return (prefixo || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* Datas são guardadas como 'AAAA-MM-DD' (ISO) e mostradas como 'DD/MM/AAAA'. */
function hojeIso() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dataBr(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return d + '/' + m + '/' + a;
}
function isoParaDate(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}
function somaDias(iso, dias) {
  const d = isoParaDate(iso);
  d.setDate(d.getDate() + Number(dias));
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function diasEntre(isoA, isoB) {
  return Math.round((isoParaDate(isoB) - isoParaDate(isoA)) / 86400000);
}

function num(v) {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function fmt(n, casas) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0 });
}

function toast(msg, erro) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (erro ? ' erro' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast'; }, 3200);
}

/* Lê os campos de um formulário com atributo name para um objeto simples. */
function lerForm(form) {
  const o = {};
  $$('[name]', form).forEach(el => {
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else o[el.name] = el.value.trim();
  });
  return o;
}
function preencherForm(form, dados) {
  $$('[name]', form).forEach(el => {
    const v = dados[el.name];
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v == null ? '' : v;
  });
}

function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo || 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* CSV com ponto e vírgula e BOM, para abrir direto no Excel em português. */
function paraCsv(linhas) {
  const cel = v => {
    const s = String(v == null ? '' : v);
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '﻿' + linhas.map(l => l.map(cel).join(';')).join('\r\n');
}

function confirmar(msg) { return window.confirm(msg); }
