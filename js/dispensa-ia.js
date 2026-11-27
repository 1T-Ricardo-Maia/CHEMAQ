/* Preenchimento da dispensa a partir do orçamento, com IA.
 *
 * Ideia trazida do Gerador de Dispensa Eletrônica do SIGAB: em vez de digitar
 * campo a campo, entrega-se à IA o orçamento (PDF ou texto), os links dos
 * produtos ou uma descrição do que se quer contratar, e ela devolve um JSON
 * que preenche o formulário inteiro: campos, tabela de itens, prazos e, se
 * pedido, os textos longos do ETP, do TR e do Aviso.
 *
 * Dois caminhos, com o mesmo resultado:
 *  - sem chave: "Copiar o prompt", colar no claude.ai com o orçamento anexado
 *    e trazer o JSON de volta em "Colar o JSON da IA";
 *  - com chave de API (guardada só neste navegador, fora do backup): o CHEMAQ
 *    chama a IA direto. Em rede da Marinha o endereço costuma estar bloqueado
 *    pelo proxy; aí vale o primeiro caminho.
 *
 * Tudo o que a IA preenche fica marcado com o selo IA até ser editado. As
 * instruções campo a campo são do CHEMAQ, calibradas na Dispensa 26/2026. */
'use strict';

const IA_CHAVE = 'chemaq.iaChave';
const IA_MODELO = 'claude-opus-5-5';

/* Campos do formulário que a IA pode preencher, com a instrução de cada um. */
const IA_CAMPOS = {
  servicoTitulo: 'Nome do serviço ou do material como entra no objeto, em minúsculas e sem artigo no início. Ex.: revisão dos sistemas de lubrificação e de arrefecimento; filtros de óleo e de combustível',
  alvo: 'Equipamento atendido, por extenso, com artigo e sigla entre parênteses. Ex.: o motor de combustão principal de boreste (MCP BE). Para material de vários equipamentos: os motores e equipamentos da Praça de Máquinas',
  identificacao: 'Fabricante, modelo e dados de placa do equipamento (potência, rotação, tensão), só o que constar da fonte ou dos dados do processo. Ex.: motor diesel marítimo MTU 6R 199 TB60, de 294 kW (400 CV) a 1.850 rpm',
  funcao: 'Função do equipamento a bordo, em minúsculas, completando a frase "O equipamento ___". Ex.: é um dos dois únicos meios de propulsão da embarcação',
  area: 'Ramo da empresa a contratar, completando "empresa especializada em ___". Ex.: manutenção de motores diesel marítimos',
  carater: 'Exatamente um destes: preventivo e corretivo | corretivo | preventivo',
  defeitos: 'O que a Divisão de Máquinas constatou, em minúsculas e sem ponto final, completando "A Divisão de Máquinas constatou ___". Para material, a necessidade de reposição',
  consequencias: 'Consequência de não contratar, em uma ou duas frases completas (prontidão, segurança da navegação, risco de avaria)',
  servicos: 'Lista dos serviços a executar, um por linha (\\n), cada um começando por substantivo de ação (substituição, inspeção, limpeza, teste...), sem ponto final. Vazio para material',
  materiais: 'Peças e materiais incluídos no preço, um por linha, sem ponto final',
  foraEscopo: 'O que expressamente NÃO integra o objeto, um por linha. Vazio se a fonte não indicar',
  beneficios: 'Benefícios esperados, um por linha, concretos e verificáveis, sem ponto final',
  aceitacao: 'Critérios técnicos de aceitação (valores de teste, pressões, temperaturas, ausência de vazamento), um por linha, só os que constarem da fonte ou do manual informado',
  referencias: 'Manuais e desenhos de referência, com artigo. Ex.: o Manual de Operação e Manutenção do motor e o desenho de instalação nº ... Vazio se não houver',
  assunto: 'Assunto da capa: frase de 10 a 25 palavras começando por "Contratação de serviço de" (serviço) ou "Aquisição de" (material), nomeando o equipamento e a OM, terminada em ponto',
  finalidade: 'Oração no infinitivo, em minúsculas, sem ponto final, que completa "cuja finalidade é ___". Ex.: realizar a revisão dos sistemas de lubrificação e de arrefecimento do MCP BE da OM',
  contribuicao: 'Completa "a despesa contribui para ___", sem ponto final. Ex.: a prontidão operativa da OM',
  codigo: 'Código CATSER (serviço) ou CATMAT (material), só dígitos, APENAS se constar da fonte. Se não constar, string vazia. Nunca invente',
  unidade: 'Unidade em maiúsculas: SERV para serviço; UN, CX, PC, KG, L, M para material',
  qtd: 'Quantidade do item único, só dígitos (para serviço, normalmente 1)',
  valor: 'Valor estimado TOTAL em reais, só dígitos e ponto decimal (ex.: 50411.88). Havendo mais de uma cotação para o mesmo objeto, a média. Vazio se a fonte não trouxer preço',
  mes: 'Mês pretendido para a conclusão da contratação, em MAIÚSCULAS. Ex.: DEZEMBRO',
  prioridade: 'ALTA, MÉDIA ou BAIXA',
  prazo: 'Prazo de entrega ou de execução em dias corridos, só dígitos. Use o da fonte; sem informação, 60 para serviço e 10 para material',
  garantia: 'Garantia em dias, só dígitos. Use a da fonte; sem informação, 180 para serviço e 90 para material',
  vigencia: 'Vigência da contratação em meses, só dígitos (normalmente 4 para serviço e 6 para material)'
};
/* Colunas de cada item da tabela (quando há mais de um item, ou é material). */
const IA_ITEM = {
  nome: 'Nome curto do item em MAIÚSCULAS, com a característica principal entre parênteses. Ex.: FILTRO DE ÓLEO LUBRIFICANTE (PSL962)',
  espec: 'Especificação técnica mínima em texto corrido: dimensões, rosca, material, capacidade, tensão, normas. Sem marca',
  codigo: 'CATMAT ou CATSER do item, só dígitos, APENAS se constar da fonte; senão string vazia. Nunca invente',
  un: 'Unidade em maiúsculas (UN, CX, PC, SERV...)',
  qtd: 'Quantidade, só dígitos',
  preco: 'Preço UNITÁRIO em reais, só dígitos e ponto decimal (ex.: 1317.86); média se houver mais de uma cotação; vazio se não houver preço',
  marca: 'Marca e modelo de referência (código do fabricante), APENAS se constarem da fonte; senão string vazia',
  onde: 'Onde o item é usado a bordo (equipamento e rotina), se a fonte ou os dados permitirem; senão string vazia',
  grupo: 'Só na modalidade por grupo: nome curto do lote do item; itens do mesmo lote com exatamente o mesmo texto. Senão string vazia'
};
/* Textos longos (os mesmos que "Editar" mostra em cada documento). */
const IA_TEXTOS = {
  necessidade: 'Justificativa da necessidade (DFD 1 e ETP 2), em três parágrafos separados por \\n\\n: (1) o equipamento, o que foi constatado e o impacto na prontidão e na segurança; (2) o que a contratação compreende e por que agora; (3) o enquadramento no art. 75, inciso II, da Lei nº 14.133/2021, com pesquisa de preços (art. 23 e IN SEGES/ME nº 65/2021) e a vedação ao fracionamento (art. 75, § 1º)',
  descricaoSucinta: 'Descrição sucinta do objeto em um parágrafo, terminando com "(CATSER ou CATMAT código – quantidade unidade)"',
  requisitos: 'Requisitos da contratação (ETP 4 e TR 1.1): parágrafo de abertura com o objeto e a vedação de marca ("originais ou tecnicamente equivalentes"), seguido das alíneas a), b), c)... com o que a contratada deve fazer, medir e testar, separadas por \\n, cada uma terminada em ponto e vírgula e a penúltima em "; e"',
  solucao: 'Descrição da solução como um todo (ETP 6), em dois ou três parágrafos: o que será fornecido ou executado; o ciclo da contratação em (i) a (v); e o que não integra o objeto',
  quantidades: 'Estimativa das quantidades (DFD 3 e ETP 7): quanto se contrata, como foi dimensionado e o que está incluído no preço; termine afastando o fracionamento indevido (art. 75, § 1º)',
  parcelamento: 'Justificativa do parcelamento ou não (ETP 9), coerente com a modalidade de julgamento informada nos dados do processo (art. 40, inciso V, alínea "b", e §§ 2º e 3º, da Lei nº 14.133/2021)',
  beneficiosTxt: 'Benefícios (ETP 12) em alíneas a), b), c)... separadas por \\n',
  providencias: 'Providências (ETP 13) em alíneas a), b), c)... separadas por \\n: adequação orçamentária (art. 72, IV), pesquisa de preços, ausência de ARP e de fracionamento, fiscal e gestor (art. 117), publicação no PNCP (art. 75, § 3º), consultas SICAF/CEIS/CNEP/CNJ e as específicas do objeto',
  impactos: 'Possíveis impactos ambientais (ETP 14) e medidas mitigadoras (Lei nº 12.305/2010; óleo usado: Resolução CONAMA nº 362/2005)',
  avisoItem: 'Item 1.1.1 do Aviso: "ITEM 1 – NOME EM MAIÚSCULAS (CATSER código – qtd unidade): compreende ..." resumindo o escopo; havendo vários itens, uma linha por item'
};

const DispIA = {
  modo: 'descricao',
  arquivo: null,          /* { nome, tipo: 'pdf'|'texto', dados } — só na memória, não vai para o backup */

  chave() { try { return localStorage.getItem(IA_CHAVE) || ''; } catch (e) { return ''; } },

  /* ---------- prompt ---------- */
  contexto(P) {
    const C = DB.dados.dispCfg || {};
    const material = ehMaterial(P);
    const pares = [
      ['Organização Militar', C.om], ['UASG', C.uasg], ['Cidade', C.cidade], ['Setor requisitante', C.setor],
      ['Local de execução ou entrega', C.local],
      ['Tipo do objeto', (material ? 'MATERIAL' : 'SERVIÇO') + ' – ' + (P.tipoObjeto || '')],
      ['Modalidade de julgamento escolhida (não altere)', criterioDe(P).v]
    ];
    const ja = ['servicoTitulo', 'alvo', 'identificacao', 'funcao', 'area', 'defeitos', 'servicos', 'materiais', 'referencias', 'codigo']
      .filter(k => String(P[k] || '').trim()).map(k => [k, P[k]]);
    let s = 'Dados já conhecidos deste processo (use-os e mantenha a coerência):\n' +
      pares.filter(p => String(p[1] || '').trim()).map(p => '- ' + p[0] + ': ' + p[1]).join('\n');
    if (ja.length) s += '\n\nCampos já preenchidos no formulário (mantenha, a menos que a fonte os corrija):\n' +
      ja.map(([k, v]) => '- ' + k + ': ' + String(v).replace(/\n/g, ' / ')).join('\n');
    return s;
  },

  fonte() {
    if (this.modo === 'links') {
      const ls = this.links();
      return ls.length ? 'FONTE: links dos produtos (abra cada página e extraia nome, especificação, marca/modelo e preço; ' +
        'cada link é um item, na mesma ordem):\n' + ls.map((l, i) => (i + 1) + '. ' + l.url + ' — quantidade ' + l.qtd).join('\n')
        : 'FONTE: [cole aqui os links dos produtos]';
    }
    if (this.modo === 'arquivo') {
      if (this.arquivo && this.arquivo.tipo === 'texto') return 'FONTE: orçamento abaixo.\n\n' + this.arquivo.dados;
      return 'FONTE: o orçamento em PDF anexado a esta mensagem' + (this.arquivo ? ' (' + this.arquivo.nome + ')' : '') + '.';
    }
    const d = ($('#iaDescricao') || {}).value || '';
    return 'FONTE: descrição do que se pretende contratar:\n\n' + (d.trim() || '[descreva aqui o que se pretende contratar]');
  },

  prompt(P) {
    const material = ehMaterial(P);
    const comTextos = !$('#iaTextos') || $('#iaTextos').checked;
    const bloco = (o, ind) => Object.keys(o).map(k => ind + JSON.stringify(k) + ': ' + JSON.stringify(o[k])).join(',\n');
    return [
      'Você é o Chefe de Máquinas de um navio da Marinha do Brasil e vai preencher uma Dispensa Eletrônica de Licitação ' +
      '(art. 75, inciso II, da Lei nº 14.133/2021) cujo objeto é ' + (material ? 'um MATERIAL (use verbos de fornecimento: adquirir, fornecer, entregar)'
        : 'um SERVIÇO (use verbos de execução: realizar, executar, substituir, testar)') + '.',
      '',
      'Regras obrigatórias:',
      '- Linguagem formal da administração pública, impessoal, sem adjetivos publicitários; use "objeto" para o que será contratado.',
      '- Extraia da fonte itens, quantidades, especificações e preços. NUNCA invente preço, código CATMAT/CATSER, marca, modelo ou dado de placa que não esteja na fonte ou nos dados abaixo: na dúvida, devolva string vazia.',
      '- Vedada a exigência de marca: marca e modelo só como referência, "originais ou tecnicamente equivalentes".',
      '- Havendo mais de um item, numere ITEM 1, ITEM 2... na mesma ordem em todos os textos e no array "itens".',
      '- Nas strings, \\n separa linhas e \\n\\n separa parágrafos. Sem markdown, sem asteriscos, sem texto fora do JSON.',
      '',
      this.contexto(P),
      '',
      'Responda APENAS com um objeto JSON (comece em { e termine em }) com as chaves abaixo. O valor de cada chave explica o que escrever nela:',
      '',
      '{',
      bloco(IA_CAMPOS, '  ') + ',',
      '  "itens": [ /* um objeto por item; deixe [] quando o objeto for um único serviço */',
      '    {',
      bloco(IA_ITEM, '      '),
      '    }',
      '  ]' + (comTextos ? ',' : ''),
      comTextos ? bloco(IA_TEXTOS, '  ') : '',
      '}',
      '',
      this.fonte()
    ].filter((l, i, a) => !(l === '' && a[i - 1] === '' )).join('\n');
  },

  links() {
    return String(($('#iaLinks') || {}).value || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
      const m = l.match(/^(\S+)(?:\s+(\d+))?/);
      return { url: m[1], qtd: m[2] || '1' };
    }).filter(l => /^https?:\/\//i.test(l.url));
  },

  /* ---------- aplicar o JSON ---------- */
  extrair(txt) {
    const s = String(txt || '').replace(/```(json)?/gi, '');
    const i = s.indexOf('{'), f = s.lastIndexOf('}');
    if (i < 0 || f <= i) throw new Error('não há um objeto JSON (de { a }) no texto colado');
    return JSON.parse(s.slice(i, f + 1));
  },

  aplicar(o) {
    const P = Dispensa.atual; if (!P) return 0;
    const ia = new Set(P.iaCampos || []);
    const lista = v => Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean).join('\n') : String(v == null ? '' : v).trim();
    const digitos = v => String(v == null ? '' : v).replace(/\D/g, '');
    const dinheiro = v => { const n = typeof v === 'number' ? v : numBR(String(v || '').replace(/R\$\s*/i, '')); return n > 0 ? n : null; };
    let n = 0;
    const por = (k, v) => { if (v) { P[k] = v; ia.add(k); n++; } };
    Object.keys(IA_CAMPOS).forEach(k => {
      if (!(k in o)) return;
      let v = lista(o[k]);
      if (['codigo', 'qtd', 'prazo', 'garantia', 'vigencia'].includes(k)) v = digitos(v);
      else if (k === 'valor') { const x = dinheiro(o[k]); v = x ? x.toFixed(2).replace('.', ',') : ''; }
      else if (k === 'mes') { v = v.toUpperCase().replace(/[.\s]+$/, ''); if (!MESES.includes(v)) v = ''; }
      else if (k === 'prioridade') { v = v.toUpperCase().replace(/[.\s]+$/, '').replace('MEDIA', 'MÉDIA'); if (!['ALTA', 'MÉDIA', 'BAIXA'].includes(v)) v = ''; }
      else if (k === 'carater') { if (!['preventivo e corretivo', 'corretivo', 'preventivo'].includes(v.toLowerCase())) v = ''; else v = v.toLowerCase(); }
      else if (k === 'unidade') v = v.toUpperCase();
      por(k, v);
    });
    const brutos = Array.isArray(o.itens) ? o.itens.filter(i => i && String(i.nome || i.espec || '').trim()) : [];
    if (brutos.length > 1 || (brutos.length === 1 && ehMaterial(P))) {
      P.itens = brutos.map(i => ({
        nome: String(i.nome || '').trim(), espec: String(i.espec || '').trim(), catmat: digitos(i.codigo || i.catmat),
        un: String(i.un || (ehMaterial(P) ? 'UN' : 'SERV')).trim().toUpperCase(), qtd: parseInt(digitos(i.qtd), 10) || 1,
        preco: dinheiro(i.preco) || 0, marca: String(i.marca || '').trim(), onde: String(i.onde || '').trim(),
        grupo: String(i.grupo || '').trim(), ia: true,
        catmatAlerta: digitos(i.codigo || i.catmat) ? '' : 'Código não veio da fonte: consulte o catálogo'
      }));
      ordenarPorGrupo(P);
      Dispensa.totalItensSilencioso();
      ia.add('itens'); n++;
    }
    P.textos = P.textos || {};
    Object.keys(IA_TEXTOS).forEach(k => {
      if (typeof o[k] === 'string' && o[k].trim()) { P.textos[k] = { texto: o[k].trim(), origem: 'ia' }; n++; }
    });
    P.iaCampos = [...ia];
    return n;
  },

  colar() {
    const box = $('#iaJson');
    if (!box.value.trim()) { toast('Cole a resposta da IA primeiro.', true); return; }
    let o;
    try { o = this.extrair(box.value); } catch (e) { this.status('JSON inválido: ' + e.message + '. Cole a resposta inteira, de { a }.', 'erro'); return; }
    const n = this.aplicar(o);
    if (!n) { this.status('O JSON não trouxe nenhum campo conhecido.', 'erro'); return; }
    box.value = '';
    this.depois(n);
  },

  depois(n) {
    const P = Dispensa.atual;
    preencherForm($('#formDisp'), P);
    Dispensa.gravar();
    Dispensa.renderDocs();
    Dispensa.aplicarModo();
    this.status(n + ' campos e textos preenchidos e marcados com IA. Revise antes de gerar: o texto vai para documento assinado.' +
      ((P.itens || []).some(i => !i.catmat) ? ' Há itens sem CATMAT/CATSER: a IA não inventa código, consulte o catálogo.' : ''), 'ok');
    toast(n + ' campos preenchidos pela IA.');
  },

  status(txt, classe) { const e = $('#iaStatus'); if (e) { e.textContent = txt; e.className = 'iaStatus ' + (classe || ''); } },

  copiar() {
    const P = Dispensa.atual; if (!P) return;
    const txt = this.prompt(P);
    const aviso = this.modo === 'arquivo' && (!this.arquivo || this.arquivo.tipo === 'pdf') ? ' Anexe o PDF do orçamento na conversa.' : '';
    navigator.clipboard.writeText(txt).then(() => { toast('Prompt copiado. Cole no claude.ai e traga o JSON de volta.' + aviso); this.status('Prompt copiado.' + aviso + ' Depois cole a resposta abaixo.', ''); },
      () => { $('#iaJson').value = txt; toast('Não foi possível copiar; o prompt foi posto na caixa abaixo.', true); });
  },

  /* ---------- chamada direta (opcional) ---------- */
  async chamar() {
    const P = Dispensa.atual; if (!P) return;
    const chave = this.chave();
    if (!chave) { this.status('Sem chave de IA neste navegador. Use "Copiar o prompt" ou configure a chave.', 'erro'); return; }
    if (this.modo === 'arquivo' && !this.arquivo) { this.status('Escolha o arquivo do orçamento primeiro.', 'erro'); return; }
    if (this.modo === 'links' && !this.links().length) { this.status('Cole pelo menos um link (começando por http).', 'erro'); return; }
    const bt = $('#iaChamar'), rot = bt.textContent;
    bt.disabled = true; bt.textContent = 'Redigindo…';
    this.status('A IA está lendo a fonte e redigindo. Costuma levar de meio minuto a dois minutos.', '');
    try {
      const conteudo = [];
      if (this.modo === 'arquivo' && this.arquivo.tipo === 'pdf')
        conteudo.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: this.arquivo.dados } });
      conteudo.push({ type: 'text', text: this.prompt(P) });
      const corpo = { model: IA_MODELO, max_tokens: 16000, output_config: { effort: 'medium' }, fallbacks: 'default',
        messages: [{ role: 'user', content: conteudo }] };
      if (this.modo === 'links') corpo.tools = [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 12 }];
      let resp, texto = '';
      for (let volta = 0; volta < 4; volta++) {
        resp = await this.pedir(chave, corpo);
        texto += (resp.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
        if (resp.stop_reason !== 'pause_turn') break;
        corpo.messages = corpo.messages.concat([{ role: 'assistant', content: resp.content }]);
      }
      if (resp.stop_reason === 'refusal') throw new Error('a IA recusou o pedido. Use "Copiar o prompt" no claude.ai.');
      if (resp.stop_reason === 'max_tokens') throw new Error('a resposta ficou longa demais. Desmarque "Pedir também os textos longos" e tente de novo.');
      const n = this.aplicar(this.extrair(texto));
      if (!n) throw new Error('a resposta não trouxe nenhum campo conhecido.');
      this.depois(n);
    } catch (e) {
      this.status('Não deu certo: ' + (e.message || e), 'erro');
    } finally { bt.disabled = false; bt.textContent = rot; }
  },

  async pedir(chave, corpo) {
    let r;
    try {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': chave, 'anthropic-version': '2026-10-21',
          'anthropic-beta': 'server-side-fallback-2026-07-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify(corpo)
      });
    } catch (e) {
      throw new Error('não foi possível alcançar a API da IA (em rede da Marinha o proxy costuma bloquear). Use "Copiar o prompt" e cole no claude.ai.');
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || 'erro ' + r.status + ' da API');
    return j;
  },

  configurarChave() {
    const atual = this.chave();
    const v = window.prompt('Chave da API da Anthropic (fica só neste navegador, fora do backup). Deixe em branco para apagar.', atual ? '(manter a atual)' : '');
    if (v === null || v === '(manter a atual)') return;
    try { if (v.trim()) localStorage.setItem(IA_CHAVE, v.trim()); else localStorage.removeItem(IA_CHAVE); } catch (e) { toast('Não foi possível guardar a chave neste navegador.', true); return; }
    this.render();
    toast(v.trim() ? 'Chave guardada neste navegador.' : 'Chave apagada.');
  },

  lerArquivo(f) {
    if (!f) { this.arquivo = null; this.render(); return; }
    if (f.size > 4 * 1024 * 1024) { toast('Arquivo maior que 4 MB.', true); return; }
    const pdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
    const rd = new FileReader();
    rd.onload = () => {
      this.arquivo = pdf ? { nome: f.name, tipo: 'pdf', dados: String(rd.result).split(',')[1] } : { nome: f.name, tipo: 'texto', dados: String(rd.result) };
      this.render();
    };
    if (pdf) rd.readAsDataURL(f); else rd.readAsText(f);
  },

  render() {
    $$('#iaModos [data-iamodo]').forEach(b => b.setAttribute('aria-pressed', b.dataset.iamodo === this.modo));
    $$('#cardIA [data-painel]').forEach(d => d.classList.toggle('hidden', d.dataset.painel !== this.modo));
    const tem = !!this.chave();
    $('#iaChamar').classList.toggle('hidden', !tem);
    $('#iaChaveBtn').textContent = tem ? 'Chave de IA ✓' : 'Chave de IA';
    $('#iaArqNome').textContent = this.arquivo ? this.arquivo.nome + (this.arquivo.tipo === 'pdf' ? ' (PDF: anexe na conversa ao usar o prompt)' : ' (texto vai dentro do prompt)') : 'nenhum arquivo escolhido';
  },

  ligar() {
    const card = $('#cardIA'); if (!card) return;
    card.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.iamodo) { this.modo = b.dataset.iamodo; this.render(); }
      else if (b.id === 'iaCopiar') this.copiar();
      else if (b.id === 'iaAplicar') this.colar();
      else if (b.id === 'iaChamar') this.chamar();
      else if (b.id === 'iaChaveBtn') this.configurarChave();
    });
    $('#iaArquivo').addEventListener('change', e => this.lerArquivo(e.target.files[0]));
    this.render();
  }
};

/* ---------- valores já usados (sugestões nos campos) ----------
 * Campos que se repetem de uma dispensa para outra ganham uma lista com os
 * valores das dispensas guardadas, os mais usados primeiro. */
const CAMPOS_HIST = ['area', 'funcao', 'identificacao', 'alvo', 'referencias', 'unidade', 'contribuicao', 'comissionado',
  'horarioLances', 'fonte', 'ptres', 'natureza', 'planoInterno'];
function renderHistorico() {
  const f = $('#formDisp'); if (!f) return;
  CAMPOS_HIST.forEach(k => {
    const el = f.elements[k]; if (!el || el.tagName !== 'INPUT') return;
    const cont = {};
    (DB.dados.dispensas || []).forEach(P => { const v = String(P[k] || '').trim(); if (v) cont[v] = (cont[v] || 0) + 1; });
    const vals = Object.keys(cont).sort((a, b) => cont[b] - cont[a] || a.localeCompare(b, 'pt')).slice(0, 12);
    const id = 'hist-' + k;
    let dl = document.getElementById(id);
    if (!dl) { dl = document.createElement('datalist'); dl.id = id; document.body.appendChild(dl); el.setAttribute('list', id); }
    dl.innerHTML = vals.map(v => '<option value="' + esc(v) + '">').join('');
  });
}
