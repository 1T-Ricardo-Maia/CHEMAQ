/* Combustível (ODM). Dois jeitos de lançar:
 *  - colar a mensagem de sondagem do WhatsApp (o jeito do dia a dia a bordo);
 *  - lançar o dia por motor (litros e horas), que também soma horímetros.
 * O histórico da planilha CONTROLE CLG.xlsx pode ser importado de uma vez.
 * O ROB segue o saldo calculado; quando há sondagem, a diferença fica
 * registrada e a conta segue a partir do valor medido (BE + BB, sem o
 * tanque de serviço, como na planilha). Cada lançamento pode ter um trecho
 * ("Breves x Ponta Negra"); com a distância do trecho em milhas, o site tira
 * a média de litros por milha e planeja o consumo das próximas comissões. */
'use strict';

const CORES_SERIE = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

function corMotor(idx) {
  return getComputedStyle(document.documentElement).getPropertyValue(CORES_SERIE[idx % CORES_SERIE.length]).trim();
}
function somaMotores(l) {
  return Object.values(l.consumos || {}).reduce((s, c) => s + (num(c.litros) || 0), 0);
}
/* Consumo do lançamento: o informado na sondagem vale mais que a soma por motor. */
function consumoTotal(l) {
  const dec = num(l.consumo);
  return dec != null ? dec : somaMotores(l);
}
function temMotores(l) { return Object.keys(l.consumos || {}).length > 0; }

/* "Breves x Ponta Negra", "breves X ponta negra" e "(Breves x Ponta Negra )" são o mesmo trecho. */
function chaveTrecho(nome) {
  return String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[()]/g, ' ').replace(/\s*\bx\b\s*/g, ' x ').replace(/\s+/g, ' ').trim();
}

function carregarScript(url) {
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = url; s.onload = ok; s.onerror = () => falha(new Error('sem internet para carregar o leitor de planilhas'));
    document.head.appendChild(s);
  });
}

const Comb = {
  /* ───────── cálculos ───────── */

  ordenados() {
    return DB.dados.combustivel.slice().sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')));
  },

  /* Lançamentos em ordem cronológica, já com o ROB de cada um. */
  serie() {
    const lista = this.ordenados();
    let rob = num(DB.dados.combConfig.robInicial);
    if (rob == null && lista.length) rob = num(lista[0].anterior);
    return lista.map(l => {
      const consumo = consumoTotal(l);
      const recebido = num(l.recebido) || 0;
      const transferido = num(l.transferido) || 0;
      const calc = rob == null ? null : rob - consumo + recebido - transferido;
      const medido = num(l.robMedido);
      const dif = medido != null && calc != null ? medido - calc : null;
      rob = medido != null ? medido : calc;
      const milhas = this.milhasDe(l);
      return { l, consumo, recebido, transferido, calc, medido, dif, rob, milhas, lpm: milhas ? consumo / milhas : null };
    });
  },

  robAtual() {
    const s = this.serie();
    return s.length ? s[s.length - 1].rob : num(DB.dados.combConfig.robInicial);
  },

  /* Litros por dia nos últimos n lançamentos, dividindo pelo período que eles cobrem
   * (uma sondagem pode valer por vários dias). */
  mediaDiaria(n, filtro) {
    const s = this.serie();
    const pares = [];
    for (let i = 1; i < s.length; i++) {
      if (filtro && !filtro(s[i])) continue;
      const dias = Math.max(1, diasEntre(s[i - 1].l.data, s[i].l.data));
      if (s[i].consumo > 0) pares.push({ litros: s[i].consumo, dias });
    }
    const ult = pares.slice(-n);
    if (!ult.length) {
      if (s.length === 1 && s[0].consumo) return s[0].consumo;
      return null;
    }
    return ult.reduce((a, p) => a + p.litros, 0) / ult.reduce((a, p) => a + p.dias, 0);
  },

  /* Consumo por dia parado (lançamentos sem trecho). */
  mediaPorto() { return this.mediaDiaria(10, x => !x.l.trecho); },

  trecho(nome) {
    const k = chaveTrecho(nome);
    return k ? (DB.dados.trechos || []).find(t => chaveTrecho(t.nome) === k) || null : null;
  },
  milhasDe(l) {
    const p = num(l.milhas);
    if (p != null) return p;
    return this.milhasTrecho(l.trecho);
  },
  /* Milhas de um trecho: a digitada pelo usuário vale mais; senão, a da tabela de distâncias. */
  milhasTrecho(nome) {
    if (!nome) return null;
    const t = this.trecho(nome);
    return t && num(t.milhas) != null ? num(t.milhas) : Dist.milhas(nome);
  },
  garantirTrecho(nome) {
    if (!nome || this.trecho(nome)) return;
    (DB.dados.trechos = DB.dados.trechos || []).push({ id: novoId('tr'), nome: nome.trim(), milhas: '' });
  },

  /* Médias por trecho e geral (litros por milha náutica). */
  estatTrechos() {
    const s = this.serie();
    const grupos = {};
    (DB.dados.trechos || []).forEach(t => { grupos[chaveTrecho(t.nome)] = { t, n: 0, litros: 0, lComMilha: 0, milhas: 0, ultima: '' }; });
    s.forEach(x => {
      if (!x.l.trecho || !x.consumo) return;
      const k = chaveTrecho(x.l.trecho);
      const g = grupos[k] || (grupos[k] = { t: { nome: x.l.trecho, milhas: '' }, n: 0, litros: 0, lComMilha: 0, milhas: 0, ultima: '' });
      g.n++; g.litros += x.consumo;
      if (x.milhas) { g.lComMilha += x.consumo; g.milhas += x.milhas; }
      if (x.l.data > g.ultima) g.ultima = x.l.data;
    });
    const lista = Object.values(grupos).map(g => Object.assign(g, {
      media: g.n ? g.litros / g.n : null, lpm: g.milhas ? g.lComMilha / g.milhas : null
    })).sort((a, b) => (b.ultima || '').localeCompare(a.ultima || '') || a.t.nome.localeCompare(b.t.nome));
    const tl = lista.reduce((a, g) => a + g.lComMilha, 0), tm = lista.reduce((a, g) => a + g.milhas, 0);
    return { lista, lpm: tm ? tl / tm : null, milhas: tm };
  },

  /* ───────── telas ───────── */

  renderKpis() {
    const rob = this.robAtual();
    const cap = num(DB.dados.combConfig.capacidade);
    const ult = this.ordenados().filter(l => num(l.robMedido) != null).pop();
    const mes = hojeIso().slice(0, 7);
    const doMes = DB.dados.combustivel.filter(l => l.data.startsWith(mes)).reduce((a, l) => a + consumoTotal(l), 0);
    const est = this.estatTrechos();
    const porto = this.mediaPorto();
    $('#kpisComb').innerHTML =
      kpi('ROB (BE + BB)', fmt(rob), 'L', (cap && rob != null ? fmt(rob / cap * 100) + '% da capacidade · ' : '') +
        (ult ? 'sondagem de ' + dataBr(ult.data) : 'calculado')) +
      kpi('Consumo no mês', fmt(doMes), 'L', new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })) +
      kpi('Consumo por milha', est.lpm != null ? fmt(est.lpm, 1) : '—', 'L/nm',
        est.lpm != null ? 'média de ' + fmt(est.milhas) + ' nm navegadas' : 'informe as milhas dos trechos') +
      kpi('Autonomia navegando', rob != null && est.lpm ? fmt(rob / est.lpm) : '—', 'nm', est.lpm ? 'com o ROB atual, sem reserva' : 'precisa da média por milha') +
      kpi('Parado', porto != null ? fmt(porto) : '—', 'L/dia', 'lançamentos sem trecho');
  },

  colunasMotores() {
    const usados = new Set();
    DB.dados.combustivel.forEach(l => Object.keys(l.consumos || {}).forEach(k => usados.add(k)));
    return DB.consumidores().filter(m => usados.has(m.id));
  },

  renderTabela() {
    const motores = this.colunasMotores();
    const s = this.serie().reverse();
    const tanque = (l, m) => l != null ? fmt(num(l)) + (m != null && m !== '' ? '<div class="sub">' + fmt(num(m), 2) + ' m</div>' : '') : '—';
    $('#nComb').textContent = s.length;
    $('#tabComb thead').innerHTML = '<tr><th>Data</th><th>Trecho / situação</th>' +
      motores.map(m => '<th class="num">' + esc(m.tag || m.nome) + '<div class="sub">L · h</div></th>').join('') +
      '<th class="num">BE</th><th class="num">BB</th><th class="num">Consumo</th><th class="num">Recebido</th>' +
      '<th class="num">ROB calc.</th><th class="num">Sondagem</th><th class="num">Milhas</th><th class="num">L/nm</th><th></th></tr>';
    $('#tabComb tbody').innerHTML = s.map(x => {
      const l = x.l;
      const sub = [l.trecho ? esc(l.situacao) : '', l.dia ? 'dia ' + esc(l.dia) : '', esc(l.comissao || ''), esc(l.obs || '')].filter(Boolean).join(' · ');
      return '<tr><td>' + dataBr(l.data) + (l.origem === 'planilha' ? '<div class="sub">planilha</div>' : '') + '</td>' +
        '<td>' + esc(l.trecho || l.situacao || '') + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</td>' +
        motores.map(m => {
          const c = (l.consumos || {})[m.id];
          return '<td class="num">' + (c && (c.litros || c.horas) ? fmt(num(c.litros)) + '<div class="sub">' + fmt(num(c.horas), 1) + ' h</div>' : '—') + '</td>';
        }).join('') +
        '<td class="num">' + tanque(l.beL, l.beM) + '</td><td class="num">' + tanque(l.bbL, l.bbM) + '</td>' +
        '<td class="num"><b>' + fmt(x.consumo) + '</b></td>' +
        '<td class="num">' + (x.recebido ? fmt(x.recebido) : '—') + (x.transferido ? '<div class="sub">−' + fmt(x.transferido) + ' transf.</div>' : '') + '</td>' +
        '<td class="num">' + fmt(x.calc) + '</td>' +
        '<td class="num">' + (x.medido != null ? fmt(x.medido) + (x.dif != null ? '<div class="sub' + (Math.abs(x.dif) > Sondagem.TOLERANCIA ? ' dif-neg' : '') + '">' +
          (x.dif >= 0 ? '+' : '') + fmt(x.dif) + '</div>' : '') : '—') + '</td>' +
        '<td class="num">' + (x.milhas ? fmt(x.milhas) : '—') + '</td><td class="num">' + (x.lpm != null ? fmt(x.lpm, 1) : '—') + '</td>' +
        '<td class="botoes"><button class="mini" data-cpcomb="' + l.id + '" title="Copiar a linha no formato do Registro da planilha CONTROLE CLG">Copiar</button>' +
        '<button class="mini" data-edcomb="' + l.id + '">Editar</button>' +
        '<button class="mini del" data-delcomb="' + l.id + '">Excluir</button></td></tr>';
    }).join('');
    $('#vazioComb').classList.toggle('hidden', s.length > 0);
  },

  renderTrechos() {
    const est = this.estatTrechos();
    $('#nTrechos').textContent = est.lista.length;
    $('#tabTrechos tbody').innerHTML = est.lista.map(g => {
      const tab = Dist.milhas(g.t.nome), proprio = num(g.t.milhas) != null;
      return '<tr><td>' + esc(g.t.nome) + (g.ultima ? '<div class="sub">último em ' + dataBr(g.ultima) + '</div>' : '') + '</td>' +
      '<td class="num">' + g.n + '</td><td class="num">' + (g.media != null ? fmt(g.media) : '—') + '</td>' +
      '<td class="num">' + campoMilhas('data-milhas="' + esc(g.t.nome) + '"', proprio ? g.t.milhas : tab, !proprio && tab != null, tab, 'Milhas de ' + g.t.nome) + '</td>' +
      '<td class="num">' + (g.lpm != null ? fmt(g.lpm, 1) : '—') + '</td>' +
      '<td class="botoes">' + (g.t.id ? '<button class="mini del" data-deltrecho="' + g.t.id + '">Excluir</button>' : '') + '</td></tr>';
    }).join('');
    $('#vazioTrechos').classList.toggle('hidden', est.lista.length > 0);
    $('#listaTrechos').innerHTML = est.lista.map(g => '<option value="' + esc(g.t.nome) + '">').join('');
  },

  renderRendimento() {
    const motores = DB.consumidores();
    $('#cardRend').classList.toggle('hidden', !this.colunasMotores().length);
    const lancs = this.ordenados();
    $('#tabRend tbody').innerHTML = motores.map(m => {
      const soma = ls => ls.reduce((a, l) => {
        const c = (l.consumos || {})[m.id] || {};
        a.l += num(c.litros) || 0; a.h += num(c.horas) || 0; return a;
      }, { l: 0, h: 0 });
      const t = soma(lancs);
      const r = soma(lancs.filter(l => (l.consumos || {})[m.id] && num(l.consumos[m.id].horas)).slice(-7));
      return '<tr><td>' + esc(DB.nomeEquip(m.id)) + '</td><td class="num">' + fmt(t.h, 1) + '</td><td class="num">' + fmt(t.l) + '</td>' +
        '<td class="num">' + (t.h ? fmt(t.l / t.h, 1) : '—') + '</td><td class="num">' + (r.h ? fmt(r.l / r.h, 1) : '—') + '</td></tr>';
    }).join('');
  },

  /* Barras por lançamento: empilhadas por motor no lançamento por motor, barra única na sondagem. */
  renderGrafico() {
    const host = $('#graficoComb');
    const motores = this.colunasMotores();
    const s = this.serie().slice(-30);
    if (!s.length) { host.innerHTML = '<p class="vazio">O gráfico aparece depois dos primeiros lançamentos.</p>'; return; }
    const kTotal = motores.length;
    const W = 800, H = 230, mE = 46, mD = 8, mT = 10, mB = 26;
    const max = Math.max(...s.map(x => x.consumo), 1);
    const passo = Math.pow(10, Math.floor(Math.log10(max)));
    const topo = Math.ceil(max / passo) * passo;
    const y = v => mT + (H - mT - mB) * (1 - v / topo);
    const larg = (W - mE - mD) / s.length;
    const lb = Math.max(4, Math.min(28, larg * 0.62));
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Consumo de combustível por lançamento">';
    for (let i = 0; i <= 4; i++) {
      const v = topo * i / 4;
      svg += '<line class="grade" x1="' + mE + '" x2="' + (W - mD) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="eixo" x="' + (mE - 6) + '" y="' + (y(v) + 3.5) + '" text-anchor="end">' + fmt(v) + '</text>';
    }
    const cadaRotulo = Math.ceil(s.length / 10);
    let usouTotal = false;
    s.forEach((x, i) => {
      const cx = mE + larg * i + larg / 2;
      let acum = 0;
      let partes = num(x.l.consumo) == null && temMotores(x.l)
        ? motores.map((m, k) => ({ k, v: num(((x.l.consumos || {})[m.id] || {}).litros) || 0 })).filter(p => p.v > 0)
        : [];
      if (!partes.length && x.consumo > 0) { partes = [{ k: kTotal, v: x.consumo }]; usouTotal = true; }
      partes.forEach((p, j) => {
        const y0 = y(acum), y1 = y(acum + p.v);
        const topoSeg = j === partes.length - 1;
        const h = Math.max(0, y0 - y1 - (topoSeg ? 0 : 2));
        svg += topoSeg
          ? '<path d="' + barraArredondada(cx - lb / 2, y1, lb, y0 - y1, Math.min(4, lb / 2)) + '" fill="' + corMotor(p.k) + '"/>'
          : '<rect x="' + (cx - lb / 2) + '" y="' + (y1 + 2) + '" width="' + lb + '" height="' + h + '" fill="' + corMotor(p.k) + '"/>';
        acum += p.v;
      });
      svg += '<rect class="alvo" data-i="' + i + '" x="' + (mE + larg * i) + '" y="' + mT + '" width="' + larg + '" height="' + (H - mT - mB) + '" fill="transparent"/>';
      if (i % cadaRotulo === 0) svg += '<text class="eixo" x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + dataBr(x.l.data).slice(0, 5) + '</text>';
    });
    svg += '<line class="base" x1="' + mE + '" x2="' + (W - mD) + '" y1="' + y(0) + '" y2="' + y(0) + '"/></svg>';
    const itens = motores.map((m, k) => '<span><i class="cor" style="background:' + corMotor(k) + '"></i>' + esc(m.tag || m.nome) + '</span>');
    if (usouTotal && motores.length) itens.push('<span><i class="cor" style="background:' + corMotor(kTotal) + '"></i>Sondagem (total)</span>');
    host.innerHTML = svg + (itens.length > 1 ? '<div class="legenda">' + itens.join('') + '</div>' : '');
    $('#combPeriodo').textContent = s.length < 30 ? s.length + ' lançamentos' : 'últimos 30 lançamentos';

    const dica = $('#dica');
    $$('.alvo', host).forEach(r => {
      r.addEventListener('mousemove', ev => {
        const x = s[r.dataset.i];
        const porMotor = num(x.l.consumo) == null && temMotores(x.l);
        dica.innerHTML = '<b>' + dataBr(x.l.data) + '</b> · ' + esc(x.l.trecho || x.l.situacao || '') + '<br>' +
          (porMotor ? motores.map(m => {
            const c = (x.l.consumos || {})[m.id] || {};
            return esc(m.tag || m.nome) + ': <b>' + fmt(num(c.litros) || 0) + ' L</b>' + (num(c.horas) ? ' em ' + fmt(num(c.horas), 1) + ' h' : '');
          }).join('<br>') + '<br>' : '') +
          'Consumo: <b>' + fmt(x.consumo) + ' L</b>' + (x.lpm != null ? '<br>' + fmt(x.milhas) + ' nm · <b>' + fmt(x.lpm, 1) + ' L/nm</b>' : '') +
          (x.medido != null ? '<br>ROB: <b>' + fmt(x.medido) + ' L</b>' : '');
        dica.hidden = false;
        const bx = Math.min(ev.clientX + 14, window.innerWidth - dica.offsetWidth - 8);
        dica.style.left = bx + 'px'; dica.style.top = (ev.clientY + 14) + 'px';
      });
      r.addEventListener('mouseleave', () => { dica.hidden = true; });
    });
  },

  /* ───────── planejamento ───────── */

  plano() {
    const p = DB.dados.planoComb = DB.dados.planoComb || {};
    if (!Array.isArray(p.pernas) || !p.pernas.length) p.pernas = [{ trecho: '', milhas: '' }];
    if (p.reserva == null) p.reserva = '10';
    return p;
  },

  renderPlano() {
    const p = this.plano();
    $('#planoPernas').innerHTML = p.pernas.map((x, i) => {
      const auto = this.milhasTrecho(x.trecho), proprio = num(x.milhas) != null;
      return '<tr data-perna="' + i + '"><td><input type="text" list="listaTrechos" data-pc="trecho" value="' + esc(x.trecho) + '" placeholder="Belém x Breves" aria-label="Trecho ' + (i + 1) + '"></td>' +
      '<td class="num">' + campoMilhas('data-pc="milhas"', proprio ? x.milhas : auto, !proprio && auto != null, auto, 'Milhas do trecho ' + (i + 1), auto != null ? origemMilhas(x.trecho) : '') + '</td>' +
      '<td class="num" data-saida="lpm"></td><td class="num" data-saida="litros"></td>' +
      '<td class="botoes"><button class="mini del" data-delperna="' + i + '" aria-label="Remover trecho ' + (i + 1) + '">×</button></td></tr>';
    }).join('');
    preencherForm($('#formPlano'), p);
    this.calcPlano();
  },

  /* Recalcula só os números do plano, sem redesenhar os campos (o cursor fica onde está). */
  calcPlano() {
    const p = this.plano();
    const est = this.estatTrechos();
    const porto = this.mediaPorto();
    let milhas = 0, litros = 0, semMedia = 0;
    $$('#planoPernas tr').forEach((tr, i) => {
      const x = p.pernas[i] || {};
      const nm = num(x.milhas) != null ? num(x.milhas) : this.milhasTrecho(x.trecho);
      const t = x.trecho ? est.lista.find(g => chaveTrecho(g.t.nome) === chaveTrecho(x.trecho)) : null;
      const lpm = t && t.lpm != null ? t.lpm : est.lpm;
      const l = nm && lpm != null ? nm * lpm : null;
      if (nm) milhas += nm;
      if (l != null) litros += l; else if (nm) semMedia++;
      $('[data-saida=lpm]', tr).innerHTML = lpm != null ? fmt(lpm, 1) + '<div class="sub">' + (t && t.lpm != null ? 'do trecho' : 'média geral') + '</div>' : '—';
      $('[data-saida=litros]', tr).textContent = l != null ? fmt(l) : '—';
    });
    const dias = num(p.diasPorto) || 0;
    const lDia = num(p.litrosDia) != null ? num(p.litrosDia) : porto;
    const parado = dias && lDia != null ? dias * lDia : 0;
    const subtotal = litros + parado;
    const margem = subtotal * (num(p.reserva) || 0) / 100;
    const total = subtotal + margem;
    const rob = this.robAtual();
    const sobra = rob != null ? rob - total : null;
    $('[name=litrosDia]', $('#formPlano')).placeholder = porto != null ? fmt(porto) + ' (média)' : 'L/dia';
    $('#planoResumo').innerHTML =
      linhaPlano('Navegando', fmt(milhas) + ' nm', fmt(litros) + ' L') +
      linhaPlano('Parado', fmt(dias) + ' dias × ' + (lDia != null ? fmt(lDia) : '—') + ' L/dia', fmt(parado) + ' L') +
      linhaPlano('Margem', fmt(num(p.reserva) || 0) + '%', fmt(margem) + ' L') +
      linhaPlano('<b>Consumo previsto</b>', '', '<b>' + fmt(total) + ' L</b>') +
      linhaPlano('ROB atual', '', fmt(rob) + ' L') +
      linhaPlano('<b>ROB ao fim da comissão</b>', '', '<b class="' + (sobra != null && sobra < 0 ? 'dif-neg' : '') + '">' + fmt(sobra) + ' L</b>');
    const avisos = [];
    if (semMedia) avisos.push(semMedia + ' trecho(s) sem média de consumo: lance sondagens com trecho e informe as milhas na tabela de trechos.');
    if (sobra != null && sobra < 0) avisos.push('O ROB não cobre a comissão: faltam ' + fmt(-sobra) + ' L. Programe recebimento.');
    $('#planoAviso').textContent = avisos.join(' ');
    $('#planoAviso').classList.toggle('hidden', !avisos.length);
  },

  /* ───────── sondagem pela mensagem ───────── */

  abrirColar() {
    const dlg = $('#dlgSond');
    $('#txtSond').value = '';
    this._lidas = [];
    this.previa();
    dlg.showModal();
    $('#txtSond').focus();
  },

  duplicada(r) {
    return DB.dados.combustivel.find(l => l.data === r.data && num(r.consumo) != null && consumoTotal(l) === num(r.consumo)) || null;
  },

  previa() {
    const lidas = this._lidas = Sondagem.lerTudo($('#txtSond').value);
    const host = $('#previaSond');
    if (!lidas.length) { host.innerHTML = '<p class="hint">Cole acima uma ou mais mensagens. Os campos aparecem aqui para conferir antes de lançar.</p>'; $('#btnLancarSond').disabled = true; return; }
    host.innerHTML = lidas.map((r, i) => {
      const dup = this.duplicada(r);
      const v = (rot, val, un) => '<div><span>' + rot + '</span><b>' + (val == null || val === '' ? '—' : val) + (un && val != null ? ' ' + un : '') + '</b></div>';
      return '<div class="lida' + (dup ? ' dup' : '') + '"><label class="check"><input type="checkbox" data-lida="' + i + '"' + (dup || r.consumo == null ? '' : ' checked') + '> ' +
        '<b>' + (r.data ? dataBr(r.data) : 'sem data') + '</b>' + (r.trecho ? ' · ' + esc(r.trecho) : '') + (r.comissao ? ' · ' + esc(r.comissao) : '') + '</label>' +
        '<div class="campos">' +
        v('Anterior', fmt(r.anterior), 'L') + v('Atual', fmt(r.atual), 'L') + v('Consumo', r.consumo != null ? fmt(r.consumo) : null, 'L') +
        v('BE', r.beL != null ? fmt(r.beL) + (r.beM != null ? ' L · ' + fmt(r.beM, 2) + ' m' : ' L') : null) +
        v('BB', r.bbL != null ? fmt(r.bbL) + (r.bbM != null ? ' L · ' + fmt(r.bbM, 2) + ' m' : ' L') : null) +
        v('Serviço', r.servico != null ? fmt(r.servico) : null, 'L') +
        (r.recebido != null ? v('Recebido', fmt(r.recebido), 'L') : '') + (r.transferido != null ? v('Transferido', fmt(r.transferido), 'L') : '') +
        (r.dia != null ? v('Dia da comissão', r.dia) : '') +
        (r.aguada != null || r.consumoAgua != null ? v('Aguada', fmt(r.aguada), 'L') + v('Consumo de água', fmt(r.consumoAgua), 'L') : '') +
        '</div>' +
        (dup ? '<p class="aviso">Já existe lançamento em ' + dataBr(r.data) + ' com ' + fmt(num(r.consumo)) + ' L. Marque só se for outra sondagem.</p>' : '') +
        r.avisos.map(a => '<p class="aviso">' + esc(a) + '</p>').join('') + '</div>';
    }).join('');
    const marcar = () => {
      const n = $$('[data-lida]:checked', host).length;
      $('#btnLancarSond').disabled = !n;
      $('#btnLancarSond').textContent = n > 1 ? 'Lançar ' + n + ' sondagens' : 'Lançar sondagem';
    };
    $$('[data-lida]', host).forEach(c => c.addEventListener('change', marcar));
    marcar();
  },

  lancarLidas() {
    const marcadas = $$('#previaSond [data-lida]:checked').map(c => this._lidas[c.dataset.lida]);
    if (!marcadas.length) return false;
    marcadas.forEach(r => {
      if (r.trecho) this.garantirTrecho(r.trecho);
      DB.dados.combustivel.push(Object.assign({ id: novoId('cb'), origem: 'sondagem' }, this.registroDeSondagem(r)));
    });
    DB.salvar();
    const semMilhas = [...new Set(marcadas.filter(r => r.trecho && this.milhasDe(r) == null).map(r => r.trecho))];
    toast((marcadas.length === 1 ? 'Sondagem lançada. ROB: ' + fmt(this.robAtual()) + ' L.' : marcadas.length + ' sondagens lançadas.') +
      (semMilhas.length ? ' Informe as milhas de ' + semMilhas.join(', ') + ' na tabela de trechos.' : ''));
  },

  registroDeSondagem(r) {
    const g = v => (v == null ? '' : String(v));
    return {
      data: r.data || hojeIso(), situacao: r.trecho ? 'Viagem' : 'Porto', trecho: g(r.trecho), comissao: g(r.comissao), dia: g(r.dia),
      anterior: g(r.anterior), robMedido: g(r.atual), consumo: g(r.consumo), recebido: g(r.recebido), transferido: g(r.transferido),
      beM: g(r.beM), beL: g(r.beL), bbM: g(r.bbM), bbL: g(r.bbL), servico: g(r.servico),
      aguada: g(r.aguada), consumoAgua: g(r.consumoAgua), texto: r.texto || '', avisos: r.avisos || []
    };
  },

  /* Edição de sondagem (ou lançamento manual de sondagem, sem mensagem). */
  abrirSondagem(id) {
    const dlg = $('#dlgSondEd'), f = $('form', dlg);
    const l = id ? DB.dados.combustivel.find(x => x.id === id) : { data: hojeIso(), situacao: 'Porto' };
    preencherForm(f, l);
    const mt = this.milhasTrecho(l.trecho);
    $('[name=milhas]', f).placeholder = mt != null ? mt + ' (do trecho)' : 'nm';
    f.dataset.id = id || '';
    $('#dlgSondEdTit').textContent = id ? 'Sondagem de ' + dataBr(l.data) : 'Sondagem sem mensagem';
    $('#sondTexto').textContent = l.texto || '';
    $('#sondTextoBox').classList.toggle('hidden', !l.texto);
    dlg.showModal();
  },

  salvarSondagem(f) {
    const o = lerForm(f);
    if (num(o.consumo) == null && num(o.recebido) == null && num(o.transferido) == null && num(o.robMedido) == null) {
      toast('Informe ao menos o consumo, um recebimento ou o saldo atual.', true); return false;
    }
    const id = f.dataset.id;
    if (o.trecho) {
      this.garantirTrecho(o.trecho);
      const t = this.trecho(o.trecho);
      if (t && !num(t.milhas) && num(o.milhas)) { t.milhas = o.milhas; o.milhas = ''; }
      else if (t && num(t.milhas) === num(o.milhas)) o.milhas = '';
    }
    if (id) Object.assign(DB.dados.combustivel.find(x => x.id === id), o);
    else DB.dados.combustivel.push(Object.assign({ id: novoId('cb'), origem: 'sondagem' }, o));
    DB.salvar();
    toast('Sondagem salva.');
  },

  /* ───────── lançamento do dia por motor ───────── */

  abrir(id) {
    const l0 = id ? DB.dados.combustivel.find(x => x.id === id) : null;
    if (l0 && !temMotores(l0)) { this.abrirSondagem(id); return; }
    const motores = DB.consumidores();
    if (!motores.length) { toast('Marque em Equipamentos quais motores consomem combustível.', true); irPara('manutencao', 'equipamentos'); return; }
    const dlg = $('#dlgComb'), f = $('form', dlg);
    const l = l0 || { data: hojeIso(), situacao: 'Porto', somaHoras: true };
    $('#combMotores').innerHTML = motores.map((m, k) => {
      const c = (l.consumos || {})[m.id] || {};
      return '<div class="motor"><div class="nome"><i class="cor" style="background:' + corMotor(k) + '"></i>' + esc(DB.nomeEquip(m.id)) + '</div>' +
        '<div class="row"><div><label>Litros</label><input type="number" step="any" min="0" data-m="' + m.id + '" data-c="litros" value="' + esc(c.litros || '') + '"></div>' +
        '<div><label>Horas</label><input type="number" step="any" min="0" max="24" data-m="' + m.id + '" data-c="horas" value="' + esc(c.horas || '') + '"></div></div></div>';
    }).join('');
    preencherForm(f, Object.assign({ somaHoras: true }, l));
    f.dataset.id = id || '';
    $('#dlgCombTit').textContent = id ? 'Editar lançamento de ' + dataBr(l.data) : 'Lançamento do dia por motor';
    dlg.showModal();
  },

  salvar(f) {
    const o = lerForm(f);
    const consumos = {};
    $$('[data-m]', f).forEach(inp => {
      const v = inp.value.trim();
      if (v === '') return;
      (consumos[inp.dataset.m] = consumos[inp.dataset.m] || {})[inp.dataset.c] = v;
    });
    const id = f.dataset.id;
    const outro = DB.dados.combustivel.find(x => x.data === o.data && x.id !== id);
    if (outro && !confirmar('Já existe lançamento em ' + dataBr(o.data) + '. Gravar outro no mesmo dia?')) return false;
    const reg = id ? DB.dados.combustivel.find(x => x.id === id) : null;
    const antes = (reg && reg.horasSomadas) || {};
    const agora = {};
    if (o.somaHoras) Object.keys(consumos).forEach(k => { const h = num(consumos[k].horas); if (h) agora[k] = h; });
    this.ajustarHorimetros(antes, agora);
    if (o.trecho) this.garantirTrecho(o.trecho);
    const dados = { data: o.data, situacao: o.situacao, trecho: o.trecho, recebido: o.recebido, robMedido: o.robMedido, obs: o.obs,
      somaHoras: o.somaHoras, consumos, horasSomadas: agora };
    if (reg) Object.assign(reg, dados);
    else DB.dados.combustivel.push(Object.assign({ id: novoId('cb'), origem: 'dia' }, dados));
    DB.salvar();
    toast('Lançamento salvo.');
  },

  /* Soma ao horímetro só a diferença entre o que este lançamento já tinha somado e o novo valor. */
  ajustarHorimetros(antes, agora) {
    new Set([...Object.keys(antes), ...Object.keys(agora)]).forEach(eqId => {
      const eq = DB.equip(eqId); if (!eq) return;
      const delta = (agora[eqId] || 0) - (antes[eqId] || 0);
      if (!delta) return;
      eq.horimetro = String(Math.round(((num(eq.horimetro) || 0) + delta) * 10) / 10);
    });
  },

  excluir(id) {
    const l = DB.dados.combustivel.find(x => x.id === id);
    if (!confirmar('Excluir o lançamento de ' + dataBr(l.data) + '?' +
      (Object.keys(l.horasSomadas || {}).length ? ' As horas somadas aos horímetros serão descontadas.' : ''))) return;
    this.ajustarHorimetros(l.horasSomadas || {}, {});
    DB.dados.combustivel = DB.dados.combustivel.filter(x => x.id !== id);
    DB.salvar();
  },

  /* ───────── planilha CONTROLE CLG ───────── */

  /* Mesmas colunas A:Y da aba Registro da planilha, para colar lá sem rearrumar. */
  CABECALHO_REGISTRO: ['Data referência', 'Hora', 'Tipo', 'Consumo (L)', 'Recebido (L)', 'Transferido (L)', 'Anterior (L)',
    'Tanque BE (L)', 'Tanque BB (L)', 'Serviço (L)', 'Saldo BE+BB (L)', 'Saldo declarado (L)', 'Diferença (L)', 'Conferência',
    'Trecho / contexto', 'Observações e ressalvas', 'Fonte', 'Data mensagem', 'Remetente', 'ID da fonte', 'Ano', 'Ano-mês',
    'Aguada (L)', 'Consumo de água (L)', 'Dia da comissão'],

  linhaRegistro(x) {
    const l = x.l, n = v => (num(v) == null ? '' : num(v));
    const be = num(l.beL), bb = num(l.bbL);
    const ant = num(l.anterior), atual = num(l.robMedido);
    const dif = ant != null && atual != null ? ant + x.recebido - x.transferido - atual - x.consumo : '';
    const tipo = x.consumo ? 'Consumo' : x.recebido ? 'Abastecimento' : x.transferido ? 'Transferência' : 'Sondagem';
    const conf = dif === '' ? 'Sem conciliação' : Math.abs(dif) > Sondagem.TOLERANCIA ? 'Revisar' : 'Compatível';
    return [dataBr(l.data), l.hora || '', tipo, x.consumo || '', x.recebido || '', x.transferido || '', n(l.anterior), n(l.beL), n(l.bbL),
      n(l.servico), be != null && bb != null ? be + bb : '', n(l.robMedido), dif, conf, l.trecho || l.comissao || '',
      [l.trecho && l.comissao ? l.comissao : '', l.obs || '', l.beM ? 'Sondagem BE: ' + l.beM + ' m; BB: ' + (l.bbM || '') + ' m' : ''].filter(Boolean).join(' · '),
      l.origem === 'planilha' ? (l.fonte || 'CONTROLE CLG') : 'CHEMAQ', dataBr(l.data), '', l.fonteId || 'CHEMAQ-' + l.id.slice(-6),
      l.data.slice(0, 4), l.data.slice(0, 7), n(l.aguada), n(l.consumoAgua), n(l.dia)];
  },

  copiarLinha(id) {
    const x = this.serie().find(s => s.l.id === id);
    const tsv = this.linhaRegistro(x).map(v => String(v).replace(/[\t\n]/g, ' ')).join('\t');
    navigator.clipboard.writeText(tsv).then(
      () => toast('Linha copiada. Cole na primeira linha livre da aba Registro da planilha (coluna A).'),
      () => toast('O navegador não deixou copiar. Use Exportar planilha.', true));
  },

  csv() {
    const motores = this.colunasMotores();
    const cab = this.CABECALHO_REGISTRO.concat(['Milhas (nm)', 'L/nm', 'BE (m)', 'BB (m)', 'ROB calculado (L)'],
      ...motores.map(m => [(m.tag || m.nome) + ' (L)', (m.tag || m.nome) + ' (h)']));
    const linhas = [cab];
    this.serie().forEach(x => linhas.push(this.linhaRegistro(x).concat(
      [x.milhas || '', x.lpm != null ? Math.round(x.lpm * 10) / 10 : '', x.l.beM || '', x.l.bbM || '', x.calc == null ? '' : x.calc],
      ...motores.map(m => { const c = (x.l.consumos || {})[m.id] || {}; return [c.litros || '', c.horas || '']; }))));
    baixarArquivo('controle-clg-' + hojeIso() + '.csv', paraCsv(linhas), 'text/csv;charset=utf-8');
  },

  /* Lê a aba Registro do CONTROLE CLG.xlsx e traz o que ainda não está no site. */
  async importarPlanilha(arq) {
    if (!window.XLSX) await carregarScript(XLSX_URL);
    const wb = XLSX.read(await arq.arrayBuffer(), { type: 'array' });
    const ws = wb.Sheets['Registro'];
    if (!ws) throw new Error('não achei a aba Registro');
    const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
    const iCab = linhas.findIndex(r => String(r[0]).trim() === 'Data referência');
    if (iCab < 0) throw new Error('não achei o cabeçalho "Data referência" na aba Registro');
    const col = {};
    linhas[iCab].forEach((c, i) => { col[String(c).trim()] = i; });
    const v = (r, nome) => (col[nome] == null ? '' : r[col[nome]]);
    const data = x => {
      if (typeof x === 'number') { const d = XLSX.SSF.parse_date_code(x); return d ? d.y + '-' + String(d.m).padStart(2, '0') + '-' + String(d.d).padStart(2, '0') : ''; }
      const m = String(x).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
      const i = String(x).match(/^(\d{4})-(\d{2})-(\d{2})/); return i ? i[0] : '';
    };
    const hora = x => {
      if (typeof x === 'number') { const s = Math.round((x % 1) * 86400); return String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0'); }
      return String(x || '').slice(0, 5);
    };
    const t = x => (x === '' || x == null ? '' : String(x).trim());
    const ids = new Set(DB.dados.combustivel.map(l => l.fonteId).filter(Boolean));
    let novos = 0, repetidos = 0;
    linhas.slice(iCab + 1).forEach(r => {
      const d = data(v(r, 'Data referência'));
      if (!d) return;
      const consumo = t(v(r, 'Consumo (L)')), recebido = t(v(r, 'Recebido (L)')), transferido = t(v(r, 'Transferido (L)'));
      if (!consumo && !recebido && !transferido) return;
      const fonteId = t(v(r, 'ID da fonte'));
      const igual = DB.dados.combustivel.find(l => l.data === d && consumoTotal(l) === (num(consumo) || 0) &&
        (num(l.recebido) || 0) === (num(recebido) || 0));
      if ((fonteId && ids.has(fonteId)) || igual) { repetidos++; return; }
      const be = t(v(r, 'Tanque BE (L)')), bb = t(v(r, 'Tanque BB (L)'));
      const declarado = t(v(r, 'Saldo BE+BB (L)')) || t(v(r, 'Saldo declarado (L)'));
      const contexto = t(v(r, 'Trecho / contexto'));
      const trecho = Sondagem.trecho(contexto);
      if (trecho) this.garantirTrecho(trecho);
      DB.dados.combustivel.push({
        id: novoId('cb'), origem: 'planilha', fonteId, fonte: t(v(r, 'Fonte')),
        data: d, hora: hora(v(r, 'Hora')), situacao: trecho ? 'Viagem' : 'Porto',
        trecho, comissao: contexto && contexto !== trecho ? contexto : '',
        consumo, recebido, transferido, anterior: t(v(r, 'Anterior (L)')), beL: be, bbL: bb, servico: t(v(r, 'Serviço (L)')),
        robMedido: declarado, aguada: t(v(r, 'Aguada (L)')), consumoAgua: t(v(r, 'Consumo de água (L)')),
        dia: t(v(r, 'Dia da comissão')), obs: t(v(r, 'Observações e ressalvas')).replace(/^Sondagem BE:.*$/, '') + (t(v(r, 'Tipo')) && t(v(r, 'Tipo')) !== 'Consumo' ? ' [' + t(v(r, 'Tipo')) + ']' : '')
      });
      if (fonteId) ids.add(fonteId);
      novos++;
    });
    DB.salvar();
    return { novos, repetidos };
  },

  render() { this.renderKpis(); this.renderGrafico(); this.renderTabela(); this.renderTrechos(); this.renderPlano(); this.renderRendimento(); },

  ligar() {
    $('#btnColarSond').onclick = () => this.abrirColar();
    $('#btnNovoComb').onclick = () => this.abrir();
    $('#btnSondManual').onclick = () => this.abrirSondagem();
    $('#btnCsvComb').onclick = () => this.csv();
    $('#txtSond').addEventListener('input', () => this.previa());
    $('#inPlanilhaClg').onchange = async e => {
      const arq = e.target.files[0]; e.target.value = '';
      if (!arq) return;
      toast('Lendo a planilha…');
      try {
        const r = await this.importarPlanilha(arq);
        toast(r.novos + ' lançamentos importados' + (r.repetidos ? ', ' + r.repetidos + ' já estavam no site' : '') + '.');
      } catch (err) { toast('Não foi possível importar: ' + err.message, true); }
    };
    $('#tabComb').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.edcomb) this.abrir(b.dataset.edcomb);
      if (b.dataset.delcomb) this.excluir(b.dataset.delcomb);
      if (b.dataset.cpcomb) this.copiarLinha(b.dataset.cpcomb);
    });
    $('#tabTrechos').addEventListener('change', e => {
      const inp = e.target.closest('[data-milhas]'); if (!inp) return;
      const nome = inp.dataset.milhas;
      this.garantirTrecho(nome);
      /* Apagar o campo, ou deixar igual à tabela, volta a seguir a tabela de distâncias. */
      const v = inp.value.trim(), tab = Dist.milhas(nome);
      this.trecho(nome).milhas = v === '' || (tab != null && num(v) === tab) ? '' : v;
      DB.salvar();
    });
    $('#tabTrechos').addEventListener('click', e => {
      const b = e.target.closest('[data-deltrecho]'); if (!b) return;
      DB.dados.trechos = (DB.dados.trechos || []).filter(t => t.id !== b.dataset.deltrecho);
      DB.salvar();
    });

    /* Plano: grava sem redesenhar a tela, para o cursor não pular. */
    const gravaPlano = () => { DB.salvar(true); this.calcPlano(); };
    $('#planoPernas').addEventListener('input', e => {
      const inp = e.target.closest('[data-pc]'); if (!inp) return;
      const i = Number(inp.closest('tr').dataset.perna);
      const perna = this.plano().pernas[i];
      perna[inp.dataset.pc] = inp.value;
      if (inp.dataset.pc === 'trecho') {
        /* Trecho novo: as milhas voltam a vir do trecho (digitadas na tabela de trechos ou da tabela de distâncias). */
        perna.milhas = '';
        const auto = this.milhasTrecho(inp.value), campo = $('[data-pc=milhas]', inp.closest('tr'));
        campo.value = auto != null ? auto : '';
        marcarAuto(campo, auto != null ? origemMilhas(inp.value) : '');
      } else if (inp.dataset.pc === 'milhas') {
        const auto = this.milhasTrecho(perna.trecho);
        if (auto != null && num(inp.value) === auto) perna.milhas = '';
        marcarAuto(inp, perna.milhas === '' && auto != null ? origemMilhas(perna.trecho) : '');
      }
      gravaPlano();
    });
    $('#planoPernas').addEventListener('click', e => {
      const b = e.target.closest('[data-delperna]'); if (!b) return;
      this.plano().pernas.splice(Number(b.dataset.delperna), 1);
      DB.salvar(true); this.renderPlano();
    });
    $('#btnAddPerna').onclick = () => { this.plano().pernas.push({ trecho: '', milhas: '' }); DB.salvar(true); this.renderPlano(); $$('#planoPernas [data-pc=trecho]').pop().focus(); };
    $('#btnLimparPlano').onclick = () => { DB.dados.planoComb = {}; DB.salvar(true); this.renderPlano(); };
    $('#formPlano').addEventListener('input', () => { Object.assign(this.plano(), lerForm($('#formPlano'))); gravaPlano(); });

    ligarDialogo('#dlgComb', f => this.salvar(f));
    ligarDialogo('#dlgSondEd', f => this.salvarSondagem(f));
    ligarDialogo('#dlgSond', () => this.lancarLidas());
  }
};

/* Campo de milhas. Quando o valor veio sozinho (tabela de distâncias ou trecho
 * cadastrado), aparece mais apagado e com a origem embaixo; digitar por cima vale. */
function campoMilhas(attr, valor, auto, tab, rotulo, origem) {
  return '<input class="inNum' + (auto ? ' auto' : '') + '" type="number" step="any" min="0" ' + attr + ' value="' + esc(valor == null ? '' : valor) + '" placeholder="nm" aria-label="' + esc(rotulo) + '"' +
    (tab != null ? ' title="Tabela de distâncias: ' + tab + ' nm"' : '') + '>' +
    '<div class="sub">' + (auto ? (origem || 'tabela') : '') + '</div>';
}
function marcarAuto(campo, origem) {
  campo.classList.toggle('auto', !!origem);
  $('.sub', campo.parentNode).textContent = origem;
}
function origemMilhas(trecho) {
  const t = Comb.trecho(trecho);
  return t && num(t.milhas) != null ? 'do trecho' : 'tabela';
}

function linhaPlano(rot, det, val) {
  return '<div class="lp"><span>' + rot + (det ? ' <small>' + det + '</small>' : '') + '</span><span class="num">' + val + '</span></div>';
}

function kpi(rot, val, un, det, alerta) {
  return '<div class="kpi' + (alerta ? ' alerta' : '') + '"><div class="rot">' + esc(rot) + '</div><div class="val">' + val +
    (un ? '<small>' + esc(un) + '</small>' : '') + '</div><div class="det">' + esc(det || '') + '</div></div>';
}

/* Retângulo com os cantos de cima arredondados (ponta da barra), base reta. */
function barraArredondada(x, y, w, h, r) {
  r = Math.min(r, h);
  return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
    'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
}
