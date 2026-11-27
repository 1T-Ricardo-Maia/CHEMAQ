/* Tabela de distâncias entre localidades (dados/distancias.json, em milhas náuticas).
 *
 * Dado um trecho como está na sondagem ("Breves x Ponta Negra",
 * "monte alegre x Santarém PA", "Belém x breves"), devolve a distância da
 * tabela. Acentos, maiúsculas, parênteses e o estado ("PA", "- AM") não
 * contam, a ordem não importa (A x B = B x A) e um roteiro com várias
 * paradas ("BNVC x Breves x Portel") soma as pernas. Se o usuário informou
 * outra distância para o trecho, a dele vale mais (ver Comb.milhasTrecho). */
'use strict';

const Dist = {
  locs: [],      // [{ nome, uf, apelidos }]
  matriz: [],
  indice: {},    // nome normalizado -> posição na matriz

  carregar() {
    fetch('dados/distancias.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => {
      if (!j || !Array.isArray(j.localidades) || !Array.isArray(j.matriz)) return;
      this.locs = j.localidades; this.matriz = j.matriz; this.indice = {};
      j.localidades.forEach((l, i) => [l.nome].concat(l.apelidos || []).forEach(n => {
        this.indice[this.norm(n)] = i;
        this.indice[this.norm(n).replace(/ /g, '')] = i;
      }));
      if (typeof Comb !== 'undefined') Comb.render();
    }).catch(() => { /* sem rede ou aberto como arquivo: as milhas ficam só as digitadas */ });
  },

  /* "Santarém - PA" -> "santarem"; "Parintins-AM" -> "parintins". */
  norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').trim().replace(/ (pa|am|ap)$/, '').trim();
  },

  /* Posição da localidade na tabela, ou -1. */
  local(nome) {
    const k = this.norm(nome);
    if (!k) return -1;
    if (k in this.indice) return this.indice[k];
    const junto = k.replace(/ /g, '');
    return junto in this.indice ? this.indice[junto] : -1;
  },

  /* Divide o trecho nas paradas: "A x B", "A X B", "A × B", "A -> B", "A / B". */
  paradas(trecho) {
    return String(trecho || '').replace(/[()]/g, ' ')
      .split(/\s+x\s+|\s*[×→\/]\s*|\s*->\s*/i).map(s => s.trim()).filter(Boolean);
  },

  /* Milhas do trecho pela tabela, ou null se alguma parada não está nela
   * ou se o trecho começa e termina no mesmo lugar ("prainha x prainha"). */
  milhas(trecho) {
    if (!this.matriz.length) return null;
    const p = this.paradas(trecho).map(n => this.local(n));
    if (p.length < 2 || p.includes(-1)) return null;
    let nm = 0;
    for (let i = 1; i < p.length; i++) nm += this.matriz[p[i - 1]][p[i]] || 0;
    return nm > 0 ? nm : null;
  }
};
