/* Combustível: lançamento diário do consumo de cada motor, recebimentos e
 * sondagem. O ROB é calculado a partir do ROB inicial; quando há sondagem, a
 * diferença fica registrada e a conta segue a partir do valor medido. */
'use strict';

const CORES_SERIE = ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6', '--s7', '--s8'];

function corMotor(idx) {
  return getComputedStyle(document.documentElement).getPropertyValue(CORES_SERIE[idx % CORES_SERIE.length]).trim();
}
function consumoTotal(l) {
  return Object.values(l.consumos || {}).reduce((s, c) => s + (num(c.litros) || 0), 0);
}

const Comb = {
  /* Lançamentos em ordem cronológica, já com o ROB de cada dia. */
  serie() {
    const cfg = DB.dados.combConfig;
    let rob = num(cfg.robInicial);
    return DB.dados.combustivel.slice().sort((a, b) => a.data.localeCompare(b.data)).map(l => {
      const consumo = consumoTotal(l);
      const recebido = num(l.recebido) || 0;
      const calc = rob == null ? null : rob - consumo + recebido;
      const medido = num(l.robMedido);
      const dif = medido != null && calc != null ? medido - calc : null;
      rob = medido != null ? medido : calc;
      return { l, consumo, recebido, calc, medido, dif, rob };
    });
  },

  robAtual() {
    const s = this.serie();
    return s.length ? s[s.length - 1].rob : num(DB.dados.combConfig.robInicial);
  },

  /* Média diária de consumo nos últimos n lançamentos (opcionalmente só em viagem). */
  mediaDiaria(n, situacao) {
    const s = this.serie().filter(x => !situacao || x.l.situacao === situacao).slice(-n);
    if (!s.length) return null;
    return s.reduce((a, x) => a + x.consumo, 0) / s.length;
  },

  renderKpis() {
    const rob = this.robAtual();
    const cap = num(DB.dados.combConfig.capacidade);
    const media7 = this.mediaDiaria(7);
    const mediaViagem = this.mediaDiaria(10, 'Viagem');
    const mes = hojeIso().slice(0, 7);
    const doMes = DB.dados.combustivel.filter(l => l.data.startsWith(mes)).reduce((a, l) => a + consumoTotal(l), 0);
    const autonomia = rob != null && mediaViagem ? rob / mediaViagem : null;
    $('#kpisComb').innerHTML =
      kpi('ROB atual', fmt(rob), 'L', cap && rob != null ? fmt(rob / cap * 100) + '% da capacidade' : 'calculado') +
      kpi('Consumo no mês', fmt(doMes), 'L', new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })) +
      kpi('Média diária', fmt(media7), 'L/dia', 'últimos 7 lançamentos') +
      kpi('Autonomia em viagem', autonomia != null ? fmt(autonomia, 1) : '—', 'dias', mediaViagem ? 'a ' + fmt(mediaViagem) + ' L/dia em viagem' : 'sem lançamentos em viagem');
  },

  renderTabela() {
    const motores = DB.consumidores();
    const s = this.serie().reverse();
    $('#nComb').textContent = s.length;
    $('#tabComb thead').innerHTML = '<tr><th>Data</th><th>Situação</th>' +
      motores.map(m => '<th class="num">' + esc(m.tag || m.nome) + '<div class="sub">L · h</div></th>').join('') +
      '<th class="num">Consumo</th><th class="num">Recebido</th><th class="num">ROB calc.</th><th class="num">Sondagem</th><th></th></tr>';
    $('#tabComb tbody').innerHTML = s.map(x => {
      const l = x.l;
      return '<tr><td>' + dataBr(l.data) + '</td><td>' + esc(l.situacao) + (l.obs ? '<div class="sub">' + esc(l.obs) + '</div>' : '') + '</td>' +
        motores.map(m => {
          const c = (l.consumos || {})[m.id];
          return '<td class="num">' + (c && (c.litros || c.horas) ? fmt(num(c.litros)) + '<div class="sub">' + fmt(num(c.horas), 1) + ' h</div>' : '—') + '</td>';
        }).join('') +
        '<td class="num"><b>' + fmt(x.consumo) + '</b></td><td class="num">' + (x.recebido ? fmt(x.recebido) : '—') + '</td>' +
        '<td class="num">' + fmt(x.calc) + '</td>' +
        '<td class="num">' + (x.medido != null ? fmt(x.medido) + '<div class="sub' + (x.dif < 0 ? ' dif-neg' : '') + '">' +
          (x.dif >= 0 ? '+' : '') + fmt(x.dif) + '</div>' : '—') + '</td>' +
        '<td class="botoes"><button class="mini" data-edcomb="' + l.id + '">Editar</button>' +
        '<button class="mini del" data-delcomb="' + l.id + '">Excluir</button></td></tr>';
    }).join('');
    $('#vazioComb').classList.toggle('hidden', s.length > 0);
  },

  renderRendimento() {
    const motores = DB.consumidores();
    const lancs = DB.dados.combustivel.slice().sort((a, b) => a.data.localeCompare(b.data));
    $('#tabRend tbody').innerHTML = motores.map(m => {
      const soma = ls => ls.reduce((a, l) => {
        const c = (l.consumos || {})[m.id] || {};
        a.l += num(c.litros) || 0; a.h += num(c.horas) || 0; return a;
      }, { l: 0, h: 0 });
      const t = soma(lancs);
      const r = soma(lancs.filter(l => (l.consumos || {})[m.id] && num(l.consumos[m.id].horas)).slice(-7));
      return '<tr><td>' + esc(DB.nomeEquip(m.id)) + '</td><td class="num">' + fmt(t.h, 1) + '</td><td class="num">' + fmt(t.l) + '</td>' +
        '<td class="num">' + (t.h ? fmt(t.l / t.h, 1) : '—') + '</td><td class="num">' + (r.h ? fmt(r.l / r.h, 1) : '—') + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="sub">Marque em Equipamentos quais consomem combustível.</td></tr>';
  },

  /* Barras empilhadas por motor, um lançamento por barra. */
  renderGrafico() {
    const host = $('#graficoComb');
    const motores = DB.consumidores();
    const s = this.serie().slice(-30);
    if (!s.length || !motores.length) { host.innerHTML = '<p class="vazio">O gráfico aparece depois dos primeiros lançamentos.</p>'; return; }
    const W = 800, H = 230, mE = 46, mD = 8, mT = 10, mB = 26;
    const max = Math.max(...s.map(x => x.consumo), 1);
    const passo = Math.pow(10, Math.floor(Math.log10(max)));
    const topo = Math.ceil(max / passo) * passo;
    const y = v => mT + (H - mT - mB) * (1 - v / topo);
    const larg = (W - mE - mD) / s.length;
    const lb = Math.max(4, Math.min(28, larg * 0.62));
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Consumo diário de combustível por motor">';
    for (let i = 0; i <= 4; i++) {
      const v = topo * i / 4;
      svg += '<line class="grade" x1="' + mE + '" x2="' + (W - mD) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text class="eixo" x="' + (mE - 6) + '" y="' + (y(v) + 3.5) + '" text-anchor="end">' + fmt(v) + '</text>';
    }
    const cadaRotulo = Math.ceil(s.length / 10);
    s.forEach((x, i) => {
      const cx = mE + larg * i + larg / 2;
      let acum = 0;
      const partes = motores.map((m, k) => ({ k, v: num(((x.l.consumos || {})[m.id] || {}).litros) || 0 })).filter(p => p.v > 0);
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
    const legenda = motores.length > 1 ? '<div class="legenda">' + motores.map((m, k) =>
      '<span><i class="cor" style="background:' + corMotor(k) + '"></i>' + esc(m.tag || m.nome) + '</span>').join('') + '</div>' : '';
    host.innerHTML = svg + legenda;
    $('#combPeriodo').textContent = s.length < 30 ? s.length + ' lançamentos' : 'últimos 30 lançamentos';

    const dica = $('#dica');
    $$('.alvo', host).forEach(r => {
      r.addEventListener('mousemove', ev => {
        const x = s[r.dataset.i];
        dica.innerHTML = '<b>' + dataBr(x.l.data) + '</b> · ' + esc(x.l.situacao) + '<br>' + motores.map(m => {
          const c = (x.l.consumos || {})[m.id] || {};
          return esc(m.tag || m.nome) + ': <b>' + fmt(num(c.litros) || 0) + ' L</b>' + (num(c.horas) ? ' em ' + fmt(num(c.horas), 1) + ' h' : '');
        }).join('<br>') + '<br>Total: <b>' + fmt(x.consumo) + ' L</b>';
        dica.hidden = false;
        const bx = Math.min(ev.clientX + 14, window.innerWidth - dica.offsetWidth - 8);
        dica.style.left = bx + 'px'; dica.style.top = (ev.clientY + 14) + 'px';
      });
      r.addEventListener('mouseleave', () => { dica.hidden = true; });
    });
  },

  abrir(id) {
    const motores = DB.consumidores();
    if (!motores.length) { toast('Marque em Equipamentos quais motores consomem combustível.', true); irPara('manutencao', 'equipamentos'); return; }
    const dlg = $('#dlgComb'), f = $('form', dlg);
    const l = id ? DB.dados.combustivel.find(x => x.id === id) : { data: hojeIso(), situacao: 'Porto', somaHoras: true };
    $('#combMotores').innerHTML = motores.map((m, k) => {
      const c = (l.consumos || {})[m.id] || {};
      return '<div class="motor"><div class="nome"><i class="cor" style="background:' + corMotor(k) + '"></i>' + esc(DB.nomeEquip(m.id)) + '</div>' +
        '<div class="row"><div><label>Litros</label><input type="number" step="any" min="0" data-m="' + m.id + '" data-c="litros" value="' + esc(c.litros || '') + '"></div>' +
        '<div><label>Horas</label><input type="number" step="any" min="0" max="24" data-m="' + m.id + '" data-c="horas" value="' + esc(c.horas || '') + '"></div></div></div>';
    }).join('');
    preencherForm(f, Object.assign({ somaHoras: true }, l));
    f.dataset.id = id || '';
    $('#dlgCombTit').textContent = id ? 'Editar lançamento de ' + dataBr(l.data) : 'Lançamento de combustível';
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
    let reg = id ? DB.dados.combustivel.find(x => x.id === id) : null;
    const antes = (reg && reg.horasSomadas) || {};
    const agora = {};
    if (o.somaHoras) Object.keys(consumos).forEach(k => { const h = num(consumos[k].horas); if (h) agora[k] = h; });
    this.ajustarHorimetros(antes, agora);
    const dados = { data: o.data, situacao: o.situacao, recebido: o.recebido, robMedido: o.robMedido, obs: o.obs,
      somaHoras: o.somaHoras, consumos, horasSomadas: agora };
    if (reg) Object.assign(reg, dados);
    else DB.dados.combustivel.push(Object.assign({ id: novoId('cb') }, dados));
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

  csv() {
    const motores = DB.consumidores();
    const linhas = [['Data', 'Situação'].concat(...motores.map(m => [(m.tag || m.nome) + ' (L)', (m.tag || m.nome) + ' (h)']),
      ['Consumo (L)', 'Recebido (L)', 'ROB calculado (L)', 'ROB medido (L)', 'Diferença (L)', 'Obs.'])];
    this.serie().forEach(x => linhas.push([dataBr(x.l.data), x.l.situacao].concat(...motores.map(m => {
      const c = (x.l.consumos || {})[m.id] || {}; return [c.litros || '', c.horas || ''];
    }), [x.consumo, x.recebido || '', x.calc == null ? '' : x.calc, x.medido == null ? '' : x.medido, x.dif == null ? '' : x.dif, x.l.obs || ''])));
    baixarArquivo('consumo-combustivel.csv', paraCsv(linhas), 'text/csv;charset=utf-8');
  },

  render() { this.renderKpis(); this.renderGrafico(); this.renderTabela(); this.renderRendimento(); },

  ligar() {
    $('#btnNovoComb').onclick = () => this.abrir();
    $('#btnCsvComb').onclick = () => this.csv();
    $('#tabComb').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.edcomb) this.abrir(b.dataset.edcomb);
      if (b.dataset.delcomb) this.excluir(b.dataset.delcomb);
    });
    ligarDialogo('#dlgComb', f => this.salvar(f));
  }
};

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
