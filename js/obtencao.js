/* Obtenção: o caminho da dispensa até a nota fiscal certificada.
 *
 * Funções trazidas da aba Obtenção do SIGAB e adaptadas ao CHEMAQ, que não
 * tem servidor: tudo fica no navegador (e no backup) e as consultas vão
 * direto ao PNCP, que libera o acesso a partir do site.
 *
 *  - SOLEMP: nasce da dispensa, vira nota de empenho e só termina com a NF
 *    certificada. Cinco etapas, marcadas com um clique.
 *  - Entregas: as SOLEMPs empenhadas, com data prevista, contatos com o
 *    fornecedor e prazo em dias úteis (sábado, domingo e feriado nacional
 *    não contam).
 *  - Notas de empenho: lidas do PDF de impressão do SIAFI (sem API pública),
 *    conferidas e ligadas à SOLEMP.
 *  - Limite por PDM: soma no ano, por PDM, o que o navio contratou por
 *    dispensa (PNCP) e o que está planejado no CHEMAQ, contra o teto do
 *    art. 75, II.
 *  - PNCP: processos da UASG, um processo pelo número de controle (anexos,
 *    histórico e itens) e atas da UASG gerenciadora, com itens e preços. */
'use strict';

const SOL_ETAPAS = [
  { v: 'encaminhada', l: 'SOLEMP encaminhada', c: 'Encaminhada' },
  { v: 'conferida', l: 'SOLEMP conferida', c: 'Conferida' },
  { v: 'empenhada', l: 'SOLEMP empenhada', c: 'Empenhada' },
  { v: 'entregue', l: 'Entregue / pronto', c: 'Entregue' },
  { v: 'certificada', l: 'NF certificada', c: 'Certificada' }
];
const ENT_SIT = [
  { v: '', l: 'Aguardando contato' },
  { v: 'ciente', l: 'Fornecedor ciente, com data' },
  { v: 'transito', l: 'Em trânsito / em execução' },
  { v: 'mudo', l: 'Não respondeu (3 tentativas)' },
  { v: 'fim', l: 'Entregue / pronto' },
  { v: 'canc', l: 'Cancelada' }
];
const NE_SIT = { emitida: 'Emitida', entregue: 'Material entregue', paga: 'Paga', anulada: 'Anulada' };
const ND_NOMES = { '339030': 'Material de Consumo', '339039': 'Outros Serviços de Terceiros PJ', '449052': 'Equipamentos e Material Permanente' };
const FASES_PNCP = ['Publicação e divulgação', 'Propostas', 'Sessão de lances', 'Julgamento e negociação', 'Habilitação',
  'Adjudicação e homologação', 'SOLEMP encaminhada', 'SOLEMP empenhada', 'Cancelada', 'Revogada', 'Deserta/fracassada'];
const PDM_LIMITE_PADRAO = 65492.11;   /* art. 75, II, da Lei 14.133/2021, atualizado pelo Decreto nº 12.807/2025 */
const PNCP = 'https://pncp.gov.br/api';

function obt() {
  const d = DB.dados;
  d.obtencao = Object.assign({ solemps: [], nes: [], processos: [], atas: [], pdm: { itens: {} }, cfg: {} }, d.obtencao || {});
  d.obtencao.cfg = Object.assign({ cnpj: '00394502000144', uasgAtas: '784810', limitePdm: PDM_LIMITE_PADRAO }, d.obtencao.cfg);
  return d.obtencao;
}
const uasgNavio = () => String((DB.dados.dispCfg || {}).uasg || '').replace(/\D/g, '');
const brl = v => 'R$ ' + moeda(+v || 0);
const solTotal = s => (s.itens || []).reduce((a, i) => a + (+i.valor || 0), 0);
const neNorm = n => { const m = String(n || '').toUpperCase().replace(/\s/g, '').match(/^(\d{4})NE0*(\d+)$/); return m ? m[1] + 'NE' + m[2].padStart(6, '0') : String(n || '').toUpperCase().trim(); };
const cnpjFmt = s => { const d = String(s || '').replace(/\D/g, ''); return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : String(s || '').trim(); };
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const contem = (v, q) => semAcento(v).includes(semAcento(q));

/* ---------- dias úteis: feriados nacionais, fixos e móveis (pela Páscoa) ---------- */
function pascoa(a) {
  const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4, g = Math.floor((c + 8) / 25),
    h = Math.floor((c - g + 1) / 3), i = (19 * b + c - e - h + 15) % 30, k = Math.floor(d / 4), l = d % 4,
    m = (32 + 2 * f + 2 * k - i - l) % 7, n = Math.floor((b + 11 * i + 22 * m) / 451), mes = Math.floor((i + m - 7 * n + 114) / 31),
    dia = ((i + m - 7 * n + 114) % 31) + 1;
  return a + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}
const _feriados = {};
function feriados(ano) {
  if (_feriados[ano]) return _feriados[ano];
  const p = pascoa(ano);
  const s = new Set(['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].map(x => ano + '-' + x));
  [-48, -47, -2, 60].forEach(n => s.add(somaDias(p, n)));   /* carnaval (seg e ter), sexta-feira santa, Corpus Christi */
  return (_feriados[ano] = s);
}
function diaUtil(iso) { const w = isoParaDate(iso).getDay(); return w !== 0 && w !== 6 && !feriados(+iso.slice(0, 4)).has(iso); }
/* dias úteis de hoje até a data (negativo se já passou) */
function diasUteisAte(iso) {
  const hoje = hojeIso();
  if (iso === hoje) return 0;
  const passo = iso > hoje ? 1 : -1;
  let n = 0, d = hoje;
  while (d !== iso && Math.abs(n) < 400) { d = somaDias(d, passo); if (diaUtil(d)) n += passo; }
  return n;
}

/* ---------- PNCP ---------- */
async function pncpGet(caminho, ms) {
  const c = new AbortController(), corta = setTimeout(() => c.abort(), ms || 60000);
  try {
    const r = await fetch(PNCP + caminho, { signal: c.signal });
    if (r.status === 204) return null;
    if (!r.ok) throw new Error('o PNCP respondeu ' + r.status);
    return await r.json();
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? 'o PNCP não respondeu a tempo' : e.message === 'Failed to fetch' ? 'sem acesso ao PNCP (rede ou bloqueio)' : e.message);
  } finally { clearTimeout(corta); }
}
const ymd = iso => iso.replace(/-/g, '');
/* nº de controle (00394502000144-1-006056/2026), endereço da página ou CNPJ/ano/sequencial */
function lePncp(txt) {
  const t = String(txt || '').trim();
  let m = t.match(/(\d{14})\/(\d{4})\/(\d{1,6})/);
  if (m) return { cnpj: m[1], ano: +m[2], seq: +m[3] };
  m = t.match(/(\d{14})-\d+-(\d{1,6})\/(\d{4})/);
  if (m) return { cnpj: m[1], ano: +m[3], seq: +m[2] };
  const n = t.split(/\D+/).filter(Boolean);
  if (n.length === 3 && n[0].length === 14 && n[1].length === 4) return { cnpj: n[0], ano: +n[1], seq: +n[2] };
  return null;
}
const linkCompra = a => 'https://pncp.gov.br/app/editais/' + a.cnpj + '/' + a.ano + '/' + a.seq;

/* ---------- leitura do PDF de impressão da NE (SIAFI) ---------- */
let _pdfjs = null;
function carregaPdfjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjs) return _pdfjs;
  _pdfjs = new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(window.pdfjsLib); };
    s.onerror = () => { _pdfjs = null; falha(new Error('não foi possível carregar o leitor de PDF (sem internet?)')); };
    document.head.appendChild(s);
  });
  return _pdfjs;
}
async function linhasDoPdf(buf) {
  const lib = await carregaPdfjs();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const linhas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const c = await (await pdf.getPage(p)).getTextContent();
    const porY = {};
    c.items.forEach(it => { const y = Math.round(it.transform[5]); (porY[y] = porY[y] || []).push({ x: it.transform[4], s: it.str }); });
    Object.keys(porY).map(Number).sort((a, b) => b - a).forEach(y => {
      const l = porY[y].sort((a, b) => a.x - b.x).map(o => o.s).join(' ').replace(/\s+/g, ' ').trim();
      if (l) linhas.push(l);
    });
  }
  return linhas;
}
/* Campos da NE no texto do SIAFI: "2026 NE 000183", UG emitente, linha de emissão
 * (data, processo, valor), favorecido (código e nome), SOLEMP citada na descrição
 * e natureza de despesa da lista de itens. O que não for achado fica em branco. */
function leNe(linhas) {
  const t = linhas.join('\n'), r = {};
  let m = t.match(/\b(20\d{2})\s*NE\s*(\d{1,6})\b/);
  if (m) r.numero = m[1] + 'NE' + m[2].padStart(6, '0');
  m = t.match(/UG\s+Emitente[\s\S]{0,200}?\n(\d{6})\b/i);
  if (m) r.ug = m[1];
  m = t.match(/\b(\d{2}\/\d{2}\/\d{4})\s+\S+\s+([\d.]+\/\d{4}(?:-\d{2})?|\d{17})\s+[\d,.-]+\s+([\d.]+,\d{2})\s*$/m);
  if (m) {
    r.data = m[1].split('/').reverse().join('-');
    r.processo = /^\d{17}$/.test(m[2]) ? m[2].slice(0, 5) + '.' + m[2].slice(5, 11) + '/' + m[2].slice(11, 15) + '-' + m[2].slice(15) : m[2];
    r.valor = numBR(m[3]);
  }
  if (!r.data) { m = t.match(/Data de Emiss[ãa]o[\s\S]{0,80}?(\d{2}\/\d{2}\/\d{4})/i); if (m) r.data = m[1].split('/').reverse().join('-'); }
  m = t.match(/Favorecido\s*\n\s*C[oó0]digo\s+Nome\s*\n\s*([\d./-]{11,20})\s+(.+)/i);
  if (m) { r.cnpj = cnpjFmt(m[1]); r.favorecido = m[2].trim(); }
  m = t.match(/SOLEMP\)?[^0-9]{0,12}\d{4,6}-(\d{4}\/\d{4})/i) || t.match(/\b\d{5,6}-(\d{4}\/\d{4})\b/);
  if (m) r.solemp = m[1];
  else { m = t.match(/SOLEMP\s+(?:N[ºo°.]?\s*)?(\d{1,4})\/(\d{4})\b/i); if (m) r.solemp = m[1].padStart(4, '0') + '/' + m[2]; }
  m = t.match(/Natureza de Despesa[\s\S]{0,150}?(\d{6})\s*-\s*[A-ZÀ-Ü]/);
  if (m) r.nd = m[1];
  if (!r.numero) throw new Error('não parece o PDF de impressão da NE do SIAFI');
  return r;
}

/* ---------- PDM ---------- */
/* Nome do PDM a partir da descrição do item no PNCP: a descrição do catálogo
 * começa pelo nome do PDM e segue com "característica: valor". */
function pdmDaDescricao(desc) {
  const s = String(desc || '').trim(), partes = s.split(/\s+/);
  const i = partes.findIndex(p => p.includes(':'));
  if (i < 0) return partes.slice(0, 3).join(' ');
  let ini = i;
  for (let k = i - 1; k >= 0; k--) { if (/^[a-zà-ÿ]/.test(partes[k])) ini = k; else break; }
  return partes.slice(0, ini).join(' ').replace(/[-/,]+$/, '').trim() || partes.slice(0, 3).join(' ');
}

const Obt = {
  filtroEtapa: '',
  busca: '',
  lote: [],
  pncpAchado: null,
  atasTela: null,
  pdmAno: String(new Date().getFullYear()),

  gravar() { DB.salvar(); },

  render() {
    if (!$('#tab-obtencao')) return;
    obt();
    this.renderSolemps();
    this.renderEntregas();
    this.renderNes();
    this.renderPdm();
    this.renderProcessos();
    this.renderAtas();
    const fc = $('#formObtCfg');
    if (!fc.contains(document.activeElement)) preencherForm(fc, Object.assign({}, obt().cfg, { limitePdm: moeda(obt().cfg.limitePdm) }));
  },

  /* ============ SOLEMP ============ */
  solemps() { return obt().solemps; },

  renderSolemps() {
    const L = this.solemps();
    const cont = {}; SOL_ETAPAS.forEach(e => cont[e.v] = 0); L.forEach(s => cont[s.etapa] = (cont[s.etapa] || 0) + 1);
    $('#solFluxo').innerHTML = SOL_ETAPAS.map((e, i) => '<button type="button" class="fluxo-et" data-filtroetapa="' + e.v + '" aria-pressed="' + (this.filtroEtapa === e.v) + '">' +
      '<b>' + cont[e.v] + '</b><span>' + (i + 1) + '. ' + esc(e.l) + '</span></button>').join('');
    const q = this.busca;
    const vis = L.filter(s => (!this.filtroEtapa || s.etapa === this.filtroEtapa) &&
      (!q || [s.numero, s.ne, s.fornecedor, s.cnpj, s.dispensaTxt, s.obs].concat((s.itens || []).map(i => i.desc)).some(v => contem(v, q))))
      .sort((a, b) => String(b.numero).localeCompare(String(a.numero), 'pt', { numeric: true }));
    $('#nSol').textContent = L.length;
    $('#tabSol tbody').innerHTML = vis.map(s => {
      const idx = SOL_ETAPAS.findIndex(e => e.v === s.etapa);
      return '<tr><td class="mono">' + esc(s.numero || '—') + '<div class="sub">' + esc(s.dispensaTxt || '') + '</div></td>' +
        '<td><b>' + esc(s.fornecedor || '(fornecedor a definir)') + '</b><div class="sub">' + esc((s.itens || []).map(i => i.desc).slice(0, 3).join('; ')) +
        ((s.itens || []).length > 3 ? '…' : '') + '</div></td><td class="mono">' + esc(s.ne || '—') + '</td><td class="num">' + moeda(solTotal(s)) + '</td>' +
        '<td><div class="casinhas" role="group" aria-label="Etapa da SOLEMP ' + esc(s.numero) + '">' + SOL_ETAPAS.map((e, i) =>
          '<button type="button" class="casa' + (i <= idx ? ' feita' : '') + '" data-soletapa="' + s.id + ':' + e.v + '" title="' + esc(e.l) + '" aria-label="' + esc(e.l) + '"' +
          (i === idx ? ' aria-current="step"' : '') + '></button>').join('') + '</div><div class="sub">' + esc((SOL_ETAPAS[idx] || SOL_ETAPAS[0]).l) + '</div></td>' +
        '<td class="botoes"><button class="mini ok" data-solabrir="' + s.id + '">Abrir</button><button class="mini del" data-soldel="' + s.id + '">Excluir</button></td></tr>';
    }).join('');
    $('#vazioSol').classList.toggle('hidden', vis.length > 0);
    $('#vazioSol').textContent = L.length ? 'Nenhuma SOLEMP com esse filtro.' : 'Nenhuma SOLEMP ainda. Crie uma aqui ou pelo botão “SOLEMP” de uma dispensa.';
  },

  /* SOLEMP nova, ou a partir de uma dispensa do CHEMAQ (itens e valor vêm dela). */
  novaSolemp(dispId) {
    const P = dispId ? (DB.dados.dispensas || []).find(x => x.id === dispId) : null;
    const s = { id: novoId('sol'), numero: '', etapa: 'encaminhada', itens: [], criado: new Date().toISOString(), ent: { sit: '', contatos: [] } };
    if (P) this.itensDaDispensa(s, P);
    this.abrirSolemp(s, true);
  },
  itensDaDispensa(s, P) {
    s.dispensaId = P.id;
    s.dispensaTxt = 'Dispensa ' + (P.numeroDispensa || '(s/nº)') + (P.processoNum ? ' · ' + P.processoNum : '');
    s.tipo = ehMaterial(P) ? 'material' : 'servico';
    s.itens = Array.isArray(P.itens) && P.itens.length
      ? P.itens.map(i => ({ desc: i.nome, qtd: +i.qtd || 1, valor: Math.round((+i.qtd || 0) * (+i.preco || 0) * 100) / 100 }))
      : [{ desc: maiusc1((P.servicoTitulo || '') + (P.alvo ? ' ' + contr(P.alvo) : '')), qtd: parseInt(P.qtd, 10) || 1, valor: num(P.valor) || numBR(P.valor) || 0 }];
  },
  abrirSolemp(s, nova) {
    this._sol = { s: JSON.parse(JSON.stringify(s)), nova };
    const f = $('#formSol');
    preencherForm(f, Object.assign({}, s, { itensTxt: (s.itens || []).map(i => i.desc + ' ; ' + i.qtd + ' ; ' + moeda(+i.valor || 0)).join('\n') }));
    $('#solDispensa').innerHTML = '<option value="">— nenhuma —</option>' + (DB.dados.dispensas || []).map(P =>
      '<option value="' + P.id + '"' + (P.id === s.dispensaId ? ' selected' : '') + '>' + esc((P.numeroDispensa || 's/nº') + ' · ' + (P.servicoTitulo || '')) + '</option>').join('');
    $('#dlgSolTit').textContent = nova ? 'Nova SOLEMP' : 'SOLEMP ' + (s.numero || '');
    $('#dlgSol').showModal();
  },
  gravarSolemp(f) {
    const v = lerForm(f), s = this._sol.s;
    const itens = String(v.itensTxt || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const p = l.split(';').map(x => x.trim());
      return { desc: p[0], qtd: parseInt(p[1], 10) || 1, valor: numBR(p[2]) || 0 };
    });
    if (!v.numero && !itens.length) { toast('Informe ao menos o número ou os itens da SOLEMP.', true); return false; }
    Object.assign(s, { numero: v.numero, ne: v.ne ? neNorm(v.ne) : '', fornecedor: v.fornecedor, cnpj: cnpjFmt(v.cnpj), contato: v.contato,
      tipo: v.tipo || s.tipo || 'material', obs: v.obs, etapa: v.etapa || s.etapa, itens });
    const disp = $('#solDispensa').value;
    if (disp !== (s.dispensaId || '')) {
      const P = (DB.dados.dispensas || []).find(x => x.id === disp);
      if (P) { s.dispensaId = P.id; s.dispensaTxt = 'Dispensa ' + (P.numeroDispensa || '(s/nº)') + (P.processoNum ? ' · ' + P.processoNum : ''); }
      else { delete s.dispensaId; s.dispensaTxt = ''; }
    }
    if (s.ne && SOL_ETAPAS.findIndex(e => e.v === s.etapa) < 2) s.etapa = 'empenhada';
    const L = this.solemps(), i = L.findIndex(x => x.id === s.id);
    if (i >= 0) L[i] = s; else L.push(s);
    this.gravar();
    toast('SOLEMP gravada.');
  },
  mudarEtapa(id, etapa) {
    const s = this.solemps().find(x => x.id === id); if (!s) return;
    s.etapa = etapa;
    if (etapa === 'entregue' || etapa === 'certificada') { s.ent = s.ent || { contatos: [] }; if (s.ent.sit !== 'canc') s.ent.sit = 'fim'; s.ent.entregue = s.ent.entregue || hojeIso(); }
    this.gravar();
  },

  /* ============ ENTREGAS ============ */
  prazo(s) {
    const en = s.ent || {};
    if (en.sit === 'fim' || s.etapa === 'entregue' || s.etapa === 'certificada') return { g: 'fim', t: 'Entregue' + (en.entregue ? ' em ' + dataBr(en.entregue) : '') };
    if (en.sit === 'canc') return { g: 'canc', t: 'Cancelada' };
    if (en.prev) {
      const n = diasUteisAte(en.prev);
      if (en.prev < hojeIso()) return { g: 'atraso', t: 'Venceu há ' + Math.abs(n) + ' dia(s) úteis', n };
      if (n <= 5) return { g: 'perto', t: n === 0 ? 'Vence hoje' : 'Faltam ' + n + ' dia(s) úteis', n };
      return { g: 'ok', t: 'Faltam ' + n + ' dias úteis', n };
    }
    if (en.sit === 'mudo') return { g: 'mudo', t: 'Sem resposta' };
    if (en.sit === 'transito') return { g: 'trans', t: 'Em trânsito / execução' };
    return { g: 'sem', t: 'Sem data prevista' };
  },
  renderEntregas() {
    const L = this.solemps().filter(s => ['empenhada', 'entregue'].includes(s.etapa));
    const ord = { atraso: 0, perto: 1, mudo: 2, sem: 3, trans: 4, ok: 5, fim: 6, canc: 7 };
    const linhas = L.map(s => ({ s, p: this.prazo(s) })).sort((a, b) => ord[a.p.g] - ord[b.p.g] || (a.s.ent && a.s.ent.prev || '9').localeCompare(b.s.ent && b.s.ent.prev || '9'));
    const conta = g => linhas.filter(x => x.p.g === g).length;
    $('#kpisEnt').innerHTML = [['atraso', 'Atrasadas', 'passou da data prevista'], ['perto', 'Vencem em 5 dias úteis', 'cobrar o fornecedor'],
      ['ok', 'No prazo', 'com data marcada'], ['sem', 'Sem data', 'pedir a previsão'], ['mudo', 'Sem resposta', '3 tentativas sem retorno'], ['fim', 'Entregues', 'certificar a NF']]
      .map(([g, l, d]) => '<div class="kpi' + ((g === 'atraso' || g === 'mudo') && conta(g) ? ' alerta' : '') + '"><div class="rot">' + l + '</div><div class="val">' + conta(g) + '</div><div class="det">' + d + '</div></div>').join('');
    const cls = { atraso: 'st-vencida', perto: 'st-avencer', ok: 'st-emdia', fim: 'st-emdia', sem: 'st-semreg', mudo: 'st-vencida', trans: 'st-semreg', canc: 'st-semreg' };
    $('#tabEnt tbody').innerHTML = linhas.map(({ s, p }) => {
      const en = s.ent || {}, ult = (en.contatos || []).slice(-1)[0];
      return '<tr><td class="mono">' + esc(s.numero || '—') + '<div class="sub">' + esc(s.ne || '') + '</div></td><td><b>' + esc(s.fornecedor || '—') + '</b><div class="sub">' +
        esc(s.contato || '') + '</div></td><td>' + esc((s.itens || []).map(i => i.desc).slice(0, 2).join('; ')) + '<div class="sub">' + brl(solTotal(s)) + ' · ' +
        (s.tipo === 'servico' ? 'serviço' : 'material') + '</div></td><td><span class="selo-st ' + cls[p.g] + '">' + esc(p.t) + '</span><div class="sub">' +
        (en.prev ? 'prevista ' + dataBr(en.prev) : '') + (ult ? (en.prev ? ' · ' : '') + 'último contato ' + dataBr(ult.d) + (ult.resp === 'nao' ? ' (sem resposta)' : '') : '') + '</div></td>' +
        '<td class="botoes"><button class="mini ok" data-entabrir="' + s.id + '">Atualizar</button></td></tr>';
    }).join('');
    $('#vazioEnt').classList.toggle('hidden', linhas.length > 0);
  },
  abrirEntrega(id) {
    const s = this.solemps().find(x => x.id === id); if (!s) return;
    this._ent = s;
    s.ent = s.ent || { sit: '', contatos: [] };
    const f = $('#formEnt');
    $('#dlgEntTit').textContent = (s.tipo === 'servico' ? 'Prontificação' : 'Entrega') + ' — SOLEMP ' + (s.numero || '');
    $('#entResumo').textContent = [s.ne, s.fornecedor, s.contato, brl(solTotal(s))].filter(Boolean).join(' · ');
    $('#entSit').innerHTML = ENT_SIT.map(o => '<option value="' + o.v + '">' + esc(o.l) + '</option>').join('');
    preencherForm(f, { sit: s.ent.sit || '', prev: s.ent.prev || '', entregue: s.ent.entregue || '', obsEnt: s.ent.obs || '', ctData: hojeIso(), ctMeio: 'Telefone', ctResp: 'sim', ctTxt: '' });
    this.renderHistEnt();
    $('#dlgEnt').showModal();
  },
  renderHistEnt() {
    const c = (this._ent.ent.contatos || []).slice().reverse();
    $('#entHist').innerHTML = c.length ? c.map(x => '<li><b>' + dataBr(x.d) + '</b> · ' + esc(x.meio) + ' · ' + (x.resp === 'sim' ? 'respondeu' : 'não respondeu') +
      (x.txt ? ' — ' + esc(x.txt) : '') + '</li>').join('') : '<li class="sub">Nenhum contato registrado.</li>';
  },
  registrarContato() {
    const f = $('#formEnt'), v = lerForm(f), en = this._ent.ent;
    (en.contatos = en.contatos || []).push({ d: v.ctData || hojeIso(), meio: v.ctMeio, resp: v.ctResp, txt: v.ctTxt });
    /* três tentativas seguidas sem resposta mudam a situação; uma resposta zera a contagem */
    const ult3 = en.contatos.slice(-3);
    if (ult3.length === 3 && ult3.every(x => x.resp === 'nao') && !['fim', 'canc'].includes(en.sit)) { en.sit = 'mudo'; f.elements.sit.value = 'mudo'; }
    else if (v.ctResp === 'sim' && en.sit === 'mudo') { en.sit = ''; f.elements.sit.value = ''; }
    f.elements.ctTxt.value = '';
    this.renderHistEnt();
    DB.salvar(true);
    toast('Contato registrado.');
  },
  gravarEntrega(f) {
    const v = lerForm(f), s = this._ent;
    Object.assign(s.ent, { sit: v.sit, prev: v.prev, entregue: v.entregue, obs: v.obsEnt });
    if (v.sit === 'ciente' && !v.prev) { toast('Informe a data prevista.', true); return false; }
    if (v.sit === 'fim') { s.ent.entregue = v.entregue || hojeIso(); if (s.etapa === 'empenhada') s.etapa = 'entregue'; }
    this.gravar();
  },

  /* ============ NOTAS DE EMPENHO ============ */
  nes() { return obt().nes; },
  async lerPdfs(files) {
    const st = $('#neStatus');
    st.textContent = 'Lendo ' + files.length + ' PDF(s)…';
    let ok = 0;
    for (const f of files) {
      try {
        const r = leNe(await linhasDoPdf(await f.arrayBuffer()));
        r.arquivo = f.name; this.lote.push(r); ok++;
      } catch (e) { this.lote.push({ arquivo: f.name, erro: e.message }); }
    }
    st.textContent = ok + ' de ' + files.length + ' lido(s). Confira abaixo antes de lançar.';
    this.renderLote();
  },
  renderLote() {
    $('#neLote').classList.toggle('hidden', !this.lote.length);
    $('#nLote').textContent = this.lote.length;
    const inp = (i, k, v, w) => '<input class="mini-in texto" style="width:' + (w || 120) + 'px" data-lote="' + i + '" data-campo="' + k + '" value="' + esc(v == null ? '' : v) + '">';
    $('#tabLote tbody').innerHTML = this.lote.map((r, i) => r.erro
      ? '<tr><td colspan="7" class="alerta">' + esc(r.arquivo) + ': ' + esc(r.erro) + '</td><td class="botoes"><button class="mini del" data-lotetira="' + i + '">Tirar</button></td></tr>'
      : '<tr><td><label class="check"><input type="checkbox" data-lotemarca="' + i + '"' + (r.marcado !== false ? ' checked' : '') + '></label></td>' +
        '<td>' + inp(i, 'numero', r.numero, 130) + '<div class="sub">' + esc(r.arquivo) + '</div></td><td>' + inp(i, 'data', r.data ? dataBr(r.data) : '', 96) + '</td>' +
        '<td>' + inp(i, 'favorecido', r.favorecido, 180) + inp(i, 'cnpj', r.cnpj, 150) + '</td><td>' + inp(i, 'valor', r.valor != null ? moeda(r.valor) : '', 100) + '</td>' +
        '<td>' + inp(i, 'nd', r.nd, 70) + '</td><td>' + inp(i, 'solemp', r.solemp, 90) + '<div class="sub">' + esc(r.processo || '') + '</div></td>' +
        '<td class="botoes"><button class="mini del" data-lotetira="' + i + '">Tirar</button></td></tr>').join('');
  },
  lancarLote() {
    const marcados = this.lote.filter(r => !r.erro && r.marcado !== false);
    if (!marcados.length) { toast('Nenhuma nota marcada.', true); return; }
    let novas = 0, ligadas = 0;
    marcados.forEach(r => {
      const reg = this.registroNe(r);
      const L = this.nes(), i = L.findIndex(x => neNorm(x.numero) === reg.numero);
      if (i >= 0) L[i] = Object.assign(L[i], reg, { id: L[i].id }); else { L.push(reg); novas++; }
      if (this.ligarSolemp(reg)) ligadas++;
    });
    this.lote = this.lote.filter(r => r.erro || r.marcado === false);
    this.gravar(); this.renderLote();
    toast(novas + ' nota(s) nova(s) lançada(s)' + (ligadas ? ', ' + ligadas + ' ligada(s) a SOLEMP' : '') + '.');
  },
  registroNe(r) {
    const data = /^\d{2}\/\d{2}\/\d{4}$/.test(r.data || '') ? r.data.split('/').reverse().join('-') : (r.data || '');
    return { id: r.id || novoId('ne'), numero: neNorm(r.numero), ug: r.ug || '', data, favorecido: r.favorecido || '', cnpj: cnpjFmt(r.cnpj),
      valor: typeof r.valor === 'number' ? r.valor : numBR(r.valor), nd: String(r.nd || '').replace(/\D/g, ''), solemp: r.solemp || '',
      processo: r.processo || '', situacao: r.situacao || 'emitida', obs: r.obs || '' };
  },
  /* Liga a NE à SOLEMP pelo número citado na nota (ou pela NE já anotada na SOLEMP). */
  ligarSolemp(ne) {
    const L = this.solemps();
    const s = L.find(x => ne.solemp && String(x.numero).replace(/^0+/, '') === String(ne.solemp).replace(/^0+/, '')) || L.find(x => neNorm(x.ne) === ne.numero);
    if (!s) return false;
    s.ne = ne.numero;
    if (!s.fornecedor) s.fornecedor = ne.favorecido;
    if (!s.cnpj) s.cnpj = ne.cnpj;
    if (SOL_ETAPAS.findIndex(e => e.v === s.etapa) < 2) s.etapa = 'empenhada';
    return true;
  },
  renderNes() {
    const L = this.nes().slice().sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    $('#nNe').textContent = L.length;
    $('#tabNe tbody').innerHTML = L.map(n => '<tr><td class="mono">' + esc(n.numero) + '<div class="sub">' + (n.data ? dataBr(n.data) : '') + '</div></td>' +
      '<td><b>' + esc(n.favorecido || '—') + '</b><div class="sub">' + esc(n.cnpj || '') + '</div></td><td class="num">' + (n.valor != null ? moeda(n.valor) : '—') + '</td>' +
      '<td>' + esc(n.nd ? n.nd + (ND_NOMES[n.nd] ? ' · ' + ND_NOMES[n.nd] : '') : '—') + '</td><td class="mono">' + esc(n.solemp || '—') + '<div class="sub">' + esc(n.processo || '') + '</div></td>' +
      '<td><select class="mini-sel" data-nesit="' + n.id + '" aria-label="Situação da nota ' + esc(n.numero) + '">' + Object.entries(NE_SIT).map(([k, l]) =>
        '<option value="' + k + '"' + (n.situacao === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></td>' +
      '<td class="botoes"><button class="mini" data-needitar="' + n.id + '">Editar</button><button class="mini del" data-nedel="' + n.id + '">Excluir</button></td></tr>').join('');
    $('#vazioNe').classList.toggle('hidden', L.length > 0);
  },
  abrirNe(id) {
    const n = id ? this.nes().find(x => x.id === id) : { situacao: 'emitida' };
    this._ne = n;
    preencherForm($('#formNe'), Object.assign({}, n, { valor: n.valor != null ? moeda(n.valor) : '' }));
    $('#dlgNeTit').textContent = id ? 'Nota de empenho ' + n.numero : 'Lançar nota de empenho';
    $('#dlgNe').showModal();
  },
  gravarNe(f) {
    const v = lerForm(f);
    if (!/^\d{4}\s*NE\s*\d+$/i.test(v.numero.replace(/\s/g, ''))) { toast('Número da NE no formato 2026NE000183.', true); return false; }
    const reg = this.registroNe(Object.assign({}, v, { id: this._ne.id }));
    const L = this.nes(), i = L.findIndex(x => x.id === reg.id || neNorm(x.numero) === reg.numero);
    if (i >= 0) L[i] = reg; else L.push(reg);
    this.ligarSolemp(reg);
    this.gravar();
  },

  /* ============ LIMITE POR PDM ============ */
  async atualizarPdm(bt) {
    const uasg = uasgNavio();
    if (!uasg) { toast('Informe a UASG em Configurações › Dados fixos da dispensa.', true); return; }
    const rot = bt.textContent; bt.disabled = true; bt.textContent = 'Buscando…';
    try {
      await this.buscarProcessos(this.pdmAno, s => { $('#pdmStatus').textContent = s; });
      const procs = obt().processos.filter(p => String(p.ano) === this.pdmAno && String(p.uasg) === uasg && !/anulad|revogad|desert|fracassad/i.test(p.situacao || ''));
      let feitas = 0, erros = 0;
      for (const p of procs) {
        $('#pdmStatus').textContent = 'Itens da dispensa ' + p.numero + '/' + p.ano + '…';
        try {
          const a = lePncp(p.controle);
          const itens = await pncpGet('/pncp/v1/orgaos/' + a.cnpj + '/compras/' + a.ano + '/' + a.seq + '/itens?pagina=1&tamanhoPagina=200');
          obt().pdm.itens[p.controle] = { ano: String(p.ano), numero: p.numero, objeto: p.objeto,
            itens: (itens || []).filter(i => i.materialOuServico === 'M').map(i => ({ desc: i.descricao, pdm: pdmDaDescricao(i.descricao),
              valor: (i.situacaoCompraItem === 2 && p.homologado) ? null : +i.valorTotal || 0, estimado: +i.valorTotal || 0, item: i.numeroItem })) };
          feitas++;
        } catch (e) { erros++; }
      }
      obt().pdm.atualizado = new Date().toISOString();
      this.gravar();
      $('#pdmStatus').textContent = feitas + ' dispensa(s) lida(s) no PNCP' + (erros ? ', ' + erros + ' com erro' : '') + '.';
    } catch (e) { $('#pdmStatus').textContent = 'Não deu certo: ' + e.message; }
    finally { bt.disabled = false; bt.textContent = rot; }
  },
  /* soma por PDM: o que já foi publicado no PNCP e o que está planejado nas dispensas do CHEMAQ ainda não publicadas */
  resumoPdm() {
    const mapa = new Map(), ano = this.pdmAno;
    const add = (nome, valor, origem, ref) => {
      if (!nome || !(valor > 0)) return;
      const k = semAcento(nome);
      const x = mapa.get(k) || { nome, pncp: 0, plan: 0, refs: [] };
      x[origem] += valor; x.refs.push({ origem, ref, valor }); mapa.set(k, x);
    };
    Object.values(obt().pdm.itens || {}).filter(r => String(r.ano) === ano).forEach(r =>
      r.itens.forEach(i => add(i.pdm, i.valor != null ? i.valor : i.estimado, 'pncp', 'Dispensa ' + r.numero + '/' + r.ano)));
    const cat = Catmat.dados;
    const pdmDe = cod => { if (!cat || !cod) return ''; const it = cat.idx.find(x => x.c === String(cod)); return it ? cat.pdms[it.p] : ''; };
    const publicadas = new Set(obt().processos.map(p => (p.nup || '').replace(/\D/g, '')).filter(Boolean));
    (DB.dados.dispensas || []).filter(P => ehMaterial(P) && String(P.dataCapa || P.criado || '').slice(0, 4) === ano &&
      !(P.processoNum && publicadas.has(P.processoNum.replace(/\D/g, '')))).forEach(P => {
      const ref = 'CHEMAQ ' + (P.numeroDispensa || P.servicoTitulo || '');
      if (Array.isArray(P.itens) && P.itens.length) P.itens.forEach(i => add(pdmDe(i.catmat) || pdmDaDescricao(i.nome), (+i.qtd || 0) * (+i.preco || 0), 'plan', ref));
      else add(pdmDe(P.codigo) || pdmDaDescricao(P.servicoTitulo), numBR(P.valor) || 0, 'plan', ref);
    });
    return [...mapa.values()].map(x => Object.assign(x, { total: x.pncp + x.plan })).sort((a, b) => b.total - a.total);
  },
  renderPdm() {
    const lim = +obt().cfg.limitePdm || PDM_LIMITE_PADRAO;
    $('#pdmLimite').textContent = brl(lim);
    const anos = [...new Set([String(new Date().getFullYear()), String(new Date().getFullYear() - 1)].concat(Object.values(obt().pdm.itens || {}).map(r => String(r.ano))))].sort().reverse();
    $('#pdmAno').innerHTML = anos.map(a => '<option' + (a === this.pdmAno ? ' selected' : '') + '>' + a + '</option>').join('');
    if (!Catmat.dados) Catmat.carregar().then(() => this.renderPdm()).catch(() => {});
    const L = this.resumoPdm();
    $('#tabPdm tbody').innerHTML = L.map((x, i) => {
      const pct = x.total / lim * 100, cls = pct > 100 ? 'st-vencida' : pct >= 80 ? 'st-avencer' : 'st-emdia';
      return '<tr><td><b>' + esc(x.nome) + '</b><details class="sub"><summary>' + x.refs.length + ' lançamento(s)</summary>' +
        x.refs.map(r => esc(r.ref) + ' (' + (r.origem === 'pncp' ? 'PNCP' : 'planejada') + '): ' + brl(r.valor)).join('<br>') + '</details></td>' +
        '<td class="num">' + moeda(x.pncp) + '</td><td class="num">' + moeda(x.plan) + '</td><td class="num"><b>' + moeda(x.total) + '</b></td>' +
        '<td><div class="barra pdm"><i style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div><span class="selo-st ' + cls + '">' + fmt(pct, 1) + '%</span></td></tr>';
    }).join('');
    $('#vazioPdm').classList.toggle('hidden', L.length > 0);
    const at = obt().pdm.atualizado;
    if (!$('#pdmStatus').textContent) $('#pdmStatus').textContent = at ? 'PNCP lido em ' + new Date(at).toLocaleString('pt-BR') + '.' : 'Ainda sem leitura do PNCP: só as dispensas do CHEMAQ entram na soma.';
  },

  /* ============ PNCP: processos, processo avulso e atas ============ */
  /* Dispensas da UASG no ano, em janelas de três meses (o PNCP não aguenta o ano de uma vez). */
  async buscarProcessos(ano, aviso) {
    const uasg = uasgNavio(), cnpj = obt().cfg.cnpj;
    if (!uasg) throw new Error('informe a UASG em Configurações › Dados fixos da dispensa');
    const fim = ano === String(new Date().getFullYear()) ? hojeIso() : ano + '-12-31';
    const achados = [];
    for (let m = 1; m <= 12; m += 3) {
      const ini = ano + '-' + String(m).padStart(2, '0') + '-01';
      if (ini > fim) break;
      let ate = somaDias(ano + '-' + String(m + 3).padStart(2, '0').replace('13', '12') + '-01', m + 3 > 12 ? 30 : -1);
      if (m + 3 > 12) ate = ano + '-12-31';
      if (ate > fim) ate = fim;
      for (let pag = 1; pag < 20; pag++) {
        if (aviso) aviso('Consultando o PNCP: ' + dataBr(ini) + ' a ' + dataBr(ate) + (pag > 1 ? ', página ' + pag : '') + '…');
        const j = await pncpGet('/consulta/v1/contratacoes/publicacao?dataInicial=' + ymd(ini) + '&dataFinal=' + ymd(ate) +
          '&codigoModalidadeContratacao=8&cnpj=' + cnpj + '&codigoUnidadeAdministrativa=' + uasg + '&pagina=' + pag + '&tamanhoPagina=50', 90000);
        if (!j || !j.data) break;
        achados.push(...j.data);
        if (pag >= (j.totalPaginas || 1)) break;
      }
    }
    const L = obt().processos;
    achados.forEach(d => {
      const p = { controle: d.numeroControlePNCP, numero: d.numeroCompra, ano: d.anoCompra, uasg: (d.unidadeOrgao || {}).codigoUnidade || uasg,
        nup: d.processo || '', objeto: (d.objetoCompra || '').trim(), estimado: d.valorTotalEstimado, homologado: d.valorTotalHomologado,
        situacao: d.situacaoCompraNome || '', modalidade: d.modalidadeNome || 'Dispensa', publicado: String(d.dataPublicacaoPncp || '').slice(0, 10),
        abertura: String(d.dataAberturaProposta || '').slice(0, 10) };
      const i = L.findIndex(x => x.controle === p.controle);
      if (i >= 0) L[i] = Object.assign(L[i], p); else L.push(p);
    });
    obt().processosAtualizado = new Date().toISOString();
    this.gravar();
    return achados.length;
  },
  renderProcessos() {
    const uasg = uasgNavio();
    const L = obt().processos.filter(p => !uasg || String(p.uasg) === uasg).sort((a, b) => (b.publicado || '').localeCompare(a.publicado || ''));
    $('#nProc').textContent = L.length;
    const dispDe = nup => (DB.dados.dispensas || []).find(P => P.processoNum && P.processoNum.replace(/\D/g, '') === String(nup).replace(/\D/g, ''));
    $('#tabProc tbody').innerHTML = L.map(p => {
      const P = dispDe(p.nup), a = lePncp(p.controle);
      return '<tr><td class="mono">' + esc(p.numero + '/' + p.ano) + '<div class="sub">' + esc(p.nup) + '</div></td><td>' + esc(p.objeto.slice(0, 160)) + (p.objeto.length > 160 ? '…' : '') +
        '<div class="sub">' + (P ? 'No CHEMAQ: dispensa ' + esc(P.numeroDispensa || P.servicoTitulo) + ' · ' : '') + 'publicada em ' + dataBr(p.publicado) + '</div></td>' +
        '<td class="num">' + (p.estimado != null ? moeda(p.estimado) : '—') + '<div class="sub">' + (p.homologado ? 'homol. ' + moeda(p.homologado) : '') + '</div></td>' +
        '<td>' + esc(p.situacao) + '<div><select class="mini-sel" data-procfase="' + esc(p.controle) + '" aria-label="Fase do processo ' + esc(p.numero) + '"><option value="">fase…</option>' +
        FASES_PNCP.map(f => '<option' + (p.fase === f ? ' selected' : '') + '>' + f + '</option>').join('') + '</select></div></td>' +
        '<td class="botoes"><button class="mini ok" data-procver="' + esc(p.controle) + '">Anexos</button>' + (a ? '<a class="mini" href="' + linkCompra(a) + '" target="_blank" rel="noopener">PNCP</a>' : '') + '</td></tr>';
    }).join('');
    $('#vazioProc').classList.toggle('hidden', L.length > 0);
    const anos = [...new Set([String(new Date().getFullYear()), String(new Date().getFullYear() - 1)])];
    if (!$('#procAno').options.length) $('#procAno').innerHTML = anos.map(a => '<option>' + a + '</option>').join('');
  },
  /* Um processo do PNCP: anexos, histórico e itens (com o resultado de cada item, se houver). */
  async verProcesso(txt, destino) {
    const a = lePncp(txt), box = $(destino);
    if (!a) { box.innerHTML = '<p class="alerta">Não reconheci o número. Exemplo: 00394502000144-1-006056/2026, ou o endereço da página do processo no PNCP.</p>'; return; }
    box.innerHTML = '<p class="sub">Consultando o PNCP…</p>';
    const base = '/pncp/v1/orgaos/' + a.cnpj + '/compras/' + a.ano + '/' + a.seq;
    const [arq, hist, itens] = await Promise.all([base + '/arquivos', base + '/historico', base + '/itens?pagina=1&tamanhoPagina=100']
      .map(c => pncpGet(c, 30000).catch(e => ({ erro: e.message }))));
    if (arq && arq.erro && itens && itens.erro) { box.innerHTML = '<p class="alerta">Não achei esse processo no PNCP: ' + esc(arq.erro) + '.</p>'; return; }
    const lst = x => Array.isArray(x) ? x : [];
    box.innerHTML = '<div class="pncpDet"><p><a href="' + linkCompra(a) + '" target="_blank" rel="noopener">Abrir no PNCP</a></p>' +
      '<h4>Anexos</h4>' + (lst(arq).filter(x => x.statusAtivo !== false).length ? '<ul class="lista">' + lst(arq).filter(x => x.statusAtivo !== false).map(x =>
        '<li><a href="' + esc(x.url || x.uri) + '" target="_blank" rel="noopener">' + esc(x.titulo || 'arquivo') + '</a><span class="dir">' + esc(x.tipoDocumentoNome || '') + ' · ' + dataBr(String(x.dataPublicacaoPncp || '').slice(0, 10)) + '</span></li>').join('') + '</ul>' : '<p class="sub">Nenhum anexo.</p>') +
      '<h4>Itens</h4>' + (lst(itens).length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th class="num">Item</th><th>Descrição</th><th class="num">Qtd</th><th class="num">Estimado (R$)</th><th>Situação</th></tr></thead><tbody>' +
        lst(itens).map(i => '<tr><td class="num">' + i.numeroItem + '</td><td>' + esc(String(i.descricao || '').slice(0, 200)) + '<div class="sub">' + esc(i.materialOuServicoNome || '') + '</div></td><td class="num">' +
          fmt(+i.quantidade, 0) + '</td><td class="num">' + moeda(+i.valorTotal || 0) + '</td><td>' + esc(i.situacaoCompraItemNome || '') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="sub">Sem itens.</p>') +
      '<h4>Histórico</h4>' + (lst(hist).length ? '<ul class="lista">' + lst(hist).sort((x, y) => String(x.logManutencaoDataInclusao).localeCompare(String(y.logManutencaoDataInclusao))).map(h =>
        '<li><span>' + esc([h.categoriaLogManutencaoNome, h.tipoLogManutencaoNome, h.documentoTitulo].filter(Boolean).join(' · ')) + '</span><span class="dir">' +
        dataBr(String(h.logManutencaoDataInclusao || '').slice(0, 10)) + '</span></li>').join('') + '</ul>' : '<p class="sub">Sem histórico.</p>') + '</div>';
  },

  /* Atas da UASG gerenciadora (por padrão o Centro de Intendência), com vigência e filtro pelo objeto. */
  async buscarAtas(bt) {
    const cfg = obt().cfg, uasg = String($('#ataUasg').value || cfg.uasgAtas).replace(/\D/g, '');
    if (!uasg) { toast('Informe a UASG gerenciadora.', true); return; }
    cfg.uasgAtas = uasg;
    const rot = bt.textContent; bt.disabled = true; bt.textContent = 'Buscando…';
    const st = $('#ataStatus');
    try {
      const ano = new Date().getFullYear(), achadas = [];
      for (let pag = 1; pag < 40; pag++) {
        st.textContent = 'Consultando o PNCP' + (pag > 1 ? ', página ' + pag : '') + '…';
        const j = await pncpGet('/consulta/v1/atas?dataInicial=' + (ano - 1) + '0101&dataFinal=' + (ano + 1) + '1231&cnpj=' + cfg.cnpj +
          '&codigoUnidadeAdministrativa=' + uasg + '&pagina=' + pag + '&tamanhoPagina=50', 90000);
        if (!j || !j.data) break;
        achadas.push(...j.data);
        if (pag >= (j.totalPaginas || 1)) break;
      }
      obt().atas = achadas.filter(d => !d.cancelado).map(d => ({ controle: d.numeroControlePNCPAta, compra: d.numeroControlePNCPCompra, numero: d.numeroAtaRegistroPreco,
        ano: d.anoAta, objeto: (d.objetoContratacao || '').trim(), ini: d.vigenciaInicio, fim: d.vigenciaFim, uasg: d.codigoUnidadeOrgao,
        unidade: d.nomeUnidadeOrgao, adesao: d.possibilidadeAdesao }));
      obt().atasAtualizado = new Date().toISOString();
      this.gravar();
      st.textContent = obt().atas.length + ' ata(s) da UASG ' + uasg + '.';
    } catch (e) { st.textContent = 'Não deu certo: ' + e.message; }
    finally { bt.disabled = false; bt.textContent = rot; }
  },
  vigencia(a) {
    if (!a.fim) return { g: 'sem', t: '—' };
    const d = diasEntre(hojeIso(), a.fim);
    if (d < 0) return { g: 'vencida', t: 'vencida em ' + dataBr(a.fim), cls: 'st-vencida' };
    if (d <= 90) return { g: 'vencendo', t: 'vence em ' + dataBr(a.fim) + ' (' + d + ' dias)', cls: 'st-avencer' };
    return { g: 'vigente', t: 'vigente até ' + dataBr(a.fim), cls: 'st-emdia' };
  },
  renderAtas() {
    if (!$('#ataUasg').value) $('#ataUasg').value = obt().cfg.uasgAtas;
    const q = $('#ataBusca').value.trim(), sit = $('#ataSit').value;
    const L = obt().atas.map(a => ({ a, v: this.vigencia(a) })).filter(({ a, v }) => (!sit || (sit === 'vigentes' ? v.g !== 'vencida' : v.g === sit)) &&
      (!q || q.split(/\s+/).every(w => contem(a.objeto, w)))).sort((x, y) => (y.a.fim || '').localeCompare(x.a.fim || ''));
    $('#nAtas').textContent = L.length;
    $('#tabAtas tbody').innerHTML = L.slice(0, 200).map(({ a, v }) => {
      const c = lePncp(a.compra);
      return '<tr><td class="mono">' + esc(a.numero + '/' + a.ano) + '<div class="sub">' + esc(a.compra) + '</div></td><td>' + esc(a.objeto.slice(0, 220)) + (a.objeto.length > 220 ? '…' : '') +
        '<div class="sub">' + esc(a.unidade || '') + (a.adesao ? ' · admite adesão' : '') + '</div></td><td><span class="selo-st ' + (v.cls || 'st-semreg') + '">' + esc(v.t) + '</span></td>' +
        '<td class="botoes"><button class="mini ok" data-ataitens="' + esc(a.controle) + '">Itens e preços</button>' + (c ? '<a class="mini" href="https://pncp.gov.br/app/atas/' +
          c.cnpj + '/' + c.ano + '/' + c.seq + '/' + (String(a.controle).split('-').pop().replace(/^0+/, '') || '1') + '" target="_blank" rel="noopener">PNCP</a>' : '') + '</td></tr>' +
        '<tr class="hidden" data-ataitensbox="' + esc(a.controle) + '"><td colspan="4"><div></div></td></tr>';
    }).join('');
    $('#vazioAtas').classList.toggle('hidden', L.length > 0);
    $('#vazioAtas').textContent = obt().atas.length ? 'Nenhuma ata com esse filtro.' : 'Clique em “Buscar atas” para trazer as atas da UASG gerenciadora.';
  },
  /* Itens da compra que gerou a ata, com o fornecedor e o preço registrados. */
  async itensAta(controle) {
    const linha = $('[data-ataitensbox="' + CSS.escape(controle) + '"]'), box = $('div', linha);
    linha.classList.toggle('hidden');
    if (linha.classList.contains('hidden') || box.dataset.ok) return;
    const a = obt().atas.find(x => x.controle === controle), c = lePncp(a && a.compra);
    if (!c) { box.textContent = 'Número da compra não reconhecido.'; return; }
    box.innerHTML = '<p class="sub">Consultando os itens no PNCP…</p>';
    try {
      const base = '/pncp/v1/orgaos/' + c.cnpj + '/compras/' + c.ano + '/' + c.seq;
      const itens = (await pncpGet(base + '/itens?pagina=1&tamanhoPagina=200', 30000)) || [];
      const comRes = itens.filter(i => i.temResultado).slice(0, 60);
      const res = {};
      for (let k = 0; k < comRes.length; k += 6) {
        await Promise.all(comRes.slice(k, k + 6).map(i => pncpGet(base + '/itens/' + i.numeroItem + '/resultados', 30000).then(r => { res[i.numeroItem] = r || []; }).catch(() => {})));
      }
      box.dataset.ok = '1';
      box.innerHTML = itens.length ? '<div class="tabela-wrap"><table class="tabela"><thead><tr><th class="num">Item</th><th>Descrição</th><th>Fornecedor</th><th class="num">Qtd</th><th class="num">Unitário (R$)</th></tr></thead><tbody>' +
        itens.map(i => { const r = (res[i.numeroItem] || [])[0];
          return '<tr><td class="num">' + i.numeroItem + '</td><td>' + esc(String(i.descricao || '').slice(0, 180)) + '</td><td>' + esc(r ? r.nomeRazaoSocialFornecedor : '—') +
            (r ? '<div class="sub">' + esc(cnpjFmt(r.niFornecedor)) + '</div>' : '') + '</td><td class="num">' + fmt(+(r ? r.quantidadeHomologada : i.quantidade), 0) + '</td><td class="num">' +
            moeda(+(r ? r.valorUnitarioHomologado : i.valorUnitarioEstimado) || 0) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        (itens.filter(i => i.temResultado).length > 60 ? '<p class="sub">Mostrando o fornecedor dos 60 primeiros itens com resultado.</p>' : '') : '<p class="sub">Sem itens.</p>';
    } catch (e) { box.innerHTML = '<p class="alerta">' + esc(e.message) + '</p>'; }
  },

  ligar() {
    const sec = $('#tab-obtencao'); if (!sec) return;
    ligarDialogo('#dlgSol', f => this.gravarSolemp(f));
    ligarDialogo('#dlgEnt', f => this.gravarEntrega(f));
    ligarDialogo('#dlgNe', f => this.gravarNe(f));
    $('#btnNovaSol').onclick = () => this.novaSolemp();
    $('#solBusca').addEventListener('input', e => { this.busca = e.target.value.trim(); this.renderSolemps(); });
    $('#btnSolItensDisp').onclick = () => {
      const P = (DB.dados.dispensas || []).find(x => x.id === $('#solDispensa').value);
      if (!P) { toast('Escolha a dispensa.', true); return; }
      const s = this._sol.s; this.itensDaDispensa(s, P);
      $('#formSol').elements.itensTxt.value = s.itens.map(i => i.desc + ' ; ' + i.qtd + ' ; ' + moeda(i.valor)).join('\n');
      $('#formSol').elements.tipo.value = s.tipo;
    };
    $('#btnEntContato').onclick = () => this.registrarContato();
    $('#neArquivos').addEventListener('change', e => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) this.lerPdfs(fs); });
    $('#btnLoteLancar').onclick = () => this.lancarLote();
    $('#btnLoteDescartar').onclick = () => { this.lote = []; this.renderLote(); $('#neStatus').textContent = ''; };
    $('#btnNovaNe').onclick = () => this.abrirNe();
    $('#tabLote').addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.lotemarca != null) this.lote[+t.dataset.lotemarca].marcado = t.checked;
      else if (t.dataset.lote != null) this.lote[+t.dataset.lote][t.dataset.campo] = t.dataset.campo === 'valor' ? numBR(t.value) : t.value.trim();
    });
    $('#pdmAno').addEventListener('change', e => { this.pdmAno = e.target.value; $('#pdmStatus').textContent = ''; this.renderPdm(); });
    $('#btnPdmAtualizar').onclick = e => this.atualizarPdm(e.target);
    $('#btnProcBuscar').onclick = async e => {
      const bt = e.target, rot = bt.textContent; bt.disabled = true; bt.textContent = 'Buscando…';
      try { const n = await this.buscarProcessos($('#procAno').value, s => { $('#procStatus').textContent = s; }); $('#procStatus').textContent = n + ' dispensa(s) encontrada(s) no PNCP.'; }
      catch (err) { $('#procStatus').textContent = 'Não deu certo: ' + err.message; }
      finally { bt.disabled = false; bt.textContent = rot; }
    };
    $('#btnPncpBuscar').onclick = () => this.verProcesso($('#pncpNumero').value, '#pncpRes');
    $('#btnAtasBuscar').onclick = e => this.buscarAtas(e.target);
    ['#ataBusca', '#ataSit'].forEach(s => $(s).addEventListener('input', () => this.renderAtas()));
    $('#formObtCfg').addEventListener('change', () => {
      const v = lerForm($('#formObtCfg')), c = obt().cfg;
      c.cnpj = v.cnpj.replace(/\D/g, '') || '00394502000144'; c.uasgAtas = v.uasgAtas.replace(/\D/g, '') || '784810';
      c.limitePdm = numBR(v.limitePdm) || PDM_LIMITE_PADRAO;
      this.gravar();
    });

    sec.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.filtroetapa != null) { this.filtroEtapa = this.filtroEtapa === d.filtroetapa ? '' : d.filtroetapa; this.renderSolemps(); }
      else if (d.soletapa) { const [id, et] = d.soletapa.split(':'); this.mudarEtapa(id, et); }
      else if (d.solabrir) this.abrirSolemp(this.solemps().find(x => x.id === d.solabrir));
      else if (d.soldel) {
        const s = this.solemps().find(x => x.id === d.soldel);
        if (!confirmar('Excluir a SOLEMP ' + (s.numero || '') + '?')) return;
        obt().solemps = this.solemps().filter(x => x.id !== d.soldel); this.gravar();
      }
      else if (d.entabrir) this.abrirEntrega(d.entabrir);
      else if (d.lotetira != null) { this.lote.splice(+d.lotetira, 1); this.renderLote(); }
      else if (d.needitar) this.abrirNe(d.needitar);
      else if (d.nedel) { if (!confirmar('Excluir a nota de empenho?')) return; obt().nes = this.nes().filter(x => x.id !== d.nedel); this.gravar(); }
      else if (d.procver) { const box = $('#procDet'); box.classList.remove('hidden'); this.verProcesso(d.procver, '#procDetBox'); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (d.ataitens) this.itensAta(d.ataitens);
    });
    sec.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.nesit) { const n = this.nes().find(x => x.id === t.dataset.nesit); n.situacao = t.value; DB.salvar(true); }
      else if (t.dataset.procfase) { const p = obt().processos.find(x => x.controle === t.dataset.procfase); p.fase = t.value; DB.salvar(true); }
    });
  }
};
