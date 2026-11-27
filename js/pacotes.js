/* Pacotes de serviço por equipamento.
 *
 * O arquivo dados/pacotes.json diz, para cada tipo de equipamento, o que se
 * faz numa dispensa (serviço, escopo, materiais, catálogo, prazos). Ao
 * escolher ou descrever o equipamento, a aba Dispensa mostra os pacotes que
 * servem e um clique preenche o formulário. Cada dispensa pode virar pacote
 * novo ("Salvar como pacote"), guardado neste navegador e exportável em .json
 * para entrar no repositório. */
'use strict';

const PAC_CAMPOS = ['tipoObjeto', 'catTipo', 'codigo', 'unidade', 'qtd', 'servicoTitulo', 'identificacao', 'funcao', 'area', 'carater',
  'defeitos', 'consequencias', 'servicos', 'materiais', 'foraEscopo', 'beneficios', 'referencias', 'prazo', 'vigencia', 'garantia',
  'finalidade', 'contribuicao'];

const Pacotes = {
  base: [],
  verTodos: false,

  carregar() {
    fetch('dados/pacotes.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
      if (j && Array.isArray(j.pacotes)) { this.base = j.pacotes; if (Dispensa.atual) Dispensa.renderDocs(); }
    }).catch(() => { /* sem rede ou aberto como arquivo: ficam só os pacotes deste navegador */ });
  },

  meus() { return DB.dados.pacotes || (DB.dados.pacotes = []); },
  todos() {
    const meus = this.meus(), ids = new Set(meus.map(p => p.id));
    return meus.concat(this.base.filter(p => !ids.has(p.id)));
  },

  /* Texto que descreve o equipamento desta dispensa: cadastro + o que foi digitado. */
  descricao(P) {
    const e = P.equipId ? DB.equip(P.equipId) : null;
    return [e && e.tag, e && e.nome, e && e.modelo, P.alvo, P.identificacao].filter(Boolean).join(' ').toLowerCase();
  },
  serve(pac, P) {
    const d = this.descricao(P);
    if (!d) return false;
    return (pac.equipamentos || []).some(t => {
      const s = String(t).toLowerCase();
      return s.length <= 4 ? new RegExp('(^|[^a-z0-9])' + s.replace(/[^a-z0-9]/g, '') + '([^a-z0-9]|$)').test(d) : d.includes(s);
    });
  },

  render(P) {
    const todos = this.todos();
    const servem = todos.filter(p => this.serve(p, P));
    const lista = this.verTodos ? todos : servem;
    const card = p => {
      const c = p.campos || {};
      return '<button type="button" class="opcao" data-pacote="' + esc(p.id) + '" aria-pressed="' + (P.pacoteId === p.id) + '"><b>' +
        esc(p.nome) + '</b><span>' + esc([(c.catTipo || '') + (c.codigo ? ' ' + c.codigo : ' · código a buscar'), p.origem].filter(Boolean).join(' · ')) +
        '</span></button>';
    };
    const vazio = servem.length ? '' : '<p class="hint">' + (this.descricao(P) ? 'Nenhum pacote para este equipamento ainda.' :
      'Escolha ou descreva o equipamento para ver os pacotes que servem.') + '</p>';
    return (this.verTodos ? '' : vazio) + lista.map(card).join('') +
      (todos.length > servem.length ? '<button type="button" class="mini" data-vertodos="1">' +
        (this.verTodos ? 'Mostrar só os deste equipamento' : 'Ver todos os pacotes (' + todos.length + ')') + '</button>' : '');
  },

  aplicar(id) {
    const P = Dispensa.atual, pac = this.todos().find(p => p.id === id);
    if (!P || !pac) return;
    if ((P.servicos || P.servicoTitulo) && P.pacoteId !== id &&
      !confirmar('Aplicar o pacote "' + pac.nome + '"? Os campos do pacote substituem os que já estão preenchidos.')) return;
    const c = pac.campos || {};
    PAC_CAMPOS.forEach(k => {
      if (c[k] == null || c[k] === '') return;
      P[k] = Array.isArray(c[k]) ? c[k].join('\n') : String(c[k]);
    });
    if (pac.textos) P.textos = Object.assign({}, P.textos || {}, JSON.parse(JSON.stringify(pac.textos)));
    P.pacoteId = id;
    preencherForm($('#formDisp'), P);
    Dispensa.gravar();
    toast('Pacote aplicado. Confira o que foi constatado' + (c.codigo ? '' : ' e busque o código CATSER') + '.');
  },

  salvarAtual() {
    const P = Dispensa.atual; if (!P) return;
    const nome = window.prompt('Nome do pacote de serviço:', maiusc1(P.servicoTitulo || ''));
    if (!nome) return;
    const e = P.equipId ? DB.equip(P.equipId) : null;
    const campos = {};
    PAC_CAMPOS.forEach(k => {
      const v = P[k]; if (v == null || String(v).trim() === '') return;
      campos[k] = ['servicos', 'materiais', 'foraEscopo', 'beneficios'].includes(k) ? linhasDe(v) : String(v);
    });
    delete campos.defeitos; /* o que foi constatado é desta dispensa, não do pacote */
    const textos = {};
    Object.entries(P.textos || {}).forEach(([k, t]) => { if (t && t.texto && !CAMPOS.atos.some(([a]) => a === k)) textos[k] = t; });
    const id = 'meu-' + nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const pac = {
      id, nome, origem: P.numeroDispensa ? 'Dispensa ' + P.numeroDispensa : 'salvo em ' + new Date().toLocaleDateString('pt-BR'),
      equipamentos: [e && e.tag, e && e.modelo].filter(Boolean).concat(e ? [] : [semArtigo(P.alvo || '')].filter(Boolean)),
      campos
    };
    if (Object.keys(textos).length) pac.textos = textos;
    DB.dados.pacotes = this.meus().filter(p => p.id !== id).concat([pac]);
    P.pacoteId = id;
    Dispensa.gravar();
    toast('Pacote "' + nome + '" salvo neste navegador. Use "Exportar pacotes" para levar ao repositório.');
  },

  exportar() {
    const j = { versao: 1, sobre: 'Pacotes de serviço do CHEMAQ (base do repositório + os salvos neste navegador).', pacotes: this.todos() };
    baixarArquivo('pacotes.json', JSON.stringify(j, null, 2), 'application/json');
  },

  async importar(arq) {
    try {
      const j = JSON.parse(await arq.text());
      const l = Array.isArray(j) ? j : j.pacotes;
      if (!Array.isArray(l) || l.some(p => !p.id || !p.nome)) throw new Error('o arquivo não tem uma lista "pacotes" com id e nome');
      const ids = new Set(l.map(p => p.id));
      DB.dados.pacotes = this.meus().filter(p => !ids.has(p.id)).concat(l);
      DB.salvar();
      toast(l.length + ' pacotes importados.');
    } catch (e) { toast('Não foi possível importar: ' + e.message, true); }
  },

  ligar() {
    this.carregar();
    $('#btnExpPacotes').onclick = () => this.exportar();
    $('#inPacotes').onchange = e => { const a = e.target.files[0]; e.target.value = ''; if (a) this.importar(a); };
    $('#dispPacotes').addEventListener('click', e => {
      if (e.target.closest('[data-vertodos]')) { this.verTodos = !this.verTodos; Dispensa.renderDocs(); }
    });
  }
};
