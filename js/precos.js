/* Pesquisa de preços pelo recurso (aba Obtenção › Pesquisa de preços).
 *
 * Ajuda a achar o CATSER/CATMAT que serve ao serviço e a montar a pesquisa de
 * preços com fontes reais (IN SEGES/ME nº 65/2021, art. 5º, I e II):
 *  - códigos candidatos vêm de recortes do catálogo guardados no repositório
 *    (dados/catser-maquinas.json e dados/catmat-maquinas.json);
 *  - preços praticados vêm da API de pesquisa de preços do Compras.gov.br. Ela
 *    não aceita chamadas de outro site (CORS), então o CHEMAQ abre a consulta
 *    numa aba nova e a pessoa cola o resultado aqui;
 *  - compras parecidas vêm do PNCP, que aceita a consulta direto do site.
 *
 * O preço de referência sai das fontes escolhidas por critério (período,
 * escopo, valores inexequíveis ou excessivos), nunca por estar perto do
 * recurso. Para caber no recurso, mudam a quantidade ou o escopo. */
'use strict';

const DADOS_ABERTOS = 'https://dadosabertos.compras.gov.br';

const Precos = {
  catser: null,
  _catser: null,
  buscando: false,

  /* ---------- estado ---------- */
  dados() {
    const d = DB.dados;
    d.precos = Object.assign({ atual: null, salvas: [], faixas: {} }, d.precos || {});
    if (!d.precos.atual) d.precos.atual = this.nova();
    return d.precos;
  },
  nova(base) {
    return Object.assign({ id: novoId('pp'), desc: '', tipo: 'S', codigo: '', codDesc: '', codTipo: 'item', recurso: '', qtd: 1,
      meses: 12, escopo: '', uf: '', limInf: 50, limSup: 200, metodo: 'auto', fontes: [], origem: null, criado: new Date().toISOString() }, base || {});
  },
  get P() { return this.dados().atual; },
  gravar(silencioso) { DB.salvar(silencioso !== false); },

  carregarCatser() {
    if (this.catser) return Promise.resolve(this.catser);
    if (!this._catser) {
      this._catser = fetch('dados/catser-maquinas.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(j => { j.idx = j.itens.map(([c, d]) => ({ c: String(c), d, n: Catmat.norm(d) })); this.catser = j; return j; })
        .catch(e => { this._catser = null; throw e; });
    }
    return this._catser;
  },

  /* Palavras do serviço, sem as que não ajudam a achar o código. */
  termos(txt) {
    const fora = new Set(['SERVICO', 'SERVICOS', 'CONTRATACAO', 'EMPRESA', 'ESPECIALIZADA', 'FORNECIMENTO', 'PECAS', 'NAVIO', 'AVHOFLU', 'RIO', 'TOCANTINS', 'BE', 'BB', 'COM', 'SEM']);
    return Catmat.termos(txt).filter(w => !fora.has(w));
  },
  /* "MOTORES" acha "MOTOR", "BOMBAS" acha "BOMBA", "REPARO" acha "REPAROS". */
  raiz: w => w.length > 5 ? w.slice(0, -2) : w.length > 3 ? w.replace(/(ES|S)$/, '') : w,
  contem(textoNorm, w) { return textoNorm.includes(' ' + this.raiz(w)); },

  /* Códigos candidatos: CATSER (serviço) ou CATMAT (material). Sinônimos comuns a bordo entram na busca. */
  async candidatos() {
    const P = this.P, ts = this.termos(P.desc);
    const sin = { REVISAO: ['MANUTENCAO'], REPARO: ['MANUTENCAO'], CONSERTO: ['MANUTENCAO', 'REPARO'], MCP: ['MOTOR', 'COMBUSTAO'], MCA: ['GERADOR', 'MOTOR'],
      DIESEL: ['COMBUSTAO'], GERADOR: ['GERADOR'], REBOBINAMENTO: ['ENROLAMENTO'], RETIFICA: ['RETIFICA'], EMBARCACAO: ['EMBARCACAO', 'NAVAL'], LANCHA: ['EMBARCACAO'],
      TURBO: ['TURBOALIMENTADOR'], TURBINA: ['TURBOALIMENTADOR'], INJETOR: ['INJETOR'], 'AR': ['AR'], CONDICIONADO: ['CONDICIONADO'], FRIGORIFICA: ['REFRIGERACAO', 'CAMARA'],
      BOMBA: ['BOMBAS'], ELETRICO: ['ELETRICOS'], QUADRO: ['PAINEIS'], PAINEL: ['PAINEIS'], CASCO: ['EMBARCACOES', 'ESTRUTURAL'], PINTURA: ['PINTURA'] };
    const ext = [...new Set(ts.concat(...ts.map(w => sin[w] || [])))];
    if (P.tipo === 'M') {
      await Catmat.carregar();
      return { termos: ts, itens: Catmat.buscar(ts.join(' '), 15).itens.map(i => ({ c: i.c, d: i.d, extra: i.pdm, pdm: this.pdmDe(i.c) })) };
    }
    const cs = await this.carregarCatser();
    const r = cs.idx.map(x => {
      let s = 0;
      ext.forEach(w => { if (this.contem(x.n, w)) s += ts.includes(w) ? (w.length > 3 ? 2 : 1) : 1; });
      return { x, s };
    }).filter(r => r.s >= 2).sort((a, b) => b.s - a.s || a.x.d.length - b.x.d.length).slice(0, 15);
    return { termos: ts, itens: r.map(({ x }) => ({ c: x.c, d: x.d })) };
  },
  pdmDe(c) {
    const it = Catmat.dados && Catmat.dados.itens.find(i => String(i[0]) === String(c));
    return it ? String(it[1]) : '';
  },

  /* ---------- Compras.gov.br: abrir a consulta e colar o resultado ---------- */
  periodo() {
    const fim = hojeIso(), d = isoParaDate(fim);
    d.setMonth(d.getMonth() - (Number(this.P.meses) || 12));
    return { ini: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), fim };
  },
  urlCompras(pagina) {
    const P = this.P, { ini, fim } = this.periodo(), pg = '?pagina=' + (pagina || 1) + '&tamanhoPagina=500';
    const datas = '&dataCompraInicio=' + ini + '&dataCompraFim=' + fim;
    if (P.tipo === 'M') return DADOS_ABERTOS + '/modulo-pesquisa-preco/1_consultarMaterial' + pg + '&tipo=' + (P.codTipo === 'pdm' ? 'codigoPdm' : 'codigoItemCatalogo') + '&codigo=' + encodeURIComponent(P.codigo) + datas;
    return DADOS_ABERTOS + '/modulo-pesquisa-preco/3_consultarServico' + pg + '&codigoItemCatalogo=' + encodeURIComponent(P.codigo) + datas;
  },
  linkCompra: id => id ? 'https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/compras/acompanhamento-compra?compra=' + encodeURIComponent(id) : '',

  colar(texto) {
    let j;
    try { j = JSON.parse(String(texto).trim()); } catch (e) {
      toast('Não reconheci o texto colado. Na aba do Compras.gov.br, use Cmd+A (ou Ctrl+A) e Cmd+C, e cole aqui.', true); return;
    }
    const lista = Array.isArray(j) ? j : j.resultado;
    if (!Array.isArray(lista)) { toast('O texto colado não tem a lista "resultado" da consulta de preços.', true); return; }
    const P = this.P, antes = P.fontes.length;
    let outros = 0;
    lista.forEach(r => {
      if (r.precoUnitario == null) return;
      if (P.codigo && P.codTipo !== 'pdm' && String(r.codigoItemCatalogo) !== String(P.codigo)) outros++;
      const k = 'cg-' + (r.idItemCompra || (r.idCompra + '-' + r.numeroItemCompra));
      if (P.fontes.some(f => f.k === k)) return;
      P.fontes.push({ k, origem: 'compras', preco: +r.precoUnitario, qtd: +r.quantidade || 1, un: r.siglaUnidadeMedida || r.nomeUnidadeMedida || '',
        orgao: (r.nomeUasg || r.nomeOrgao || '').trim() + (r.codigoUasg ? ' (' + r.codigoUasg + ')' : ''), uf: r.estado || '',
        data: String(r.dataResultado || r.dataCompra || '').slice(0, 10), objeto: (r.objetoCompra || '').trim(),
        desc: (r.descricaoDetalhadaItem || r.descricaoItem || '').trim(), fornecedor: r.nomeFornecedor || '', link: this.linkCompra(r.idCompra), codigo: r.codigoItemCatalogo });
    });
    const novos = P.fontes.length - antes;
    this.resumir();
    P.paginas = { total: j.totalRegistros, restantes: j.paginasRestantes };
    this.gravar(false);
    toast(novos + ' preço(s) novo(s) entraram na pesquisa' + (outros ? '; ' + outros + ' são de outro código, confira' : '') + '.');
  },

  /* Guarda, por código, a faixa de preços da última consulta: aparece nas sugestões de código da próxima vez. */
  resumir() {
    const P = this.P; if (!P.codigo) return;
    const { ini } = this.periodo();
    const v = P.fontes.filter(f => f.origem === 'compras' && (!f.data || f.data >= ini)).map(f => f.preco).sort((a, b) => a - b);
    if (!v.length) return;
    const c = this.dados().faixas || (this.dados().faixas = {});
    c[(P.codTipo === 'pdm' ? 'pdm' : P.tipo) + P.codigo] = { n: v.length, min: v[0], max: v[v.length - 1], med: mediana(v), data: hojeIso() };
  },
  faixa(tipo, c) { const f = (this.dados().faixas || {})[tipo + c]; return f ? 'mediana ' + brl(f.med) + ' (' + f.n + ' preços de ' + brl(f.min) + ' a ' + brl(f.max) + ', consulta de ' + dataBr(f.data) + ')' : ''; },

  /* ---------- PNCP: compras parecidas ---------- */
  async pncpGet(url, ms) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 25000);
    try {
      const r = await fetch(url, { signal: c.signal });
      if (r.status === 204) return [];
      if (!r.ok) throw new Error('o PNCP respondeu ' + r.status);
      return await r.json();
    } catch (e) {
      throw new Error(e.name === 'AbortError' ? 'o PNCP não respondeu a tempo' : e.message === 'Failed to fetch' ? 'sem acesso ao PNCP (rede ou bloqueio)' : e.message);
    } finally { clearTimeout(t); }
  },
  async trazerPncp() {
    const P = this.P, st = $('#ppPncpStatus');
    const ts = this.termos(P.desc);
    if (!ts.length) { toast('Escreva o serviço ou material primeiro.', true); return; }
    if (this.buscando) return;
    this.buscando = true;
    try {
      const { ini } = this.periodo();
      st.textContent = 'Procurando compras parecidas no PNCP…';
      const q = encodeURIComponent(ts.slice(0, 6).join(' ').toLowerCase());
      const busca = await this.pncpGet('https://pncp.gov.br/api/search/?q=' + q + '&tipos_documento=edital&ordenacao=relevancia&pagina=1&tam_pagina=30&status=todos');
      const compras = (busca.items || []).filter(c => !c.cancelado && String(c.data_publicacao_pncp || '').slice(0, 10) >= ini).slice(0, 15);
      if (!compras.length) { st.textContent = 'O PNCP não trouxe compras com essas palavras no período. Tente menos palavras.'; return; }
      const chave = ts.filter(w => w.length > 3);
      const minimo = Math.max(1, Math.ceil(chave.length / 2));
      let lidas = 0, achados = 0;
      for (const c of compras) {
        lidas++;
        st.textContent = 'Lendo os itens das compras no PNCP: ' + lidas + ' de ' + compras.length + '…';
        const base = 'https://pncp.gov.br/api/pncp/v1/orgaos/' + c.orgao_cnpj + '/compras/' + c.ano + '/' + c.numero_sequencial;
        let itens;
        try { itens = await this.pncpGet(base + '/itens?pagina=1&tamanhoPagina=100'); } catch (e) { continue; }
        for (const i of (itens || [])) {
          const n = Catmat.norm(i.descricao + ' ' + (c.description || ''));
          const mesmoCodigo = P.codigo && String(i.catalogoCodigoItem || '') === String(P.codigo);
          if (!mesmoCodigo && chave.filter(w => this.contem(n, w)).length < minimo) continue;
          if (P.tipo === 'S' && i.materialOuServico === 'M' && !mesmoCodigo) continue;
          if (P.tipo === 'M' && i.materialOuServico === 'S' && !mesmoCodigo) continue;
          const k = 'pn-' + c.numero_controle_pncp + '-' + i.numeroItem;
          if (P.fontes.some(f => f.k === k)) continue;
          let preco = null, estimado = true, fornecedor = '';
          if (i.temResultado) {
            try {
              const rs = await this.pncpGet(base + '/itens/' + i.numeroItem + '/resultados');
              const r = (rs || []).find(x => x.valorUnitarioHomologado != null);
              if (r) { preco = +r.valorUnitarioHomologado; estimado = false; fornecedor = r.nomeRazaoSocialFornecedor || ''; }
            } catch (e) { /* fica o estimado */ }
          }
          if (preco == null) preco = i.orcamentoSigiloso ? null : +i.valorUnitarioEstimado;
          if (!(preco > 0)) continue;
          achados++;
          P.fontes.push({ k, origem: 'pncp', preco, qtd: +i.quantidade || 1, un: i.unidadeMedida || '', orgao: c.orgao_nome || '', uf: c.uf || '',
            data: String(c.data_publicacao_pncp || '').slice(0, 10), objeto: (c.description || '').trim(), desc: (i.descricao || '').trim(),
            fornecedor, estimado, link: 'https://pncp.gov.br/app/editais/' + c.orgao_cnpj + '/' + c.ano + '/' + c.numero_sequencial, codigo: i.catalogoCodigoItem || '' });
        }
      }
      st.textContent = achados ? achados + ' item(ns) parecido(s) trazido(s) de ' + lidas + ' compra(s) do PNCP. Os valores só estimados entram desmarcados.' :
        'Li ' + lidas + ' compra(s) no PNCP, mas nenhum item tinha as palavras do serviço com preço aberto.';
      this.gravar(false);
    } catch (e) {
      st.textContent = 'Não consegui consultar o PNCP: ' + e.message + '.';
    } finally { this.buscando = false; }
  },
  linkPncpBusca: q => 'https://pncp.gov.br/app/editais?q=' + encodeURIComponent(q) + '&status=todos&pagina=1',

  /* ---------- análise crítica (IN 65/2021, art. 6º) ---------- */
  analisar() {
    const P = this.P, { ini } = this.periodo();
    const escopo = this.termos(P.escopo);
    const linhas = P.fontes.map(f => {
      let motivo = '';
      if (f.data && f.data < ini) motivo = 'fora do período';
      else if (P.uf && f.uf && f.uf !== P.uf) motivo = 'outra UF';
      else if (escopo.length && !escopo.some(w => this.contem(Catmat.norm(f.objeto + ' ' + f.desc), w))) motivo = 'fora do escopo';
      else if (f.estimado) motivo = 'só estimado, sem contratação';
      return { f, motivo };
    });
    const base = linhas.filter(l => !l.motivo).map(l => l.f.preco).sort((a, b) => a - b);
    const med0 = mediana(base);
    linhas.forEach(l => {
      if (l.motivo || med0 == null) return;
      if (l.f.preco < med0 * P.limInf / 100) l.motivo = 'inexequível (abaixo de ' + P.limInf + '% da mediana)';
      else if (l.f.preco > med0 * P.limSup / 100) l.motivo = 'excessivo (acima de ' + P.limSup + '% da mediana)';
    });
    linhas.forEach(l => { l.usar = l.f.usar === true || l.f.usar === false ? l.f.usar : !l.motivo; });
    const v = linhas.filter(l => l.usar).map(l => l.f.preco).sort((a, b) => a - b);
    const n = v.length, media = n ? v.reduce((s, x) => s + x, 0) / n : null;
    const dp = n > 1 ? Math.sqrt(v.reduce((s, x) => s + (x - media) ** 2, 0) / (n - 1)) : 0;
    const cv = media ? dp / media * 100 : null;
    const med = mediana(v);
    let metodo = P.metodo;
    if (metodo === 'auto') metodo = cv != null && cv <= 25 ? 'media' : 'mediana';
    const ref = metodo === 'media' ? media : metodo === 'menor' ? v[0] : med;
    return { linhas, n, min: v[0], max: v[n - 1], media, med, cv, metodo, ref: ref != null ? Math.round(ref * 100) / 100 : null };
  },

  /* ---------- tela ---------- */
  render() {
    if (!$('#ppForm')) return;
    const P = this.P, f = $('#ppForm');
    if (!f.contains(document.activeElement)) preencherForm(f, P);
    $('#ppOrigem').innerHTML = P.origem ? 'Item ' + (P.origem.item + 1) + ' da dispensa “' + esc(P.origem.titulo || '') + '”: ' + esc(P.origem.nome || '') +
      ' <button type="button" class="mini" data-ppsolta>Desligar</button>' : '';
    $('#ppCodigoSel').innerHTML = P.codigo ? '<b>' + (P.tipo === 'M' ? (P.codTipo === 'pdm' ? 'PDM ' : 'CATMAT ') : 'CATSER ') + esc(P.codigo) + '</b> ' + esc(P.codDesc || '') : 'Nenhum código escolhido.';
    const temCod = !!P.codigo;
    $('#ppPasso2').classList.toggle('apagado', !temCod);
    $('#ppAbrirCompras').href = temCod ? this.urlCompras(1) : '#';
    const pg = P.paginas && P.paginas.restantes > 0 ? P.paginas : null;
    $('#ppMaisPaginas').innerHTML = pg ? 'A consulta tem ' + fmt(pg.total) + ' registros; ainda faltam ' + pg.restantes + ' página(s): ' +
      Array.from({ length: Math.min(pg.restantes, 5) }, (_, i) => '<a href="' + esc(this.urlCompras(i + 2)) + '" target="_blank" rel="noopener">página ' + (i + 2) + '</a>').join(' · ') : '';
    $('#ppPncpLink').href = this.linkPncpBusca(this.termos(P.desc).slice(0, 6).join(' ').toLowerCase());
    this.renderFontes();
    this.renderSalvas();
  },

  renderFontes() {
    const P = this.P, a = this.analisar();
    $('#nPpFontes').textContent = P.fontes.length;
    const ord = a.linhas.slice().sort((x, y) => (y.usar - x.usar) || x.f.preco - y.f.preco);
    $('#tabPpFontes tbody').innerHTML = ord.map(({ f, motivo, usar }) => {
      const i = P.fontes.indexOf(f);
      return '<tr' + (usar ? '' : ' class="apagado"') + '><td><input type="checkbox" data-ppusar="' + i + '"' + (usar ? ' checked' : '') + ' aria-label="Usar este preço"></td>' +
        '<td class="num"><b>' + moeda(f.preco) + '</b><div class="sub">' + fmt(f.qtd, f.qtd % 1 ? 2 : 0) + ' ' + esc(f.un) + '</div></td>' +
        '<td><div title="' + esc(f.objeto) + '">' + esc(cortar(f.objeto || f.desc, 160)) + '</div>' +
        (f.desc && f.objeto ? '<div class="sub" title="' + esc(f.desc) + '">' + esc(cortar(f.desc, 120)) + '</div>' : '') +
        (motivo ? '<div class="sub alerta">' + (usar ? 'Marcado à mão apesar de: ' : 'Fora: ') + esc(motivo) + '</div>' : '') + '</td>' +
        '<td>' + esc(f.orgao) + '<div class="sub">' + esc(f.uf) + ' · ' + dataBr(f.data) + (f.fornecedor ? ' · ' + esc(cortar(f.fornecedor, 40)) : '') + '</div></td>' +
        '<td class="botoes"><span class="sub">' + (f.origem === 'pncp' ? 'PNCP' + (f.estimado ? ' (estimado)' : '') : f.origem === 'manual' ? 'manual' : 'Compras.gov') + '</span>' +
        (f.link ? '<a class="mini" href="' + esc(f.link) + '" target="_blank" rel="noopener">Ver</a>' : '') +
        '<button class="mini del" data-pptira="' + i + '">Tirar</button></td></tr>';
    }).join('');
    $('#vazioPpFontes').classList.toggle('hidden', P.fontes.length > 0);

    const nomeMet = { media: 'média', mediana: 'mediana', menor: 'menor preço' }[a.metodo];
    const qtd = num(P.qtd) || 1, total = a.ref != null ? a.ref * qtd : null, rec = numBR(P.recurso);
    const kpi = (rot, val, det, alerta) => '<div class="kpi' + (alerta ? ' alerta' : '') + '"><div class="rot">' + rot + '</div><div class="val">' + val + '</div><div class="det">' + det + '</div></div>';
    $('#ppKpis').innerHTML = kpi('Preços usados', a.n, a.n ? 'de ' + moeda(a.min) + ' a ' + moeda(a.max) : 'nenhum ainda', a.n > 0 && a.n < 3) +
      kpi('Mediana · média', a.med != null ? moeda(a.med) : '—', a.media != null ? 'média ' + moeda(a.media) + (a.cv != null ? ' · variação ' + fmt(a.cv) + '%' : '') : '') +
      kpi('Preço de referência', a.ref != null ? moeda(a.ref) : '—', a.ref != null ? 'pela ' + nomeMet + (P.metodo === 'auto' ? (a.metodo === 'media' ? ' (variação até 25%)' : ' (variação acima de 25%)') : '') : '') +
      kpi('Total estimado', total != null ? moeda(total) : '—', fmt(qtd) + ' × referência' + (rec ? ' · recurso ' + moeda(rec) : ''), rec && total > rec);
    $('#ppAvisos').innerHTML = this.avisos(a, total, rec);
    $('#ppCabe').innerHTML = this.cabe(a, rec);
    $('#btnPpAplicar').classList.toggle('hidden', !P.origem);
  },

  avisos(a, total, rec) {
    const l = [];
    if (a.n > 0 && a.n < 3) l.push('Menos de três preços: a IN 65/2021 (art. 6º, § 5º) pede justificativa da autoridade competente.');
    if (a.n && a.cv > 25 && this.P.metodo === 'media') l.push('Os preços variam mais de 25%: a média fica distorcida; prefira a mediana ou reveja o escopo das fontes.');
    if (this.P.fontes.some(f => f.usar === true) || this.P.fontes.some(f => f.usar === false)) l.push('Há fontes marcadas ou desmarcadas à mão: registre o motivo de cada uma na justificativa da pesquisa (art. 6º, § 3º).');
    if (rec && total > rec) l.push('O total passa do recurso em ' + moeda(total - rec) + '. Ajuste a quantidade ou o escopo abaixo; não troque fontes por serem caras.');
    return l.map(t => '<p class="alerta">⚠ ' + esc(t) + '</p>').join('');
  },

  /* Como caber no recurso: quantidade que cabe e o que outros órgãos contrataram com valor parecido. */
  cabe(a, rec) {
    if (!rec) return '<p class="hint">Informe o recurso disponível para ver quanto cabe.</p>';
    if (a.ref == null) return '<p class="hint">Traga os preços (passo 2) para comparar com o recurso.</p>';
    const P = this.P, qtd = num(P.qtd) || 1, total = a.ref * qtd, cabe = Math.floor(rec / a.ref);
    const partes = [];
    if (total <= rec) partes.push('<p>Cabe: o total estimado (' + brl(total) + ') fica ' + brl(rec - total) + ' abaixo do recurso' +
      (cabe > qtd ? ', e daria para ' + cabe + ' ' + (P.tipo === 'S' ? 'execuções' : 'unidades') + ' pelo mesmo preço' : '') + '.</p>');
    else if (cabe >= 1) partes.push('<p>Não cabe: com o preço de referência de ' + brl(a.ref) + ', o recurso de ' + brl(rec) + ' paga <b>' + cabe + '</b> ' +
      (P.tipo === 'S' ? 'execução(ões)' : 'unidade(s)') + ' em vez de ' + fmt(qtd) + '. <button type="button" class="mini ok" data-ppqtd="' + cabe + '">Usar ' + cabe + '</button>' +
      ' Ou mantenha a quantidade e tire do escopo o que pode esperar o próximo recurso.</p>');
    else partes.push('<p>Não cabe: o recurso de ' + brl(rec) + ' cobre <b>' + fmt(rec / total * 100) + '%</b> do total estimado (' + brl(total) + '). ' +
      'Reduza o escopo: separe o que é essencial agora (ex.: só a revisão, sem as peças acessórias; só um dos equipamentos) e deixe o resto para uma segunda dispensa, ' +
      'depois refaça a pesquisa com fontes do escopo menor (passo 3). Peça a diferença de ' + brl(total - rec) + ' se o escopo não puder ser reduzido.</p>');
    /* Escopo que cabe: fontes (de qualquer critério) cujo preço unitário fica perto do que o recurso paga por unidade. */
    const alvo = rec / qtd;
    const perto = a.linhas.filter(l => l.f.preco >= alvo * 0.7 && l.f.preco <= alvo * 1.15 && !/fora do período/.test(l.motivo))
      .sort((x, y) => Math.abs(x.f.preco - alvo) - Math.abs(y.f.preco - alvo)).slice(0, 8);
    if (perto.length) partes.push('<details><summary>O que outros órgãos contrataram por valor parecido (' + brl(alvo * 0.7) + ' a ' + brl(alvo * 1.15) + ' por unidade)</summary>' +
      '<p class="hint">Serve para redesenhar o escopo do seu serviço, não para escolher as fontes da pesquisa.</p><ul class="lista">' +
      perto.map(({ f }) => '<li><span>' + esc(cortar(f.objeto || f.desc, 200)) + '<span class="sub"> · ' + esc(f.orgao) + '</span></span><span class="dir">' + moeda(f.preco) + '</span></li>').join('') +
      '</ul></details>');
    return partes.join('');
  },

  renderSalvas() {
    const s = this.dados().salvas;
    $('#ppSalvas').innerHTML = s.length ? '<ul class="lista">' + s.map((x, i) => '<li><span>' + esc(x.desc || '(sem nome)') +
      '<span class="sub"> · ' + (x.codigo ? 'código ' + esc(x.codigo) + ' · ' : '') + x.fontes.length + ' fonte(s) · ' + new Date(x.criado).toLocaleDateString('pt-BR') + '</span></span>' +
      '<span class="dir"><button class="mini ok" data-ppabrir="' + i + '">Abrir</button><button class="mini del" data-ppdel="' + i + '">Excluir</button></span></li>').join('') + '</ul>'
      : '<p class="vazio">Nenhuma pesquisa salva.</p>';
  },

  async mostrarCandidatos() {
    const box = $('#ppCands');
    if (!this.P.desc) { box.innerHTML = '<p class="hint">Escreva o serviço ou material.</p>'; return; }
    box.innerHTML = '<p class="hint">Procurando no catálogo…</p>';
    let r;
    try { r = await this.candidatos(); } catch (e) { box.innerHTML = '<p class="alerta">Não carreguei o catálogo (' + esc(e.message) + ').</p>'; return; }
    const tipo = this.P.tipo === 'M' ? 'CATMAT' : 'CATSER';
    box.innerHTML = '<p class="hint">Palavras usadas: ' + r.termos.map(w => '<code>' + esc(w.toLowerCase()) + '</code>').join(' ') + '</p>' +
      (r.itens.length ? r.itens.map(i => '<div class="catItem"><button type="button" class="mini ok" data-ppcod="' + esc(i.c) + '" data-ppdesc="' + esc(i.d) + '">Escolher</button>' +
        (i.pdm ? '<button type="button" class="mini" data-ppcod="' + esc(i.pdm) + '" data-ppdesc="' + esc(i.extra || '') + '" data-pppdm="1" title="Preços de todos os itens desta família">PDM ' + esc(i.pdm) + '</button>' : '') +
        '<div><b>' + esc(i.c) + '</b>' + (i.extra ? ' · <span class="sub">' + esc(i.extra) + '</span>' : '') + '<div>' + esc(i.d) + '</div>' +
        (this.faixa(this.P.tipo, i.c) ? '<div class="sub">Já consultado: ' + this.faixa(this.P.tipo, i.c) + '</div>' : '') + '</div></div>').join('')
        : '<p class="hint">Nada parecido no recorte do ' + tipo + '. Tente outras palavras (ex.: “manutenção motor combustão”, “bombas”, “refrigeração”) ou digite o código abaixo.</p>') +
      '<p class="hint">Confira o código no <a href="https://catalogo.compras.gov.br/cnbs-web/busca" target="_blank" rel="noopener">catálogo oficial</a>. ' +
      'Os CATSER de manutenção são genéricos (“manutenção de motores a combustão” serve de viatura a navio): por isso o passo 3 filtra as fontes pelo escopo.</p>';
  },

  escolher(c, d, pdm) {
    const P = this.P;
    if (P.codigo && P.codigo !== c && P.fontes.length && !confirm('Trocar o código apaga os ' + P.fontes.length + ' preços já trazidos. Continuar?')) return;
    if (P.codigo !== c) P.fontes = [];
    Object.assign(P, { codigo: c, codDesc: d || '', codTipo: pdm ? 'pdm' : 'item', paginas: null });
    this.gravar(false);
  },

  /* ---------- ligação com a dispensa ---------- */
  abrirItem(n) {
    const D = Dispensa.atual; if (!D || !D.itens || !D.itens[n]) return;
    const it = D.itens[n], material = ehMaterial(D);
    const salva = it.pesquisaId && this.dados().salvas.find(s => s.id === it.pesquisaId);
    if (this.P.fontes.length || this.P.desc) this.guardar(true);
    this.dados().atual = salva ? JSON.parse(JSON.stringify(salva)) : this.nova({ desc: [it.nome, cortar(it.espec || '', 80)].filter(Boolean).join(' '), tipo: material ? 'M' : 'S',
      codigo: it.catmat || '', qtd: it.qtd || 1, recurso: '' });
    this.P.origem = { disp: D.id, item: n, nome: it.nome, titulo: D.servicoTitulo || '' };
    this.gravar(false);
    irPara('obtencao', 'precos');
    if (!this.P.codigo) this.mostrarCandidatos();
  },
  aplicar() {
    const P = this.P, a = this.analisar();
    if (!P.origem || a.ref == null) { toast('Sem preço de referência para levar.', true); return; }
    const D = (DB.dados.dispensas || []).find(x => x.id === P.origem.disp), it = D && D.itens && D.itens[P.origem.item];
    if (!it) { toast('O item da dispensa não existe mais.', true); return; }
    this.guardar(true);
    it.preco = a.ref;
    if (P.codigo && P.codTipo !== 'pdm') it.catmat = P.codigo;
    it.qtd = num(P.qtd) || it.qtd;
    it.pesquisaId = P.id;
    it.pesquisa = { metodo: a.metodo, n: a.n, ref: a.ref, data: hojeIso() };
    if (Dispensa.atual === D) { Dispensa.totalItens(); Dispensa.renderDocs(); } else DB.salvar();
    toast('Preço de referência ' + brl(a.ref) + ' levado ao item ' + (P.origem.item + 1) + ' da dispensa.');
  },
  /* Põe as fontes do item na tabela da dispensa: uma linha extra com a origem do preço. */
  decorarItens() {
    const D = Dispensa.atual; if (!D || !Array.isArray(D.itens)) return;
    $$('#tabDispItens tbody tr').forEach((tr, n) => {
      const it = D.itens[n], td = $('td.botoes', tr); if (!it || !td || $('[data-ppitem]', td)) return;
      td.insertAdjacentHTML('afterbegin', '<button class="mini ok" data-ppitem="' + n + '" title="Achar código e preços dentro do recurso">Preços</button>' +
        '<a class="mini" href="' + esc(this.linkPncpBusca(it.nome || D.servicoTitulo || '')) + '" target="_blank" rel="noopener" title="Compras parecidas no PNCP">PNCP</a>');
      if (it.pesquisa) $('td:nth-child(2)', tr).insertAdjacentHTML('beforeend', '<div class="sub">Pesquisa: ' + it.pesquisa.n + ' preço(s), ' +
        ({ media: 'média', mediana: 'mediana', menor: 'menor' }[it.pesquisa.metodo] || '') + ' de ' + dataBr(it.pesquisa.data) + '</div>');
    });
  },

  guardar(quieto) {
    const P = this.P, s = this.dados().salvas;
    if (!P.desc && !P.fontes.length) { if (!quieto) toast('Nada para salvar.', true); return; }
    const copia = JSON.parse(JSON.stringify(P)), i = s.findIndex(x => x.id === P.id);
    if (i >= 0) s[i] = copia; else s.unshift(copia);
    if (s.length > 40) s.length = 40;
    this.gravar(!!quieto);
    if (!quieto) toast('Pesquisa salva.');
  },

  /* Mapa de preços em texto com tabulação: cola certo no Word e no Excel. */
  mapa() {
    const P = this.P, a = this.analisar(), usadas = a.linhas.filter(l => l.usar);
    const cab = ['Fonte', 'Órgão (UASG)', 'UF', 'Data', 'Objeto', 'Qtd', 'Un', 'Preço unitário (R$)'];
    const linhas = usadas.map(({ f }) => [f.origem === 'pncp' ? 'PNCP' : 'Compras.gov.br (pesquisa de preços)', f.orgao, f.uf, dataBr(f.data),
      cortar((f.objeto || f.desc).replace(/\s+/g, ' '), 200), fmt(f.qtd, f.qtd % 1 ? 2 : 0), f.un, moeda(f.preco)]);
    const fora = a.linhas.filter(l => !l.usar && l.motivo).length;
    const txt = ['Pesquisa de preços: ' + (P.desc || ''), (P.tipo === 'M' ? 'CATMAT' : 'CATSER') + ' ' + (P.codigo || '—') + ' ' + (P.codDesc || ''),
      'Período: ' + dataBr(this.periodo().ini) + ' a ' + dataBr(this.periodo().fim) + ' (IN SEGES/ME nº 65/2021, art. 5º, I e II)', '',
      cab.join('\t'), ...linhas.map(l => l.join('\t')), '',
      'Preços usados: ' + a.n + ' · menor ' + moeda(a.min) + ' · maior ' + moeda(a.max) + ' · média ' + moeda(a.media) + ' · mediana ' + moeda(a.med) +
        (a.cv != null ? ' · coeficiente de variação ' + fmt(a.cv, 1) + '%' : ''),
      'Preço de referência (' + ({ media: 'média', mediana: 'mediana', menor: 'menor preço' }[a.metodo]) + '): R$ ' + moeda(a.ref),
      fora ? fora + ' preço(s) desconsiderado(s) na análise crítica: fora do período, da UF ou do escopo, só estimados, ou abaixo de ' + P.limInf + '% / acima de ' + P.limSup + '% da mediana.' : ''].join('\n');
    navigator.clipboard.writeText(txt).then(() => toast('Mapa de preços copiado. Cole no Word ou no Excel.'),
      () => toast('Não foi possível copiar.', true));
  },

  ligar() {
    const f = $('#ppForm'); if (!f) return;
    f.addEventListener('input', e => {
      const P = this.P, el = e.target, n = el.name; if (!n || n === 'codigo') return;
      if (n === 'tipo' && P.tipo !== el.value) { P.tipo = el.value; P.codigo = ''; P.codDesc = ''; P.fontes = []; this.gravar(false); $('#ppCands').innerHTML = ''; return; }
      P[n] = ['meses', 'limInf', 'limSup'].includes(n) ? (num(el.value) || P[n]) : el.value;
      this.gravar(true);
      if (n !== 'desc') this.renderFontes();
    });
    f.addEventListener('change', e => { if (e.target.name === 'codigo') { this.escolher(e.target.value.replace(/\D/g, ''), '', false); } else this.render(); });
    f.addEventListener('submit', e => e.preventDefault());
    $('#btnPpCands').onclick = () => this.mostrarCandidatos();
    $('#ppCands').addEventListener('click', e => {
      const b = e.target.closest('[data-ppcod]'); if (!b) return;
      this.escolher(b.dataset.ppcod, b.dataset.ppdesc, !!b.dataset.pppdm);
    });
    $('#ppColar').addEventListener('paste', e => {
      const t = (e.clipboardData || window.clipboardData).getData('text'); e.preventDefault(); this.colar(t);
    });
    $('#btnPpColar').onclick = () => { const t = $('#ppColar').value; if (t.trim()) { this.colar(t); $('#ppColar').value = ''; } };
    $('#btnPpPncp').onclick = () => this.trazerPncp();
    $('#btnPpManual').onclick = () => {
      const preco = numBR($('#ppManPreco').value), org = $('#ppManOrg').value.trim();
      if (!(preco > 0) || !org) { toast('Informe o preço e a fonte (empresa, site ou órgão).', true); return; }
      this.P.fontes.push({ k: novoId('man'), origem: 'manual', preco, qtd: 1, un: '', orgao: org, uf: '', data: hojeIso(), objeto: $('#ppManObj').value.trim(), desc: '', link: '' });
      $('#ppManPreco').value = ''; $('#ppManOrg').value = ''; $('#ppManObj').value = '';
      this.gravar(false);
    };
    $('#tabPpFontes').addEventListener('click', e => {
      const t = e.target.closest('[data-pptira]');
      if (t) { this.P.fontes.splice(Number(t.dataset.pptira), 1); this.gravar(false); }
    });
    $('#tabPpFontes').addEventListener('change', e => {
      const c = e.target.closest('[data-ppusar]'); if (!c) return;
      const fo = this.P.fontes[Number(c.dataset.ppusar)];
      const auto = !this.analisar().linhas.find(l => l.f === fo).motivo;
      fo.usar = c.checked === auto ? undefined : c.checked;
      this.gravar(false);
    });
    $('#tab-obtencao').addEventListener('click', e => {
      const q = e.target.closest('[data-ppqtd]'); if (q) { this.P.qtd = Number(q.dataset.ppqtd); this.gravar(false); return; }
      if (e.target.closest('[data-ppsolta]')) { this.P.origem = null; this.gravar(false); return; }
      const ab = e.target.closest('[data-ppabrir]');
      if (ab) { this.guardar(true); this.dados().atual = JSON.parse(JSON.stringify(this.dados().salvas[Number(ab.dataset.ppabrir)])); this.gravar(false); window.scrollTo({ top: 0 }); return; }
      const del = e.target.closest('[data-ppdel]');
      if (del && confirm('Excluir esta pesquisa salva?')) { this.dados().salvas.splice(Number(del.dataset.ppdel), 1); this.gravar(false); }
    });
    $('#btnPpNova').onclick = () => { this.guardar(true); this.dados().atual = this.nova(); this.gravar(false); $('#ppCands').innerHTML = ''; };
    $('#btnPpSalvar').onclick = () => this.guardar();
    $('#btnPpMapa').onclick = () => this.mapa();
    $('#btnPpAplicar').onclick = () => this.aplicar();
    $('#tabDispItens').addEventListener('click', e => {
      const b = e.target.closest('[data-ppitem]'); if (b) { e.preventDefault(); this.abrirItem(Number(b.dataset.ppitem)); }
    });
    /* A tabela de itens da dispensa é redesenhada pela aba Dispensa; os botões entram depois de cada desenho. */
    const orig = Dispensa.renderItens;
    Dispensa.renderItens = function () { orig.apply(this, arguments); Precos.decorarItens(); };
  }
};

function mediana(v) {
  if (!v.length) return null;
  const s = v.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function cortar(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }
