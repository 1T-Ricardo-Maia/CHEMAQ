/* Manutenção no estilo TM Master: equipamentos com horímetro, rotinas do plano
 * (por horas ou por calendário), ordens de serviço e o histórico de cada
 * equipamento. Concluir uma OS ligada a uma rotina reinicia a contagem dela. */
'use strict';

const ESTADOS = {
  vencida: { txt: 'Vencida', ordem: 0 },
  semreg: { txt: 'Sem registro', ordem: 1 },
  avencer: { txt: 'A vencer', ordem: 2 },
  emdia: { txt: 'Em dia', ordem: 3 }
};

/* Situação de uma rotina. "A vencer" = faltam até 10% do intervalo
 * (no calendário, no mínimo 7 dias). */
function situacaoRotina(r) {
  const eq = DB.equip(r.equipId);
  const intervalo = num(r.intervalo) || 0;
  if (r.base === 'horas') {
    const atual = eq ? num(eq.horimetro) : null;
    const ult = num(r.ultHoras);
    if (ult == null || atual == null) return { estado: 'semreg', prox: '—', falta: null, chave: -1 };
    const prox = ult + intervalo;
    const falta = prox - atual;
    const estado = falta < 0 ? 'vencida' : falta <= intervalo * 0.1 ? 'avencer' : 'emdia';
    return {
      estado, falta, chave: falta / intervalo,
      prox: fmt(prox) + ' h',
      faltaTxt: falta < 0 ? 'passou ' + fmt(-falta) + ' h' : 'faltam ' + fmt(falta) + ' h'
    };
  }
  if (!r.ultData) return { estado: 'semreg', prox: '—', falta: null, chave: -1 };
  const proxIso = somaDias(r.ultData, intervalo);
  const falta = diasEntre(hojeIso(), proxIso);
  const estado = falta < 0 ? 'vencida' : falta <= Math.max(7, intervalo * 0.1) ? 'avencer' : 'emdia';
  return {
    estado, falta, chave: falta / intervalo,
    prox: dataBr(proxIso),
    faltaTxt: falta < 0 ? 'passou ' + (-falta) + ' d' : 'faltam ' + falta + ' d'
  };
}

function seloSituacao(estado) {
  return '<span class="selo-st st-' + estado + '">' + ESTADOS[estado].txt + '</span>';
}
function periodicidade(r) {
  return r.base === 'horas' ? 'a cada ' + fmt(num(r.intervalo)) + ' h' : 'a cada ' + fmt(num(r.intervalo)) + ' dias';
}

function rotinasOrdenadas() {
  return DB.dados.rotinas.map(r => ({ r, s: situacaoRotina(r) }))
    .sort((a, b) => ESTADOS[a.s.estado].ordem - ESTADOS[b.s.estado].ordem || a.s.chave - b.s.chave);
}

function opcoesEquip(sel, vazio) {
  const atual = sel.value;
  const eqs = DB.dados.equipamentos.slice().sort((a, b) => (a.tag || a.nome).localeCompare(b.tag || b.nome));
  sel.innerHTML = (vazio != null ? '<option value="">' + esc(vazio) + '</option>' : '') +
    eqs.map(e => '<option value="' + e.id + '">' + esc(DB.nomeEquip(e.id)) + '</option>').join('');
  if (atual && eqs.some(e => e.id === atual)) sel.value = atual;
}

/* ═══════════ Plano ═══════════ */
const Manut = {
  fRotEstado: '',
  fOsStatus: 'Aberta',

  renderPlano() {
    opcoesEquip($('#fRotEquip'), 'Todos os equipamentos');
    const fEq = $('#fRotEquip').value;
    const linhas = rotinasOrdenadas().filter(x => (!fEq || x.r.equipId === fEq) &&
      (!this.fRotEstado || x.s.estado === this.fRotEstado ||
        (this.fRotEstado === 'avencer' && x.s.estado === 'semreg')));
    $('#nRotinas').textContent = DB.dados.rotinas.length;
    $('#tabRotinas tbody').innerHTML = linhas.map(({ r, s }) =>
      '<tr><td>' + seloSituacao(s.estado) + '</td>' +
      '<td>' + esc(DB.nomeEquip(r.equipId)) + '</td>' +
      '<td>' + esc(r.descricao) + (r.referencia ? '<div class="sub">' + esc(r.referencia) + '</div>' : '') + '</td>' +
      '<td class="nowrap">' + periodicidade(r) + '</td>' +
      '<td>' + (r.base === 'horas' ? (r.ultHoras !== '' && r.ultHoras != null ? fmt(num(r.ultHoras)) + ' h' : '—') : '') +
        (r.ultData ? '<div class="sub">' + dataBr(r.ultData) + '</div>' : (r.base === 'dias' ? '—' : '')) + '</td>' +
      '<td>' + s.prox + (s.faltaTxt ? '<div class="sub">' + s.faltaTxt + '</div>' : '') + '</td>' +
      '<td class="botoes"><button class="mini ok" data-exec="' + r.id + '">Executar</button>' +
      '<button class="mini" data-edrot="' + r.id + '">Editar</button>' +
      '<button class="mini del" data-delrot="' + r.id + '">Excluir</button></td></tr>').join('');
    $('#vazioRotinas').classList.toggle('hidden', linhas.length > 0);
    if (!linhas.length && DB.dados.rotinas.length) $('#vazioRotinas').textContent = 'Nenhuma rotina neste filtro.';
  },

  abrirRotina(id) {
    if (!DB.dados.equipamentos.length) { toast('Cadastre primeiro o equipamento.', true); irPara('manutencao', 'equipamentos'); return; }
    const dlg = $('#dlgRotina'), f = $('form', dlg);
    opcoesEquip($('[name=equipId]', f));
    const r = id ? DB.rotina(id) : { base: 'horas' };
    preencherForm(f, r);
    f.dataset.id = id || '';
    $('#dlgRotinaTit').textContent = id ? 'Editar rotina' : 'Nova rotina';
    dlg.showModal();
  },
  salvarRotina(f) {
    const o = lerForm(f);
    const id = f.dataset.id;
    if (id) Object.assign(DB.rotina(id), o);
    else DB.dados.rotinas.push(Object.assign({ id: novoId('rot') }, o));
    DB.salvar();
    toast('Rotina salva.');
  },
  excluirRotina(id) {
    const r = DB.rotina(id);
    if (!confirmar('Excluir a rotina "' + r.descricao + '"? As OS já registradas continuam no histórico.')) return;
    DB.dados.rotinas = DB.dados.rotinas.filter(x => x.id !== id);
    DB.salvar();
  },

  /* ═══════════ Ordens de serviço ═══════════ */
  renderOs() {
    const lista = DB.dados.os.filter(o => !this.fOsStatus || o.status === this.fOsStatus)
      .sort((a, b) => (b.data || '').localeCompare(a.data || '') || (b.numero || '').localeCompare(a.numero || ''));
    $('#nOs').textContent = DB.dados.os.filter(o => o.status === 'Aberta').length + ' abertas';
    $('#tabOs tbody').innerHTML = lista.map(o =>
      '<tr><td class="mono">' + esc(o.numero) + '</td><td>' + dataBr(o.data) + '</td>' +
      '<td>' + esc(DB.nomeEquip(o.equipId)) + '</td><td>' + esc(o.tipo) + '</td>' +
      '<td>' + esc(o.descricao) + (o.rotinaId && DB.rotina(o.rotinaId) ? '<div class="sub">Plano: ' + esc(DB.rotina(o.rotinaId).descricao) + '</div>' : '') + '</td>' +
      '<td>' + (o.status === 'Aberta' ? '<span class="selo-st st-avencer">Aberta</span>' : '<span class="selo-st st-emdia">Concluída</span>' +
        '<div class="sub">' + dataBr(o.dataConclusao) + '</div>') + '</td>' +
      '<td class="botoes">' + (o.status === 'Aberta' ? '<button class="mini ok" data-concluir="' + o.id + '">Concluir</button>' : '') +
      (o.tipo === 'Corretiva' ? '<button class="mini" data-dispensa="' + o.id + '">Dispensa</button>' : '') +
      '<button class="mini" data-edos="' + o.id + '">Editar</button>' +
      '<button class="mini del" data-delos="' + o.id + '">Excluir</button></td></tr>').join('');
    $('#vazioOs').classList.toggle('hidden', lista.length > 0);
  },

  abrirOs(id, preset) {
    if (!DB.dados.equipamentos.length) { toast('Cadastre primeiro o equipamento.', true); irPara('manutencao', 'equipamentos'); return; }
    const dlg = $('#dlgOs'), f = $('form', dlg);
    opcoesEquip($('[name=equipId]', f));
    $('[name=tipo]', f).innerHTML = TIPOS_OS.map(t => '<option>' + t + '</option>').join('');
    const o = id ? DB.dados.os.find(x => x.id === id) :
      Object.assign({ data: hojeIso(), status: 'Aberta', tipo: 'Corretiva' }, preset || {});
    preencherForm(f, o);
    this.opcoesRotinaOs(f, o.rotinaId);
    f.dataset.id = id || '';
    $('#dlgOsTit').textContent = id ? 'OS ' + o.numero : 'Nova ordem de serviço';
    this.mostraConclusao(f);
    dlg.showModal();
  },
  opcoesRotinaOs(f, valor) {
    const eqId = $('[name=equipId]', f).value;
    const sel = $('[name=rotinaId]', f);
    sel.innerHTML = '<option value="">— serviço fora do plano —</option>' +
      DB.dados.rotinas.filter(r => r.equipId === eqId)
        .map(r => '<option value="' + r.id + '">' + esc(r.descricao) + ' (' + periodicidade(r) + ')</option>').join('');
    sel.value = valor && DB.rotina(valor) && DB.rotina(valor).equipId === eqId ? valor : '';
  },
  mostraConclusao(f) {
    const concl = $('[name=status]', f).value === 'Concluída';
    $('.conclusao', f).classList.toggle('hidden', !concl);
    if (concl) {
      if (!$('[name=dataConclusao]', f).value) $('[name=dataConclusao]', f).value = hojeIso();
      const eq = DB.equip($('[name=equipId]', f).value);
      if (!$('[name=horimetro]', f).value && eq && eq.horimetro !== '') $('[name=horimetro]', f).value = eq.horimetro;
    }
  },
  salvarOs(f) {
    const o = lerForm(f);
    const id = f.dataset.id;
    if (o.status !== 'Concluída') { o.dataConclusao = ''; }
    let reg;
    if (id) { reg = DB.dados.os.find(x => x.id === id); Object.assign(reg, o); }
    else { reg = Object.assign({ id: novoId('os'), numero: DB.proximoNumeroOs() }, o); DB.dados.os.push(reg); }
    if (reg.status === 'Concluída') this.aplicarConclusao(reg);
    DB.salvar();
    toast('OS ' + reg.numero + ' salva.');
  },
  /* Ao concluir: o horímetro do equipamento acompanha a leitura informada e a
   * rotina do plano (se houver) passa a contar desta execução. */
  aplicarConclusao(o) {
    const eq = DB.equip(o.equipId);
    const h = num(o.horimetro);
    if (eq && h != null && (num(eq.horimetro) == null || h > num(eq.horimetro))) eq.horimetro = String(h);
    const r = o.rotinaId && DB.rotina(o.rotinaId);
    if (r && (!r.ultData || o.dataConclusao >= r.ultData)) {
      r.ultData = o.dataConclusao;
      if (h != null) r.ultHoras = String(h);
    }
  },
  excluirOs(id) {
    const o = DB.dados.os.find(x => x.id === id);
    if (!confirmar('Excluir a OS ' + o.numero + '? Ela sai também do histórico.')) return;
    DB.dados.os = DB.dados.os.filter(x => x.id !== id);
    DB.salvar();
  },
  executarRotina(id) {
    const r = DB.rotina(id);
    this.abrirOs(null, { equipId: r.equipId, rotinaId: r.id, tipo: 'Preventiva', descricao: r.descricao, status: 'Concluída' });
  },

  /* ═══════════ Equipamentos ═══════════ */
  renderEquip() {
    const eqs = DB.dados.equipamentos.slice().sort((a, b) =>
      SISTEMAS.indexOf(a.sistema) - SISTEMAS.indexOf(b.sistema) || (a.tag || a.nome).localeCompare(b.tag || b.nome));
    $('#nEquip').textContent = eqs.length;
    $('#tabEquip tbody').innerHTML = eqs.map(e =>
      '<tr><td class="mono">' + esc(e.tag) + '</td><td>' + esc(e.nome) + (e.consome ? ' <span class="sub">· consome combustível</span>' : '') +
      (e.local ? '<div class="sub">' + esc(e.local) + '</div>' : '') + '</td>' +
      '<td>' + esc(e.sistema) + '</td><td>' + esc([e.fabricante, e.modelo].filter(Boolean).join(' ')) +
      (e.serie ? '<div class="sub">S/N ' + esc(e.serie) + '</div>' : '') + '</td>' +
      '<td class="num">' + (e.horimetro !== '' && e.horimetro != null ? fmt(num(e.horimetro)) + ' h' : '—') + '</td>' +
      '<td class="botoes"><button class="mini ok" data-hor="' + e.id + '">Horímetro</button>' +
      '<button class="mini" data-histeq="' + e.id + '">Histórico</button>' +
      '<button class="mini" data-edeq="' + e.id + '">Editar</button>' +
      '<button class="mini del" data-deleq="' + e.id + '">Excluir</button></td></tr>').join('');
    $('#vazioEquip').classList.toggle('hidden', eqs.length > 0);
  },
  abrirEquip(id) {
    const dlg = $('#dlgEquip'), f = $('form', dlg);
    $('[name=sistema]', f).innerHTML = SISTEMAS.map(s => '<option>' + s + '</option>').join('');
    preencherForm(f, id ? DB.equip(id) : { sistema: 'Propulsão' });
    f.dataset.id = id || '';
    $('#dlgEquipTit').textContent = id ? 'Editar equipamento' : 'Novo equipamento';
    dlg.showModal();
  },
  salvarEquip(f) {
    const o = lerForm(f);
    const id = f.dataset.id;
    if (id) Object.assign(DB.equip(id), o);
    else DB.dados.equipamentos.push(Object.assign({ id: novoId('eq') }, o));
    DB.salvar();
    toast('Equipamento salvo.');
  },
  excluirEquip(id) {
    const e = DB.equip(id);
    const nRot = DB.dados.rotinas.filter(r => r.equipId === id).length;
    if (!confirmar('Excluir ' + e.nome + '?' + (nRot ? ' As ' + nRot + ' rotinas dele também serão excluídas.' : ''))) return;
    DB.dados.equipamentos = DB.dados.equipamentos.filter(x => x.id !== id);
    DB.dados.rotinas = DB.dados.rotinas.filter(r => r.equipId !== id);
    DB.salvar();
  },
  atualizarHorimetro(id) {
    const e = DB.equip(id);
    const v = window.prompt('Leitura atual do horímetro de ' + e.nome + ' (h):', e.horimetro || '');
    if (v == null) return;
    const n = num(v);
    if (n == null || n < 0) { toast('Leitura inválida.', true); return; }
    if (num(e.horimetro) != null && n < num(e.horimetro) &&
      !confirmar('A leitura é menor que a anterior (' + fmt(num(e.horimetro)) + ' h). Gravar mesmo assim?')) return;
    e.horimetro = String(n);
    DB.salvar();
    toast('Horímetro atualizado.');
  },

  /* ═══════════ Histórico ═══════════ */
  historicoFiltrado() {
    const fEq = $('#fHistEquip').value;
    const busca = $('#fHistBusca').value.trim().toLowerCase();
    return DB.dados.os.filter(o => o.status === 'Concluída' && (!fEq || o.equipId === fEq) &&
      (!busca || [o.descricao, o.executado, o.pecas, o.executante].join(' ').toLowerCase().includes(busca)))
      .sort((a, b) => (b.dataConclusao || '').localeCompare(a.dataConclusao || ''));
  },
  renderHist() {
    opcoesEquip($('#fHistEquip'), 'Todos os equipamentos');
    const lista = this.historicoFiltrado();
    $('#nHist').textContent = lista.length;
    $('#listaHist').innerHTML = lista.map(o =>
      '<li><div class="quando">' + dataBr(o.dataConclusao) + (o.horimetro ? ' · ' + fmt(num(o.horimetro)) + ' h' : '') +
      ' · OS ' + esc(o.numero) + ' · ' + esc(o.tipo) + '</div>' +
      '<div class="oque">' + esc(DB.nomeEquip(o.equipId)) + ' — ' + esc(o.descricao) + '</div>' +
      '<div class="det">' + esc([o.executado, o.pecas ? 'Peças: ' + o.pecas : '', o.executante ? 'Executante: ' + o.executante : '']
        .filter(Boolean).join('\n')) + '</div></li>').join('');
    $('#vazioHist').classList.toggle('hidden', lista.length > 0);
  },
  csvHist() {
    const linhas = [['OS', 'Equipamento', 'Tipo', 'Abertura', 'Conclusão', 'Horímetro', 'Serviço', 'Executado', 'Peças', 'Executante']];
    this.historicoFiltrado().forEach(o => linhas.push([o.numero, DB.nomeEquip(o.equipId), o.tipo, dataBr(o.data),
      dataBr(o.dataConclusao), o.horimetro, o.descricao, o.executado, o.pecas, o.executante]));
    baixarArquivo('historico-manutencao.csv', paraCsv(linhas), 'text/csv;charset=utf-8');
  },

  render() { this.renderPlano(); this.renderOs(); this.renderEquip(); this.renderHist(); },

  ligar() {
    $('#btnNovaRotina').onclick = () => this.abrirRotina();
    $('#btnNovaOs').onclick = () => this.abrirOs();
    $('#btnNovoEquip').onclick = () => this.abrirEquip();
    $('#btnCsvHist').onclick = () => this.csvHist();
    $('#fRotEquip').onchange = () => this.renderPlano();
    $('#fHistEquip').onchange = () => this.renderHist();
    $('#fHistBusca').oninput = () => this.renderHist();
    $('#fRotEstado').onclick = e => {
      const b = e.target.closest('[data-estado]'); if (!b) return;
      $$('[data-estado]', $('#fRotEstado')).forEach(x => x.setAttribute('aria-pressed', x === b));
      this.fRotEstado = b.dataset.estado; this.renderPlano();
    };
    $('#fOsStatus').onclick = e => {
      const b = e.target.closest('[data-status]'); if (!b) return;
      $$('[data-status]', $('#fOsStatus')).forEach(x => x.setAttribute('aria-pressed', x === b));
      this.fOsStatus = b.dataset.status; this.renderOs();
    };
    $('#tab-manutencao').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.exec) this.executarRotina(d.exec);
      else if (d.edrot) this.abrirRotina(d.edrot);
      else if (d.delrot) this.excluirRotina(d.delrot);
      else if (d.concluir) {
        this.abrirOs(d.concluir);
        const f = $('#dlgOs form'); $('[name=status]', f).value = 'Concluída'; this.mostraConclusao(f);
      }
      else if (d.edos) this.abrirOs(d.edos);
      else if (d.delos) this.excluirOs(d.delos);
      else if (d.dispensa) Dispensa.deOs(d.dispensa);
      else if (d.hor) this.atualizarHorimetro(d.hor);
      else if (d.edeq) this.abrirEquip(d.edeq);
      else if (d.deleq) this.excluirEquip(d.deleq);
      else if (d.histeq) { irPara('manutencao', 'historico'); $('#fHistEquip').value = d.histeq; this.renderHist(); }
    });
    const fOs = $('#dlgOs form');
    $('[name=equipId]', fOs).onchange = () => this.opcoesRotinaOs(fOs, '');
    $('[name=status]', fOs).onchange = () => this.mostraConclusao(fOs);
    ligarDialogo('#dlgEquip', f => this.salvarEquip(f));
    ligarDialogo('#dlgRotina', f => this.salvarRotina(f));
    ligarDialogo('#dlgOs', f => this.salvarOs(f));
  }
};
