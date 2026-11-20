/* Dados de exemplo para conhecer o CHEMAQ antes de cadastrar o navio de verdade.
 * Os equipamentos e a dispensa seguem o AvHoFlu Rio Tocantins; os números de
 * horímetro, consumo e as OS são ilustrativos. */
'use strict';

function carregarExemplo() {
  if (DB.dados.equipamentos.length && !confirmar('Já há dados cadastrados. Os dados de exemplo serão SOMADOS a eles. Continuar?')) return;
  const d = DB.dados;
  const eq = (tag, nome, sistema, fab, modelo, hor, consome, local) => {
    const e = { id: novoId('eq'), tag, nome, sistema, fabricante: fab, modelo, serie: '', local: local || 'Praça de Máquinas',
      horimetro: hor == null ? '' : String(hor), consome: !!consome, obs: '' };
    d.equipamentos.push(e); return e;
  };
  const mcpBB = eq('MCP-BB', 'Motor de combustão principal de bombordo', 'Propulsão', 'MTU', '6R 199 TB60', 4812, true);
  const mcpBE = eq('MCP-BE', 'Motor de combustão principal de boreste', 'Propulsão', 'MTU', '6R 199 TB60', 4790, true);
  const mca1 = eq('MCA-1', 'Motor de combustão auxiliar nº 1', 'Geração de energia', 'MWM', 'D229-6', 9120, true);
  const mca2 = eq('MCA-2', 'Motor de combustão auxiliar nº 2', 'Geração de energia', 'MWM', 'D229-6', 8875, true);
  const bab = eq('BAB-BE', 'Bomba de água bruta do MCP BE', 'Arrefecimento', 'MTU', '', null, false);

  const hoje = hojeIso();
  const rot = (e, descricao, base, intervalo, ultData, ultHoras, referencia) => {
    const r = { id: novoId('rot'), equipId: e.id, descricao, base, intervalo: String(intervalo), ultData: ultData || '',
      ultHoras: ultHoras == null ? '' : String(ultHoras), referencia: referencia || 'Manual de Operação e Manutenção' };
    d.rotinas.push(r); return r;
  };
  rot(mcpBB, 'Troca de óleo lubrificante e filtros', 'horas', 250, somaDias(hoje, -40), 4600);
  rot(mcpBE, 'Troca de óleo lubrificante e filtros', 'horas', 250, somaDias(hoje, -38), 4580);
  rot(mcpBB, 'Troca dos filtros de combustível', 'horas', 500, somaDias(hoje, -110), 4300);
  rot(mcpBE, 'Regulagem da folga de válvulas', 'horas', 1000, somaDias(hoje, -200), 3850);
  rot(mca1, 'Troca de óleo lubrificante e filtros', 'horas', 250, somaDias(hoje, -20), 8900);
  rot(mca2, 'Troca de óleo lubrificante e filtros', 'horas', 250, somaDias(hoje, -25), 8700);
  rot(bab, 'Inspeção do rotor (impelidor) da bomba de água bruta', 'dias', 90, somaDias(hoje, -84), null);
  rot(mcpBE, 'Substituição dos anodos de sacrifício do trocador de calor', 'dias', 180, '', null);

  const os = (e, tipo, descricao, data, status, extra) => {
    d.os.push(Object.assign({ id: novoId('os'), numero: DB.proximoNumeroOs(), equipId: e.id, rotinaId: '', tipo, descricao, data, status,
      dataConclusao: '', horimetro: '', executante: '', executado: '', pecas: '' }, extra || {}));
  };
  os(mcpBE, 'Corretiva', 'Vazamento na rede de óleo do turbocompressor e degradação da bomba de água bruta', somaDias(hoje, -15), 'Aberta');
  os(mca2, 'Corretiva', 'Vazamento na junta da tampa de válvulas', somaDias(hoje, -60), 'Concluída', {
    dataConclusao: somaDias(hoje, -58), horimetro: '8790', executante: 'Divisão de Máquinas', executado: 'Substituída a junta da tampa de válvulas e reapertado no torque do manual.',
    pecas: '1 junta da tampa de válvulas' });

  if (num(d.combConfig.robInicial) == null) Object.assign(d.combConfig, { robInicial: '18000', robInicialData: somaDias(hoje, -21), capacidade: '24000' });
  for (let i = 20; i >= 1; i--) {
    const viagem = i % 7 < 3;
    const c = {};
    const hMcp = viagem ? 10 + (i % 3) : 0;
    if (hMcp) { c[mcpBB.id] = { litros: String(hMcp * 38 + (i % 4) * 6), horas: String(hMcp) }; c[mcpBE.id] = { litros: String(hMcp * 39 + (i % 5) * 5), horas: String(hMcp) }; }
    c[(i % 2 ? mca1 : mca2).id] = { litros: String(viagem ? 190 : 140 + (i % 3) * 10), horas: viagem ? '24' : '18' };
    d.combustivel.push({ id: novoId('cb'), data: somaDias(hoje, -i), situacao: viagem ? 'Viagem' : 'Porto', consumos: c,
      recebido: i === 9 ? '6000' : '', robMedido: i === 10 ? '14650' : '', obs: i === 9 ? 'Recebimento na Base Naval' : '',
      somaHoras: false, horasSomadas: {} });
  }

  d.dispCfg = Object.assign({}, d.dispCfg, {
    om: d.dispCfg.om || 'Aviso Hidroceanográfico Fluvial Rio Tocantins', uasg: d.dispCfg.uasg || '784515',
    cidade: d.dispCfg.cidade || 'Belém, PA', setor: d.dispCfg.setor || 'Divisão de Máquinas',
    local: d.dispCfg.local && d.dispCfg.local !== 'a bordo do navio' ? d.dispCfg.local : 'a bordo do navio, na Base Naval de Val-de-Cães, Belém-PA',
    uge: d.dispCfg.uge || 'Centro de Intendência da Marinha em Belém',
    orgPar: d.dispCfg.orgPar || 'Centro de Hidrografia e Navegação do Norte (CHN-4)'
  });
  if (!d.navio.nome) d.navio.nome = 'AvHoFlu Rio Tocantins';

  (d.dispensas = d.dispensas || []).push({
    id: novoId('disp'), equipId: mcpBE.id, tipoObjeto: 'Serviço não continuado',
    servicoTitulo: 'revisão dos sistemas de lubrificação e de arrefecimento',
    alvo: 'o motor de combustão principal de boreste (MCP BE)',
    identificacao: 'motor diesel marítimo MTU 6R 199 TB60, de 294 kW (400 CV) a 1.850 rpm',
    funcao: 'é um dos dois únicos meios de propulsão da embarcação', area: 'manutenção de motores diesel marítimos',
    carater: 'preventivo e corretivo',
    defeitos: 'no sistema de lubrificação, condição de vazamento na rede de alimentação de óleo do turbocompressor e na junta de expansão do resfriador de óleo lubrificante e, no sistema de arrefecimento, a degradação da bomba de água bruta, de seu rotor e de sua tampa, do trocador de calor e dos mangotes',
    consequencias: 'Esses sistemas são essenciais à lubrificação dos mancais do motor e do turbocompressor e à manutenção da temperatura de operação, e sua deficiência compromete a disponibilidade da propulsão, a segurança da navegação e a prontidão operativa do meio.',
    servicos: 'a substituição da rede de óleo do turbocompressor e da junta de expansão do resfriador de óleo\na limpeza química do sistema de lubrificação e do resfriador\na substituição da bomba de água bruta\na confecção, o fornecimento e a instalação de trocador de calor do motor novo\no reparo do pós-arrefecedor do ar de admissão\na substituição dos mangotes\na revisão do circuito fechado de fluido de arrefecimento\na substituição do jogo de juntas do cilindro e do cabeçote',
    materiais: 'a rede de óleo do turbocompressor\nas juntas do resfriador de óleo\no óleo lubrificante, os filtros e o produto de limpeza\na bomba de água bruta completa e seus sobressalentes (1 rotor, 1 tampa e 1 junta da tampa)\no trocador de calor do motor novo\nos mangotes e as abraçadeiras\no jogo de juntas do cilindro e do cabeçote\no fluido de arrefecimento com inibidor de corrosão',
    foraEscopo: 'o motor de combustão principal de bombordo\na retífica geral do motor e a retífica do cabeçote\no reparo interno ou a substituição do turbocompressor',
    beneficios: '', referencias: 'o desenho de instalação do motor MTU do Brasil nº 1199112415 e o Manual de Operação e Manutenção do motor',
    processoNum: '63387.000262/2026-44', pesquisaNum: '41/2026', catTipo: 'CATSER', codigo: '13463', unidade: 'SERV', qtd: '1',
    valor: '50411,88', prioridade: 'ALTA', mes: 'DEZEMBRO', parCodigo: '0054/2026', parData: '2026-11-16',
    prazo: '60', vigencia: '4', garantia: '180', textos: {}, criado: new Date().toISOString(), atualizado: new Date().toISOString()
  });
  DB.salvar();
}
