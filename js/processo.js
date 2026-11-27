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

/* ---------- Mapa de Riscos (padrão das dispensas da OM) ---------- */
function riscosPadrao(P) {
  const C = DB.dados.dispCfg || {};
  const cat = Array.isArray(P.itens) && P.itens.length ? 'CATMAT' : (P.catTipo || 'CATSER');
  const obt = C.obtencao || 'Divisão de Obtenção da UGE';
  const plan = 'Planejamento da Contratação';
  return [
    { t: 'Levantamento de mercado deficiente', prob: 'Média', imp: 'Alta',
      dano: 'Direcionamento da licitação com aumento do valor contratado',
      prev: ['Seguir as disposições da Instrução Normativa nº 65, de 2021, para a realização da pesquisa de mercado (Painel de Preços, aquisições similares, mídia especializada e pesquisa direta com fornecedores).', plan],
      cont: ['Tomar as providências necessárias ao saneamento do processo, reforçando práticas de negociação de valor durante a fase de aceitabilidade da proposta.', obt] },
    { t: 'Ausência de código de ' + (cat === 'CATMAT' ? 'material' : 'serviço') + ' constante no ' + cat + ' que possibilite o melhor enquadramento do item que se pretende licitar', prob: 'Baixa', imp: 'Média',
      dano: 'Perda da celeridade e retrabalho. Diminuição do número de empresas participantes no certame em virtude da discrepância entre a nomenclatura do ' + cat + ' com o objeto que se pretende licitar.',
      prev: ['Adequar os códigos existentes no ' + cat + ' às necessidades da MB e mantê-los sempre atualizados.', plan],
      cont: ['Em caso de frustração na licitação, realizar novo processo de aquisição. Realizar gestões para incluir pedido de Catalogação de Item no ' + cat + '.', plan + '\n' + obt] },
    { t: 'Ausência de Norma Técnica ou descrição detalhada do objeto', prob: 'Média', imp: 'Alta',
      dano: 'Licitação frustrada ou aquisição de objeto que não atende as necessidades da MB.',
      prev: ['Detalhar de forma objetiva e completa as características exigidas para o objeto a ser licitado.', plan],
      cont: ['Revisar a descrição do objeto da licitação, realizando nova licitação.', plan + '\n' + obt] },
    { t: 'Contratação conduzida sem processo padronizado', prob: 'Baixa', imp: 'Média',
      dano: 'Erros e omissões que dificultam a contratação e levam à obtenção com baixa qualidade (maior tempo, maior custo).',
      prev: ['Estabelecimento de processo de trabalho formal para toda organização.', plan],
      cont: ['Verificar os vícios constantes nos autos, sanando-os na medida que for possível, até mesmo para que eles não se repitam.', plan + '\n' + obt] },
    { t: 'Pessoal envolvido no processo em quantidade e qualificação inadequadas', prob: 'Média', imp: 'Alta',
      dano: 'Contratação desvantajosa levando ao desperdício de recursos financeiros, material e pessoal.',
      prev: ['Prover a quantidade e a capacitação necessárias ao pessoal envolvido neste processo. A OM poderá se valer dos cursos do CIANB para capacitar o seu pessoal.', plan],
      cont: ['Rescindir o contrato desvantajoso, solicitando, paralelamente, apoio ao Comando Imediatamente Superior quanto ao embarque de pessoal qualificado na elaboração de documentos atinentes à fase interna de um processo licitatório.', plan + '\n' + obt + '\nOrdenador de Despesas'] },
    { t: 'Falhas na elaboração de Termo de Referência (TR)', prob: 'Baixa', imp: 'Média',
      dano: 'Documentos incompletos e inconsistentes. Procedimentos mal elaborados. Aquisição de itens inadequados. Desperdício de recurso orçamentário.',
      prev: ['Fazer checklist para verificar a confecção do TR. Preocupação em observar prazos, regras e recomendações da AGU e TCU. Utilizar modelo da CJU.', plan],
      cont: ['Refazer o processo de aquisição, considerando elementos padronizados e inequívocos de Termo de Referência. Apuração de responsabilidades em caso de prejuízo.', plan + '\n' + obt + '\nOrdenador de Despesas'] }
  ];
}

/* ---------- peças do processo ---------- */
const PECAS = [
  { n: '01', nome: 'Capa', arq: 'CAPA', gera: 'capa' },
  { n: '02', nome: 'Termo de Autuação', arq: 'TERMO_DE_AUTUACAO', gera: 'autuacao' },
  { n: '03', nome: 'Documento de Formalização da Demanda (DFD)', arq: 'DFD', gera: 'dfd' },
  { n: '04', nome: 'Estudo Técnico Preliminar (ETP)', compras: 'etp' },
  { n: '05', nome: 'Ato de Aprovação do ETP', arq: 'ATO_DE_APROVACAO_ETP', gera: 'atoEtp' },
  { n: '06', nome: 'Autorização de Abertura', arq: 'AUTORIZACAO_DE_ABERTURA', gera: 'autorizacao' },
  { n: '07', nome: 'Mapa de Riscos', arq: 'MAPA_DE_RISCOS', gera: 'riscos' },
  { n: '09', nome: 'Declaração Orçamentária (LRF)', arq: 'DECLARACAO_ORCAMENTARIA', gera: 'declaracao' },
  { n: '12', nome: 'Aviso de Contratação Direta', compras: 'aviso' },
  { n: '13', nome: 'Termo de Referência (TR)', compras: 'tr' },
  { n: '14', nome: 'Ato de Aprovação do TR', arq: 'ATO_DE_APROVACAO_TR', gera: 'atoTr' }
];

const Processo = {
  /* Corpo (XML do Word) de cada peça gerada aqui. */
  corpo(peca, P) {
    const C = DB.dados.dispCfg || {}, { p, tabela } = Docx;
    const pad = textosPadrao(P), vars = metaVars(P, pad);
    const tf = k => textoFinal(P, k, pad);
    const cab = titulo => p('MARINHA DO BRASIL', { alinha: 'centro', b: true, depois: 0 }) +
      p((C.om || '').toUpperCase(), { alinha: 'centro', b: true, depois: 480 }) +
      p(titulo, { alinha: 'centro', b: true, depois: 360 });
    const assin = () => p((C.cidade || '') + ', na data da assinatura.', { alinha: 'centro', antes: 480, depois: 960 }) +
      p((C.ordNome || '').toUpperCase(), { alinha: 'centro', b: true, depois: 0 }) + p(C.ordPosto || '', { alinha: 'centro', depois: 0 }) +
      p(C.ordFuncao || 'Ordenador de Despesas', { alinha: 'centro' });
    const corrido = txt => String(txt).split(/\n+/).map(l => p(l, { recuo: true, depois: 160 })).join('');

    switch (peca.gera) {
      case 'capa': {
        const mov = [['', 'DESTINO', 'DATA', '', 'DESTINO', 'DATA']];
        for (let i = 1; i <= 11; i++) mov.push([String(i), '', '', String(i + 11), '', '']);
        return p([{ t: 'Número do Processo: ', b: true }, vars.nup], { alinha: 'direita', depois: 480 }) +
          p('REPÚBLICA FEDERATIVA DO BRASIL', { alinha: 'centro', b: true, depois: 0 }) +
          p('MINISTÉRIO DA DEFESA', { alinha: 'centro', b: true, depois: 0 }) +
          p('MARINHA DO BRASIL', { alinha: 'centro', b: true, depois: 360 }) +
          p([{ t: 'Data: ', b: true }, dataBr(vars.dataCapa)], { alinha: 'direita', depois: 360 }) +
          p('ORIGEM:', { b: true, depois: 0 }) + p(C.om || '', { depois: 240 }) +
          p('INTERESSADO:', { b: true, depois: 0 }) + p(C.om || '', { depois: 240 }) +
          p('ASSUNTO:', { b: true, depois: 0 }) + p(vars.assunto, { depois: 240 }) +
          p('OBSERVAÇÕES:', { b: true, depois: 0 }) + p('Dispensa Eletrônica de Licitação nº ' + vars.dispensa + '.', { depois: 480 }) +
          p('MOVIMENTO DO PROCESSO', { alinha: 'centro', b: true, depois: 80 }) +
          tabela(mov, [500, 3200, 1200, 500, 3200, 1200]);
      }
      case 'autuacao': return cab('TERMO DE AUTUAÇÃO') + corrido(tf('autuacao')) + assin();
      case 'atoEtp': return cab('ATO DE APROVAÇÃO DO ESTUDO TÉCNICO PRELIMINAR') + corrido(tf('atoEtp')) + assin();
      case 'autorizacao': return cab('AUTORIZAÇÃO') + corrido(tf('autorizacao')) + assin();
      case 'atoTr': return cab('ATO DE APROVAÇÃO DO TERMO DE REFERÊNCIA') + p('APROVO:', { b: true, depois: 160 }) + corrido(tf('atoTr')) + assin();
      case 'declaracao':
        return cab('DECLARAÇÃO ORÇAMENTÁRIA PARA FINS DA LEI DE RESPONSABILIDADE FISCAL') +
          corrido('O ' + vars.ordFuncao + ' do ' + vars.om + ', no uso de suas atribuições legais, atendendo o disposto no art. 16, ' +
            'inciso II, da Lei Complementar nº 101/2000.') +
          p('RESOLVE:', { b: true, antes: 120, depois: 160 }) + corrido(tf('declaracao')) + assin();
      case 'riscos': {
        const X = (v, o) => '(' + (v === o ? 'X' : '  ') + ') ' + o;
        const nivel = v => ['Baixa', 'Média', 'Alta'].map(o => X(v, o)).join('   ');
        const largura = [600, 6200, 2600];
        return cab('MAPA DE RISCOS') +
          p('FASE DE ANÁLISE', { b: true, depois: 40 }) +
          p('(X) Planejamento da Contratação e Seleção do Fornecedor', { depois: 0 }) + p('(  ) Gestão do Contrato', { depois: 240 }) +
          riscosPadrao(P).map((r, i) =>
            p('RISCO ' + String(i + 1).padStart(2, '0') + ' – ' + r.t, { b: true, antes: 240, depois: 40 }) +
            p([{ t: 'Probabilidade  ', b: true }, nivel(r.prob)], { depois: 0 }) +
            p([{ t: 'Impacto  ', b: true }, nivel(r.imp)], { depois: 80 }) +
            tabela([['Id', 'Dano', ''], ['1', r.dano, '']], largura, { alinha: 'esquerda' }) +
            tabela([['Id', 'Ação Preventiva', 'Responsável'], ['1', r.prev[0], r.prev[1]]], largura, { alinha: 'esquerda' }) +
            tabela([['Id', 'Ação de Contingência', 'Responsável'], ['1', r.cont[0], r.cont[1]]], largura, { alinha: 'esquerda' })
          ).join('') + assin();
      }
    }
    return '';
  },

  nome(peca, P) {
    return peca.n + '-' + peca.arq + (P.numeroDispensa ? '-' + P.numeroDispensa.replace(/\W+/g, '-') : '') + '.docx';
  },

  /* Bytes do .docx de uma peça (o DFD reaproveita o gerador do dispensa.js). */
  bytes(peca, P) {
    if (peca.gera === 'dfd') return Docx.bytes(Dispensa.dfdCorpo());
    return Docx.bytes(this.corpo(peca, P));
  },

  baixar(n) {
    const P = Dispensa.atual, peca = PECAS.find(x => x.n === n);
    baixarArquivo(this.nome(peca, P), this.bytes(peca, P), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  },

  /* Todas as peças em Word, mais o rascunho de ETP/TR/Aviso, num .zip. */
  baixarTudo() {
    const P = Dispensa.atual;
    const pendentes = this.pendencias(P);
    if (pendentes.length && !confirmar('Ainda faltam: ' + pendentes.join(', ') + '.\nOs documentos sairão com [marcadores] nesses pontos. Baixar assim mesmo?')) return;
    const arqs = {};
    PECAS.filter(x => x.gera).forEach(x => { arqs[this.nome(x, P)] = this.bytes(x, P); });
    arqs['04-12-13-ETP-AVISO-TR-textos-Compras.docx'] = Docx.bytes(Dispensa.rascunhoCorpo());
    const nome = 'Dispensa' + (P.numeroDispensa ? '_' + P.numeroDispensa.replace(/\W+/g, '_') : '') + '.zip';
    baixarArquivo(nome, Docx.zipBytes(arqs), 'application/zip');
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
      PECAS.map(x => x.gera
        ? '<button type="button" class="peca" data-peca="' + x.n + '"><i>' + x.n + '</i><span>' + esc(x.nome) + '</span><em>.docx</em></button>'
        : '<button type="button" class="peca compras" data-doc="' + x.compras + '"><i>' + x.n + '</i><span>' + esc(x.nome) +
          '</span><em>Compras.gov.br</em></button>').join('') +
      '<p class="hint">Os nº 08, 10 e 11 não estavam na pasta da Dispensa 26/2026 e ainda não são gerados aqui. O mapa de riscos usa ' +
      'os seis riscos padrão das dispensas da OM.</p>';
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
