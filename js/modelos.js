/* Peças da dispensa a partir dos modelos em Word da última dispensa (pasta
 * modelos/dispensa/). Cada modelo é o .docx original, com a formatação, o
 * brasão, o cabeçalho e o rodapé intactos; só os dados foram trocados por
 * marcadores:
 *   {{campo}}      texto curto, dentro de um parágrafo;
 *   [[campo]]      parágrafo que vira um parágrafo por linha do texto (some se vazio);
 *   [[@itens]]     linha de tabela repetida para cada item, com {{i.campo}}.
 * O .docx é aberto no navegador (ZIP com deflate), preenchido e empacotado de novo. */
'use strict';

const Modelos = (() => {
  const cache = {};
  const xmlEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---- leitura do ZIP (stored e deflate) ---- */
  async function inflar(bytes) {
    const ds = new DecompressionStream('deflate-raw');
    const buf = await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(buf);
  }
  async function unzip(buf) {
    const dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder();
    let fim = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { fim = i; break; }
    if (fim < 0) throw new Error('modelo .docx inválido');
    const n = dv.getUint16(fim + 10, true);
    let p = dv.getUint32(fim + 16, true);
    const out = {};
    for (let k = 0; k < n; k++) {
      const metodo = dv.getUint16(p + 10, true), tam = dv.getUint32(p + 20, true);
      const ln = dv.getUint16(p + 28, true), le = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true), loc = dv.getUint32(p + 42, true);
      const nome = dec.decode(u8.subarray(p + 46, p + 46 + ln));
      const ini = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
      const dados = u8.slice(ini, ini + tam);
      out[nome] = metodo === 0 ? dados : await inflar(dados);
      p += 46 + ln + le + lc;
    }
    return out;
  }
  async function abrir(nome) {
    if (!cache[nome]) {
      cache[nome] = fetch('modelos/dispensa/' + nome + '.docx').then(r => {
        if (!r.ok) throw new Error('modelo ' + nome + ' não encontrado (HTTP ' + r.status + ')');
        return r.arrayBuffer();
      }).then(unzip).catch(e => { delete cache[nome]; throw e; });
    }
    return cache[nome];
  }

  /* ---- preenchimento ---- */
  /* início do elemento <w:tag ...> que contém a posição i */
  function inicio(xml, tag, i) {
    const re = new RegExp('<w:' + tag + '[ >]', 'g');
    let ini = -1, m;
    while ((m = re.exec(xml)) && m.index < i) ini = m.index;
    return ini;
  }
  function elemento(xml, tag, i) {
    const a = inicio(xml, tag, i), b = xml.indexOf('</w:' + tag + '>', i) + tag.length + 5;
    return [a, b];
  }
  function trocarCampos(s, vars, pre) {
    return s.replace(/\{\{([\w.]+)\}\}/g, (m, k) => {
      const kk = pre && k.startsWith(pre) ? k.slice(pre.length) : (pre ? null : k);
      if (kk == null) return m;
      const v = vars[kk];
      return v == null ? '' : xmlEsc(v);
    });
  }
  function preencherXml(xml, vars, blocos, itens) {
    /* linhas de tabela repetidas */
    let i;
    while ((i = xml.indexOf('[[@itens]]')) >= 0) {
      const [a, b] = elemento(xml, 'tr', i);
      const linha = xml.slice(a, b).replace('[[@itens]]', '');
      xml = xml.slice(0, a) + (itens || []).map(it => trocarCampos(linha, it, 'i.')).join('') + xml.slice(b);
    }
    /* blocos de parágrafos */
    xml = xml.replace(/\[\[(\w+)\]\]/g, '\u0000$1\u0000');
    while ((i = xml.indexOf('\u0000')) >= 0) {
      const j = xml.indexOf('\u0000', i + 1), nome = xml.slice(i + 1, j);
      const [a, b] = elemento(xml, 'p', i);
      const par = xml.slice(a, b);
      const linhas = blocos[nome] == null ? [] : (Array.isArray(blocos[nome]) ? blocos[nome] : [blocos[nome]]);
      const novo = linhas.map(l => par.replace('\u0000' + nome + '\u0000', xmlEsc(l))).join('');
      xml = xml.slice(0, a) + novo + xml.slice(b);
    }
    return trocarCampos(xml, vars);
  }

  /* ---- escrita do ZIP com deflate (o .docx sai do tamanho do original) ---- */
  async function comprimir(bytes) {
    const cs = new CompressionStream('deflate-raw');
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(cs)).arrayBuffer());
  }
  async function zipar(arquivos) {
    const enc = new TextEncoder(), partes = [], central = [];
    let desloc = 0;
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      const nb = enc.encode(nome), dados = typeof conteudo === 'string' ? enc.encode(conteudo) : conteudo;
      const crc = Docx.crc32(dados), z = await comprimir(dados);
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true); loc.setUint16(8, 8, true);
      loc.setUint32(14, crc, true); loc.setUint32(18, z.length, true); loc.setUint32(22, dados.length, true); loc.setUint16(26, nb.length, true);
      partes.push(new Uint8Array(loc.buffer), nb, z);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true); cen.setUint16(10, 8, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, z.length, true); cen.setUint32(24, dados.length, true);
      cen.setUint16(28, nb.length, true); cen.setUint32(42, desloc, true);
      central.push(new Uint8Array(cen.buffer), nb);
      desloc += 30 + nb.length + z.length;
    }
    const tamCentral = central.reduce((a, b) => a + b.length, 0), n = Object.keys(arquivos).length;
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, n, true); fim.setUint16(10, n, true);
    fim.setUint32(12, tamCentral, true); fim.setUint32(16, desloc, true);
    const todas = [...partes, ...central, new Uint8Array(fim.buffer)];
    const out = new Uint8Array(todas.reduce((a, b) => a + b.length, 0));
    let o = 0;
    todas.forEach(b => { out.set(b, o); o += b.length; });
    return out;
  }

  /* Gera o .docx do modelo com os dados. O Word recalcula o nº de páginas ao abrir. */
  async function gerar(nome, vars, blocos, itens) {
    const arqs = Object.assign({}, await abrir(nome));
    const dec = new TextDecoder();
    Object.keys(arqs).filter(k => /^word\/(document|header\d*|footer\d*)\.xml$/.test(k)).forEach(k => {
      arqs[k] = preencherXml(dec.decode(arqs[k]), vars, blocos || {}, itens);
    });
    return typeof CompressionStream === 'function' ? zipar(arqs) : Docx.zipBytes(arqs);
  }

  return { gerar, abrir, unzip, preencherXml };
})();
