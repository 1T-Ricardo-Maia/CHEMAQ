/* CATMAT: sugestões de código para os materiais da máquina e busca por link ou descrição.
 *
 * O site é estático (GitHub Pages) e a API do Compras.gov.br não aceita
 * chamadas de outro site (CORS). Por isso a busca usa um recorte do CATMAT
 * guardado no repositório (dados/catmat-maquinas.json: filtros, baterias,
 * correias, rotores, bombas e peças de motor de embarcação). O site também
 * não consegue abrir a página da loja; ele usa as palavras do próprio link
 * (a maioria das lojas põe o nome do produto no endereço) e o que for digitado. */
'use strict';

/* Pesquisa feita em 27/11/2026 no CATMAT para os códigos marcados como errados. */
const SUGESTOES_CATMAT = {
  fc165: { c: '611945', d: 'ELEMENTO FILTRANTE COMBUSTÍVEL - VEÍCULO AUTOMOTIVO, REFERÊNCIA: TECFIL FC165', nota: 'mesma referência (Tecfil FC165)' },
  'racor-2020pm': { c: '637612', d: 'ELEMENTO FILTRANTE, separador de água do diesel, motores diesel Scania estacionários e marítimos, REFERÊNCIA: 1671502',
    nota: 'é um elemento Racor separador de água para motor marítimo; confira se a referência 1671502 corresponde ao 2020PM' },
  'jabsco-17937': { c: '628942', d: "PEÇA/COMPONENTE MOTOR DE EMBARCAÇÃO, ROTOR DA BOMBA D'ÁGUA, MOTOR MWM 229, REFERÊNCIA: 9.229.0.890.003.4",
    nota: 'rotor da bomba de água do MWM 229 (o motor dos MCA); confira se a referência MWM corresponde ao Jabsco 17937' },
  'bateria-180': { c: '321179', d: 'BATERIA AUTOMOTIVA, 12 V, 180 AH, CHUMBO-ÁCIDA, SELADA',
    nota: 'bateria automotiva 12 V 180 Ah selada, como a Moura de partida (há também 337584, 180 Ah, mas cadastrada como estacionária)' },
  'bateria-220': { familia: 'BATERIA ESTACIONÁRIA ALTA CAPACIDADE (PDM 18982)', nota: 'não há 12 V 220 Ah; o mais próximo é 387820 (12 V 200 Ah)' },
  b125005: { familia: 'FILTRO AR (PDM 1359)', nota: 'nenhum item cita MTU 6R 199, Donaldson B125005 ou AH19497' },
  psh693: { familia: 'FILTRO ÓLEO HIDRÁULICO (PDM 7471)', nota: 'nenhum item cita PSH693, AL77061 ou máquina do leme' },
  'bauer-059183': { familia: 'PEÇA/COMPONENTE COMPRESSOR (PDM 10556)', nota: 'só há o filtro de ar do Bauer Securus (613971); o cartucho triplex não está catalogado' },
  'jabsco-17935': { familia: 'ROTOR BOMBA D\'ÁGUA (PDM 17371)', nota: 'nenhum rotor de MTU 6R 199 ou Jabsco 17935 catalogado' },
  'correia-13av1450': { familia: 'CORREIA MOTOR (PDM 17621)', nota: 'nenhuma 13AV1450; há 348455 (correia em V do MWM Delta 229 de 4 cilindros), que não é o motor dos MCA' },
  'correia-13av1045': { familia: 'CORREIA MOTOR (PDM 17621)', nota: 'nenhuma 13AV1045 catalogada' }
};

const Catmat = {
  dados: null,
  carregando: null,

  carregar() {
    if (this.dados) return Promise.resolve(this.dados);
    if (!this.carregando) {
      this.carregando = fetch('dados/catmat-maquinas.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(j => {
          j.idx = j.itens.map(([c, p, d]) => ({ c: String(c), p, d, n: Catmat.norm(d + ' ' + (j.pdms[p] || '')) }));
          this.dados = j; return j;
        }).catch(e => { this.carregando = null; throw e; });
    }
    return this.carregando;
  },

  norm: s => ' ' + String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, ' ') + ' ',

  /* Palavras úteis de um link de loja ou de um texto digitado. */
  termos(entrada) {
    let t = String(entrada || '').trim();
    if (/^https?:\/\//i.test(t)) {
      try {
        const u = new URL(t);
        t = decodeURIComponent(u.pathname + ' ' + [...u.searchParams.values()].join(' '));
      } catch (e) { /* não é um link válido: usa o texto como está */ }
    }
    const lixo = new Set(['HTTP', 'HTTPS', 'WWW', 'COM', 'BR', 'HTML', 'HTM', 'PHP', 'ASPX', 'PRODUTO', 'PRODUTOS', 'P', 'DP', 'MLB', 'ITEM',
      'DE', 'DA', 'DO', 'DAS', 'DOS', 'E', 'PARA', 'COM', 'EM', 'A', 'O', 'AS', 'OS', 'UN', 'UNIDADE', 'KIT', 'NOVO', 'ORIGINAL', 'FRETE', 'GRATIS',
      'PROMOCAO', 'OFERTA', 'SKU', 'REF', 'COD', 'ID', 'UTM', 'SOURCE', 'MEDIUM', 'CAMPAIGN']);
    const palavras = this.norm(t).trim().split(' ').filter(w => w && !lixo.has(w) && !(/^\d{8,}$/.test(w)) && !(/^[A-Z0-9]{14,}$/.test(w)) && !/^(MLB|MLA)\d+$/.test(w) && !/^B0[A-Z0-9]{8}$/.test(w));
    return [...new Set(palavras)].slice(0, 14);
  },

  /* Pontua cada item: palavra comum vale 1, referência com número (FC165, 2020PM, 180AH) vale 4. */
  buscar(entrada, max) {
    const ts = this.termos(entrada);
    if (!ts.length || !this.dados) return { termos: ts, itens: [] };
    const pesos = ts.map(w => ({ w, p: /\d/.test(w) && /[A-Z]/.test(w) || w.length >= 4 && /^\d+$/.test(w) ? 4 : w.length <= 2 ? 0.3 : 1 }));
    /* "180 AH" e "180AH" valem o mesmo */
    const variantes = w => [w, w.replace(/^(\d+)([A-Z]+)$/, '$1 $2'), w.replace(/^([A-Z]+)(\d+)$/, '$1 $2')];
    const itens = this.dados.idx.map(x => {
      let s = 0, achou = 0;
      pesos.forEach(({ w, p }) => { if (variantes(w).some(v => x.n.includes(' ' + v + ' '))) { s += p; achou++; } });
      return { x, s, achou };
    }).filter(r => r.achou >= Math.min(2, ts.length) || r.s >= 4).sort((a, b) => b.s - a.s || b.achou - a.achou).slice(0, max || 12);
    return { termos: ts, itens: itens.map(r => ({ c: r.x.c, d: r.x.d, pdm: this.dados.pdms[r.x.p] || '', s: r.s })) };
  },

  async sugerir() {
    const box = $('#catRes'), ent = $('#catEntrada').value.trim();
    if (!ent) { box.innerHTML = ''; return; }
    box.innerHTML = '<p class="hint">Carregando o catálogo…</p>';
    try { await this.carregar(); } catch (e) { box.innerHTML = '<p class="alerta">Não foi possível carregar o catálogo (' + esc(e.message) + ').</p>'; return; }
    const r = this.buscar(ent);
    const so = /^https?:\/\//i.test(ent) && r.termos.length < 2;
    box.innerHTML = '<p class="hint">Palavras usadas: ' + (r.termos.length ? r.termos.map(w => '<code>' + esc(w.toLowerCase()) + '</code>').join(' ') : '(nenhuma)') +
      (so ? '. Este link não traz o nome do produto; escreva o nome, a marca e a referência ao lado do link.' : '') + '</p>' +
      (r.itens.length ? r.itens.map(i => '<div class="catItem"><button type="button" class="mini ok" data-copiarcat="' + i.c + '">Copiar ' + i.c +
        '</button><div><b>' + i.c + '</b> · <span class="sub">' + esc(i.pdm) + '</span><div>' + esc(i.d) + '</div></div></div>').join('')
        : '<p class="hint">Nada parecido no recorte do catálogo. Tente com menos palavras (tipo, marca e referência) ou confira no catálogo oficial.</p>') +
      '<p class="hint">Confirme sempre no <a href="https://catalogo.compras.gov.br/cnbs-web/busca" target="_blank" rel="noopener">catálogo oficial do Compras.gov.br</a> ' +
      'antes de usar. O recorte tem ' + fmt(this.dados.itens.length) + ' itens ativos (cópia de ' + dataBr(this.dados.data) + ').</p>';
  },

  ligar() {
    const ent = $('#catEntrada'); if (!ent) return;
    $('#btnCatSugerir').onclick = () => this.sugerir();
    ent.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); this.sugerir(); } });
    $('#catRes').addEventListener('click', e => {
      const b = e.target.closest('[data-copiarcat]'); if (!b) return;
      navigator.clipboard.writeText(b.dataset.copiarcat).then(() => toast('CATMAT ' + b.dataset.copiarcat + ' copiado.'),
        () => toast('Não foi possível copiar; anote o código ' + b.dataset.copiarcat + '.', true));
    });
  }
};
