/* Processo completo da dispensa eletrônica.
 *
 * Um formulário único de metadados (nº da dispensa, NUP, assunto, finalidade...)
 * alimenta todas as peças do processo, na ordem da Dispensa 26/2026:
 * 01 Capa, 02 Termo de Autuação, 03 DFD, 04 ETP, 05 Ato de Aprovação do ETP,
 * 06 Autorização de Abertura, 07 Mapa de Riscos, 09 Declaração Orçamentária,
 * 12 Aviso, 13 TR e 14 Ato de Aprovação do TR — como a planilha de metadados
 * fazia, aba por aba.
 *
 * Os textos dos atos são modelos com {campos}. Quando um texto é ajustado numa
 * dispensa, "Salvar como modelo" troca os valores daquela dispensa pelos
 * {campos} e guarda o modelo para as próximas: o conhecimento cresce a cada
 * processo, sem ficar preso ao TR. */
'use strict';

/* ---------- modelos dos atos (redação da Dispensa 26/2026) ---------- */
const MODELOS_ATOS_ORIGINAIS = {
  autuacao: 'Dou comissão ao {comissionado} para rubricar as folhas do processo administrativo NUP {nup} referente à ' +
    'Dispensa Eletrônica de Licitação nº {dispensa}, desta OM (UASG {uasg}).',
  atoEtp: 'O presente Estudo Técnico Preliminar, cuja finalidade é {finalidade}, bem como, intenta-se por intermédio deste ' +
    'instrumento, fornecer informações necessárias para subsidiar o respectivo certame. Destarte, encontram-se evidenciados todos os ' +
    'elementos necessários à identificação do problema a ser resolvido e a melhor solução dentre as possíveis, de modo a permitir com ' +
    'clareza a avaliação da viabilidade técnica e socioeconômica da contratação.',
  autorizacao: 'AUTORIZO a abertura do Processo Administrativo NUP nº {nup}, referente à Dispensa Eletrônica de Licitação nº ' +
    '{dispensa} desta OM (UASG {uasg}), para {finalidade}, conforme preconizado no artigo 72, inciso II, da Lei nº 14.133/2021.',
  declaracao: 'Declarar que a despesa decorrente da {assuntoMin} contribui para {contribuicao}. A presente despesa encontra-se ' +
    'adequada, em termos orçamentários e financeiros, com a Lei Orçamentária Anual e compatível com o Plano Plurianual e com a Lei de ' +
    'Diretrizes Orçamentárias.',
  atoTr: 'O presente Termo de Referência tem como finalidade {finalidade}, bem como, intenta-se por intermédio deste instrumento, ' +
    'fornecer informações necessárias para subsidiar o respectivo certame. Destarte, encontram-se evidenciados todos os elementos ' +
    'necessários à identificação do objeto, os custos inerentes da contratação e todos os critérios para participação de forma clara e ' +
    'concisa, parametrizando a escolha da proposta mais vantajosa.'
};
CAMPOS.atos = [
  ['autuacao', '02. Termo de Autuação'],
  ['atoEtp', '05. Ato de Aprovação do ETP'],
  ['autorizacao', '06. Autorização de Abertura'],
  ['declaracao', '09. Declaração Orçamentária (RESOLVE)'],
  ['atoTr', '14. Ato de Aprovação do TR']
];
const CAMPOS_VARS = [
  ['dispensa', 'nº da dispensa'], ['nup', 'NUP'], ['assunto', 'assunto'], ['assuntoMin', 'assunto em minúscula'],
  ['finalidade', 'finalidade'], ['contribuicao', 'contribuição'], ['comissionado', 'quem rubrica'], ['om', 'OM'],
  ['uasg', 'UASG'], ['ordFuncao', 'função do ordenador']
];

function modelosAtos() { return DB.dados.modelosDisp || (DB.dados.modelosDisp = {}); }
function modeloAto(k) { const m = modelosAtos()[k]; return m && m.texto ? m.texto : MODELOS_ATOS_ORIGINAIS[k]; }

/* Valores automáticos dos metadados (usados quando o campo fica em branco). */
function metaAuto(P, t) {
  const C = DB.dados.dispCfg || {};
  const assunto = (t._assunto || '[assunto]').replace(/\.$/, '') + '.';
  const sem = assunto.replace(/\.$/, '');
  const finalidade = /^Contratação de serviço de /i.test(sem) ? 'realizar a ' + sem.replace(/^Contratação de serviço de /i, '')
    : /^Aquisição de /i.test(sem) ? 'adquirir ' + sem.replace(/^Aquisição de /i, '')
      : sem.charAt(0).toLowerCase() + sem.slice(1);
  const doOm = C.om ? ' ' + contr('o ' + C.om) : null;
  return {
    assunto, finalidade: doOm && finalidade.endsWith(doOm) ? finalidade.slice(0, -doOm.length) + ' da OM' : finalidade,
    contribuicao: 'a prontidão operativa da OM',
    comissionado: [C.respPosto, (C.respNome || '').toUpperCase()].filter(Boolean).join(' ') || '[posto e nome]',
    dataCapa: hojeIso()
  };
}

function metaVars(P, t) {
  const C = DB.dados.dispCfg || {};
  const a = metaAuto(P, t);
  const v = k => (P[k] && String(P[k]).trim()) || a[k];
  const assunto = v('assunto');
  const sem = assunto.replace(/\.$/, '');
  return {
    dispensa: P.numeroDispensa || '[nº/ano]', nup: P.processoNum || '[NUP]', assunto,
    assuntoMin: sem.charAt(0).toLowerCase() + sem.slice(1), finalidade: v('finalidade').replace(/\.$/, ''),
    contribuicao: v('contribuicao').replace(/\.$/, ''), comissionado: v('comissionado'), om: C.om || '[OM]',
    uasg: C.uasg || '[UASG]', ordFuncao: C.ordFuncao || 'Ordenador de Despesas', dataCapa: v('dataCapa')
  };
}

function preencherModelo(txt, vars) { return txt.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)); }

/* Texto concreto → modelo: troca os valores desta dispensa pelos {campos}, do mais longo ao mais curto. */
function generalizar(txt, vars) {
  const pares = CAMPOS_VARS.map(([k]) => [k, String(vars[k] || '')]).filter(([, val]) => val.length >= 3 && !/^\[/.test(val))
    .sort((a, b) => b[1].length - a[1].length);
  let s = txt;
  pares.forEach(([k, val]) => { s = s.split(val).join('{' + k + '}'); });
  return s;
}

function textosAtos(P, t) {
  const vars = metaVars(P, t);
  CAMPOS.atos.forEach(([k]) => { t[k] = preencherModelo(modeloAto(k), vars); });
  return t;
}

/* ---------- peças do processo ---------- */
/* Classificação orçamentária (opcional): sai na Declaração Orçamentária quando preenchida. */
function dotacaoTxt(P) {
  const d = [['Programa de Trabalho (PTRES)', P.ptres], ['Fonte de Recursos', P.fonte], ['Natureza da Despesa', P.natureza], ['Plano Interno', P.planoInterno]]
    .filter(([, v]) => String(v || '').trim());
  return d.length ? 'A despesa correrá à conta da seguinte classificação orçamentária: ' + d.map(([r, v]) => r + ' ' + v).join('; ') + '.' : '';
}

const PECAS = [
  { n: '01', nome: 'Capa', arq: 'CAPA', gera: 'capa' },
  { n: '02', nome: 'Termo de Autuação', arq: 'TERMO_DE_AUTUACAO', gera: 'autuacao' },
  { n: '03', nome: 'Documento de Formalização da Demanda (DFD)', arq: 'DFD', gera: 'dfd' },
  { n: '04', nome: 'Estudo Técnico Preliminar (ETP)', arq: 'ETP', gera: 'etp', compras: 'etp' },
  { n: '05', nome: 'Ato de Aprovação do ETP', arq: 'ATO_DE_APROVACAO_ETP', gera: 'atoEtp' },
  { n: '06', nome: 'Autorização de Abertura', arq: 'AUTORIZACAO_DE_ABERTURA', gera: 'autorizacao' },
  { n: '07', nome: 'Mapa de Riscos', arq: 'MAPA_DE_RISCOS', gera: 'riscos' },
  { n: '09', nome: 'Declaração Orçamentária (LRF)', arq: 'DECLARACAO_ORCAMENTARIA', gera: 'declaracao' },
  { n: '12', nome: 'Aviso de Contratação Direta', arq: 'AVISO', gera: 'aviso', compras: 'aviso', soServico: true },
  { n: '13', nome: 'Termo de Referência (TR)', arq: 'TR', gera: 'tr', compras: 'tr', soServico: true },
  { n: '14', nome: 'Ato de Aprovação do TR', arq: 'ATO_DE_APROVACAO_TR', gera: 'atoTr' }
];
/* Aviso e TR em Word só existem no modelo de serviço; na dispensa de material saem os textos do Compras.gov.br. */
const temWord = (x, P) => x.gera && !(x.soServico && ehMaterial(P));

const TIPOS_DFD = ['Serviço não continuado', 'Serviço continuado SEM dedicação exclusiva de mão de obra',
  'Serviço continuado COM dedicação exclusiva de mão de obra', 'Material de consumo', 'Material permanente/equipamento'];

/* Texto do CHEMAQ em parágrafos (uma linha por parágrafo). Com espaco, intercala parágrafos vazios, como no ETP e no DFD. */
function paragrafos(txt, espaco) {
  const l = String(txt || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  return espaco ? l.flatMap((x, i) => i ? ['', x] : [x]) : l;
}
const comPrefixo = (pre, linhas) => linhas.map((l, i) => i ? l : pre + l);
const diasTxt = n => n + ' (' + extensoInteiro(n) + ') dias';
const regimeTxt = P => 'empreitada por preço ' + (criterioDe(P).id === 'item' && (P.itens || []).length > 1
  ? 'unitário (art. 6º, inciso XXVIII, da Lei nº 14.133/2021)' : 'global (art. 6º, inciso XXIX, da Lei nº 14.133/2021)');

/* Linhas da tabela do TR (texto "ITEM | ESPECIFICAÇÃO | ..." do CHEMAQ) na ordem das colunas do modelo. */
function itensTabela(txt) {
  const ls = String(txt || '').split('\n').filter(l => l.trim());
  const cab = (ls.shift() || '').split('|').map(c => c.trim().toUpperCase());
  const col = re => cab.findIndex(c => re.test(c));
  const ix = { item: 0, espec: col(/ESPECIF/), cod: col(/CAT|C[ÓO]D/), un: col(/UNID/), qtd: col(/QTD|QUANT/), vu: col(/UNIT/), vt: col(/TOTAL/) };
  return ls.map(l => l.split('|').map(c => c.trim())).filter(c => !/^TOTAL$/i.test(c[0])).map(c => /^\d+$/.test(c[0])
    ? Object.fromEntries(Object.entries(ix).map(([k, i]) => [k, i >= 0 ? c[i] || '' : '']))
    : { item: '', espec: c[0], cod: '', qtd: '', un: '', vu: '', vt: c[c.length - 1] || '' });
}

const Processo = {
  /* Campos comuns a todas as peças. */
  vars(P) {
    const C = DB.dados.dispCfg || {}, pad = textosPadrao(P), mv = metaVars(P, pad);
    const navio = (DB.dados.navio || {}).nome || C.om || '';
    const material = ehMaterial(P);
    const valor = num(P.valor) != null ? num(P.valor) : numBR(P.valor);
    const prazo = parseInt(P.prazo, 10) || (material ? 10 : 60), garantia = parseInt(P.garantia, 10) || 180;
    const crit = criterioDe(P);
    return {
      OM: (C.om || '[OM]').toUpperCase(), om: C.om || '[OM]', cidade: C.cidade || '[cidade]', uasg: C.uasg || '[UASG]',
      nup: mv.nup, dispensa: mv.dispensa, assunto: mv.assunto, dataCapa: dataBr(mv.dataCapa), data: dataBr(hojeIso()),
      ordNome: (C.ordNome || '[ordenador de despesas]').toUpperCase(), ordPosto: C.ordPosto || '', ordFuncao: C.ordFuncao || 'Ordenador de Despesas',
      respNome: (C.respNome || '[responsável]').toUpperCase(), respPosto: C.respPosto || '', respTel: C.respTel || '', respMat: C.respMat || '',
      respEmail: C.respEmail || '', areaReq: (C.setor || 'Divisão de Máquinas') + (navio ? ' - ' + navio : ''),
      obtencao: C.obtencao || 'Divisão de Obtenção da UGE',
      cat: material ? 'CATMAT' : (P.catTipo || 'CATSER'), catNome: material ? 'material' : 'serviço', catPlural: material ? 'materiais' : 'serviços',
      categoria: material ? 'II - compra, inclusive por encomenda' : 'V - prestação de serviços, inclusive os técnico-profissionais especializados',
      CRITERIO: crit.v, numTR: P.numTR || mv.dispensa, dataSessao: P.dataSessao ? dataBr(P.dataSessao) : '', horario: P.horarioLances || '08:00 às 14:00',
      objetoTr: mv.assunto.replace(/\.$/, ''), finalidade: mv.finalidade, garantia: diasTxt(garantia), prazo: diasTxt(prazo),
      localExec: maiusc1(C.local || 'a bordo do navio'), regimeTr: 'A execução do objeto dar-se-á sob o regime de ' + regimeTxt(P) + '.',
      valorTotal: valor != null ? 'R$ ' + moeda(valor) : '', valorExtenso: valor != null ? 'R$ ' + moeda(valor) + ' (' + extensoReais(valor) + ')' : '[valor]',
      fonte: P.fonte || '', ptres: P.ptres || '', natureza: P.natureza || '', planoInterno: P.planoInterno || ''
    };
  },

  /* Dados de cada peça: campos curtos, blocos de parágrafos e itens da tabela. */
  dados(peca, P) {
    const pad = textosPadrao(P), tf = k => textoFinal(P, k, pad), v = this.vars(P);
    const b = {};
    let itens = null;
    switch (peca.gera) {
      case 'autuacao': case 'atoEtp': case 'autorizacao': case 'atoTr':
        b.corpo = paragrafos(tf(peca.gera)); break;
      case 'declaracao':
        b.corpo = paragrafos(tf('declaracao')).concat(dotacaoTxt(P) ? [dotacaoTxt(P)] : []); break;
      case 'dfd':
        TIPOS_DFD.forEach((t, i) => { v['x' + (i + 1)] = P.tipoObjeto === t ? 'X' : ' '; });
        CAMPOS.dfd.forEach(([k]) => { b[k] = paragrafos(tf(k), true); }); break;
      case 'etp': {
        v.numDoc = P.numETP || v.dispensa;
        CAMPOS.etp.forEach(([k]) => { b[k] = paragrafos(tf(k), true); });
        const area = tf('etpArea'), ar = area.match(/Área requisitante:\s*(.*)/i), rs = area.match(/Responsável:\s*(.*)/i);
        if (ar && ar[1].trim()) v.areaReq = ar[1].trim();
        if (rs && rs[1].trim()) v.respNome = rs[1].trim().toUpperCase();
        const via = tf('viabilidade').split(/\n\s*15\.1\.[^\n]*\n/);
        b.viabilidade = paragrafos(via[0], true); b.viabilidadeJust = paragrafos(via.slice(1).join('\n'), true);
        break;
      }
      case 'aviso': {
        v.numDoc = P.numAviso || v.dispensa;
        b.torna = String(tf('avisoPreambulo')).split('\n').filter(l => /^Torna-se/.test(l.trim()));
        b.objeto = comPrefixo('1.1. ', paragrafos(tf('avisoObjeto'))).concat(comPrefixo('1.1.1. ', paragrafos(tf('avisoItem'))), paragrafos(tf('avisoGerais')));
        b.regime = ['1.3. O serviço objeto desta contratação é caracterizado como comum, sob o regime de ' + regimeTxt(P) + ', conforme o Termo de Referência.'];
        const valor = num(P.valor) != null ? num(P.valor) : numBR(P.valor);
        b.exclusiva = [!(valor >= 80000)
          ? '3.2. Participação Exclusiva (Lei Complementar nº 123/2006): Por se tratar de contratação com valor total estimado inferior a R$ 80.000,00 (oitenta mil reais), a participação nesta dispensa eletrônica é destinada exclusivamente a Microempresas (ME) e Empresas de Pequeno Porte (EPP), bem como a Microempreendedores Individuais (MEI) e sociedades cooperativas equiparadas, ressalvadas as hipóteses de restrição de competitividade previstas na legislação.'
          : '3.2. Participação ampla: por se tratar de contratação com valor total estimado superior a R$ 80.000,00 (oitenta mil reais), não se aplica a participação exclusiva de que trata o art. 48, inciso I, da Lei Complementar nº 123/2006.'];
        break;
      }
      case 'tr': {
        v.numDoc = P.numTR || v.dispensa;
        b.escopo = paragrafos(tf('trObjeto'));
        itens = itensTabela(tf('trTabela'));
        v.divergencia = paragrafos(tf('trDivergencia')).join(' ').replace(/^1\.\d\.\s*/, '');
        v.vigencia = paragrafos(tf('trVigencia')).join(' ');
        b.necessidade = paragrafos(tf('necessidade'));
        b.par = paragrafos(tf('trPar'));
        b.solucao = comPrefixo('3.1. ', paragrafos(tf('solucao')));
        b.requisitos = paragrafos(tf('trRequisitos')).map((l, i) => '4.1.' + (6 + i) + '. ' + l.replace(/^\d+(\.\d+)*\.\s*/, ''));
        b.atestado = [];
        break;
      }
    }
    return { v, b, itens };
  },

  nome(peca, P) {
    return peca.n + '-' + peca.arq + (P.numeroDispensa ? '-' + P.numeroDispensa.replace(/\W+/g, '-') : '') + '.docx';
  },

  /* Bytes do .docx de uma peça, preenchendo o modelo em Word da última dispensa. */
  async bytes(peca, P) {
    const { v, b, itens } = this.dados(peca, P);
    return Modelos.gerar(peca.n + '-' + peca.arq, v, b, itens);
  },

  async baixar(n) {
    const P = Dispensa.atual, peca = PECAS.find(x => x.n === n);
    try {
      baixarArquivo(this.nome(peca, P), await this.bytes(peca, P), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch (e) { toast('Não foi possível gerar a peça: ' + e.message, true); }
  },

  /* Todas as peças em Word, mais o rascunho de ETP/TR/Aviso para colar no Compras.gov.br, num .zip. */
  async baixarTudo() {
    const P = Dispensa.atual;
    const pendentes = this.pendencias(P);
    if (pendentes.length && !confirmar('Ainda faltam: ' + pendentes.join(', ') + '.\nOs documentos sairão com [marcadores] nesses pontos. Baixar assim mesmo?')) return;
    try {
      const arqs = {};
      for (const x of PECAS.filter(x => temWord(x, P))) arqs[this.nome(x, P)] = await this.bytes(x, P);
      arqs['04-12-13-ETP-AVISO-TR-textos-Compras.docx'] = Docx.bytes(Dispensa.rascunhoCorpo());
      const nome = 'Dispensa' + (P.numeroDispensa ? '_' + P.numeroDispensa.replace(/\W+/g, '_') : '') + '.zip';
      baixarArquivo(nome, Docx.zipBytes(arqs), 'application/zip');
    } catch (e) { toast('Não foi possível gerar as peças: ' + e.message, true); }
  },

  pendencias(P) {
    const C = DB.dados.dispCfg || {};
    const f = [];
    if (!P.numeroDispensa) f.push('nº da dispensa');
    if (!P.processoNum) f.push('NUP');
    if (!C.om) f.push('OM (Configurações)');
    if (!C.uasg) f.push('UASG (Configurações)');
    if (!C.ordNome) f.push('ordenador de despesas (Configurações)');
    if (!C.respNome) f.push('responsável pela demanda (Configurações)');
    return f;
  },

  /* Aba "Processo completo": a lista de peças, na ordem dos autos. */
  render(P) {
    const pend = this.pendencias(P);
    return (pend.length ? '<p class="alerta">Faltam: ' + esc(pend.join(', ')) + '.</p>' : '') +
      PECAS.map(x => (temWord(x, P)
        ? '<button type="button" class="peca" data-peca="' + x.n + '"><i>' + x.n + '</i><span>' + esc(x.nome) + '</span><em>.docx</em></button>' : '') +
        (x.compras ? '<button type="button" class="peca compras" data-doc="' + x.compras + '"><i>' + x.n + '</i><span>' + esc(x.nome) +
          (temWord(x, P) ? ' · textos' : '') + '</span><em>Compras.gov.br</em></button>' : '')).join('') +
      '<p class="hint">As peças em Word seguem os modelos da última dispensa (formatação, brasão, cabeçalho e assinaturas). ' +
      'Os nº 08, 10 e 11 não existem na dispensa eletrônica.' + (ehMaterial(P) ? ' O Aviso e o TR de material ainda não têm modelo em Word: use os textos do Compras.gov.br.' : '') + '</p>';
  },

  salvarModelo(k) {
    const P = Dispensa.atual, pad = textosPadrao(P);
    const txt = textoFinal(P, k, pad);
    const modelo = generalizar(txt, metaVars(P, pad));
    modelosAtos()[k] = { texto: modelo, origem: P.numeroDispensa || P.processoNum || '', em: new Date().toISOString() };
    if (P.textos) delete P.textos[k];
    Dispensa.gravar();
    toast('Modelo salvo. As próximas dispensas já usam este texto, com os dados de cada uma.');
  },

  /* Configurações: modelos personalizados. */
  renderModelos() {
    const box = $('#listaModelos'); if (!box) return;
    const m = modelosAtos();
    const ks = CAMPOS.atos.filter(([k]) => m[k] && m[k].texto);
    box.innerHTML = ks.length ? ks.map(([k, rot]) => '<div class="campoDoc"><div class="topo"><b>' + esc(rot) + '</b><span class="acoes">' +
      '<button class="mini" data-modeloorig="' + k + '">Voltar ao original</button></span></div><div class="texto">' + esc(m[k].texto) +
      '</div></div>').join('') : '<p class="hint">Nenhum modelo personalizado. Os atos usam a redação da Dispensa 26/2026.</p>';
  },

  ligar() {
    $('#listaModelos').addEventListener('click', e => {
      const b = e.target.closest('[data-modeloorig]'); if (!b) return;
      if (!confirmar('Voltar este ato à redação original?')) return;
      delete modelosAtos()[b.dataset.modeloorig];
      DB.salvar();
    });
  }
};
