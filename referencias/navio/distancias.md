# Tabela de distâncias entre localidades

Fonte: *Tabela de Distâncias entre Localidades* (PDF de 1 página, enviado pelo Chefe de Máquinas em 27/11/2026). Distâncias em **milhas náuticas (nm)**, de Belém (BNVC) até Parintins-AM, pelo Rio Pará e Amazonas.

Os números estão em [`dados/distancias.json`](../../dados/distancias.json), que o site lê para preencher as milhas dos trechos na aba Combustível (tabela de Trechos e Planejar comissão). A distância digitada pelo usuário para um trecho vale mais que a da tabela.

## Como o site reconhece os nomes

- Acentos, maiúsculas, parênteses e o estado no fim ("Santarém PA", "Parintins - AM") são ignorados.
- A ordem não importa: "Breves x Ponta Negra" = "Ponta Negra x Breves".
- Roteiro com várias paradas soma as pernas: "BNVC x Breves x Portel" = 141 + 33 = 174 nm.
- **Belém = BNVC** (Base Naval de Val-de-Cães). Outros apelidos: SSBV = São Sebastião da Boa Vista; "Almerim" = Almeirim; "M. Alegre" = Monte Alegre; "Jaburu" = Vista Alegre do Jaburu.
- Fica sem distância: trecho com localidade fora da tabela (ex.: **Anajás**) e trecho que sai e volta ao mesmo lugar ("prainha x prainha"). Nesses casos digite as milhas.
- Para incluir uma localidade ou apelido, edite `dados/distancias.json` (lista `localidades` e uma linha/coluna nova na `matriz`).

## Localidades (ordem da tabela)

| # | Abrev. | Localidade | UF |
|---|---|---|---|
| 1 | BNVC | BNVC (Base Naval de Val-de-Cães) | PA |
| 2 | Cotij | Cotijuba | PA |
| 3 | Mosq | Mosqueiro | PA |
| 4 | Barc | Barcarena | PA |
| 5 | PtPed | Ponta de Pedras | PA |
| 6 | Abaet | Abaetetuba | PA |
| 7 | Camet | Cametá | PA |
| 8 | PtNeg | Ponta Negra | PA |
| 9 | SSBV | SSBV (São Sebastião da Boa Vista) | PA |
| 10 | Curr | Curralinho | PA |
| 11 | Breves | Breves | PA |
| 12 | Portel | Portel | PA |
| 13 | ALemos | Antônio Lemos | PA |
| 14 | Jabur | Vista Alegre do Jaburu | PA |
| 15 | Sant | Santana | AP |
| 16 | Afuá | Afuá | PA |
| 17 | Gurupá | Gurupá | PA |
| 18 | PMoz | Porto de Moz | PA |
| 19 | Almeir | Almeirim | PA |
| 20 | Prainha | Prainha | PA |
| 21 | MAleg | Monte Alegre | PA |
| 22 | Stm | Santarém | PA |
| 23 | Óbidos | Óbidos | PA |
| 24 | Juruti | Juruti | PA |
| 25 | Parint | Parintins | AM |

## Matriz (nm)

| | BNVC | Cotij | Mosq | Barc | PtPed | Abaet | Camet | PtNeg | SSBV | Curr | Breves | Portel | ALemos | Jabur | Sant | Afuá | Gurupá | PMoz | Almeir | Prainha | MAleg | Stm | Óbidos | Juruti | Parint |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **BNVC** | — | 10 | 15 | 17 | 31 | 45 | 95 | 57 | 80 | 97 | 141 | 183 | 176 | 184 | 277 | 270 | 248 | 294 | 307 | 364 | 400 | 464 | 528 | 570 | 624 |
| **Cotij** | 10 | — | 8 | 16 | 34 | 44 | 94 | 56 | 79 | 96 | 140 | 182 | 175 | 183 | 276 | 269 | 247 | 293 | 306 | 363 | 399 | 463 | 527 | 569 | 623 |
| **Mosq** | 15 | 8 | — | 24 | 43 | 46 | 102 | 64 | 87 | 104 | 148 | 190 | 183 | 191 | 284 | 277 | 255 | 301 | 314 | 371 | 407 | 471 | 535 | 577 | 631 |
| **Barc** | 17 | 16 | 24 | — | 18 | 28 | 78 | 40 | 63 | 80 | 124 | 166 | 159 | 167 | 260 | 253 | 231 | 277 | 290 | 347 | 383 | 447 | 511 | 553 | 607 |
| **PtPed** | 31 | 34 | 43 | 18 | — | 26 | 74 | 36 | 59 | 59 | 103 | 145 | 138 | 146 | 239 | 232 | 210 | 256 | 269 | 326 | 362 | 426 | 490 | 532 | 586 |
| **Abaet** | 45 | 44 | 46 | 28 | 26 | — | 68 | 30 | 52 | 69 | 113 | 155 | 148 | 156 | 249 | 242 | 220 | 266 | 279 | 336 | 372 | 436 | 500 | 542 | 596 |
| **Camet** | 95 | 94 | 102 | 78 | 74 | 68 | — | 51 | 60 | 77 | 121 | 163 | 156 | 164 | 257 | 250 | 228 | 274 | 287 | 344 | 380 | 444 | 508 | 550 | 604 |
| **PtNeg** | 57 | 56 | 64 | 40 | 36 | 30 | 51 | — | 23 | 40 | 84 | 126 | 119 | 127 | 220 | 213 | 191 | 237 | 250 | 307 | 343 | 407 | 471 | 513 | 567 |
| **SSBV** | 80 | 79 | 87 | 63 | 59 | 52 | 60 | 23 | — | 17 | 61 | 85 | 96 | 104 | 197 | 190 | 168 | 214 | 227 | 284 | 320 | 384 | 448 | 490 | 544 |
| **Curr** | 97 | 96 | 104 | 80 | 59 | 69 | 77 | 40 | 17 | — | 44 | 86 | 78 | 87 | 180 | 173 | 151 | 197 | 210 | 267 | 303 | 367 | 431 | 473 | 527 |
| **Breves** | 141 | 140 | 148 | 124 | 103 | 113 | 121 | 84 | 61 | 44 | — | 33 | 35 | 43 | 136 | 129 | 107 | 153 | 166 | 223 | 259 | 323 | 387 | 429 | 483 |
| **Portel** | 183 | 182 | 190 | 166 | 145 | 155 | 163 | 126 | 85 | 86 | 33 | — | 49 | 83 | 176 | 169 | 121 | 167 | 180 | 237 | 273 | 337 | 401 | 443 | 497 |
| **ALemos** | 176 | 175 | 183 | 159 | 138 | 148 | 156 | 119 | 96 | 78 | 35 | 49 | — | 34 | 128 | 120 | 72 | 118 | 131 | 188 | 224 | 288 | 352 | 394 | 448 |
| **Jabur** | 184 | 183 | 191 | 167 | 146 | 156 | 164 | 127 | 104 | 87 | 43 | 83 | 34 | — | 93 | 86 | 106 | 152 | 165 | 222 | 258 | 322 | 386 | 428 | 482 |
| **Sant** | 277 | 276 | 284 | 260 | 239 | 249 | 257 | 220 | 197 | 180 | 136 | 176 | 128 | 93 | — | 67 | 126 | 138 | 139 | 195 | 231 | 295 | 359 | 401 | 455 |
| **Afuá** | 270 | 269 | 277 | 253 | 232 | 242 | 250 | 213 | 190 | 173 | 129 | 169 | 120 | 86 | 67 | — | 193 | 205 | 206 | 262 | 298 | 362 | 426 | 468 | 522 |
| **Gurupá** | 248 | 247 | 255 | 231 | 210 | 220 | 228 | 191 | 168 | 151 | 107 | 121 | 72 | 106 | 126 | 193 | — | 46 | 59 | 116 | 152 | 216 | 280 | 322 | 376 |
| **PMoz** | 294 | 293 | 301 | 277 | 256 | 266 | 274 | 237 | 214 | 197 | 153 | 167 | 118 | 152 | 138 | 205 | 46 | — | 53 | 110 | 146 | 210 | 274 | 316 | 370 |
| **Almeir** | 307 | 306 | 314 | 290 | 269 | 279 | 287 | 250 | 227 | 210 | 166 | 180 | 131 | 165 | 139 | 206 | 59 | 53 | — | 57 | 93 | 157 | 221 | 263 | 317 |
| **Prainha** | 364 | 363 | 371 | 347 | 326 | 336 | 344 | 307 | 284 | 267 | 223 | 237 | 188 | 222 | 195 | 262 | 116 | 110 | 57 | — | 36 | 100 | 164 | 206 | 260 |
| **MAleg** | 400 | 399 | 407 | 383 | 362 | 372 | 380 | 343 | 320 | 303 | 259 | 273 | 224 | 258 | 231 | 298 | 152 | 146 | 93 | 36 | — | 64 | 128 | 170 | 224 |
| **Stm** | 464 | 463 | 471 | 447 | 426 | 436 | 444 | 407 | 384 | 367 | 323 | 337 | 288 | 322 | 295 | 362 | 216 | 210 | 157 | 100 | 64 | — | 64 | 106 | 160 |
| **Óbidos** | 528 | 527 | 535 | 511 | 490 | 500 | 508 | 471 | 448 | 431 | 387 | 401 | 352 | 386 | 359 | 426 | 280 | 274 | 221 | 164 | 128 | 64 | — | 42 | 96 |
| **Juruti** | 570 | 569 | 577 | 553 | 532 | 542 | 550 | 513 | 490 | 473 | 429 | 443 | 394 | 428 | 401 | 468 | 322 | 316 | 263 | 206 | 170 | 106 | 42 | — | 54 |
| **Parint** | 624 | 623 | 631 | 607 | 586 | 596 | 604 | 567 | 544 | 527 | 483 | 497 | 448 | 482 | 455 | 522 | 376 | 370 | 317 | 260 | 224 | 160 | 96 | 54 | — |

## Observações

- A matriz é simétrica (conferida: A x B = B x A em todos os 300 pares).
- Algumas distâncias não fecham por soma de pernas (ex.: Afuá x Gurupá = 193 nm, mais que Afuá x Santana + Santana x Gurupá = 67 + 126), provavelmente por derrotas diferentes. O site usa o número da tabela tal como está.
