/* Ficha do equipamento: tudo de um equipamento numa janela só — dados de placa,
 * horímetro e horas por ano, rotinas do plano com a situação, OS abertas,
 * últimos serviços, materiais que ele usa (aba Material), dispensas feitas
 * para ele e manuais. Abre ao clicar no nome do equipamento em qualquer aba. */
'use strict';

/* Pastas de manuais e resumos no repositório, por modelo. */
const MANUAIS_REPO = 'https://github.com/1T-Ricardo-Maia/CHEMAQ/tree/main/referencias/manuais';
const MANUAIS = [
  { teste: /6R\s*199|MTU/i, nome: 'MTU 6R 199 TB60: resumo dos documentos (instalação, desempenho, dados técnicos)', url: MANUAIS_REPO + '/mtu-6r199tb60' }
];

const Ficha = {
  id: null,

  abrir(id) {
    if (!DB.equip(id)) return;
    this.id = id;
    this.render();
    const dlg = $('#dlgFicha');
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
  },
  fechar() { this.id = null; const dlg = $('#dlgFicha'); if (dlg.open) dlg.close(); },

  /* Horas de uso por ano pelas leituras do horímetro (a mais antiga e a mais recente dos últimos 13 meses). */
  horasAno(e) {
    const l = (e.leituras || []).filter(x => diasEntre(x.data, hojeIso()) <= 400);
    if (l.length < 2) return null;
    const a = l[0], b = l[l.length - 1], dias = diasEntre(a.data, b.data);
    if (dias < 30 || b.h <= a.h) return null;
    return { h: (b.h - a.h) / dias * 365, de: a.data, ate: b.data, dias };
  },

  materiais(e) {
    if (typeof MATERIAIS === 'undefined' || !e.tag) return [];
    const tag = e.tag.toUpperCase();
    return MATERIAIS.filter(m => m.usos.some(u => u.tags.includes(tag))).map(m => {
      const u = m.usos.find(x => x.tags.includes(tag));
      return { m, u, it: matItem(m.id) };
    });
  },

  dispensas(e) {
    const tag = (e.tag || '').toUpperCase();
    return (DB.dados.dispensas || []).filter(P => P.equipId === e.id ||
      (tag && (P.itens || []).some(i => String(i.onde || '').toUpperCase().includes(tag))));
  },

  render() {
    const e = DB.equip(this.id);
    if (!e) { this.fechar(); return; }
    const d = DB.dados;
    const rots = rotinasOrdenadas().filter(x => x.r.equipId === e.id);
    const abertas = d.os.filter(o => o.equipId === e.id && o.status === 'Aberta');
    const feitas = d.os.filter(o => o.equipId === e.id && o.status === 'Concluída')
      .sort((a, b) => (b.dataConclusao || '').localeCompare(a.dataConclusao || ''));
    const ha = this.horasAno(e);
    const mats = this.materiais(e);
    const disps = this.dispensas(e);
    const manuais = MANUAIS.filter(m => m.teste.test([e.fabricante, e.modelo, e.nome].join(' ')));
    const comb = e.consome ? Comb.ordenados().reduce((a, l) => {
      const c = (l.consumos || {})[e.id]; if (c) { a.l += num(c.litros) || 0; a.h += num(c.horas) || 0; }
      return a;
    }, { l: 0, h: 0 }) : null;

    const sec = (tit, n, corpo, vazio) => '<section class="fsec"><h4>' + tit + (n != null ? ' <span class="n">' + n + '</span>' : '') + '</h4>' +
      (corpo || '<p class="vazio">' + vazio + '</p>') + '</section>';

    $('#fichaTit').innerHTML = (e.tag ? '<span class="mono">' + esc(e.tag) + '</span> · ' : '') + esc(e.nome);
    $('#fichaCorpo').innerHTML =
      '<div class="fdados">' +
        [['Sistema', e.sistema], ['Fabricante / modelo', [e.fabricante, e.modelo].filter(Boolean).join(' ')], ['Nº de série', e.serie], ['Local', e.local]]
          .filter(([, v]) => v).map(([r, v]) => '<div><span>' + r + '</span><b>' + esc(v) + '</b></div>').join('') +
        '<div><span>Horímetro</span><b>' + (e.horimetro !== '' && e.horimetro != null ? fmt(num(e.horimetro)) + ' h' : '—') + '</b></div>' +
        '<div><span>Uso por ano</span><b>' + (ha ? fmt(ha.h) + ' h' : '—') + '</b>' +
          (ha ? '<small>leituras de ' + dataBr(ha.de) + ' a ' + dataBr(ha.ate) + '</small>' : '<small>precisa de 2 leituras com 30 dias de intervalo</small>') + '</div>' +
        (comb && comb.l ? '<div><span>Combustível lançado</span><b>' + fmt(comb.l) + ' L</b><small>' + (comb.h ? fmt(comb.l / comb.h, 1) + ' L/h em ' + fmt(comb.h, 1) + ' h' : '') + '</small></div>' : '') +
      '</div>' +
      (e.obs ? '<p class="hint">' + esc(e.obs) + '</p>' : '') +
      '<div class="acoes fbotoes">' +
        '<button class="btn" data-fa="hor">Atualizar horímetro</button>' +
        '<button class="btn ghost" data-fa="os">Nova OS</button>' +
        '<button class="btn ghost" data-fa="rotina">Nova rotina</button>' +
        '<button class="btn ghost" data-fa="servico">Montar serviço</button>' +
        '<button class="btn ghost" data-fa="editar">Editar cadastro</button>' +
      '</div>' +
      sec('Plano de manutenção', rots.length, rots.length ? '<ul class="lista">' + rots.map(({ r, s }) =>
        '<li><span>' + seloSituacao(s.estado) + ' ' + esc(r.descricao) + '<div class="sub">' + periodicidade(r) + ' · ' +
        (s.faltaTxt || 'sem última execução') + '</div></span><span class="dir botoes">' +
        '<button class="mini ok" data-fa="executar" data-id="' + r.id + '">Executar</button>' +
        '<button class="mini" data-fa="dispRot" data-id="' + r.id + '">Dispensa</button></span></li>').join('') + '</ul>' : '',
        'Nenhuma rotina. ' + (mats.length ? 'Os materiais deste equipamento estão na aba Material: “Criar rotinas de troca no plano” cria as rotinas.' : 'Cadastre as rotinas do manual.')) +
      sec('OS abertas', abertas.length, abertas.length ? '<ul class="lista">' + abertas.map(o =>
        '<li><span>OS ' + esc(o.numero) + ' · ' + esc(o.tipo) + '<div class="sub">' + dataBr(o.data) + ' · ' + esc(o.descricao) + '</div></span>' +
        '<span class="dir botoes"><button class="mini ok" data-fa="concluir" data-id="' + o.id + '">Concluir</button>' +
        (o.tipo === 'Corretiva' ? '<button class="mini" data-fa="dispOs" data-id="' + o.id + '">Dispensa</button>' : '') + '</span></li>').join('') + '</ul>' : '',
        'Nenhuma OS aberta.') +
      sec('Últimos serviços', feitas.length, feitas.length ? '<ol class="linhaTempo">' + feitas.slice(0, 8).map(o =>
        '<li><div class="quando">' + dataBr(o.dataConclusao) + (o.horimetro ? ' · ' + fmt(num(o.horimetro)) + ' h' : '') + ' · OS ' + esc(o.numero) + '</div>' +
        '<div class="oque">' + esc(o.descricao) + '</div>' +
        (o.executado || o.pecas ? '<div class="det">' + esc([o.executado, o.pecas ? 'Peças: ' + o.pecas : ''].filter(Boolean).join('\n')) + '</div>' : '') +
        '</li>').join('') + '</ol>' + (feitas.length > 8 ? '<button class="mini" data-fa="hist">Ver o histórico completo</button>' : '') : '',
        'Nenhum serviço concluído ainda.') +
      sec('Materiais que ele usa', mats.length, mats.length ? '<ul class="lista">' + mats.map(({ m, u, it }) =>
        '<li><span>' + esc(m.nome) + '<div class="sub">' + u.porTroca + ' un. por troca · ' + intervaloTxt(u.regra, matCfg().catMtu) + '</div></span>' +
        '<span class="dir">' + (it.estoque ? esc(it.estoque) + ' em estoque' : 'estoque não informado') + '</span></li>').join('') + '</ul>' +
        '<button class="mini" data-fa="material">Abrir na aba Material</button>' : '',
        'Nenhum material da aba Material ligado a ' + (e.tag ? 'esta tag' : 'este equipamento (cadastre a tag)') + '.') +
      sec('Dispensas', disps.length, disps.length ? '<ul class="lista">' + disps.map(P =>
        '<li><span>' + esc(maiusc1(P.servicoTitulo || 'Dispensa')) + '<div class="sub">' + esc(P.processoNum || 'sem NUP') +
        (P.atualizado ? ' · ' + new Date(P.atualizado).toLocaleDateString('pt-BR') : '') + '</div></span>' +
        '<span class="dir botoes">' + (num(P.valor) != null ? 'R$ ' + moeda(num(P.valor)) + ' ' : '') +
        '<button class="mini" data-fa="abrirDisp" data-id="' + P.id + '">Abrir</button></span></li>').join('') + '</ul>' : '',
        'Nenhuma dispensa para este equipamento.') +
      sec('Manuais', null, '<ul class="lista">' + manuais.map(m => '<li><a href="' + m.url + '" target="_blank" rel="noopener">' + esc(m.nome) + '</a></li>').join('') +
        '<li><a href="' + MANUAIS_REPO + '" target="_blank" rel="noopener">Todos os resumos de manuais no repositório</a></li></ul>' +
        '<p class="sub">Os PDFs originais ficam na pasta CHEMAQ › Manuais do computador da Divisão.</p>');
  },

  acao(b) {
    const id = b.dataset.id, eqId = this.id;
    const fechaE = fn => { this.fechar(); fn(); };
    switch (b.dataset.fa) {
      case 'hor': Manut.atualizarHorimetro(eqId); break;
      case 'os': fechaE(() => Manut.abrirOs(null, { equipId: eqId })); break;
      case 'rotina': fechaE(() => { Manut.abrirRotina(); const f = $('#dlgRotina form'); $('[name=equipId]', f).value = eqId; }); break;
      case 'editar': fechaE(() => Manut.abrirEquip(eqId)); break;
      case 'servico': fechaE(() => { const c = servCfg(); c.equipId = eqId; c.pacote = ''; DB.salvar(); irPara('servicos'); }); break;
      case 'executar': fechaE(() => Manut.executarRotina(id)); break;
      case 'concluir': fechaE(() => Manut.concluirOs(id)); break;
      case 'dispRot': fechaE(() => Painel.dispensaRotina(id)); break;
      case 'dispOs': fechaE(() => Dispensa.deOs(id)); break;
      case 'abrirDisp': fechaE(() => { irPara('dispensa'); Dispensa.abrir(id); }); break;
      case 'material': fechaE(() => Materiais.destacar(this.materiais(DB.equip(eqId)).map(x => x.m.id))); break;
      case 'hist': fechaE(() => { irPara('manutencao', 'historico'); $('#fHistEquip').value = eqId; Manut.renderHist(); }); break;
    }
  },

  ligar() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-ficha]'); if (!b) return;
      e.preventDefault();
      this.abrir(b.dataset.ficha);
    });
    $('#dlgFicha').addEventListener('click', e => {
      if (e.target.closest('[data-fechaficha]')) { this.fechar(); return; }
      const b = e.target.closest('[data-fa]'); if (b) this.acao(b);
    });
    $('#dlgFicha').addEventListener('close', () => { this.id = null; });
    document.addEventListener('chemaq:mudou', () => { if (this.id) this.render(); });
  }
};
