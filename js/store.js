/* Armazenamento dos dados do CHEMAQ.
 *
 * Nesta primeira versão tudo fica no próprio navegador (localStorage), e a aba
 * Configurações exporta e importa um arquivo de backup .json. Toda leitura e
 * gravação passa por este arquivo, então trocar por um banco na nuvem
 * (Supabase, como o SIGAB usa) mexe só aqui. */
'use strict';

const CHAVE_DB = 'chemaq.dados.v1';
const SISTEMAS = ['Propulsão', 'Geração de energia', 'Auxiliares', 'Combustível e lubrificação',
  'Arrefecimento', 'Ar comprimido', 'Governo', 'Incêndio e esgoto', 'Controle de poluição', 'Ventilação', 'Elétrica',
  'Casco e convés', 'Embarcação orgânica', 'Habitabilidade', 'Outros'];
const TIPOS_OS = ['Preventiva', 'Corretiva', 'Inspeção', 'Melhoria'];

function bancoVazio() {
  return {
    versao: 1,
    navio: { nome: '', indicativo: '', chefe: '' },
    equipamentos: [],
    rotinas: [],
    os: [],
    combustivel: [],
    combConfig: { robInicial: null, robInicialData: '', capacidade: null },
    trechos: [],
    planoComb: {},
    dispensas: [],
    dispCfg: {
      om: '', uasg: '', cidade: '', setor: 'Divisão de Máquinas',
      local: 'a bordo do navio', respPosto: '', respNome: '', respTel: '', respMat: '', respEmail: '',
      ordPosto: '', ordNome: '', ordFuncao: 'Ordenador de Despesas', uge: '', orgPar: ''
    },
    seqOs: 0
  };
}

const DB = {
  dados: null,

  carregar() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(CHAVE_DB)); } catch (e) { d = null; }
    this.dados = Object.assign(bancoVazio(), d || {});
    return this.dados;
  },

  /* silencioso: grava sem redesenhar as telas (usado enquanto a pessoa digita). */
  salvar(silencioso) {
    try {
      localStorage.setItem(CHAVE_DB, JSON.stringify(this.dados));
    } catch (e) {
      toast('Não foi possível gravar no navegador. Faça um backup agora.', true);
    }
    if (!silencioso) document.dispatchEvent(new CustomEvent('chemaq:mudou'));
  },

  substituir(novo) {
    if (!novo || typeof novo !== 'object' || !Array.isArray(novo.equipamentos)) {
      throw new Error('arquivo não parece ser um backup do CHEMAQ');
    }
    this.dados = Object.assign(bancoVazio(), novo);
    this.salvar();
  },

  equip(id) { return this.dados.equipamentos.find(e => e.id === id) || null; },
  rotina(id) { return this.dados.rotinas.find(r => r.id === id) || null; },
  nomeEquip(id) {
    const e = this.equip(id);
    return e ? (e.tag ? e.tag + ' · ' : '') + e.nome : '(equipamento removido)';
  },
  consumidores() { return this.dados.equipamentos.filter(e => e.consome); },
  proximoNumeroOs() {
    this.dados.seqOs = (this.dados.seqOs || 0) + 1;
    return String(this.dados.seqOs).padStart(4, '0') + '/' + new Date().getFullYear();
  }
};
