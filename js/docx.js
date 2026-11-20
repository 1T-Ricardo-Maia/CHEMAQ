/* Gerador mínimo de .docx, sem bibliotecas: monta o XML do Word e empacota
 * num ZIP sem compressão. Suficiente para documentos de texto com títulos,
 * parágrafos justificados, negrito, centralização e tabelas simples. */
'use strict';

const Docx = (() => {
  const xmlEsc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Um trecho de texto. Aceita string ou {t, b} (negrito). */
  function run(r, base) {
    const o = typeof r === 'string' ? { t: r } : r;
    const b = o.b || (base && base.b);
    const tam = (base && base.tam) || 22;
    const linhas = String(o.t).split('\n');
    return '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' + (b ? '<w:b/>' : '') +
      '<w:sz w:val="' + tam + '"/></w:rPr>' +
      linhas.map((l, i) => (i ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + xmlEsc(l) + '</w:t>').join('') + '</w:r>';
  }

  /* Parágrafo: p('texto') ou p(['trecho', {t:'negrito', b:true}], {alinha:'centro', b:true, antes:120}) */
  function p(conteudo, op) {
    op = op || {};
    const al = { centro: 'center', direita: 'right', esquerda: 'left' }[op.alinha] || 'both';
    const runs = (Array.isArray(conteudo) ? conteudo : [conteudo]).map(r => run(r, op)).join('');
    return '<w:p><w:pPr><w:spacing w:before="' + (op.antes || 0) + '" w:after="' + (op.depois == null ? 120 : op.depois) +
      '" w:line="276" w:lineRule="auto"/>' + (op.recuo ? '<w:ind w:firstLine="709"/>' : '') +
      '<w:jc w:val="' + al + '"/></w:pPr>' + runs + '</w:p>';
  }

  /* Tabela: linhas = [[cel, cel], ...]; a primeira linha vai em negrito. */
  function tabela(linhas, larguras) {
    const total = larguras.reduce((a, b) => a + b, 0);
    return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblBorders>' +
      ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(l => '<w:' + l + ' w:val="single" w:sz="4" w:space="0" w:color="000000"/>').join('') +
      '</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>' + larguras.map(w => '<w:gridCol w:w="' + w + '"/>').join('') + '</w:tblGrid>' +
      linhas.map((l, i) => '<w:tr>' + l.map((c, j) => '<w:tc><w:tcPr><w:tcW w:w="' + larguras[j] + '" w:type="dxa"/></w:tcPr>' +
        p(String(c), { alinha: 'centro', b: i === 0, depois: 40, tam: 18 }) + '</w:tc>').join('') + '</w:tr>').join('') + '</w:tbl>' + p('');
  }

  function documento(corpo) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + corpo +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr>' +
      '</w:body></w:document>';
  }

  const ARQS_FIXOS = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
  };

  /* ---- ZIP sem compressão ---- */
  const tabelaCrc = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = tabelaCrc[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zip(arquivos) {
    const enc = new TextEncoder();
    const partes = [], central = [];
    let desloc = 0;
    Object.entries(arquivos).forEach(([nome, conteudo]) => {
      const nb = enc.encode(nome), dados = enc.encode(conteudo), crc = crc32(dados);
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
      loc.setUint32(14, crc, true); loc.setUint32(18, dados.length, true); loc.setUint32(22, dados.length, true);
      loc.setUint16(26, nb.length, true);
      partes.push(new Uint8Array(loc.buffer), nb, dados);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint32(16, crc, true); cen.setUint32(20, dados.length, true); cen.setUint32(24, dados.length, true);
      cen.setUint16(28, nb.length, true); cen.setUint32(42, desloc, true);
      central.push(new Uint8Array(cen.buffer), nb);
      desloc += 30 + nb.length + dados.length;
    });
    const tamCentral = central.reduce((a, b) => a + b.length, 0);
    const fim = new DataView(new ArrayBuffer(22));
    const n = Object.keys(arquivos).length;
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, n, true); fim.setUint16(10, n, true);
    fim.setUint32(12, tamCentral, true); fim.setUint32(16, desloc, true);
    return new Blob([...partes, ...central, new Uint8Array(fim.buffer)],
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  function gerar(corpoXml) {
    return zip(Object.assign({}, ARQS_FIXOS, { 'word/document.xml': documento(corpoXml) }));
  }

  return { p, tabela, gerar, crc32 };
})();
