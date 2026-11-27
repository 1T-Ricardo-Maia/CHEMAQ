/* Inicialização: abas, relógio, janelas e redesenho quando os dados mudam. */
'use strict';

function irPara(aba, sub) {
  $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === aba));
  $$('main > section').forEach(s => s.classList.toggle('hidden', s.id !== 'tab-' + aba));
  if (sub) {
    const sec = $('#tab-' + aba);
    $$('.subtabs [data-sub]', sec).forEach(b => b.setAttribute('aria-selected', b.dataset.sub === sub));
    $$('[data-subpainel]', sec).forEach(p => p.classList.toggle('hidden', p.dataset.subpainel !== sub));
  }
  try { localStorage.setItem('chemaq.aba', aba + (sub ? ':' + sub : '')); } catch (e) { /* sem memória da aba */ }
  window.scrollTo({ top: 0 });
}

/* Janelas de cadastro: Salvar valida e grava; se o gravador devolver false, a janela fica aberta. */
function ligarDialogo(sel, gravar) {
  const dlg = $(sel), f = $('form', dlg);
  f.addEventListener('submit', e => {
    e.preventDefault();
    if (e.submitter && e.submitter.value === 'cancelar') { dlg.close(); return; }
    if (gravar(f) !== false) dlg.close();
  });
  $$('[value=cancelar]', f).forEach(b => b.addEventListener('click', e => { e.preventDefault(); dlg.close(); }));
}

function renderTudo() {
  Painel.render();
  Manut.render();
  Comb.render();
  Dispensa.render();
  Materiais.render();
  Servicos.render();
  Config.render();
}

function relogio() {
  const d = new Date();
  $('#relogio').innerHTML = '<b>' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '</b>' +
    d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

document.addEventListener('DOMContentLoaded', () => {
  DB.carregar();
  Manut.ligar();
  Comb.ligar();
  Dispensa.ligar();
  Processo.ligar();
  Pacotes.ligar();
  Dist.carregar();
  Materiais.ligar();
  Catmat.ligar();
  Servicos.ligar();
  Config.ligar();
  Painel.ligar();
  Ficha.ligar();
  Backup.ligar();

  $('.tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    const sec = $('#tab-' + b.dataset.tab);
    const subAtual = $('.subtabs [aria-selected="true"]', sec);
    irPara(b.dataset.tab, subAtual ? subAtual.dataset.sub : null);
  });
  $$('.subtabs').forEach(st => st.addEventListener('click', e => {
    const b = e.target.closest('[data-sub]'); if (!b) return;
    irPara(st.closest('section').id.replace('tab-', ''), b.dataset.sub);
  }));
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ir]'); if (!b) return;
    const [aba, sub] = b.dataset.ir.split(':');
    irPara(aba, sub);
  });
  $$('[data-carregar-navio]').forEach(b => b.onclick = () => {
    const n = carregarEquipamentosNavio();
    toast(n ? n + ' equipamentos do memorial cadastrados.' : 'Todos os equipamentos do memorial já estavam cadastrados.');
    if (n) irPara('manutencao', 'equipamentos');
  });
  $('#btnExemplo').onclick = () => { carregarExemplo(); toast('Dados de exemplo carregados.'); };

  document.addEventListener('chemaq:mudou', renderTudo);
  renderTudo();
  relogio();
  setInterval(relogio, 30000);

  let salva = null;
  try { salva = localStorage.getItem('chemaq.aba'); } catch (e) { salva = null; }
  if (salva) { const [a, s] = salva.split(':'); if ($('#tab-' + a)) irPara(a, s); }

  /* Atalhos do aplicativo instalado: ?acao=sondagem abre o Colar sondagem; ?aba=x abre a aba. */
  const q = new URLSearchParams(location.search);
  if (q.get('aba') && $('#tab-' + q.get('aba'))) irPara(q.get('aba'));
  if (q.get('acao') === 'sondagem') { irPara('combustivel'); Comb.abrirColar(); }
  if (q.has('acao') || q.has('aba')) history.replaceState(null, '', location.pathname);
  $('#btnSondTopo').onclick = () => { irPara('combustivel'); Comb.abrirColar(); };

  /* Instalável (PWA): service worker e o botão Instalar quando o navegador oferece. */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* segue funcionando sem instalar */ });
  }
  let pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; $('#btnInstalar').classList.remove('hidden'); });
  $('#btnInstalar').onclick = () => { if (pedidoInstalar) { pedidoInstalar.prompt(); pedidoInstalar = null; $('#btnInstalar').classList.add('hidden'); } };
});
