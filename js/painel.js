/* Painel: o resumo do departamento na primeira tela, com a ação de cada pendência
 * à mão (executar ou abrir OS da rotina, levar à dispensa, concluir OS, atualizar
 * horímetro) e o nome de cada equipamento abrindo a ficha dele. */
'use strict';

const Painel = {
  render() {
    const d = DB.dados;
    $('#cardBoasVindas').classList.toggle('hidden', d.equipamentos.length > 0);
    Backup.renderAviso();
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

    const osDaRotina = id => abertas.find(o => o.rotinaId === id);
    const itemRot = ({ r, s }) => {
      const os = osDaRotina(r.id);
      return '<li><span>' + seloSituacao(s.estado) + ' ' + linkEquip(r.equipId) +
        '<div class="sub">' + esc(r.descricao) + ' · ' + (s.faltaTxt || 'sem última execução') + '</div></span>' +
        '<span class="dir botoes">' +
        '<button class="mini ok" data-pn="executar" data-id="' + r.id + '" title="Registrar que foi feita hoje">Executar</button>' +
        (os ? '<button class="mini" data-pn="concluir" data-id="' + os.id + '" title="Concluir a OS já aberta">OS ' + esc(os.numero) + '</button>'
          : '<button class="mini" data-pn="abrirOs" data-id="' + r.id + '" title="Abrir uma OS preventiva para esta rotina">Abrir OS</button>') +
        '<button class="mini" data-pn="dispRot" data-id="' + r.id + '" title="' + ((r.materiais || []).length ? 'Marcar os materiais desta troca na dispensa anual da aba Material' : 'Criar uma dispensa de serviço para este equipamento') + '">Dispensa</button>' +
        '</span></li>';
    };
    $('#nPainelVenc').textContent = venc.length;
    $('#painelVenc').innerHTML = venc.length ? '<ul class="lista">' + venc.map(itemRot).join('') + '</ul>' : '<p class="vazio">Nada vencido.</p>';
    $('#nPainelAvencer').textContent = aVencer.length;
    $('#painelAvencer').innerHTML = aVencer.length ? '<ul class="lista">' + aVencer.map(itemRot).join('') + '</ul>' : '<p class="vazio">Nada a vencer.</p>';
    $('#nPainelOs').textContent = abertas.length;
    $('#painelOs').innerHTML = abertas.length ? '<ul class="lista">' + abertas.map(o =>
      '<li><span>' + linkEquip(o.equipId) + '<div class="sub">OS ' + esc(o.numero) + ' · ' + dataBr(o.data) + ' · ' + esc(o.descricao) + '</div></span>' +
      '<span class="dir botoes"><button class="mini ok" data-pn="concluir" data-id="' + o.id + '">Concluir</button>' +
      (o.tipo === 'Corretiva' ? '<button class="mini" data-pn="dispOs" data-id="' + o.id + '">Dispensa</button>' : '') + '</span></li>').join('') + '</ul>'
      : '<p class="vazio">Nenhuma OS aberta.</p>';
    const comHor = d.equipamentos.filter(e => e.horimetro !== '' && e.horimetro != null || /^(MCP|MCA)/i.test(e.tag || ''))
      .sort((a, b) => (a.tag || a.nome).localeCompare(b.tag || b.nome));
    $('#painelHor').innerHTML = comHor.length ? '<ul class="lista">' + comHor.map(e =>
      '<li><span>' + linkEquip(e.id) + '</span><span class="dir">' + (e.horimetro !== '' && e.horimetro != null ? fmt(num(e.horimetro)) + ' h' : '—') +
      ' <button class="mini" data-pn="hor" data-id="' + e.id + '">Atualizar</button></span></li>').join('') + '</ul>'
      : '<p class="vazio">Nenhum horímetro cadastrado.</p>';
  },

  /* Rotina com materiais (filtros, correias...) vai para a dispensa anual da aba Material;
   * sem materiais, abre uma dispensa de serviço para o equipamento. */
  dispensaRotina(id) {
    const r = DB.rotina(id);
    if ((r.materiais || []).length) { Materiais.destacar(r.materiais, r.descricao); return; }
    const preset = Object.assign(Dispensa.dadosEquip(r.equipId), {
      defeitos: 'A rotina do plano de manutenção "' + r.descricao + '" (' + periodicidade(r) + ') está ' +
        (situacaoRotina(r).estado === 'vencida' ? 'vencida' : 'para vencer') + ' e não há meios a bordo para executá-la.'
    });
    irPara('dispensa');
    Dispensa.nova(preset);
    toast('Dispensa de serviço criada para ' + DB.nomeEquip(r.equipId) + '. Escolha um pacote de serviço.');
  },

  ligar() {
    $('#tab-painel').addEventListener('click', e => {
      const b = e.target.closest('[data-pn]'); if (!b) return;
      const id = b.dataset.id;
      switch (b.dataset.pn) {
        case 'executar': Manut.executarRotina(id); break;
        case 'abrirOs': {
          const r = DB.rotina(id);
          Manut.abrirOs(null, { equipId: r.equipId, rotinaId: r.id, tipo: 'Preventiva', descricao: r.descricao, status: 'Aberta' });
          break;
        }
        case 'concluir': Manut.concluirOs(id); break;
        case 'dispRot': this.dispensaRotina(id); break;
        case 'dispOs': Dispensa.deOs(id); break;
        case 'hor': Manut.atualizarHorimetro(id); break;
      }
    });
  }
};

/* Nome do equipamento que abre a ficha dele. */
function linkEquip(id) {
  return DB.equip(id) ? '<button class="link" data-ficha="' + id + '">' + esc(DB.nomeEquip(id)) + '</button>' : esc(DB.nomeEquip(id));
}
