/* Backup dos dados do CHEMAQ.
 *
 * Os dados vivem no navegador (localStorage). Para não depender de lembrar de
 * exportar, o Chrome e o Edge do computador podem gravar o backup sozinhos
 * numa pasta escolhida uma vez: se for a pasta do Google Drive para
 * computador (ex.: Meu Drive/CHEMAQ), o arquivo sobe para o Drive sem mais
 * nada. Cada mudança regrava "chemaq-backup.json" (o mais recente) e uma
 * cópia do dia em "diarios/" (guarda as 30 últimas).
 *
 * Nos navegadores sem esse recurso (Safari, Firefox, celular) o backup é o
 * download de sempre, e o Painel avisa quando passam 7 dias sem backup.
 *
 * O backup é um arquivo único com tudo: equipamentos, plano, OS, combustível,
 * dispensas, pacotes de serviço salvos, modelos dos atos e a aba Material. */
'use strict';

const Backup = {
  DIAS_AVISO: 7,
  MANTER_DIARIOS: 30,
  suportado: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
  pasta: null,          // FileSystemDirectoryHandle
  estado: 'sem',        // 'sem' | 'ativo' | 'pausado' (o navegador pede um clique para liberar) | 'erro'
  erro: '',
  _espera: null,
  _gravando: false,

  /* ---- a pasta escolhida fica guardada no IndexedDB (localStorage não guarda esse tipo de objeto) ---- */
  idb(modo, fn) {
    return new Promise((ok, falha) => {
      let req;
      try { req = indexedDB.open('chemaq', 1); } catch (e) { falha(e); return; }
      req.onupgradeneeded = () => req.result.createObjectStore('chaves');
      req.onerror = () => falha(req.error);
      req.onsuccess = () => {
        const tx = req.result.transaction('chaves', modo), st = tx.objectStore('chaves');
        const r = fn(st);
        tx.oncomplete = () => ok(r && 'result' in r ? r.result : undefined);
        tx.onerror = () => falha(tx.error);
      };
    });
  },
  lerPasta() { return this.idb('readonly', st => st.get('pastaBackup')).catch(() => null); },
  guardarPasta(h) { return this.idb('readwrite', st => h ? st.put(h, 'pastaBackup') : st.delete('pastaBackup')).catch(() => null); },

  async iniciar() {
    if (this.suportado) {
      const h = await this.lerPasta();
      if (h) {
        this.pasta = h;
        let p = 'prompt';
        try { p = await h.queryPermission({ mode: 'readwrite' }); } catch (e) { p = 'prompt'; }
        this.estado = p === 'granted' ? 'ativo' : 'pausado';
        if (this.estado === 'ativo') this.agendar(1500);
      }
    }
    this.renderTudo();
  },

  /* Chamado a cada gravação no navegador: o backup automático vai 20 s depois da última mudança. */
  mudou() { if (this.estado === 'ativo' && !this._gravando) this.agendar(20000); },
  agendar(ms) { clearTimeout(this._espera); this._espera = setTimeout(() => this.gravar(), ms); },

  conteudo() { return JSON.stringify(DB.dados, null, 1); },

  async gravar() {
    if (this.estado !== 'ativo' || !this.pasta) return false;
    this._gravando = true;
    try {
      const agora = new Date().toISOString();
      DB.dados.ultimoBackup = agora;
      DB.dados.ultimoBackupAuto = agora;
      const txt = this.conteudo();
      await this.escrever(this.pasta, 'chemaq-backup.json', txt);
      const dir = await this.pasta.getDirectoryHandle('diarios', { create: true });
      await this.escrever(dir, 'chemaq-backup-' + hojeIso() + '.json', txt);
      await this.limparDiarios(dir);
      try { localStorage.setItem(CHAVE_DB, JSON.stringify(DB.dados)); } catch (e) { /* o aviso de espaço vem do DB.salvar */ }
      this.erro = '';
    } catch (e) {
      if (e && e.name === 'NotAllowedError') this.estado = 'pausado';
      else { this.estado = 'erro'; this.erro = e && e.message || String(e); }
    }
    this._gravando = false;
    this.renderTudo();
    return this.estado === 'ativo';
  },
  async escrever(dir, nome, txt) {
    const arq = await dir.getFileHandle(nome, { create: true });
    const w = await arq.createWritable();
    await w.write(txt);
    await w.close();
  },
  async limparDiarios(dir) {
    const nomes = [];
    for await (const [nome] of dir.entries()) if (/^chemaq-backup-\d{4}-\d{2}-\d{2}\.json$/.test(nome)) nomes.push(nome);
    nomes.sort().slice(0, Math.max(0, nomes.length - this.MANTER_DIARIOS)).forEach(n => dir.removeEntry(n).catch(() => {}));
  },

  async escolherPasta() {
    if (!this.suportado) { toast('Este navegador não grava em pasta. Use o Chrome ou o Edge do computador, ou baixe o backup.', true); return; }
    let h;
    try { h = await window.showDirectoryPicker({ id: 'chemaq-backup', mode: 'readwrite', startIn: 'documents' }); }
    catch (e) { return; /* cancelou */ }
    this.pasta = h; this.estado = 'ativo';
    await this.guardarPasta(h);
    if (await this.gravar()) toast('Backup automático ligado na pasta "' + h.name + '".');
  },
  async reativar() {
    if (!this.pasta) return this.escolherPasta();
    let p = 'denied';
    try { p = await this.pasta.requestPermission({ mode: 'readwrite' }); } catch (e) { p = 'denied'; }
    if (p !== 'granted') { toast('O navegador não liberou a pasta. Escolha a pasta de novo.', true); return; }
    this.estado = 'ativo';
    if (await this.gravar()) toast('Backup automático retomado.');
  },
  async desligar() {
    this.pasta = null; this.estado = 'sem';
    await this.guardarPasta(null);
    this.renderTudo();
    toast('Backup automático desligado. Os arquivos já gravados continuam na pasta.');
  },

  baixar() {
    DB.dados.ultimoBackup = new Date().toISOString();
    DB.salvar(true);
    baixarArquivo('chemaq-backup-' + hojeIso() + '.json', this.conteudo(), 'application/json');
    this.renderTudo();
  },

  diasSem() {
    const u = DB.dados.ultimoBackup;
    if (!u) return null;
    return Math.floor((Date.now() - new Date(u).getTime()) / 86400000);
  },
  temDados() {
    const d = DB.dados;
    return d.equipamentos.length + d.rotinas.length + d.os.length + d.combustivel.length + (d.dispensas || []).length > 0;
  },

  /* Faixa no Painel: só aparece quando há algo a fazer. */
  renderAviso() {
    const box = $('#avisoBackup');
    if (!box) return;
    const dias = this.diasSem();
    let msg = '', botoes = '';
    if (this.estado === 'pausado') {
      msg = 'O backup automático na pasta <b>' + esc(this.pasta.name) + '</b> está pausado: o navegador pede um clique para liberar a gravação.';
      botoes = '<button class="btn" data-backup="reativar">Retomar backup</button>';
    } else if (this.estado === 'erro') {
      msg = 'O backup automático falhou: ' + esc(this.erro) + '.';
      botoes = '<button class="btn" data-backup="reativar">Tentar de novo</button><button class="btn ghost" data-backup="pasta">Escolher outra pasta</button>';
    } else if (this.estado !== 'ativo' && this.temDados() && (dias == null || dias >= this.DIAS_AVISO)) {
      msg = dias == null ? 'Os dados estão só neste navegador e <b>nunca foram salvos em backup</b>.' :
        'O último backup foi há <b>' + dias + ' dias</b>. Os dados estão só neste navegador.';
      botoes = '<button class="btn" data-backup="baixar">Baixar backup agora</button>' +
        (this.suportado ? '<button class="btn ghost" data-backup="pasta">Backup automático numa pasta</button>' : '');
    }
    box.classList.toggle('hidden', !msg);
    box.innerHTML = msg ? '<p>' + msg + '</p><div class="acoes">' + botoes + '</div>' : '';
  },

  /* Cartão de Configurações. */
  renderConfig() {
    const box = $('#estadoBackup');
    if (!box) return;
    const d = DB.dados;
    const quando = d.ultimoBackup ? new Date(d.ultimoBackup).toLocaleString('pt-BR') : null;
    let txt;
    if (this.estado === 'ativo') txt = '<span class="selo-st st-emdia">Automático</span> Gravando na pasta <b>' + esc(this.pasta.name) + '</b>' +
      (d.ultimoBackupAuto ? ' · última gravação em ' + new Date(d.ultimoBackupAuto).toLocaleString('pt-BR') : '') + '.';
    else if (this.estado === 'pausado') txt = '<span class="selo-st st-avencer">Pausado</span> Pasta <b>' + esc(this.pasta.name) + '</b>: clique em Retomar para liberar a gravação.';
    else if (this.estado === 'erro') txt = '<span class="selo-st st-vencida">Falhou</span> ' + esc(this.erro);
    else txt = '<span class="selo-st st-semreg">Manual</span> ' + (quando ? 'Último backup em ' + quando + '.' : 'Nenhum backup feito ainda.');
    box.innerHTML = txt;
    $('#btnBackupPasta').textContent = this.estado === 'sem' ? 'Backup automático numa pasta' : 'Trocar a pasta';
    $('#btnBackupPasta').classList.toggle('hidden', !this.suportado);
    $('#btnBackupRetomar').classList.toggle('hidden', !(this.estado === 'pausado' || this.estado === 'erro'));
    $('#btnBackupDesligar').classList.toggle('hidden', this.estado === 'sem');
    $('#semPastaBackup').classList.toggle('hidden', this.suportado);
  },

  renderTudo() { this.renderAviso(); this.renderConfig(); },

  ligar() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-backup]'); if (!b) return;
      const a = b.dataset.backup;
      if (a === 'baixar') this.baixar();
      else if (a === 'pasta') this.escolherPasta();
      else if (a === 'reativar') this.reativar();
      else if (a === 'desligar') this.desligar();
    });
    this.iniciar();
  }
};
