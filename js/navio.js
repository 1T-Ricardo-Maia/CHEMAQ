/* Equipamentos do AvHoFlu Rio Tocantins, segundo o Memorial Descritivo
 * 831-AvHoFlu-801-001 (INACE, 2011), conferidos pela Divisão de Máquinas:
 * motores a combustão, motores elétricos, geradores e caixas redutoras.
 * Horímetro e nº de série ficam em branco para preencher a bordo. */
'use strict';

const BATERIAS = 'Partida elétrica: 2 baterias de 12 V 180 Ah em série (bancada de 24 V).';

const EQUIPAMENTOS_NAVIO = [
  // tag, nome, sistema, fabricante, modelo, local, consome combustível, observações
  ['MCP-BB', 'Motor de combustão principal de bombordo', 'Propulsão', 'MTU', '6R 199 TB60', 'Praça de Máquinas', true,
    '400 bhp (294 kW) a 1.850 rpm. ' + BATERIAS + ' Memorial 8.1.'],
  ['MCP-BE', 'Motor de combustão principal de boreste', 'Propulsão', 'MTU', '6R 199 TB60', 'Praça de Máquinas', true,
    '400 bhp (294 kW) a 1.850 rpm. ' + BATERIAS + ' Memorial 8.1.'],
  ['CR-BB', 'Caixa redutora de bombordo', 'Propulsão', 'Twin Disc', 'MGX 5114SC', 'Praça de Máquinas', false,
    'Redução 3,0:1, acoplamento flexível 14". Troca de óleo e filtro junto com a do MCP. Memorial 8.2.'],
  ['CR-BE', 'Caixa redutora de boreste', 'Propulsão', 'Twin Disc', 'MGX 5114SC', 'Praça de Máquinas', false,
    'Redução 3,0:1, acoplamento flexível 14". Troca de óleo e filtro junto com a do MCP. Memorial 8.2.'],
  ['MCA-1', 'Motor de combustão auxiliar nº 1', 'Geração de energia', 'MWM', 'D229-6', 'Praça de Máquinas', true,
    '110 CV a 2.500 rpm; aciona o gerador nº 1. ' + BATERIAS + ' Memorial 9.1.'],
  ['MCA-2', 'Motor de combustão auxiliar nº 2', 'Geração de energia', 'MWM', 'D229-6', 'Praça de Máquinas', true,
    '110 CV a 2.500 rpm; aciona o gerador nº 2. ' + BATERIAS + ' Memorial 9.1.'],
  ['GER-1', 'Gerador (alternador) nº 1', 'Geração de energia', 'Leon Heimer', '75 kVA', 'Praça de Máquinas', false,
    '75 kVA, FP 0,8, 220 V trifásico 60 Hz, isolamento classe F. Acionado pelo MCA-1. Memorial 9.2.'],
  ['GER-2', 'Gerador (alternador) nº 2', 'Geração de energia', 'Leon Heimer', '75 kVA', 'Praça de Máquinas', false,
    '75 kVA, FP 0,8, 220 V trifásico 60 Hz, isolamento classe F. Acionado pelo MCA-2. Memorial 9.2.'],
  ['MP-BOTE', 'Motor de popa do bote de serviço', 'Embarcação orgânica', '', '50 HP', 'Bote de serviço', false,
    '50 HP, partida elétrica. Fabricante não consta do memorial. Memorial 13.5.'],

  ['BML-1', 'Bomba hidráulica nº 1 da máquina do leme', 'Governo', 'Sperry Marine', 'VMBR-100', 'Compartimento da Máquina do Leme', false,
    'Máquina do leme eletro-hidráulica, 5,7 kN·m. Memorial 11.1.'],
  ['BML-2', 'Bomba hidráulica nº 2 da máquina do leme (reserva)', 'Governo', 'Sperry Marine', 'VMBR-100', 'Compartimento da Máquina do Leme', false,
    'Bomba reserva. Memorial 11.1.'],
  ['MOL', 'Molinete elétrico', 'Casco e convés', 'Navalsul', '', 'Convés', false,
    '10 m/min; amarra de 100 m de cabo de aço 6x7 AA. Memorial 12.1.'],
  ['TUR-AV', 'Turco portátil de vante', 'Casco e convés', '', '', 'Convés 1 – AV BE', false,
    'Acionamento manual/elétrico, 500 kg a 2,74 m. Memorial 10.1.'],
  ['TUR-AR', 'Turco portátil de ré', 'Casco e convés', '', '', 'Convés 01 – AR BE', false,
    'Acionamento manual/elétrico, 500 kg a 2,74 m. Memorial 10.1.'],
  ['BOC', 'Bomba de óleo combustível (esgotamento/transferência)', 'Combustível e lubrificação', 'RZR Bombas', 'RZR-2200 C', 'Praça de Máquinas', false,
    'Engrenagens, 2,2 m³/h a 3 bar, 1,5 CV, 220 V trifásico. Memorial 14.1.'],
  ['BIE-1', 'Bomba de incêndio e esgoto nº 1', 'Incêndio e esgoto', 'Schneider', 'BCA-41', 'Praça de Máquinas', false,
    'Centrífuga horizontal autoescorvante, 12 m³/h, 4,0 CV, 220 V trifásico. Memorial 14.7.'],
  ['BIE-2', 'Bomba de incêndio e esgoto nº 2', 'Incêndio e esgoto', 'Schneider', 'BCA-41', 'Praça de Máquinas', false,
    'Centrífuga horizontal autoescorvante, 12 m³/h, 4,0 CV, 220 V trifásico. Memorial 14.7.'],
  ['BAP-1', 'Bomba de água potável nº 1 (hidróforo)', 'Auxiliares', 'Jacuzzi', 'Yellow Jet 75 (TAA13)', 'Praça de Máquinas', false,
    'Autoaspirante, 2,52 m³/h a 22 mca, 1,0 CV, 220 V. Memorial 14.8.'],
  ['BAP-2', 'Bomba de água potável nº 2 (hidróforo)', 'Auxiliares', 'Jacuzzi', 'Yellow Jet 75 (TAA13)', 'Praça de Máquinas', false,
    'Autoaspirante, 2,52 m³/h a 22 mca, 1,0 CV, 220 V. Memorial 14.8.'],
  ['BAC', 'Bomba de águas cinzas (desinfecção UV)', 'Controle de poluição', 'Amboretto', 'RK-1', 'Praça de Máquinas', false,
    'Centrífuga autoescorvante, 1,0 m³/h a 12 mca, 1/3 CV, 220 V. Filtro UV Techfilter UVMAX-B-YL. Memorial 14.12.'],
  ['BAN', 'Bomba de transferência de águas negras', 'Controle de poluição', 'Amboretto', 'RK-5', 'Praça de Máquinas', false,
    'Centrífuga autoescorvante, 3,3 m³/h a 22 mca, 1,5 CV, 220 V. Memorial 14.12.'],
  ['SAO', 'Separador de água e óleo', 'Controle de poluição', 'Recovered Energy', 'Boss 2.2T-107-YM', 'Praça de Máquinas', false,
    'Gravitacional de placas coalescentes, 0,5 m³/h. Memorial 14.12.'],
  ['CAA', 'Compressor de alta pressão (ar respirável)', 'Ar comprimido', 'Scubatec', 'PE250', '', false,
    '200 bar, 220 V; 2 garrafas, estação de filtragem e 2 estações de recarga. Enche os cilindros das máscaras de combate a incêndio. Memorial 14.9.'],
  ['VPM-1', 'Ventilador/exaustor nº 1 da Praça de Máquinas', 'Ventilação', 'Motovent', 'ATD-500/8-4', 'Praça de Máquinas', false,
    'Axial, 6.060 m³/h a 21 mmca. Memorial 14.4.'],
  ['VPM-2', 'Ventilador/exaustor nº 2 da Praça de Máquinas', 'Ventilação', 'Motovent', 'ATD-500/8-4', 'Praça de Máquinas', false,
    'Axial, 6.060 m³/h a 21 mmca. Memorial 14.4.'],
  ['EXB', 'Exaustor dos banheiros', 'Ventilação', 'Fort Vent', 'Q204', '', false,
    'Centrífugo, 180 m³/h a 32 Pa. Memorial 14.3.']
];

/* Cadastra só os equipamentos cuja tag ainda não existe; devolve quantos entraram. */
function carregarEquipamentosNavio() {
  const d = DB.dados;
  const tags = new Set(d.equipamentos.map(e => (e.tag || '').trim().toUpperCase()));
  let novos = 0;
  for (const [tag, nome, sistema, fabricante, modelo, local, consome, obs] of EQUIPAMENTOS_NAVIO) {
    if (tags.has(tag)) continue;
    d.equipamentos.push({ id: novoId('eq'), tag, nome, sistema, fabricante, modelo, serie: '', local, horimetro: '', consome, obs });
    novos++;
  }
  if (novos) DB.salvar();
  return novos;
}
