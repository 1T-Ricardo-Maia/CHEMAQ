/* Painel: o resumo do departamento na primeira tela. */
'use strict';

const Painel = {
  render() {
    const d = DB.dados;
    $('#cardBoasVindas').classList.toggle('hidden', d.equipamentos.length > 0);
    const rot = rotinasOrdenadas();
    const venc = rot.filter(x => x.s.estado === 'vencida');
    const aVencer = rot.filter(x => x.s.estado === 'avencer' || x.s.estado === 'semreg');
    const abertas = d.os.filter(o => o.status === 'Aberta').sort((a, b) => (a.data || '').localeCompare(b.data || ''));
    const rob = Comb.robAtual();
    const cap = num(d.combConfig.capacidade);
    const media = Comb.mediaDiaria(7);

    $('#kpis').innerHTML =
      kpi('Manutenções vencidas', venc.length, '', venc.length ? 'precisam de atenção' : 'nenhuma pendência', venc.length > 0) +
      kpi('A vencer', aVencer.length, '', 'até 10% do intervalo') +
      kpi('OS abertas', abertas.length, '', abertas.filter(o => o.tipo === 'Corretiva').length + ' corretivas') +
      kpi('ROB', fmt(rob), 'L', cap && rob != null ? fmt(rob / cap * 100) + '% · média ' + fmt(media) + ' L/dia' : (media ? 'média ' + fmt(media) + ' L/dia' : 'sem lançamentos'));

    const itemRot = ({ r, s }) => '<li><span>' + seloSituacao(s.estado) + ' ' + esc(DB.nomeEquip(r.equipId)) +
      '<div class="sub">' + esc(r.descricao) + '</div></span><span class="dir">' + (s.faltaTxt || 'sem última execução') + '</span></li>';
    $('#nPainelVenc').textContent = venc.length;
    $('#painelVenc').innerHTML = venc.length ? '<ul class="lista">' + venc.map(itemRot).join('') + '</ul>' : '<p class="vazio">Nada vencido.</p>';
    $('#nPainelAvencer').textContent = aVencer.length;
    $('#painelAvencer').innerHTML = aVencer.length ? '<ul class="lista">' + aVencer.map(itemRot).join('') + '</ul>' : '<p class="vazio">Nada a vencer.</p>';
    $('#nPainelOs').textContent = abertas.length;
    $('#painelOs').innerHTML = abertas.length ? '<ul class="lista">' + abertas.map(o =>
      '<li><span>' + esc(DB.nomeEquip(o.equipId)) + '<div class="sub">' + esc(o.descricao) + '</div></span>' +
      '<span class="dir">OS ' + esc(o.numero) + '<br>' + dataBr(o.data) + '</span></li>').join('') + '</ul>' : '<p class="vazio">Nenhuma OS aberta.</p>';
    const comHor = d.equipamentos.filter(e => e.horimetro !== '' && e.horimetro != null)
      .sort((a, b) => (a.tag || a.nome).localeCompare(b.tag || b.nome));
    $('#painelHor').innerHTML = comHor.length ? '<ul class="lista">' + comHor.map(e =>
      '<li><span>' + esc(DB.nomeEquip(e.id)) + '</span><span class="dir">' + fmt(num(e.horimetro)) + ' h</span></li>').join('') + '</ul>'
      : '<p class="vazio">Nenhum horímetro cadastrado.</p>';
  }
};
