/* Service worker do CHEMAQ: deixa o site instalável no celular e abrindo sem
 * internet. Busca sempre a versão nova na rede e só usa a cópia guardada
 * quando a rede falha, para uma atualização no GitHub Pages valer na hora. */
'use strict';
const CACHE = 'chemaq-v4';
const BASE = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'img/bode.svg', 'img/app/icone-192.png',
  'js/util.js', 'js/store.js', 'js/backup.js', 'js/manutencao.js', 'js/sondagem.js', 'js/distancias.js', 'js/combustivel.js',
  'js/docx.js', 'js/modelos.js', 'js/dispensa.js', 'js/dispensa-ia.js', 'js/obtencao.js', 'js/processo.js', 'js/pacotes.js', 'js/materiais.js', 'js/catmat.js', 'js/servicos.js',
  'js/painel.js', 'js/ficha.js', 'js/config.js', 'js/navio.js', 'js/exemplo.js', 'js/app.js',
  'dados/distancias.json', 'dados/pacotes.json'].concat(['01-CAPA', '02-TERMO_DE_AUTUACAO', '03-DFD', '04-ETP', '05-ATO_DE_APROVACAO_ETP',
  '06-AUTORIZACAO_DE_ABERTURA', '07-MAPA_DE_RISCOS', '09-DECLARACAO_ORCAMENTARIA', '12-AVISO', '13-TR', '14-ATO_DE_APROVACAO_TR'].map(n => 'modelos/dispensa/' + n + '.docx'));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
