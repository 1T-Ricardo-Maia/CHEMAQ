/* Dispensa eletrônica (art. 75, II, da Lei nº 14.133/2021).
 *
 * Os textos seguem o padrão da última dispensa da Divisão de Máquinas
 * (Proc. 63387.000262/2026-44): o DFD sai em Word, e o ETP, o TR e o Aviso
 * saem campo a campo, prontos para colar nos modelos do Compras.gov.br.
 * Cada texto pode ser substituído pela redação da IA ou editado à mão. */
'use strict';

/* ---------- número por extenso (reais) ---------- */
function extenso999(n) {
  const u = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze',
    'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const d = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const c = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  if (n === 100) return 'cem';
  const partes = [];
  if (n >= 100) partes.push(c[Math.floor(n / 100)]);
  const r = n % 100;
  if (r >= 20) { partes.push(d[Math.floor(r / 10)]); if (r % 10) partes.push(u[r % 10]); }
  else if (r) partes.push(u[r]);
  return partes.join(' e ');
}
function extensoInteiro(n) {
  if (n === 0) return 'zero';
  const grupos = [];
  while (n > 0) { grupos.push(n % 1000); n = Math.floor(n / 1000); }
  const nomes = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
  const partes = [];
  for (let i = grupos.length - 1; i >= 0; i--) {
    const g = grupos[i]; if (!g) continue;
    let t = i === 1 && g === 1 ? 'mil' : extenso999(g) + (i ? ' ' + nomes[i][g === 1 ? 0 : 1] : '');
    partes.push({ t, g });
  }
  /* "e" antes do último grupo quando ele é menor que 100 ou centena redonda */
  return partes.map((p, i) => (i && i === partes.length - 1 && (p.g < 100 || p.g % 100 === 0) ? 'e ' : '') + p.t).join(' ');
}
function extensoReais(v) {
  const cent = Math.round(v * 100);
  const reais = Math.floor(cent / 100), cts = cent % 100;
  let s = '';
  if (reais) s += extensoInteiro(reais) + (reais === 1 ? ' real' : (reais % 1000000 === 0 ? ' de reais' : ' reais'));
  if (cts) s += (reais ? ' e ' : '') + extensoInteiro(cts) + (cts === 1 ? ' centavo' : ' centavos');
  return s || 'zero real';
}
function moeda(v) { return v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
const QTD_EXT = ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

/* ---------- ajudantes de redação ---------- */
const linhasDe = t => String(t || '').split('\n').map(s => s.trim().replace(/[;.]+$/, '')).filter(Boolean);
function enumerar(itens) {
  if (!itens.length) return '';
  if (itens.length === 1) return itens[0];
  return itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1];
}
function alineas(itens) {
  const l = 'abcdefghijklmnopqrstuvwxyz';
  return itens.map((t, i) => l[i] + ') ' + t + (i === itens.length - 1 ? '.' : i === itens.length - 2 ? '; e' : ';')).join('\n');
}
const semArtigo = s => String(s || '').replace(/^(o|a|os|as)\s+/i, '');
const contr = s => { /* "de" + artigo → "do/da/dos/das" */
  const m = String(s || '').match(/^(o|a|os|as)\s+(.*)$/i);
  return m ? 'd' + m[1].toLowerCase() + ' ' + m[2] : 'de ' + s;
};
const maiusc1 = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function ehMaterial(P) { return /^Material/.test(P.tipoObjeto); }

/* ---------- textos ---------- */
const CAMPOS = {
  dfd: [
    ['dfdJustificativa', '1. Justificativa da necessidade da contratação'],
    ['descricaoSucinta', '2. Descrição sucinta do objeto'],
    ['quantidades', '3. Quantidade a ser contratada'],
    ['dfdValor', '4. Estimativa preliminar do valor'],
    ['dfdData', '5. Data pretendida para a conclusão'],
    ['dfdPrioridade', '6. Grau de prioridade'],
    ['dfdVinculo', '7. Vinculação com outro DFD']
  ],
  etp: [
    ['necessidade', '2. Descrição da necessidade'],
    ['etpArea', '3. Área requisitante'],
    ['requisitos', '4. Descrição dos requisitos da contratação'],
    ['mercado', '5. Levantamento de mercado'],
    ['solucao', '6. Descrição da solução como um todo'],
    ['quantidades', '7. Estimativa das quantidades'],
    ['etpValor', '8. Estimativa do valor da contratação'],
    ['parcelamento', '9. Justificativa para o parcelamento ou não da solução'],
    ['correlatas', '10. Contratações correlatas e/ou interdependentes'],
    ['alinhamento', '11. Alinhamento com o planejamento'],
    ['beneficiosTxt', '12. Benefícios a serem alcançados'],
    ['providencias', '13. Providências a serem adotadas'],
    ['impactos', '14. Possíveis impactos ambientais'],
    ['viabilidade', '15. Declaração de viabilidade']
  ],
  tr: [
    ['trObjeto', '1.1. Objeto e especificação'],
    ['trTabela', 'Tabela dos itens'],
    ['trDivergencia', '1.2. Divergência com o catálogo'],
    ['trVigencia', '1.3. Vigência'],
    ['trPar', '2.2. Planejamento (PAR)'],
    ['trRequisitos', '4. Requisitos da contratação (itens específicos)'],
    ['trExecucao', '5. Modelo de execução do objeto'],
    ['trGarantia', '5.6. Garantia']
  ],
  aviso: [
    ['avisoPreambulo', 'Preâmbulo'],
    ['avisoObjeto', '1.1. Objeto da contratação direta'],
    ['avisoItem', '1.1.1. Item'],
    ['avisoGerais', '1.1.2. Requisitos gerais']
  ]
};
/* Campos que a IA redige (os demais são montados a partir dos dados). */
const CAMPOS_IA = ['necessidade', 'descricaoSucinta', 'requisitos', 'solucao', 'quantidades', 'parcelamento',
  'beneficiosTxt', 'providencias', 'impactos', 'avisoItem'];

function textosPadrao(P) {
  const C = DB.dados.dispCfg || {};
  const om = C.om || '[OM]';
  const eqTxt = P.alvo || '[equipamento]';
  const ident = P.identificacao ? ', ' + P.identificacao : '';
  const material = ehMaterial(P);
  const valor = num(P.valor);
  const qtd = parseInt(P.qtd, 10) || 1;
  const un = P.unidade || (material ? 'UN' : 'SERV');
  const servicos = linhasDe(P.servicos);
  const materiais = linhasDe(P.materiais);
  const fora = linhasDe(P.foraEscopo);
  const benef = linhasDe(P.beneficios);
  const titulo = P.servicoTitulo || '[serviço]';
  const objetoBase = (material ? 'Aquisição de ' : 'Contratação de serviço de ') + titulo + ' ' + contr(eqTxt) + ' ' + contr('o ' + om) + ident;
  const catRef = (P.catTipo || 'CATSER') + ' ' + (P.codigo || '[código]') + ' – ' + qtd + ' ' + un;
  const pesquisa = P.pesquisaNum ? ', consubstanciada na Pesquisa de Preços nº ' + P.pesquisaNum : '';
  const ano = (P.parData || hojeIso()).slice(0, 4);
  const t = {};

  const fundLegal = 'A contratação enquadra-se na hipótese do art. 75, inciso II, da Lei nº 14.133/2021, por se tratar de ' +
    (material ? 'aquisição' : 'serviço') + ' de valor estimado compatível com o limite legal de dispensa de licitação, processando-se pelo ' +
    'procedimento de dispensa de licitação na forma eletrônica disciplinado pela IN SEGES/ME nº 67/2021, precedida de pesquisa de preços ' +
    'nos termos do art. 23 da Lei nº 14.133/2021 e da IN SEGES/ME nº 65/2021' + pesquisa + ', e observada a vedação ao fracionamento ' +
    'indevido de despesa prevista no art. 75, § 1º, da mesma Lei, uma vez que o objeto constitui item único.';

  t.necessidade = maiusc1(eqTxt) + ' ' + contr('o ' + om) + ident + (P.funcao ? ', ' + P.funcao : '') + '. ' +
    'A Divisão de Máquinas constatou' + (/^(no|na|nos|nas|em)\s/i.test(P.defeitos || '') ? ', ' : ' ') + (P.defeitos || '[o que foi constatado]').replace(/\.$/, '') + '. ' +
    (P.consequencias || 'Essa condição compromete a disponibilidade do equipamento, a segurança da navegação e a prontidão operativa do meio.') +
    '\n\n' + (servicos.length ? 'A ' + titulo.replace(/^(revisão|manutenção|reparo)/i, m => m.toLowerCase()) + ' pretendida tem caráter ' +
      (P.carater || 'preventivo e corretivo') + ' e compreende ' + enumerar(servicos) + '.' + '\n\n' : '') + fundLegal;
  t.dfdJustificativa = t.necessidade;

  t.descricaoSucinta = objetoBase + (material ? '' : ', com fornecimento de todas as peças e materiais necessários') +
    (servicos.length ? ', compreendendo ' + enumerar(servicos) : '') + ' (' + catRef + ').';

  t.quantidades = 'A contratação contempla ' + String(qtd).padStart(2, '0') + ' (' + (QTD_EXT[qtd] || qtd) + ') ' +
    (material ? 'unidade' : 'unidade de serviço') + (qtd > 1 ? 's' : '') + ' (' + un + '), correspondente à ' + titulo + ' ' + contr(eqTxt) +
    '. A estimativa foi definida a partir de levantamento técnico realizado a bordo pela Divisão de Máquinas, que identificou os ' +
    'componentes degradados, e das especificações do fabricante.' +
    (materiais.length ? '\n\nEstão incluídos no preço global todos os materiais e componentes de reposição necessários, em especial ' +
      enumerar(materiais) + '.' : '') +
    ' Não há equipamento equivalente em reserva no acervo da Organização Militar nem Ata de Registro de Preços vigente que contemple o ' +
    'objeto, e a reunião dos serviços em item único afasta o fracionamento indevido de despesa vedado pelo art. 75, § 1º, da Lei nº 14.133/2021.';

  const valorTxt = valor != null ? 'R$ ' + moeda(valor) + ' (' + extensoReais(valor) + ')' : 'R$ [valor]';
  t.dfdValor = 'O custo estimado da contratação é de ' + valorTxt + ', correspondente à média das amostras da Pesquisa de Preços nº ' +
    (P.pesquisaNum || '[nº]') + ', realizada no Compras.gov.br nos termos do art. 23 da Lei nº 14.133/2021 e da IN SEGES/ME nº 65/2021.';
  t.dfdData = 'A conclusão da contratação está prevista para ocorrer no mês de ' + (P.mes || MESES[new Date().getMonth()]) + ' do presente ano.';
  t.dfdPrioridade = (P.prioridade || 'ALTA') + '.';
  t.dfdVinculo = 'No momento não é vislumbrado vinculação com outro objeto.';

  t.etpArea = 'Área requisitante: ' + om + '\nResponsável: ' + [abrevPosto(C.respPosto), C.respNome].filter(Boolean).join(' ');

  t.requisitos = (material ? 'Aquisição de ' : 'Prestação de serviço de ') + titulo + ' ' + contr(eqTxt) + ' ' + contr('o ' + om) + ident +
    (material ? '' : ', com fornecimento de todas as peças e materiais necessários, novos') +
    ', conforme as especificações técnicas mínimas abaixo' + (P.referencias ? ', ' + P.referencias : '') +
    ', sendo a indicação do fabricante e do modelo destinada apenas a identificar o equipamento existente a bordo, vedada a exigência ou ' +
    'preferência por marca das peças e materiais a fornecer, admitidos componentes originais ou tecnicamente equivalentes. ' +
    'O ' + (material ? 'material' : 'serviço') + ' constitui o ITEM 1 da tabela abaixo e compreende:' +
    (servicos.length ? '\n' + alineas(servicos) : '\n[liste os serviços no Passo 2]');

  t.mercado = 'Conforme o Art. 5° da Instrução Normativa N° 65 de 7 de julho de 2021, foram priorizados os parâmetros do inciso IV da ' +
    'referida norma, com a intenção de suprir a necessidade de levantamento de preços condizente com a realidade mercadológica no ' +
    'subsídio do processo em tela. Ademais, a medida de tendência central utilizada foi a média, para o referido item.';

  t.solucao = (material
    ? 'Será adquirido o material especificado, novo, de primeiro uso, original ou tecnicamente equivalente ao especificado pelo fabricante'
    : 'Será contratada empresa especializada em ' + (P.area || 'manutenção de equipamentos navais') + ' para executar, ' +
      (C.local || 'a bordo') + ', a ' + titulo + ' ' + contr(eqTxt) + ', com mão de obra técnica qualificada, ferramental e instrumental ' +
      'próprios e fornecimento de todas as peças e materiais, novos, de primeiro uso, originais ou tecnicamente equivalentes aos ' +
      'especificados pelo fabricante') +
    (materiais.length ? ' — incluindo ' + enumerar(materiais) : '') + '.' +
    '\n\nO ciclo da contratação compreende: (i) especificação técnica, com base nos manuais do fabricante; (ii) pesquisa de preços, ' +
    'conforme o art. 23 da Lei nº 14.133/2021 e a IN SEGES/ME nº 65/2021; (iii) publicação do aviso de contratação direta no PNCP, com ' +
    'prazo mínimo de 3 (três) dias úteis (art. 75, § 3º); (iv) emissão da nota de empenho; e (v) ' +
    (material ? 'entrega do material' : 'execução do serviço a bordo') + ', com recebimento provisório e definitivo pela fiscalização.' +
    (fora.length ? '\n\nNão integram o objeto ' + enumerar(fora) + '. Constatada a necessidade de alguma dessas providências durante a ' +
      'execução, ela será tratada em processo específico ou por alteração contratual, conforme previsto no Termo de Referência.' : '');

  t.etpValor = 'Valor (R$): ' + (valor != null ? moeda(valor) : '[valor]') + '\n\nO custo máximo estimado da contratação é de ' + valorTxt + '.';

  t.parcelamento = 'Adota-se o critério de julgamento de menor preço por item, em observância ao princípio do parcelamento previsto no ' +
    'art. 40, § 2º, e no art. 47, inciso II, da Lei nº 14.133/2021, segundo o qual o objeto deve ser dividido em tantos itens quantos se ' +
    'comprovem técnica e economicamente viáveis, de modo a ampliar a competitividade. Analisada a divisão, verificou-se que o ' +
    (material ? 'objeto' : 'serviço') + ' constitui um único item, porque incide sobre o mesmo equipamento, na mesma janela de ' +
    'indisponibilidade, e a divisão em itens distintos exporia o equipamento à atuação simultânea de executores diferentes, ' +
    'dificultaria a atribuição de responsabilidade por falhas nos testes e na garantia e não traria ganho de competitividade. ' +
    'Configura-se, assim, a hipótese do art. 40, § 3º, inciso II, da Lei nº 14.133/2021, sendo vencedor o fornecedor que ofertar o menor ' +
    'preço para o item único.';

  t.correlatas = 'Não há contratação correlata elaborada ou planejada por esta Organização Militar (UGR) ou pelo ' +
    (C.uge || '[UGE]') + ' (UGE).';

  t.alinhamento = 'A contratação encontra-se prevista no Programa de Aplicação de Recursos (PAR) de ' + ano + ', código ' +
    (P.parCodigo || '[código]') + ', com inclusão aprovada em ' + (P.parData ? dataBr(P.parData) : '[data]') + ', elaborado pelo ' +
    (C.orgPar || '[órgão]') + ', instrumento de planejamento adotado pelo Comando da Marinha conforme a faculdade do art. 1º, parágrafo ' +
    'único, do Decreto nº 10.947/2022, e está alinhada ao planejamento de manutenção ' + contr(eqTxt) + ' ' + contr('o ' + om) + '.';

  t.beneficiosTxt = benef.length ? alineas(benef) : alineas([
    'restabelecimento da plena disponibilidade ' + contr(eqTxt),
    'redução do risco de avaria e de indisponibilidade do meio durante a navegação',
    'prolongamento da vida útil do equipamento e redução de custos com reparos corretivos futuros']);

  t.providencias = alineas([
    'declaração de adequação orçamentária e financeira da despesa, nos termos do art. 72, inciso IV, da Lei nº 14.133/2021',
    'realização de pesquisa de preços com no mínimo três fontes válidas, nos termos do art. 23 da Lei nº 14.133/2021 e da IN SEGES/ME nº 65/2021',
    'confirmação da inexistência de Ata de Registro de Preços vigente que contemple o objeto e de que a contratação não configura fracionamento indevido de despesa',
    'designação de fiscal e de gestor do contrato, nos termos do art. 117 da Lei nº 14.133/2021',
    'publicação do aviso de contratação direta no Portal Nacional de Contratações Públicas (PNCP), com antecedência mínima de 3 (três) dias úteis, nos termos do art. 75, § 3º, da Lei nº 14.133/2021',
    'consulta prévia ao SICAF, ao Cadastro Nacional de Empresas Inidôneas e Suspensas (CEIS), ao Cadastro Nacional de Empresas Punidas (CNEP) e ao Cadastro Nacional de Condenações Cíveis por Ato de Improbidade Administrativa do CNJ']
    .concat(P.referencias ? ['disponibilização à contratada ' + contr(P.referencias.replace(/^(n|d)?(o|a|os|as)\s/i, '$2 '))] : [])
    .concat(material ? [] : ['verificação da destinação das peças substituídas e dos resíduos da manutenção, conforme as normas de gestão patrimonial e a legislação ambiental',
      'atualização do registro de manutenção ' + contr(eqTxt) + ' no controle técnico da Organização Militar',
      'arquivamento do relatório técnico, dos laudos e dos registros fotográficos fornecidos pela contratada']));

  t.impactos = material
    ? 'A aquisição não gera impacto ambiental relevante. As embalagens serão destinadas de forma ambientalmente adequada, conforme a Lei nº 12.305/2010, e o material substituído terá a destinação prevista nas normas de gestão patrimonial.'
    : 'A execução do objeto gera resíduos com potencial de impacto ambiental, em especial óleos e fluidos drenados, filtros contaminados, ' +
      'peças substituídas e as embalagens dos produtos empregados, além do risco de derramamento de óleo nas águas, vedado pela Lei nº ' +
      '9.966/2000. Como medidas mitigadoras, a contratada deverá empregar bandejas de contenção e material absorvente durante as ' +
      'drenagens, vedado qualquer descarte na água ou na rede de esgoto, e recolher e destinar os resíduos de forma ambientalmente ' +
      'adequada, conforme a Lei nº 12.305/2010.\n\nO óleo lubrificante usado será recolhido e encaminhado ao rerrefino por coletor ' +
      'autorizado, nos termos da Resolução CONAMA nº 362/2005, e as embalagens de óleo e de produtos químicos serão submetidas à logística reversa.';

  t.viabilidade = 'Esta equipe de planejamento declara viável esta contratação.\n\n15.1. Justificativa da Viabilidade\nCom base nos ' +
    'elementos constantes deste Estudo Técnico Preliminar — necessidade demonstrada, solução tecnicamente adequada e disponível no ' +
    'mercado, valor estimado compatível com o limite do art. 75, inciso II, da Lei nº 14.133/2021 e previsão no planejamento da ' +
    'Organização Militar —, declara-se VIÁVEL a contratação pretendida.';

  const itemTitulo = (titulo + ' ' + contr(eqTxt)).toUpperCase();
  t.trTabela = 'ITEM | ESPECIFICAÇÃO | ' + (P.catTipo || 'CATSER') + ' | UNIDADE | QTD | VALOR UNITÁRIO | VALOR TOTAL\n' +
    '1 | ' + itemTitulo + ', CONFORME O ITEM 1.1 | ' + (P.codigo || '') + ' | ' + un + ' | ' + qtd + ' | R$ ' +
    (valor != null ? moeda(valor / qtd) : '') + ' | R$ ' + (valor != null ? moeda(valor) : '');
  t.trDivergencia = 'Em caso de divergência entre a descrição do código ' + (P.catTipo || 'CATSER') + ' e a especificação detalhada no ' +
    'item 1.1, prevalecerá a especificação deste Termo de Referência.';
  const vig = parseInt(P.vigencia, 10) || 4;
  t.trVigencia = 'O prazo de vigência da contratação é de ' + vig + ' (' + (QTD_EXT[vig] ? QTD_EXT[vig].replace('uma', 'um').replace('duas', 'dois') : vig) +
    ') meses, contados da data de homologação, na forma do artigo 105 da Lei nº 14.133, de 2021.';
  t.trPar = 'I) Código PAR: ' + (P.parCodigo || '[código]') + '; e\nII) Data de aprovação de inclusão do objeto no PAR: ' +
    (P.parData ? dataBr(P.parData) : '[data]') + '.';
  const prazo = parseInt(P.prazo, 10) || 60;
  const garantia = parseInt(P.garantia, 10) || 180;
  t.trRequisitos = 'As peças e materiais empregados deverão ser novos, de primeiro uso, originais ou tecnicamente equivalentes aos ' +
    'especificados pelo fabricante, vedado o emprego de peças remanufaturadas, recondicionadas ou usadas.\n\n' +
    'A indicação do fabricante e do modelo do equipamento' + (P.identificacao ? ' (' + P.identificacao.split(',')[0].replace(/^\w+\s(diesel\s)?(marítimo\s)?/, '') + ')' : '') +
    ', bem como a referência a manuais e desenhos, destina-se apenas a identificar o equipamento existente a bordo, vedada a exigência de marca.\n\n' +
    'O recebimento provisório não implica aceitação definitiva do ' + (material ? 'material' : 'serviço') + '.\n\n' +
    'Não haverá exigência da garantia da contratação dos arts. 96 e seguintes da Lei nº 14.133, de 2021, pelas razões constantes do Estudo Técnico Preliminar.';
  t.trExecucao = '5.1. O prazo de ' + (material ? 'entrega' : 'execução do serviço') + ' é de ' + prazo + ' (' + extensoInteiro(prazo) +
    ') dias corridos, contados do recebimento da nota de empenho.\n\n5.3. O ' + (material ? 'material deverá ser entregue' : 'serviço deverá ser realizado') +
    ' ' + (C.local || 'a bordo do navio') + '.\n\n5.4. É facultada a vistoria prévia ao local de execução, mediante agendamento com a ' +
    (C.setor || 'Divisão de Máquinas') + (C.respTel ? ', pelo telefone ' + C.respTel : '') + '.';
  t.trGarantia = 'Os ' + (material ? 'materiais fornecidos' : 'serviços executados e as peças e materiais fornecidos') +
    ' contam com garantia mínima de ' + garantia + ' (' + extensoInteiro(garantia) + ') dias, contados do recebimento definitivo.';

  t.avisoPreambulo = 'Torna-se público que o(a) ' + om + ', por meio do(a) ' + (C.setor || 'Divisão de Máquinas') + ', realizará Dispensa ' +
    'Eletrônica, com critério de julgamento menor preço, na hipótese do art. 75, inciso II, nos termos da Lei n.º 14.133, de 1º de abril ' +
    'de 2021, da Instrução Normativa Seges/ME nº 67, de 2021, e demais normas aplicáveis.';
  t.avisoObjeto = objetoBase + (material ? '' : ', com fornecimento de todas as peças e materiais necessários') +
    ', nos termos da tabela e das especificações constantes do item 1.1 do Termo de Referência, conforme condições e exigências ' +
    'estabelecidas neste instrumento.';
  t.avisoItem = 'ITEM 1 – ' + itemTitulo + ' (' + catRef + ')' + (servicos.length ? ': compreende ' + enumerar(servicos) : '') +
    ', conforme o item 1.1 do Termo de Referência.';
  t.trObjeto = t.requisitos;
  if (Array.isArray(P.itens) && P.itens.length) return textosItens(P, t);
  t.avisoGerais = '1.1.2.1. Peças e materiais novos, de primeiro uso, originais ou tecnicamente equivalentes aos especificados pelo ' +
    'fabricante, vedado o emprego de peças remanufaturadas, recondicionadas ou usadas. A indicação do fabricante e do modelo destina-se ' +
    'apenas a identificar o equipamento existente a bordo, vedada a exigência de marca.\n1.1.2.2. Garantia mínima de ' + garantia + ' (' +
    extensoInteiro(garantia) + ') dias sobre os ' + (material ? 'materiais' : 'serviços e as peças') + ', contados do recebimento definitivo.\n' +
    '1.1.2.3. Prazo de ' + (material ? 'entrega' : 'execução') + ' de até ' + prazo + ' (' + extensoInteiro(prazo) +
    ') dias corridos, contados do recebimento da nota de empenho, ' + (C.local || 'a bordo do navio') + '.';
  return t;
}

function abrevPosto(p) {
  const m = { 'primeiro-tenente': '1º Ten', 'segundo-tenente': '2º Ten', 'capitão-tenente': 'CT', 'capitão de corveta': 'CC',
    'capitão de fragata': 'CF', 'capitão de mar e guerra': 'CMG', 'guarda-marinha': 'GM' };
  return m[String(p || '').toLowerCase()] || p || '';
}

/* Texto final de um campo: o editado (ou da IA) tem prioridade sobre o padrão. */
function textoFinal(P, chave, padrao) {
  const ed = (P.textos || {})[chave];
  if (ed && ed.texto) return ed.texto;
  if (chave === 'dfdJustificativa' && P.textos && P.textos.necessidade && P.textos.necessidade.texto) return P.textos.necessidade.texto;
  /* dispensas antigas: o 1.1 do TR era o mesmo campo do ETP 4 */
  if (chave === 'trObjeto' && !P.itens && P.textos && P.textos.requisitos && P.textos.requisitos.texto) return P.textos.requisitos.texto;
  return padrao[chave];
}

/* ---------- módulo ---------- */
const Dispensa = {
  atual: null,
  doc: 'dfd',

  lista() { return DB.dados.dispensas || (DB.dados.dispensas = []); },

  render() {
    const l = this.lista().slice().sort((a, b) => (b.atualizado || '').localeCompare(a.atualizado || ''));
    $('#nDisp').textContent = l.length;
    $('#tabDisp tbody').innerHTML = l.map(P =>
      '<tr><td class="mono">' + esc(P.processoNum || '(sem NUP)') + '</td><td>' + esc(maiusc1(P.servicoTitulo || 'Nova dispensa')) +
      '<div class="sub">' + esc(P.alvo || '') + '</div></td><td class="num">' + (num(P.valor) != null ? 'R$ ' + moeda(num(P.valor)) : '—') + '</td>' +
      '<td>' + (P.atualizado ? new Date(P.atualizado).toLocaleDateString('pt-BR') : '') + '</td>' +
      '<td class="botoes"><button class="mini ok" data-abrirdisp="' + P.id + '">Abrir</button>' +
      '<button class="mini" data-dupdisp="' + P.id + '">Duplicar</button>' +
      '<button class="mini del" data-deldisp="' + P.id + '">Excluir</button></td></tr>').join('');
    $('#vazioDisp').classList.toggle('hidden', l.length > 0);
    if (this.atual && !this.lista().includes(this.atual)) this.fechar();
    if (this.atual) this.renderDocs();
  },

  nova(preset) {
    const prox = MESES[(new Date().getMonth() + 1) % 12];
    const P = Object.assign({
      id: novoId('disp'), tipoObjeto: 'Serviço não continuado', carater: 'preventivo e corretivo', catTipo: 'CATSER',
      unidade: 'SERV', qtd: '1', prioridade: 'ALTA', mes: prox, prazo: '60', vigencia: '4', garantia: '180', textos: {},
      criado: new Date().toISOString()
    }, preset || {});
    this.lista().push(P);
    this.abrir(P.id);
    this.gravar();
  },

  deOs(osId) {
    const o = DB.dados.os.find(x => x.id === osId);
    const preset = Object.assign(this.dadosEquip(o.equipId), { defeitos: o.descricao, osId: o.id });
    irPara('dispensa');
    this.nova(preset);
    toast('Dispensa criada a partir da OS ' + o.numero + '.');
  },

  /* Sugestões a partir do cadastro do equipamento. */
  dadosEquip(equipId) {
    const e = DB.equip(equipId);
    if (!e) return { equipId: '' };
    const nome = e.nome.charAt(0).toLowerCase() + e.nome.slice(1);
    const fem = /^(bomba|caldeira|planta|válvula|central|unidade|máquina|purificadora|centrífuga|caixa|rede|linha)/i.test(nome);
    return {
      equipId,
      alvo: (fem ? 'a ' : 'o ') + nome + (e.tag ? ' (' + e.tag + ')' : ''),
      identificacao: [e.fabricante, e.modelo].filter(Boolean).join(' '),
      area: /motor|mcp|mca|gerador/i.test(e.nome) ? 'manutenção de motores diesel marítimos' : ''
    };
  },

  abrir(id) {
    this.atual = this.lista().find(P => P.id === id);
    if (!this.atual) return;
    const f = $('#formDisp');
    opcoesEquip($('#dEquip'), '— escolha —');
    $('[name=mes]', f).innerHTML = MESES.map(m => '<option>' + m + '</option>').join('');
    preencherForm(f, this.atual);
    $('#dJson').value = '';
    $('#dispEditor').classList.remove('hidden');
    this.renderDocs();
    $('#dispEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  fechar() { this.atual = null; $('#dispEditor').classList.add('hidden'); },

  gravar() {
    if (this.atual) this.atual.atualizado = new Date().toISOString();
    DB.salvar();
  },

  renderItens() {
    const P = this.atual, box = $('#dispItens');
    if (!box) return;
    const tem = Array.isArray(P.itens) && P.itens.length;
    box.classList.toggle('hidden', !tem);
    if (!tem) return;
    const total = P.itens.reduce((s, i) => s + (num(i.qtd) || 0) * (num(i.preco) || 0), 0);
    $('#tabDispItens tbody').innerHTML = P.itens.map((i, n) => '<tr><td class="num">' + (n + 1) + '</td><td><b>' + esc(i.nome) +
      '</b><div class="sub">CATMAT ' + esc(i.catmat) + ' · ' + esc(i.onde) + '</div></td>' +
      '<td class="num"><input class="mini-in" type="number" min="1" step="1" data-item="' + n + '" data-campo="qtd" value="' + esc(i.qtd) + '"></td>' +
      '<td class="num"><input class="mini-in larga" type="text" inputmode="decimal" data-item="' + n + '" data-campo="preco" value="' + esc(moeda(num(i.preco))) + '"></td>' +
      '<td class="num">' + moeda((num(i.qtd) || 0) * (num(i.preco) || 0)) + '</td>' +
      '<td class="botoes"><button class="mini del" data-tiraritem="' + n + '">Tirar</button></td></tr>').join('') +
      '<tr class="grupo"><td></td><td>Total</td><td></td><td></td><td class="num">' + moeda(total) + '</td><td></td></tr>';
  },

  mudarItem(t) {
    const P = this.atual, i = P.itens[Number(t.dataset.item)];
    if (t.dataset.campo === 'qtd') i.qtd = Math.max(1, parseInt(t.value, 10) || 1);
    else i.preco = num(String(t.value).replace(/\./g, '')) || 0;
    this.totalItens();
  },
  totalItens() {
    const P = this.atual;
    const v = P.itens.reduce((s, i) => s + (num(i.qtd) || 0) * (num(i.preco) || 0), 0);
    P.valor = v.toFixed(2).replace('.', ','); P.qtd = String(P.itens.length);
    const f = $('#formDisp'); if (f.elements.valor) f.elements.valor.value = P.valor;
    this.gravar();
  },

  renderDocs() {
    const P = this.atual; if (!P) return;
    this.renderItens();
    const pad = textosPadrao(P);
    $$('.docAbas [data-doc]').forEach(b => b.setAttribute('aria-selected', b.dataset.doc === this.doc));
    $('#dispDocs').innerHTML = CAMPOS[this.doc].map(([k, rot]) => {
      const ed = (P.textos || {})[k];
      const marca = ed && ed.texto ? '<span class="tagIA">' + (ed.origem === 'ia' ? 'IA' : 'editado') + '</span>' : '';
      return '<div class="campoDoc" data-campo="' + k + '"><div class="topo"><b>' + esc(rot) + marca + '</b><span class="acoes">' +
        '<button class="mini ok" data-copiar="' + k + '">Copiar</button>' +
        (k.startsWith('dfd') && k !== 'dfdJustificativa' || k === 'trTabela' ? '' : '<button class="mini" data-editar="' + k + '">Editar</button>') +
        (marca ? '<button class="mini" data-restaurar="' + k + '">Restaurar padrão</button>' : '') +
        '</span></div><div class="texto">' + esc(textoFinal(P, k, pad)) + '</div></div>';
    }).join('');
  },

  editar(k) {
    const P = this.atual;
    const caixa = $('[data-campo="' + k + '"] .texto');
    const atual = textoFinal(P, k, textosPadrao(P));
    caixa.innerHTML = '<textarea rows="10">' + esc(atual) + '</textarea><div class="acoes" style="margin-top:6px">' +
      '<button class="btn" data-salvartexto="' + k + '">Salvar texto</button></div>';
    $('textarea', caixa).focus();
  },
  salvarTexto(k) {
    const v = $('[data-campo="' + k + '"] textarea').value.trim();
    (this.atual.textos = this.atual.textos || {})[k] = { texto: v, origem: 'manual' };
    this.gravar();
  },

  copiar(k) {
    const txt = textoFinal(this.atual, k, textosPadrao(this.atual));
    navigator.clipboard.writeText(txt).then(() => toast('Texto copiado. Cole no campo do Compras.gov.br.'),
      () => toast('Não foi possível copiar. Selecione o texto e use Ctrl+C.', true));
  },

  /* Pedido para colar no claude.ai: dados do processo + estilo da última dispensa. */
  prompt() {
    const P = this.atual, C = DB.dados.dispCfg || {};
    const pad = textosPadrao(P);
    const dados = {
      OM: C.om, tipo_do_objeto: P.tipoObjeto, servico: P.servicoTitulo, equipamento: P.alvo, identificacao_tecnica: P.identificacao,
      funcao_a_bordo: P.funcao, carater: P.carater, constatado: P.defeitos, consequencias: P.consequencias,
      servicos: linhasDe(P.servicos), materiais_incluidos: linhasDe(P.materiais), fora_do_escopo: linhasDe(P.foraEscopo),
      referencias: P.referencias, catalogo: (P.catTipo || '') + ' ' + (P.codigo || ''), unidade: P.unidade, quantidade: P.qtd,
      valor_estimado: P.valor, pesquisa_de_precos: P.pesquisaNum, empresa_especializada_em: P.area, local_de_execucao: C.local
    };
    return 'Você é Chefe de Máquinas da Marinha do Brasil e vai redigir os textos de uma dispensa eletrônica (art. 75, II, da Lei nº 14.133/2021) ' +
      'para os campos do Compras.gov.br. Siga o estilo da última dispensa da Divisão de Máquinas: linguagem técnica e formal, ' +
      'frases completas, especificação detalhada por alíneas a), b), c)… com o que a contratada deve fazer, medir e testar, ' +
      'referência aos manuais do fabricante, vedação de marca ("originais ou tecnicamente equivalentes") e nada inventado ' +
      'sobre o equipamento que não esteja nos dados ou nos manuais que eu anexar.\n\n' +
      'DADOS DO PROCESSO (JSON):\n' + JSON.stringify(dados, null, 2) + '\n\n' +
      'RASCUNHO ATUAL (melhore, não precisa manter):\n' + CAMPOS_IA.map(k => '### ' + k + '\n' + pad[k]).join('\n\n') + '\n\n' +
      'Responda APENAS com um JSON válido, sem comentários, com estas chaves (texto puro, quebras de linha com \\n):\n' +
      '{\n' + CAMPOS_IA.map(k => '  "' + k + '": "..."').join(',\n') + '\n}\n\n' +
      'Significado das chaves: necessidade = justificativa (o equipamento, o que foi constatado, por que é essencial, o que será feito, ' +
      'e o parágrafo final de enquadramento no art. 75, II); descricaoSucinta = objeto em um parágrafo terminando com "(CATSER código – qtd unidade)"; ' +
      'requisitos = item 1.1 do TR com a especificação técnica mínima em alíneas; solucao = descrição da solução como um todo, ciclo da ' +
      'contratação e o que não integra o objeto; quantidades = estimativa das quantidades e o que está incluído no preço global; ' +
      'parcelamento = justificativa do item único; beneficiosTxt e providencias = listas em alíneas; impactos = impactos ambientais ' +
      'e mitigação; avisoItem = resumo do item para o Aviso.';
  },

  aplicarIA() {
    let txt = $('#dJson').value.trim();
    if (!txt) { toast('Cole a resposta da IA primeiro.', true); return; }
    txt = txt.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    let o;
    try { o = JSON.parse(txt); } catch (e) { toast('A resposta não é um JSON válido: ' + e.message, true); return; }
    let n = 0;
    this.atual.textos = this.atual.textos || {};
    CAMPOS_IA.forEach(k => {
      if (typeof o[k] === 'string' && o[k].trim()) { this.atual.textos[k] = { texto: o[k].trim(), origem: 'ia' }; n++; }
    });
    if (!n) { toast('Nenhuma das chaves esperadas veio na resposta.', true); return; }
    $('#dJson').value = '';
    this.gravar();
    toast(n + ' textos da IA aplicados. Revise os marcados com IA.');
  },

  /* ---------- Word ---------- */
  nomeArq(sufixo) {
    const P = this.atual;
    return (P.processoNum ? P.processoNum.replace(/[^\d]/g, '').slice(-10) + '-' : '') + sufixo + '.docx';
  },

  dfdDocx() {
    const P = this.atual, C = DB.dados.dispCfg || {}, pad = textosPadrao(P);
    const { p } = Docx;
    const tf = k => textoFinal(P, k, pad);
    const paragrafos = (txt, op) => String(txt).split(/\n+/).map(l => p(l, op)).join('');
    const tipos = ['Serviço não continuado', 'Serviço continuado SEM dedicação exclusiva de mão de obra',
      'Serviço continuado COM dedicação exclusiva de mão de obra', 'Material de consumo', 'Material permanente/equipamento'];
    const secao = (t, k) => p(t, { b: true, antes: 160 }) + paragrafos(tf(k), { recuo: true });
    const assin = (nome, posto, funcao) => p(C.cidade ? C.cidade + ', na data da assinatura' : 'Na data da assinatura', { alinha: 'centro', antes: 360, depois: 720 }) +
      p((nome || '').toUpperCase(), { alinha: 'centro', b: true, depois: 0 }) + p(posto || '', { alinha: 'centro', depois: 0 }) + p(funcao, { alinha: 'centro' });
    const corpo =
      p('MARINHA DO BRASIL', { alinha: 'centro', b: true, depois: 0 }) +
      p((C.om || '').toUpperCase(), { alinha: 'centro', b: true, depois: 240 }) +
      p('DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA', { alinha: 'centro', b: true, depois: 240 }) +
      p([{ t: 'OMAp: ', b: true }, C.om || ''], { depois: 40 }) +
      p([{ t: 'Área Requisitante ou Técnica (Unidade/Setor/Depto): ', b: true }, (C.setor || '') + (C.om ? ' - ' + C.om : '')], { depois: 40 }) +
      p([{ t: 'Responsável pela Demanda: ', b: true }, [C.respPosto, (C.respNome || '').toUpperCase()].filter(Boolean).join(' '),
        { t: '    Telefone: ', b: true }, C.respTel || ''], { depois: 40 }) +
      p([{ t: 'Matrícula/SIAPE: ', b: true }, C.respMat || '', { t: '    E-mail: ', b: true }, C.respEmail || ''], { depois: 200 }) +
      p('Objeto:', { b: true, depois: 40 }) +
      tipos.map(t => p('(' + (P.tipoObjeto === t ? 'X' : '  ') + ') ' + t, { depois: 0 })).join('') +
      secao('1. JUSTIFICATIVA DA NECESSIDADE DA CONTRATAÇÃO', 'dfdJustificativa') +
      secao('2. DESCRIÇÃO SUCINTA DO OBJETO', 'descricaoSucinta') +
      secao('3. QUANTIDADE A SER CONTRATADA', 'quantidades') +
      secao('4. ESTIMATIVA PRELIMINAR DO VALOR DA CONTRATAÇÃO', 'dfdValor') +
      secao('5. INDICAÇÃO DA DATA PRETENDIDA PARA A CONCLUSÃO DA CONTRATAÇÃO', 'dfdData') +
      secao('6. GRAU DE PRIORIDADE DA COMPRA OU DA CONTRATAÇÃO', 'dfdPrioridade') +
      secao('7. INDICAÇÃO DE VINCULAÇÃO OU DEPENDÊNCIA COM O OBJETO DE OUTRO DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA', 'dfdVinculo') +
      assin(C.respNome, C.respPosto, 'Responsável pela contratação direta') +
      assin(C.ordNome, C.ordPosto, C.ordFuncao || 'Ordenador de Despesas');
    baixarArquivo(this.nomeArq('DFD'), Docx.gerar(corpo));
  },

  /* ETP, TR e Aviso num só .docx de conferência, campo a campo. */
  rascunhoDocx() {
    const P = this.atual, C = DB.dados.dispCfg || {}, pad = textosPadrao(P);
    const { p, tabela } = Docx;
    let corpo = '';
    [['etp', 'ESTUDO TÉCNICO PRELIMINAR'], ['tr', 'TERMO DE REFERÊNCIA'], ['aviso', 'AVISO DE CONTRATAÇÃO DIRETA']].forEach(([doc, tit], i) => {
      corpo += p(tit, { alinha: 'centro', b: true, antes: i ? 480 : 0, depois: 0 }) +
        p((C.om || '').toUpperCase() + (P.processoNum ? ' · Processo ' + P.processoNum : ''), { alinha: 'centro', depois: 240 });
      CAMPOS[doc].forEach(([k, rot]) => {
        corpo += p(rot, { b: true, antes: 160 });
        const txt = textoFinal(P, k, pad);
        if (k === 'trTabela') {
          corpo += tabela(txt.split('\n').map(l => l.split(' | ')), [600, 3600, 900, 900, 600, 1400, 1400]);
        } else corpo += txt.split(/\n+/).map(l => p(l, { recuo: !/^[a-z]\)|^\d/.test(l) })).join('');
      });
    });
    baixarArquivo(this.nomeArq('ETP-TR-Aviso'), Docx.gerar(corpo));
  },

  ligar() {
    $('#btnNovaDisp').onclick = () => this.nova();
    $('#btnFecharDisp').onclick = () => this.fechar();
    $('#btnDfdDocx').onclick = () => this.dfdDocx();
    $('#btnTodosDocx').onclick = () => this.rascunhoDocx();
    $('#btnAplicarIA').onclick = () => this.aplicarIA();
    $('#btnPromptIA').onclick = () => navigator.clipboard.writeText(this.prompt())
      .then(() => toast('Pedido copiado. Cole no claude.ai, anexe as páginas do manual e traga o JSON de volta.'),
        () => { $('#dJson').value = this.prompt(); toast('Não foi possível copiar; o pedido foi posto na caixa abaixo.', true); });

    const f = $('#formDisp');
    let espera;
    f.addEventListener('input', e => {
      if (!this.atual) return;
      if (e.target.name === 'equipId') {
        const sug = this.dadosEquip(e.target.value);
        ['alvo', 'identificacao', 'area'].forEach(k => {
          if (!f.elements[k].value && sug[k]) f.elements[k].value = sug[k];
        });
      }
      Object.assign(this.atual, lerForm(f));
      clearTimeout(espera);
      espera = setTimeout(() => this.gravar(), 400);
    });
    f.addEventListener('submit', e => e.preventDefault());
    $('#tabDispItens').addEventListener('change', e => { if (e.target.dataset.item != null) this.mudarItem(e.target); });

    $('#tab-dispensa').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.abrirdisp) this.abrir(d.abrirdisp);
      else if (d.dupdisp) {
        const orig = this.lista().find(P => P.id === d.dupdisp);
        const copia = JSON.parse(JSON.stringify(orig));
        Object.assign(copia, { id: novoId('disp'), processoNum: '', pesquisaNum: '', parCodigo: '', parData: '', criado: new Date().toISOString() });
        this.lista().push(copia); this.abrir(copia.id); this.gravar();
        toast('Cópia criada. Ajuste o NUP, a pesquisa de preços e o PAR.');
      }
      else if (d.deldisp) {
        const P = this.lista().find(x => x.id === d.deldisp);
        if (!confirmar('Excluir a dispensa ' + (P.processoNum || P.servicoTitulo || '') + '?')) return;
        DB.dados.dispensas = this.lista().filter(x => x.id !== d.deldisp);
        this.gravar();
      }
      else if (d.doc) { this.doc = d.doc; this.renderDocs(); }
      else if (d.copiar) this.copiar(d.copiar);
      else if (d.editar) this.editar(d.editar);
      else if (d.salvartexto) this.salvarTexto(d.salvartexto);
      else if (d.restaurar) { delete this.atual.textos[d.restaurar]; this.gravar(); }
      else if (d.tiraritem) {
        if (this.atual.itens.length === 1) { toast('A dispensa precisa de pelo menos um item.', true); return; }
        this.atual.itens.splice(Number(d.tiraritem), 1); this.totalItens();
      }
    });
  }
};
