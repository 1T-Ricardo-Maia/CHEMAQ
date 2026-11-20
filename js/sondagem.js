/* Leitura da mensagem de sondagem que circula no WhatsApp. Aceita os formatos
 * usados a bordo, com ou sem *negrito*, em várias linhas ou numa linha só,
 * com ponto de milhar ("20.019") ou sem ("17157"):
 *
 *   *Sondagem*  30/09/2026  Dia - 03
 *   *Anterior* 20.019   *Atual* 19.534
 *   Be ▶️2.03▶️10.082   Bb▶️1.90▶️9.452   Tanque serviço ▶️600
 *   *Consumo* : 485
 *   Traslado: Breves x Ponta Negra          (opcional)
 *   *Sondagem da água* Aguada=16.645 Consumo=2.326   (opcional)
 *
 * O que sobra (nome da comissão, observações) vai para "comissão/obs".
 * Mesmas regras da aba "Importar WhatsApp" da planilha CONTROLE CLG: o
 * consumo de água fica separado do ODM, BE+BB não soma o tanque de serviço e
 * divergência acima de 10 L é sinalizada sem alterar os números da mensagem. */
'use strict';

const Sondagem = {
  TOLERANCIA: 10,

  /* Litros: "20.019" e "10.082" são milhar; "1.454,5" também funciona. */
  litros(s) {
    if (s == null) return null;
    let t = String(s).trim();
    if (!t) return null;
    if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else t = t.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  },
  /* Régua em metros: "1.71" ou "2,10". */
  metros(s) {
    if (s == null) return null;
    const n = Number(String(s).trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  },

  /* "A x B" de um texto como "segunda e terça (Santarém PAx Monte Alegre )";
   * devolve '' se não houver um trecho reconhecível. */
  trecho(texto) {
    let t = String(texto || '').replace(/[*_]/g, '');
    const par = t.match(/\(([^()]*)\)/);
    if (par) t = par[1];
    t = t.replace(/([A-ZÀ-Ú]{2})x\s/g, '$1 x ').replace(/^\s*(traslado|trecho|travessia|singradura)\s*[:=-]\s*/i, '').replace(/[.;]+\s*$/, '').trim();
    const m = t.match(/^([^\d:()]{2,40}?)\s*\bx\s+([^\d:()]{2,40})$/i) || t.match(/^([^\d:()]{2,40}?)\s+x\s*([^\d:()]{2,40})$/i);
    return m ? m[1].trim() + ' x ' + m[2].trim() : '';
  },

  limpar(txt) {
    return String(txt || '')
      .replace(/️|‍|​/g, '')
      .replace(/[*_~]/g, '')
      .replace(/[►▸→➡⏩]/g, '▶')
      .replace(/\r/g, '');
  },

  /* Separa várias mensagens coladas juntas: cada uma começa em "Sondagem"
   * (sem ser "Sondagem da água"), e o ";" no fim de uma mensagem também separa. */
  dividir(txt) {
    const t = this.limpar(txt);
    const re = /(^|\n|;)[^\S\n]*(sondagem(?![^\S\n]*(d[ae][^\S\n]*)?[áa]gua|[^\S\n]*:?[^\S\n]*(anterior|atual)))/gi;
    const inicios = [];
    let m;
    while ((m = re.exec(t))) inicios.push(m.index + m[1].length);
    if (!inicios.length) return t.trim() ? [t.trim()] : [];
    const blocos = [];
    const antes = t.slice(0, inicios[0]).replace(/;\s*$/, '').trim();
    inicios.forEach((ini, i) => {
      let b = t.slice(ini, inicios[i + 1] == null ? t.length : inicios[i + 1]).trim();
      b = b.replace(/;\s*$/, '').trim();
      if (b) blocos.push(b);
    });
    /* Texto antes da primeira "Sondagem" (ex.: nome da comissão) vai junto da primeira. */
    if (antes && blocos.length) blocos[0] = antes + '\n' + blocos[0];
    return blocos;
  },

  ler(bloco) {
    const t = this.limpar(bloco);
    const avisos = [];
    const r = { texto: String(bloco).trim() };

    /* Bloco da água separado, para o "Consumo=" dele não virar consumo de ODM. */
    const iAgua = t.search(/sondagem\s*(d[ae]\s*)?[áa]gua|aguada\s*[=:]/i);
    const oleo = iAgua >= 0 ? t.slice(0, iAgua) : t;
    const agua = iAgua >= 0 ? t.slice(iAgua) : '';
    const N = '(\\d[\\d.,]*)';
    const pega = (txt, re) => { const m = txt.match(re); return m ? m : null; };

    const d = pega(t, /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
    if (d) {
      let a = Number(d[3]); if (a < 100) a += 2000;
      r.data = a + '-' + String(d[2]).padStart(2, '0') + '-' + String(d[1]).padStart(2, '0');
    } else avisos.push('Mensagem sem data: confira a data do lançamento.');

    let m = pega(oleo, /\bdia\s*[-–:nº°]*\s*(\d{1,3})\b/i);
    if (m) r.dia = Number(m[1]);
    m = pega(oleo, new RegExp('anterior\\s*[:=▶-]*\\s*' + N, 'i'));
    if (m) r.anterior = this.litros(m[1]);
    m = pega(oleo, new RegExp('atual\\s*[:=▶-]*\\s*' + N, 'i'));
    if (m) r.atual = this.litros(m[1]);

    /* Tanques: "Be ▶1.71▶8530", "Be 2.08 :10325", "BE 2,10 ; 10422" ou só litros. */
    const tanque = lado => {
      const re2 = new RegExp('\\b' + lado + '\\b[^\\d\\n]{0,12}' + N + '\\s*m?\\s*[▶:;=/|-]+\\s*' + N, 'i');
      const re1 = new RegExp('\\b' + lado + '\\b[^\\d\\n]{0,12}' + N, 'i');
      let x = oleo.match(re2);
      if (x) return { m: this.metros(x[1]), l: this.litros(x[2]) };
      x = oleo.match(re1);
      if (!x) return null;
      const v = this.litros(x[1]);
      return v != null && v < 10 ? { m: this.metros(x[1]), l: null } : { m: null, l: v };
    };
    const be = tanque('be'), bb = tanque('bb');
    if (be) { r.beM = be.m; r.beL = be.l; }
    if (bb) { r.bbM = bb.m; r.bbL = bb.l; }

    m = pega(oleo, new RegExp('servi[çc]o\\s*[:=▶-]*\\s*' + N, 'i'));
    if (m) r.servico = this.litros(m[1]);
    m = pega(oleo, new RegExp('consum[o0]\\s*[:=▶-]*\\s*' + N, 'i'));
    if (m) r.consumo = this.litros(m[1]);
    m = pega(oleo, new RegExp('(?:recebi\\w*|recebimento|abasteci\\w*)\\s*(?:de\\s*)?[:=▶-]*\\s*' + N, 'i'));
    if (m) r.recebido = this.litros(m[1]);
    m = pega(oleo, new RegExp('(?:transferi\\w*|transfer[êe]ncia|cedid\\w*)\\s*(?:de\\s*)?[:=▶-]*\\s*' + N, 'i'));
    if (m) r.transferido = this.litros(m[1]);

    if (agua) {
      m = pega(agua, new RegExp('aguada\\s*[:=▶-]*\\s*' + N, 'i'));
      if (m) r.aguada = this.litros(m[1]);
      m = pega(agua, new RegExp('consum[o0]\\s*[:=▶-]*\\s*' + N, 'i'));
      if (m) r.consumoAgua = this.litros(m[1]);
    }

    /* Trecho: "Traslado: A x B", "Trecho: A x B" ou uma linha solta "A x B". */
    m = pega(oleo, /(?:traslado|trecho|travessia|singradura)\s*[:=-]\s*([^\n]+)/i);
    if (m) r.trecho = this.trecho(m[1]) || m[1].trim();

    /* Linhas que não são campos conhecidos viram comissão/observação. */
    const conhecida = /^(sondagem|anterior|atual|b[eb]\b|tanque|servi[çc]o|consum[o0]\s*[:=▶-]*\s*\d|dia\s*[-–:nº°]*\s*\d|\d{1,2}\/\d{1,2}\/\d{2,4}|aguada|recebi|abasteci|transfer)/i;
    const soltas = oleo.split('\n').map(s => s.replace(/;\s*$/, '').trim()).filter(s => s && !conhecida.test(s));
    const resto = [];
    soltas.forEach(s => {
      if (!r.trecho && /^[^\d:]{2,40}\s+x\s+[^\d:]{2,40}$/i.test(s)) { r.trecho = this.trecho(s); return; }
      if (r.trecho && s.indexOf(r.trecho) >= 0 && /^(traslado|trecho|travessia|singradura)\s*[:=-]/i.test(s)) return;
      resto.push(s);
    });
    if (resto.length) r.comissao = resto.join(' · ');

    if (r.consumo == null) avisos.push('Não achei o consumo de ODM na mensagem.');
    if (r.atual == null && r.beL != null && r.bbL != null) r.atual = r.beL + r.bbL;
    if (r.atual == null) avisos.push('Não achei o saldo atual.');
    if (r.anterior != null && r.atual != null && r.consumo != null) {
      const dif = r.anterior + (r.recebido || 0) - (r.transferido || 0) - r.atual - r.consumo;
      if (Math.abs(dif) > this.TOLERANCIA) avisos.push('Anterior − atual difere do consumo informado em ' + fmt(dif) + ' L.');
    }
    if (r.atual != null && r.beL != null && r.bbL != null) {
      const dif = r.atual - (r.beL + r.bbL);
      if (Math.abs(dif) > this.TOLERANCIA) avisos.push('Atual difere de BE + BB em ' + fmt(dif) + ' L.');
    }
    r.avisos = avisos;
    return r;
  },

  lerTudo(txt) { return this.dividir(txt).map(b => this.ler(b)); }
};

if (typeof module !== 'undefined') module.exports = Sondagem;
