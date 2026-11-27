/* Materiais comuns da máquina, mantidos a pronto emprego: filtros, impelidores,
 * correias e baterias.
 *
 * O catálogo abaixo nasceu das dispensas de 2025 e 2026 (ver referencias/
 * dispensas/) e da pesquisa de preços de nov/2026 (referencias/precos/). Para
 * cada material o CHEMAQ guarda onde ele é usado, quantos vão por troca e o
 * intervalo de troca do manual; com as horas de uso por ano calcula o consumo,
 * compara com o estoque a bordo e monta a dispensa anual com o que falta.
 *
 * O que a pessoa edita (horas por ano, estoque, preço, quantidade a comprar)
 * fica em DB.dados.materiais; o catálogo em si fica neste arquivo. */
'use strict';

/* Regras de intervalo. 'mtuA', 'mtuB' e 'mtuC' seguem a Tabela de Períodos de
 * Manutenção do Manual de O&M MTU 6R 199 (p. 5-4): a categoria do regime de
 * serviço define as horas de cada serviço. */
const MTU_CATEGORIAS = {
  I: { nome: 'Categoria I (1D/1DS, serviço leve)', A: 100, B: 200, C: 400 },
  II: { nome: 'Categoria II (1B, serviço médio)', A: 150, B: 300, C: 600 },
  III: { nome: 'Categoria III (1A, serviço pesado)', A: 250, B: 500, C: 1000 }
};

const GRUPOS_MAT = ['Filtros', 'Impelidores e correias', 'Baterias'];

/* uso: onde o material vai.
 *   tags: equipamentos (tags do cadastro); motor: 'MCP' ou 'MCA' (de onde vêm as horas/ano)
 *   porTroca: unidades por equipamento a cada troca
 *   regra: 'mtuA' | 'mtuB' | 'mtuC' | { horas: n } | { meses: n }
 *   reserva: unidades de reserva (padrão: uma troca completa de todos os equipamentos)
 *   confirmar: true quando o vínculo ou a quantidade ainda é suposição
 * hist: compras anteriores { ano, processo, qtd, est (unitário estimado), hom (homologado) }
 * ref: preço de referência proposto em nov/2026 (null = cotar) */
const MATERIAIS = [
  { id: 'racor-2020pm', grupo: 'Filtros', nome: 'Elemento filtrante Racor 2020PM-OR (Parker)', marca: 'PARKER',
    espec: 'Elemento filtrante separador de água Racor 2020PM-OR, 30 µm, Aquabloc II, para filtro Racor 1000FG/FH; diâmetro interno 16,1 mm, diâmetro externo 112 mm',
    catmat: '466862', catmatAlerta: 'CATMAT 466862 descreve tela metálica de bocal de tanque; procurar código de elemento separador Racor',
    usos: [{ tags: ['MCP-BB', 'MCP-BE'], motor: 'MCP', porTroca: 1, regra: { horas: 500, meses: 12 }, rotina: 'Pré-filtro separador de combustível (pelo vacuômetro, no máximo anual)', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 20, est: 71.40, hom: 68.29 }], ref: null },
  { id: 'fc165', grupo: 'Filtros', nome: 'Filtro de combustível FC165 (Tecfil)', marca: 'TECFIL',
    espec: 'Filtro de combustível FC165, original Bosch 1457431020, elemento de feltro, altura 145 mm, diâmetro externo 81,9 mm, diâmetro interno 13,8 mm',
    catmat: '466863', catmatAlerta: 'CATMAT 466863 descreve tela metálica de pescador de tanque de viatura',
    usos: [{ tags: ['MCP-BB', 'MCP-BE'], motor: 'MCP', porTroca: 2, regra: 'mtuB', rotina: 'Filtro duplo de combustível (SC05)', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 20, est: 56.09, hom: 52.90 },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 66, est: 28.25, hom: 22.00 }], ref: 22.75 },
  { id: 'pl447', grupo: 'Filtros', nome: 'Filtro de óleo lubrificante PL447 (Tecfil)', marca: 'TECFIL',
    espec: 'Filtro de óleo lubrificante PL447, original 4031840025, elemento de papel, altura 270 mm, diâmetro externo 120 mm, com válvula de alívio',
    catmat: '615934',
    usos: [{ tags: ['MCP-BB', 'MCP-BE'], motor: 'MCP', porTroca: 1, regra: 'mtuA', rotina: 'Troca de óleo e filtro de óleo lubrificante (SL05/SL06)' }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 10, est: 58.90, hom: 56.74 },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 25, est: 74.77, hom: 64.49 }], ref: 59.75 },
  { id: 'b125005', grupo: 'Filtros', nome: 'Filtro de ar B125005 (Donaldson)', marca: 'DONALDSON',
    espec: 'Elemento de filtro de ar B125005, referência cruzada AH19497 / 810033, carcaça de 23 cm de comprimento, diâmetro máximo de 32 cm e saída de ar de 14 cm',
    catmat: '615937', catmatAlerta: 'CATMAT 615937 é filtro de combustível FC164; o item ficou sem resultado em 2025 e 2026',
    usos: [{ tags: ['MCP-BB', 'MCP-BE'], motor: 'MCP', porTroca: 1, regra: { meses: 12 }, rotina: 'Substituição do elemento do filtro de ar (SA02: pelo indicador de restrição, no máximo a cada 2 anos)', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 2, est: 548.00, hom: null },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 2, est: 671.00, hom: null }], ref: null },
  { id: 'racor-2040pm', grupo: 'Filtros', nome: 'Elemento filtrante Racor 2040PM (Parker)', marca: 'PARKER',
    espec: 'Elemento filtrante separador de água Racor 2040PM, número original 1671501, Aquabloc II 30 µm, altura 122 mm, diâmetro interno 16,1 mm, diâmetro externo 112 mm',
    catmat: '625582',
    usos: [{ tags: ['MCA-1', 'MCA-2'], motor: 'MCA', porTroca: 1, regra: { horas: 500, meses: 12 }, rotina: 'Pré-filtro separador de combustível (pelo vacuômetro, no máximo anual)', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 10, est: 100.00, hom: 88.18 },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 11, est: 97.26, hom: 90.70 }], ref: 70.30 },
  { id: 'fc161', grupo: 'Filtros', nome: 'Filtro de combustível FC161 (Tecfil)', marca: 'TECFIL',
    espec: 'Filtro de combustível FC161, elemento de feltro, altura 115 mm, diâmetro externo 57,8 mm, diâmetro interno 13,8 mm',
    catmat: '627693',
    usos: [{ tags: ['MCA-1', 'MCA-2'], motor: 'MCA', porTroca: 2, regra: { horas: 250, meses: 6 }, rotina: 'Troca dos filtros de combustível', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 20, est: 15.78, hom: 14.75 },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 65, est: 16.39, hom: 14.49 }], ref: 16.00 },
  { id: 'psl962', grupo: 'Filtros', nome: 'Filtro de óleo lubrificante PSL962 (Tecfil)', marca: 'TECFIL',
    espec: 'Filtro de óleo lubrificante PSL962, original 9054118800, elemento de papel, altura 208,5 mm, diâmetro externo 93,2 mm, rosca 1" x 12 UNF-2B, com válvulas antirretorno e de alívio',
    catmat: '615936',
    usos: [{ tags: ['MCA-1', 'MCA-2'], motor: 'MCA', porTroca: 1, regra: { horas: 250, meses: 6 }, rotina: 'Troca de óleo e filtro de óleo lubrificante' }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 10, est: 35.90, hom: null },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 33, est: 53.90, hom: 49.40 }], ref: 53.20 },
  { id: 'tbh8841', grupo: 'Filtros', nome: 'Filtro de óleo TBH8841 (Turbo Filtros)', marca: 'TURBOFILTROS',
    espec: 'Filtro de óleo TBH8841, linha pesada, altura 152 mm, diâmetro externo 98 mm, rosca 1 3/8" x 12 UNF, com válvula by-pass',
    catmat: '613967', obs: 'Mesmas medidas do PSH693 (152 × 98 mm, rosca 1 3/8" x 12 UNF). Saiu da compra de 2026, quando o PSH693 subiu de 2 para 8: conferir a bordo se o PSH693 passou a ser usado nas redutoras.',
    usos: [{ tags: ['CR-BB', 'CR-BE'], motor: 'MCP', porTroca: 1, regra: { horas: 1000, meses: 12 }, rotina: 'Troca de óleo e filtro da caixa redutora', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 12, est: 299.77, hom: null }], ref: null },
  { id: 'psh693', grupo: 'Filtros', nome: 'Filtro de óleo hidráulico PSH693 (Tecfil)', marca: 'TECFIL',
    espec: 'Filtro de óleo hidráulico PSH693, referência AL77061, elemento de papel, altura 152 mm, diâmetro externo 98 mm, rosca 1 3/8" x 12 UNF',
    catmat: '613966', catmatAlerta: 'CATMAT 613966 é filtro de óleo de hélice de passo controlado (650 mm)',
    usos: [{ tags: ['BML-1', 'BML-2'], porTroca: 1, regra: { meses: 12 }, rotina: 'Troca do filtro de óleo hidráulico da máquina do leme', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 2, est: 219.46, hom: null },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 8, est: 185.03, hom: 179.60 }], ref: null },
  { id: 'everest', grupo: 'Filtros', nome: 'Refil Everest 2 em 1 (Soft Everest)', marca: 'SOFT EVEREST',
    espec: 'Elemento filtrante (refil original 755) Everest 2 em 1, código 1928834, para purificador Everest Soft Star, cartucho de polipropileno atóxico com carvão ativado, vida útil média de 4.000 litros ou 9 a 12 meses',
    catmat: '618272',
    usos: [{ tags: [], n: 2, porTroca: 1, regra: { meses: 12 }, rotina: 'Troca do refil dos purificadores de água (bebedouros)' }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 2, est: 100.00, hom: null },
      { ano: 2026, processo: '63387.000045/2026-54', qtd: 2, est: 107.80, hom: 103.80 }], ref: 108.94 },
  { id: 'bauer-059183', grupo: 'Filtros', nome: 'Cartucho triplex Bauer PN 059183', marca: 'BAUER',
    espec: 'Cartucho de substituição triplex, part number 059183, para compressor de ar respirável Bauer PE 250-TE',
    catmat: '615978', catmatAlerta: 'CATMAT 615978 é filtro de óleo de compressor Atlas Copco',
    usos: [{ tags: ['CAA'], porTroca: 1, regra: { meses: 12 }, rotina: 'Troca do cartucho triplex do compressor de ar respirável', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 1, est: 1054.66, hom: 970.20 }], ref: null },
  { id: 'bauer-n25950', grupo: 'Filtros', nome: 'Elemento de admissão de ar Bauer PN N25950', marca: 'BAUER',
    espec: 'Elemento filtrante de admissão de ar, part number N25950, para compressor de ar respirável Bauer PE 250-TE',
    catmat: '615935',
    usos: [{ tags: ['CAA'], porTroca: 1, regra: { meses: 12 }, rotina: 'Troca do filtro de admissão do compressor de ar respirável', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 1, est: 455.40, hom: null }], ref: null },
  { id: 'bauer-n25326', grupo: 'Filtros', nome: 'Elemento de óleo Bauer PN N25326', marca: 'BAUER',
    espec: 'Elemento filtrante de óleo, part number N25326, para compressor de ar respirável Bauer PE 250-TE',
    catmat: '468338',
    usos: [{ tags: ['CAA'], porTroca: 1, regra: { meses: 12 }, rotina: 'Troca do filtro de óleo do compressor de ar respirável', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000528/2025-78', qtd: 1, est: 340.06, hom: null }], ref: null },

  { id: 'jabsco-17935', grupo: 'Impelidores e correias', nome: 'Impelidor Jabsco 17935-0001-P', marca: 'JABSCO',
    espec: 'Rotor/impelidor flexível modelo 17935-0001-P, em neoprene com inserto em latão, 12 palhetas, diâmetro externo de aproximadamente 95 mm, largura de 63 mm e furo estriado para eixo de 25,4 mm',
    catmat: '603206', catmatAlerta: 'CATMAT 603206 é rotor de motor de popa Johnson/Evinrude',
    usos: [{ tags: ['MCP-BB', 'MCP-BE'], motor: 'MCP', porTroca: 1, regra: 'mtuC', rotina: 'Substituição do rotor da bomba de água bruta (SR18)', confirmar: true }],
    hist: [{ ano: 2026, processo: '63387.000045/2026-54', qtd: 3, est: 497.90, hom: 460.00 }], ref: 657.00 },
  { id: 'jabsco-17937', grupo: 'Impelidores e correias', nome: 'Impelidor Jabsco 17937-0001', marca: 'JABSCO',
    espec: 'Rotor/impelidor flexível modelo 17937-0001, em neoprene com inserto em latão, 10 palhetas, diâmetro externo de aproximadamente 65 mm, largura de 51 mm e furo estriado para eixo de 16 mm (drive tipo spline)',
    catmat: '355547', catmatAlerta: 'CATMAT 355547 é rotor de motor de popa Yamaha 40 HP',
    usos: [{ tags: ['MCA-1', 'MCA-2'], motor: 'MCA', porTroca: 1, regra: { meses: 12 }, rotina: 'Substituição do rotor da bomba de água bruta', confirmar: true }],
    hist: [{ ano: 2026, processo: '63387.000045/2026-54', qtd: 3, est: 434.50, hom: 410.93 }], ref: null },
  { id: 'correia-13av1450', grupo: 'Impelidores e correias', nome: 'Correia em V 13AV1450 (Continental)', marca: 'CONTINENTAL',
    espec: 'Correia automotiva em V, referência 13AV1450, de borracha com elementos de tração têxteis, largura nominal de 13 mm, comprimento efetivo de 1.450 mm, perfil trapezoidal tipo AV',
    catmat: '479315', catmatAlerta: 'CATMAT 479315 é correia de caminhão VW Worker',
    usos: [{ tags: ['MCA-1', 'MCA-2'], motor: 'MCA', porTroca: 2, regra: { meses: 12 }, rotina: 'Substituição das correias', confirmar: true }],
    hist: [{ ano: 2026, processo: '63387.000045/2026-54', qtd: 4, est: 100.84, hom: 92.80 }], ref: null },
  { id: 'correia-13av1045', grupo: 'Impelidores e correias', nome: 'Correia em V 13AV1045 (Continental)', marca: 'CONTINENTAL',
    espec: 'Correia automotiva em V, referência 13AV1045, de borracha com elementos de tração têxteis, largura nominal de 13 mm, comprimento efetivo de 1.045 mm, perfil trapezoidal tipo AV',
    catmat: '342432', catmatAlerta: 'CATMAT 342432 é correia de Toyota Hilux',
    usos: [{ tags: ['MCA-1', 'MCA-2'], motor: 'MCA', porTroca: 2, regra: { meses: 12 }, rotina: 'Substituição das correias', confirmar: true }],
    hist: [{ ano: 2026, processo: '63387.000045/2026-54', qtd: 4, est: 81.15, hom: 79.70 }], ref: null },

  { id: 'bateria-180', grupo: 'Baterias', nome: 'Bateria de partida Moura 12 V 180 Ah (LOG Diesel)', marca: 'MOURA',
    espec: 'Bateria automotiva selada 12 V / 180 Ah (C20), linha pesada, modelos de referência Moura M180BD ou M180BE; reserva de capacidade (RC25) de 260 minutos e corrente de partida a frio (CCA) de 950 A a –18 °C; dimensões máximas de 512 × 211 × 233 mm; chumbo-ácido selada, livre de manutenção, resistente a vibrações; polaridade conforme o circuito (M180BD ou M180BE), a informar no pedido; garantia mínima de 18 meses',
    catmat: '389537', catmatAlerta: 'CATMAT 389537 é bateria selada de 200 Ah',
    usos: [{ tags: ['MCP-BB', 'MCP-BE', 'MCA-1', 'MCA-2'], porTroca: 2, regra: { meses: 24, jogo: true }, reserva: 1, rotina: 'Substituição das baterias de partida (2 × 12 V em série)', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000601/2025-10', qtd: 9, est: 1434.90, hom: 1372.30 }], ref: 1317.86 },
  { id: 'bateria-220', grupo: 'Baterias', nome: 'Bateria estacionária Moura 12 V 220 Ah (VRLA)', marca: 'MOURA',
    espec: 'Bateria estacionária 12 V / 220 Ah (C20), chumbo-ácido regulada por válvula (VRLA/AGM) ou ventilada de baixa manutenção, C10 de aproximadamente 200 Ah; dimensões aproximadas de 517 × 272 × 246 mm; tensão de flutuação de 13,6 a 13,8 V; até 1.000 ciclos a 20% de profundidade de descarga; bornes tipo "L"; garantia mínima de 24 meses',
    catmat: '446030', catmatAlerta: 'CATMAT 446030 é lâmpada LED; o item ficou sem resultado em 2025',
    usos: [{ tags: [], n: 8, porTroca: 1, regra: { meses: 36, jogo: true }, reserva: 1, rotina: 'Substituição do banco de baterias estacionárias de 24 V', confirmar: true }],
    hist: [{ ano: 2025, processo: '63387.000601/2025-10', qtd: 9, est: 1649.00, hom: null }], ref: null }
];

function matCfg() {
  const d = DB.dados;
  /* Padrões calibrados pelo diesel real (CONTROLE CLG, nov/2025 a out/2026: 72.187 L, navio em comissão o ano todo):
   * um MCA ligado 24 h por dia (≈ 8.000 h no par, 4.000 h cada, a ≈ 6,5 L/h = 52.000 L) e o restante
   * nos MCP (≈ 20.000 L a ≈ 25 L/h por motor = 400 h cada). Conferir pelos horímetros. */
  const ano = new Date().getMonth() >= 8 ? new Date().getFullYear() + 1 : new Date().getFullYear();
  d.materiais = Object.assign({ horasAno: { MCP: '400', MCA: '4000' }, catMtu: 'I', reserva: true, anoAlvo: String(ano), itens: {} }, d.materiais || {});
  return d.materiais;
}
/* CATMAT em uso: o digitado na aba Material ou, se em branco, o da última dispensa. */
function catmatDe(m) { return (matItem(m.id).catmat || '').trim() || m.catmat; }
function campoCatmat(m, it) {
  const trocado = (it.catmat || '').trim() && it.catmat.trim() !== m.catmat;
  return '<div class="catmat"><span class="sub">CATMAT</span> <input class="mini-in larga" type="text" inputmode="numeric" data-mat="' + m.id +
    '" data-campo="catmat" value="' + esc(it.catmat || '') + '" placeholder="' + esc(m.catmat) + '" aria-label="CATMAT de ' + esc(m.nome) + '">' +
    (trocado ? ' <span class="sub">trocado (era ' + esc(m.catmat) + ')</span>'
      : m.catmatAlerta ? '<div class="sub alerta">⚠ ' + esc(m.catmatAlerta) + '. Digite o código certo aqui.</div>' : '') +
    sugestaoCatmat(m, it) + '</div>';
}
function sugestaoCatmat(m, it) {
  const s = typeof SUGESTOES_CATMAT !== 'undefined' && SUGESTOES_CATMAT[m.id];
  if (!s || (it.catmat || '').trim() === s.c) return '';
  return '<div class="sugCat">' + (s.c
    ? '<b>Sugestão: ' + esc(s.c) + '</b> <button type="button" class="mini ok" data-usarcatmat="' + m.id + '" data-cod="' + esc(s.c) + '">Usar ' + esc(s.c) + '</button>' +
      '<div class="sub">' + esc(s.d) + '. ' + esc(maiusc1(s.nota)) + '.</div>'
    : '<b>Sem código equivalente no catálogo.</b><div class="sub">Família: ' + esc(s.familia) + '; ' + esc(s.nota) + '. Caminho: pedido de catalogação ou o código genérico da família.</div>') +
    '</div>';
}
function matItem(id) { const c = matCfg(); return c.itens[id] || (c.itens[id] = {}); }

function intervaloTxt(regra, cat) {
  if (typeof regra === 'string') return 'a cada ' + MTU_CATEGORIAS[cat][regra.slice(3)] + ' h (MTU ' + regra.slice(3) + ') ou 1 ano';
  const meses = regra.meses ? (regra.meses === 12 ? 'anual' : 'a cada ' + regra.meses + ' meses') : '';
  if (regra.horas) return 'a cada ' + fmt(regra.horas) + ' h' + (meses ? ' ou ' + meses.replace('anual', '1 ano').replace('a cada ', '') : '');
  return meses + (regra.jogo ? ' (jogo inteiro)' : '');
}

/* Consumo por ano de um material e a memória do cálculo. */
function consumoMaterial(m) {
  const c = matCfg();
  let total = 0, umaTroca = 0;
  const memoria = m.usos.map(u => {
    const n = u.n || u.tags.length;
    const h = num(c.horasAno[u.motor]) || 0;
    let trocas;
    /* o que vencer primeiro: horas ou tempo (o serviço A da MTU é feito pelo menos uma vez por ano) */
    if (typeof u.regra === 'string') trocas = Math.max(h / MTU_CATEGORIAS[c.catMtu][u.regra.slice(3)], 1);
    else if (u.regra.jogo) {
      /* baterias: troca-se o jogo inteiro no ano em que vence, contado da última compra */
      const ult = num(matItem(m.id).ultAno) || m.hist[m.hist.length - 1].ano;
      const vence = ult + u.regra.meses / 12;
      trocas = (num(c.anoAlvo) || 0) >= vence ? 1 : 0;
      const q = n * u.porTroca * trocas;
      total += q; if (trocas) umaTroca += u.reserva != null ? u.reserva : 0;
      return n + ' equip. × ' + u.porTroca + ' un.: jogo comprado em ' + ult + ', vence em ' + vence +
        (trocas ? ' (troca prevista em ' + c.anoAlvo + ')' : ' (sem troca em ' + c.anoAlvo + ')');
    }
    else trocas = Math.max(u.regra.horas ? h / u.regra.horas : 0, u.regra.meses ? 12 / u.regra.meses : 0);
    const q = n * u.porTroca * trocas;
    total += q; umaTroca += u.reserva != null ? u.reserva : n * u.porTroca;
    return n + ' equip. × ' + u.porTroca + ' un. × ' + fmt(trocas, trocas % 1 ? 1 : 0) + ' trocas/ano (' + intervaloTxt(u.regra, c.catMtu) +
      (u.motor ? ', ' + fmt(h) + ' h/ano' : '') + ')';
  });
  const minimo = c.reserva ? umaTroca : 0;            /* pronto emprego: uma troca completa (ou a reserva do uso) sempre a bordo */
  return { anual: total, minimo, memoria };
}

function linhaMaterial(m) {
  const it = matItem(m.id);
  const k = consumoMaterial(m);
  const estoque = numBR(it.estoque) || 0;
  const calc = Math.max(0, Math.ceil(k.anual + k.minimo - estoque - 1e-9));
  const comprar = numBR(it.comprar) != null ? numBR(it.comprar) : calc;
  const ultimo = m.hist[m.hist.length - 1];
  const informado = numBR(it.preco);
  const preco = informado != null ? informado : (m.ref != null ? m.ref : (ultimo.hom || ultimo.est));
  const precoFonte = informado != null ? 'informado' : m.ref != null ? 'pesquisa nov/2026' :
    ultimo.hom ? 'última compra (' + ultimo.ano + '), cotar' : 'estimado ' + ultimo.ano + ' (sem resultado), cotar';
  return { m, it, k, estoque, calc, comprar, preco, precoFonte, total: comprar * preco, abaixo: estoque < k.minimo };
}

/* Horas de uso por ano medidas pelos horímetros (média dos motores com a tag MCP... ou MCA...). */
function horasMedidas(motor) {
  const eqs = DB.dados.equipamentos.filter(e => new RegExp('^' + motor, 'i').test(e.tag || ''));
  const med = eqs.map(e => ({ e, h: Ficha.horasAno(e) })).filter(x => x.h);
  if (!med.length) return { h: null, n: eqs.length, base: 0 };
  return { h: Math.round(med.reduce((s, x) => s + x.h.h, 0) / med.length / 10) * 10, n: eqs.length, base: med.length,
    dias: Math.min(...med.map(x => x.h.dias)) };
}

const Materiais = {
  realce: new Set(),

  render() {
    const c = matCfg();
    const f = $('#formMatCfg');
    if (!f) return;
    f.elements.hMCP.value = c.horasAno.MCP; f.elements.hMCA.value = c.horasAno.MCA;
    ['MCP', 'MCA'].forEach(mt => {
      const m = horasMedidas(mt), box = $('#med' + mt);
      if (!box) return;
      const atual = num(c.horasAno[mt]);
      box.innerHTML = m.h != null
        ? 'Medido: <b>' + fmt(m.h) + ' h/ano</b> (' + m.base + ' de ' + m.n + ' motores, ' + m.dias + '+ dias de leituras)' +
          (atual !== m.h ? ' <button type="button" class="mini ok" data-usarmed="' + mt + '">Usar</button>' : ' <span class="ok-ink">em uso</span>')
        : 'Sem leituras de horímetro suficientes ainda: vale o valor digitado.';
    });
    f.elements.catMtu.value = c.catMtu; f.elements.reserva.checked = !!c.reserva; f.elements.anoAlvo.value = c.anoAlvo;
    const linhas = MATERIAIS.map(linhaMaterial);
    let html = '';
    for (const g of GRUPOS_MAT) {
      const ls = linhas.filter(l => l.m.grupo === g);
      const sub = ls.reduce((s, l) => s + l.total, 0);
      html += '<tr class="grupo"><td colspan="8"><label><input type="checkbox" data-grupo="' + esc(g) + '"' +
        (c['fora_' + g] ? '' : ' checked') + '> ' + esc(g) + '</label><span class="sub"> · R$ ' + moeda(sub) + '</span></td></tr>';
      html += ls.map(l => {
        const m = l.m;
        const onde = m.usos.map(u => (u.tags.length ? u.tags.join(', ') : u.n + ' un.') + ' · ' + intervaloTxt(u.regra, c.catMtu) +
          (u.confirmar ? ' <span class="tagIA" title="Vínculo ou quantidade por troca ainda a confirmar">confirmar</span>' : '')).join('<br>');
        const hist = m.hist.map(h => h.ano + ': ' + h.qtd + ' un. × ' + moeda(h.est) + (h.hom ? ' (homol. ' + moeda(h.hom) + ')' : ' (sem resultado)')).join('<br>');
        const cls = [l.abaixo ? 'abaixo' : '', l.it.fora || c['fora_' + g] ? 'fora' : '', this.realce.has(m.id) ? 'realce' : ''].filter(Boolean).join(' ');
        return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td><label class="selmat"><input type="checkbox" data-mat="' + m.id + '" data-campo="fora"' +
          (l.it.fora ? '' : ' checked') + '> <b>' + esc(m.nome) + '</b></label>' + campoCatmat(m, l.it) +
          '<div class="sub">' + hist + '</div>' + (m.obs ? '<div class="sub alerta">' + esc(m.obs) + '</div>' : '') + '</td>' +
          '<td class="sub">' + onde + '</td>' +
          '<td class="num" title="' + esc(l.k.memoria.join('\n')) + '">' + fmt(l.k.anual, l.k.anual % 1 ? 1 : 0) + '<div class="sub">mín. ' + l.k.minimo + '</div></td>' +
          '<td class="num"><input class="mini-in" type="number" min="0" step="1" data-mat="' + m.id + '" data-campo="estoque" value="' + esc(l.it.estoque || '') + '" placeholder="0"></td>' +
          '<td class="num"><input class="mini-in" type="number" min="0" step="1" data-mat="' + m.id + '" data-campo="comprar" value="' + esc(l.it.comprar || '') + '" placeholder="' + l.calc + '"></td>' +
          '<td class="num"><input class="mini-in larga" type="text" inputmode="decimal" data-mat="' + m.id + '" data-campo="preco" value="' + esc(l.it.preco || '') + '" placeholder="' + moeda(l.preco) + '"><div class="sub">' + l.precoFonte + '</div></td>' +
          '<td class="num">' + (l.comprar ? moeda(l.total) : '—') + '</td></tr>';
      }).join('');
    }
    $('#tabMat tbody').innerHTML = html;
    const sel = linhas.filter(l => !c['fora_' + l.m.grupo] && !l.it.fora && l.comprar > 0);
    const tot = sel.reduce((s, l) => s + l.total, 0);
    const abaixo = linhas.filter(l => l.abaixo).length;
    $('#matResumo').innerHTML = '<b>' + sel.length + ' itens a comprar · R$ ' + moeda(tot) + '</b>' +
      (tot > 60000 ? ' <span class="alerta">perto ou acima do limite do art. 75, II. Confira o valor vigente no ano e some as demais dispensas da UG com objetos do mesmo ramo (art. 75, § 1º).</span>' : '') +
      (abaixo ? '<br><span class="alerta">' + abaixo + ' materiais com estoque abaixo de uma troca completa (linhas destacadas).</span>' : '');
  },

  /* Vindo do Painel ou da ficha: marca estes materiais para a dispensa anual e mostra onde estão. */
  destacar(ids, motivo) {
    const c = matCfg();
    ids.forEach(id => {
      matItem(id).fora = false;
      const m = MATERIAIS.find(x => x.id === id);
      if (m) c['fora_' + m.grupo] = false;
    });
    this.realce = new Set(ids);
    DB.salvar();
    irPara('materiais');
    const tr = $('#tabMat tr.realce');
    if (tr) tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast((motivo ? motivo + ': ' : '') + ids.length + ' material(is) marcado(s) para a dispensa anual. Confira a quantidade e clique em “Criar dispensa com os itens marcados”.');
  },

  selecionados() {
    const c = matCfg();
    return MATERIAIS.map(linhaMaterial).filter(l => !c['fora_' + l.m.grupo] && !l.it.fora && l.comprar > 0);
  },

  /* Cria a dispensa de material com vários itens e abre no editor da aba Dispensa. */
  criarDispensa() {
    const ls = this.selecionados();
    if (!ls.length) { toast('Nenhum item a comprar nos grupos marcados.', true); return; }
    const grupos = [...new Set(ls.map(l => l.m.grupo))];
    const itens = ls.map(l => ({ id: l.m.id, nome: l.m.nome, espec: l.m.espec, marca: l.m.marca, catmat: catmatDe(l.m),
      catmatAlerta: l.it.catmat ? '' : l.m.catmatAlerta || '', un: 'UN', qtd: l.comprar, qtdCalc: l.calc, ajuste: l.comprar !== l.calc ? l.comprar : undefined, preco: Math.round(l.preco * 100) / 100,
      onde: l.m.usos.map(u => u.rotina + (u.tags.length ? ' (' + u.tags.join(', ') + ')' : '')).join('; '),
      memoria: l.k.memoria.join('; ') + (l.k.minimo ? '; mais ' + l.k.minimo + ' un. de reserva para uma troca completa em comissão' : '') +
        (l.estoque ? '; menos ' + l.estoque + ' un. em estoque' : '') + ' = ' + l.calc + ' un.' }));
    const valor = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
    const partes = [].concat(grupos.includes('Filtros') ? ['filtros'] : [],
      grupos.includes('Impelidores e correias') ? ['impelidores', 'correias'] : [], grupos.includes('Baterias') ? ['baterias'] : []);
    const titulo = grupos.length === 1 && grupos[0] === 'Baterias' ? 'baterias de 12 V' :
      'sobressalentes de manutenção (' + enumerar(partes) + ')';
    irPara('dispensa');
    Dispensa.nova({ tipoObjeto: 'Material de consumo', catTipo: 'CATMAT', unidade: 'UN', qtd: String(itens.length),
      servicoTitulo: titulo, alvo: 'os motores e equipamentos da Praça de Máquinas', funcao: '', carater: 'preventivo e corretivo',
      identificacao: '', prazo: '10', vigencia: '6', garantia: '90', valor: valor.toFixed(2).replace('.', ','), itens,
      referencias: 'os manuais de operação e manutenção dos fabricantes', reserva: !!matCfg().reserva, grupos });
    toast('Dispensa criada com ' + itens.length + ' itens. Confira os textos e preencha NUP, PAR e pesquisa de preços.');
  },

  /* Cria no plano de manutenção as rotinas de troca destes materiais, sem duplicar. */
  carregarRotinas() {
    const c = matCfg(), d = DB.dados;
    let novas = 0, semEquip = new Set();
    for (const m of MATERIAIS) for (const u of m.usos) for (const tag of u.tags) {
      const e = d.equipamentos.find(x => (x.tag || '').toUpperCase() === tag);
      if (!e) { semEquip.add(tag); continue; }
      if (d.rotinas.some(r => r.equipId === e.id && r.descricao === u.rotina)) {
        const r = d.rotinas.find(r => r.equipId === e.id && r.descricao === u.rotina);
        if (!(r.materiais || []).includes(m.id)) (r.materiais = r.materiais || []).push(m.id);
        continue;
      }
      if (u.regra.jogo) continue;   /* baterias: troca por vencimento, não vira rotina de horas */
      const horas = typeof u.regra === 'string' ? MTU_CATEGORIAS[c.catMtu][u.regra.slice(3)] : u.regra.horas;
      d.rotinas.push({ id: novoId('rot'), equipId: e.id, descricao: u.rotina, base: horas ? 'horas' : 'dias',
        intervalo: String(horas || Math.round(u.regra.meses * 30.4)), ultData: '', ultHoras: '',
        referencia: (u.motor === 'MCP' && !tag.startsWith('CR') ? 'Manual de O&M MTU 6R 199, Tabela de Manutenção' :
          tag.startsWith('CR') ? 'Manual Twin Disc MGX 5114SC' : u.motor === 'MCA' ? 'Manutenção preventiva Leon Heimer / MWM D229-6' : 'Manual do fabricante') +
          ' · material: ' + m.nome + ' (' + u.porTroca + ' un. por troca)', materiais: [m.id] });
      novas++;
    }
    DB.salvar();
    toast(novas + ' rotinas criadas.' + (semEquip.size ? ' Sem cadastro: ' + [...semEquip].join(', ') + '.' : ''), semEquip.size > 0);
  },

  ligar() {
    const f = $('#formMatCfg');
    f.addEventListener('change', () => {
      const c = matCfg();
      c.horasAno = { MCP: f.elements.hMCP.value, MCA: f.elements.hMCA.value };
      c.catMtu = f.elements.catMtu.value; c.reserva = f.elements.reserva.checked; c.anoAlvo = f.elements.anoAlvo.value;
      DB.salvar();
    });
    $('#tabMat').addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.grupo) { matCfg()['fora_' + t.dataset.grupo] = !t.checked; DB.salvar(); return; }
      if (!t.dataset.mat) return;
      if (t.dataset.campo === 'fora') matItem(t.dataset.mat).fora = !t.checked;
      else matItem(t.dataset.mat)[t.dataset.campo] = t.value.trim();
      DB.salvar();
    });
    $('#tabMat').addEventListener('click', e => {
      const b = e.target.closest('[data-usarcatmat]'); if (!b) return;
      matItem(b.dataset.usarcatmat).catmat = b.dataset.cod;
      DB.salvar();
      toast('CATMAT ' + b.dataset.cod + ' aplicado. Para voltar, apague o código na caixa.');
    });
    $('#btnMatDispensa').onclick = () => this.criarDispensa();
    f.addEventListener('click', e => {
      const b = e.target.closest('[data-usarmed]'); if (!b) return;
      const m = horasMedidas(b.dataset.usarmed);
      if (m.h == null) return;
      matCfg().horasAno[b.dataset.usarmed] = String(m.h);
      DB.salvar();
      toast('Horas por ano dos ' + b.dataset.usarmed + ' atualizadas para ' + fmt(m.h) + ' h, medidas pelos horímetros.');
    });
    $('#btnMatRotinas').onclick = () => this.carregarRotinas();
  }
};

/* ---------- textos da dispensa com vários itens (chamado por textosPadrao) ---------- */
function textosItens(P, t) {
  const C = DB.dados.dispCfg || {};
  const om = C.om || '[OM]';
  const itens = P.itens;
  const valor = itens.reduce((s, i) => s + i.qtd * i.preco, 0);
  const valorTxt = 'R$ ' + moeda(valor) + ' (' + extensoReais(valor) + ')';
  const soBaterias = itens.every(i => /bateria/i.test(i.nome));
  const temBateria = itens.some(i => /bateria/i.test(i.nome));
  const objeto = 'Aquisição de ' + (P.servicoTitulo || 'sobressalentes') + (soBaterias
    ? ' para a partida dos motores e o circuito de 24 V '
    : ' para a manutenção preventiva e corretiva dos sistemas de propulsão, geração de energia, governo e habitabilidade ') + contr('o ' + om);
  t._assunto = objeto;
  const lista = itens.map((i, n) => (n + 1) + '. ' + i.nome + ' – ' + i.qtd + ' unidade' + (i.qtd > 1 ? 's' : ''));

  t.necessidade = 'A presente necessidade diz respeito à ' + objeto.charAt(0).toLowerCase() + objeto.slice(1) + ', ' +
    'em especial dos Motores de Combustão Principal (MTU 6R 199 TB60), dos Motores de Combustão Auxiliar (MWM D229-6) e dos demais ' +
    'equipamentos atendidos pelos itens. Esses materiais são de consumo e substituição periódica, nos intervalos fixados pelos ' +
    'fabricantes, e precisam estar a bordo a pronto emprego, porque o navio opera em comissões longas em áreas remotas da Amazônia, ' +
    'sem apoio logístico próximo.\n\nAs quantidades foram calculadas a partir das horas de funcionamento previstas para o ano, dos ' +
    'intervalos de troca dos manuais e do estoque existente a bordo' + (P.reserva === false ? '. ' : ', mantida uma troca completa de reserva para cada equipamento. ') +
    '\n\nA contratação enquadra-se na hipótese do art. 75, inciso II, da Lei nº 14.133/2021, processando-se pelo procedimento de dispensa ' +
    'eletrônica da IN SEGES/ME nº 67/2021, precedida de pesquisa de preços nos termos do art. 23 da mesma Lei e da IN SEGES/ME nº 65/2021' +
    (P.pesquisaNum ? ', consubstanciada na Pesquisa de Preços nº ' + P.pesquisaNum : '') + '. Os materiais da mesma natureza foram ' +
    'reunidos em um único processo anual, e o valor estimado, somado às demais despesas da unidade gestora no exercício com objetos do ' +
    'mesmo ramo de atividade, observa o limite do art. 75, inciso II (art. 75, § 1º, incisos I e II, da Lei nº 14.133/2021).';
  t.dfdJustificativa = t.necessidade;
  t.descricaoSucinta = objeto + ', em ' + itens.length + ' itens, conforme tabela do Termo de Referência.';
  t.quantidades = 'Estimativa das quantidades a serem contratadas, com a memória de cálculo de cada item:\n\n' +
    itens.map((i, n) => (n + 1) + '. ' + i.nome + ': ' + i.qtd + ' unidade' + (i.qtd > 1 ? 's' : '') + '. Uso: ' + i.onde + '. Cálculo: ' + i.memoria +
      (i.ajuste != null ? '; quantidade ajustada pela Divisão de Máquinas para ' + i.ajuste + ' un.' : '') + '.').join('\n');
  t.dfdValor = 'O custo estimado da contratação é de ' + valorTxt + ', correspondente à soma dos itens, com preços obtidos na Pesquisa de Preços nº ' +
    (P.pesquisaNum || '[nº]') + ', realizada no Compras.gov.br nos termos do art. 23 da Lei nº 14.133/2021 e da IN SEGES/ME nº 65/2021.';
  t.requisitos = 'Todos os itens devem ser novos, de primeiro uso, em embalagem original, adequados aos modelos dos equipamentos ' +
    'instalados a bordo. A marca e o modelo indicados em cada item servem de referência de qualidade e de compatibilidade (art. 41, ' +
    'inciso I, alínea "d", da Lei nº 14.133/2021), admitidos produtos equivalentes ou de melhor qualidade, cuja compatibilidade ' +
    'dimensional e de desempenho será conferida no recebimento. Vedado o fornecimento de produtos remanufaturados ou usados.\n\n' +
    itens.map((i, n) => (n + 1) + '. ' + i.nome + ' – ' + i.espec + '. Aplicação: ' + i.onde + '.').join('\n') +
    '\n\nForma de fornecimento: entrega única, em até ' + (parseInt(P.prazo, 10) || 10) + ' dias corridos do pedido, ' +
    'com embalagem e rotulagem que preservem o estado de novo durante a armazenagem a bordo.';
  t.mercado = 'Conforme o art. 5º da Instrução Normativa SEGES/ME nº 65/2021, foram utilizadas contratações similares de outros ' +
    'órgãos e entidades públicas no período de 1 (um) ano (inciso II) e, para os itens sem preço público comparável, pesquisa direta ' +
    'com no mínimo três fornecedores (inciso IV). A medida de tendência central utilizada foi a média.';
  t.solucao = 'Aquisição dos ' + itens.length + ' itens listados, para reposição do estoque de pronto emprego da Divisão de Máquinas ' +
    'e cumprimento do plano de manutenção preventiva do ano, com entrega única e armazenagem a bordo.';
  t.etpValor = 'Valor (R$): ' + moeda(valor) + '\n\nO custo máximo estimado da contratação é de ' + valorTxt + '.';
  t.parcelamento = 'O objeto é divisível e será julgado por item, pelo menor preço, conforme o art. 40, inciso V, alínea "b", e § 2º, ' +
    'da Lei nº 14.133/2021: os itens são independentes, não há prejuízo para o conjunto e a divisão amplia a participação de fornecedores ' +
    'especializados em cada linha (filtros, peças de bomba, correias, baterias).';
  t.beneficiosTxt = alineas(['manutenção dos intervalos de troca recomendados pelos fabricantes durante todo o ano',
    'disponibilidade imediata dos materiais em comissão, sem depender de apoio logístico em áreas remotas',
    'redução de avarias e de manutenções corretivas nos motores e sistemas auxiliares']);
  t.impactos = 'Os filtros substituídos, contaminados com óleo e combustível, são resíduos perigosos e serão destinados de forma ' +
    'ambientalmente adequada, conforme a Lei nº 12.305/2010, com a logística reversa das embalagens de óleos lubrificantes (art. 33, IV).' +
    (temBateria ? ' As baterias de chumbo-ácido substituídas serão devolvidas ao fornecedor, que lhes dará destinação ambientalmente ' +
      'adequada, nos termos do art. 33, inciso II, da Lei nº 12.305/2010 e da Resolução CONAMA nº 401/2008.' : '');
  t.trObjeto = objeto + ', nos termos da tabela abaixo, conforme condições e exigências estabelecidas neste instrumento.';
  t.trTabela = 'ITEM | ESPECIFICAÇÃO | CATMAT | UNIDADE | QTD | VALOR UNITÁRIO | VALOR TOTAL\n' +
    itens.map((i, n) => (n + 1) + ' | ' + i.nome.toUpperCase() + ' – ' + i.espec + ' | ' + i.catmat + ' | ' + i.un + ' | ' + i.qtd +
      ' | R$ ' + moeda(i.preco) + ' | R$ ' + moeda(i.qtd * i.preco)).join('\n') + '\nTOTAL |  |  |  |  |  | R$ ' + moeda(valor);
  t.trDivergencia = '1.2. Em caso de conflito entre a descrição do bem contida no CATMAT e a discorrida detalhadamente na tabela acima, ' +
    'os interessados deverão considerar a descrição presente na tabela.\n\n1.3. O objeto desta contratação não se enquadra como bem de ' +
    'luxo, conforme Decreto nº 10.818, de 27 de setembro de 2021.';
  t.trRequisitos = '4.2. Na presente contratação será admitida a indicação das seguintes marcas ou modelos, como referência de ' +
    'qualidade e compatibilidade, aceitos equivalentes, de acordo com as justificativas contidas no Estudo Técnico Preliminar:\n' +
    itens.map((i, n) => '- ' + i.nome.replace(/\s*\([^)]*\)\s*$/, '') + ' - ' + i.marca + (n === itens.length - 1 ? '.' : ';')).join('\n') +
    (temBateria ? '\n\nA Contratada deverá receber as baterias usadas, em quantidade equivalente às fornecidas, dando-lhes destinação ' +
      'ambientalmente adequada (Lei nº 12.305/2010, art. 33, II; Resolução CONAMA nº 401/2008).' : '') +
    '\n\n4.3. Não será admitida a subcontratação do objeto contratual.\n\n4.4. Não haverá exigência da garantia da contratação dos arts. ' +
    '96 e seguintes da Lei nº 14.133, de 2021, pelas razões constantes do Estudo Técnico Preliminar.';
  t.trExecucao = '5.1. O prazo de entrega dos bens é de ' + (parseInt(P.prazo, 10) || 10) + ' (' + extensoInteiro(parseInt(P.prazo, 10) || 10) +
    ') dias corridos, contados a partir do recebimento do pedido, através de correio eletrônico indicado pela Contratada e cadastrado no ' +
    'SICAF, em REMESSA ÚNICA, visto que os sobressalentes serão armazenados em estoque para uso em comissão.\n\n5.2. Caso não seja ' +
    'possível a entrega na data assinalada, a empresa deverá comunicar as razões respectivas com pelo menos 3 dias de antecedência para ' +
    'que qualquer pleito de prorrogação de prazo seja analisado, ressalvadas situações de caso fortuito e força maior.\n\n5.3. Os bens deverão ser ' +
    'entregues no seguinte endereço: ' + (C.local || '[endereço de entrega]') + '.';
  t.trGarantia = 'O prazo de garantia é aquele estabelecido na Lei nº 8.078, de 11 de setembro de 1990 (Código de Defesa do Consumidor), ' +
    'ou o do fabricante, se maior' + (itens.some(i => /bateria/i.test(i.nome)) ? ', observado o mínimo indicado na especificação das baterias' : '') + '.';
  t.avisoObjeto = objeto + ', conforme especificações, quantidades e condições estabelecidas no Termo de Referência e no ETP.';
  t.avisoItem = 'Havendo mais de um item, faculta-se ao fornecedor a participação em quantos forem de seu interesse.\n\n' + lista.join('\n');
  t.avisoGerais = '1.1.2.1. Produtos novos, de primeiro uso, em embalagem original; marcas e modelos indicados como referência, aceitos equivalentes.\n' +
    '1.1.2.2. Entrega única em até ' + (parseInt(P.prazo, 10) || 10) + ' dias corridos do pedido.';
  return t;
}
