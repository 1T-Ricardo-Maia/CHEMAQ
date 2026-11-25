# Pesquisa de preços preliminar: filtros, impelidores e correias (nov/2026)

Levantamento feito em 25/11/2026 na API de dados abertos do Compras.gov.br (módulo Pesquisa de Preço, a mesma base do Painel de Preços), para atualizar o modelo recorrente de sobressalentes. **Não substitui** a Pesquisa de Preços formal no Compras.gov.br, que continua sendo a peça do processo.

Fonte: `https://dadosabertos.compras.gov.br/modulo-pesquisa-preco/1_consultarMaterial?tipo=codigoItemCatalogo&codigo=<CATMAT>` (resultados desde maio/2025).

## Por que a pesquisa pelo CATMAT quase não serve

Os códigos usados em 2025 e 2026 são genéricos ou de outra peça (ver as fichas das dispensas). Pesquisar pelo CATMAT traz de tudo: no 603206 aparecem rotores de R$ 9 a R$ 13,5 milhões; no 625582, filtros de Argo, Palio e caminhões. Por isso a tabela abaixo usa só **compras comparáveis**: as nossas e as de navios da mesma região que compraram a mesma peça (IN SEGES/ME nº 65/2021, art. 5º, inciso II, contratações similares de até 1 ano).

## Compras comparáveis encontradas

UASG 784515 = AvHoFlu Rio Tocantins; 784516 = AvHoFlu Rio Xingu; 784514 = NHiB (Belém); 783141 = NPa Guaíba.

| Material | Nosso homologado fev/2026 | Rio Xingu mar/2026 | Outros | Referência proposta | Estimado no TR 1/2026 |
|---|---|---|---|---|---|
| FC165 (MCP, combustível) | 22,00 | 23,50 | — | **22,75** | 28,25 |
| PL447 (MCP, óleo) | 64,49 | 55,00 (Tecfil) | 32,00 (784514, nov/2025, vence em nov/2026) | **59,75** | 74,77 |
| B125005 (MCP, ar) | sem resultado | — | — | **cotar** | 671,00 |
| Racor 2020PM (MCP, pré-filtro) | — (68,29 em mai/2025, vencido) | — | — | **cotar** | — |
| Racor 2040PM (MCA, pré-filtro) | 90,70 | 49,90 (Authomix/Tecfil) | — | **70,30** (dispersão alta, conferir se é a mesma peça) | 97,26 |
| FC161 (MCA, combustível) | 14,49 | 17,50 | — | **16,00** | 16,39 |
| PSL962 (MCA, óleo) | 49,40 | 57,00 | — | **53,20** | 53,90 |
| TBH8841 (redutora) | — | — | — | **cotar** | — |
| PSH693 (máquina do leme) | 179,60 | — | — | **cotar** (só 1 fonte) | 185,03 |
| Refil Everest | 103,80 | — | 114,08 (Soft Everest, set/2026) | **108,94** | 107,80 |
| Bauer 059183, N25950, N25326 | — | — | — | **cotar** | — |
| Impelidor Jabsco 17935-0001-P | 460,00 | — | 854,00 (NPa Guaíba, mar/2026, "Jabsco 17935-0001") | **657,00** (dispersão alta) | 497,90 |
| Impelidor Jabsco 17937-0001 | 410,93 | — | — | **cotar** (só 1 fonte) | 434,50 |
| Correia 13AV1450 | 92,80 (Gates) | — | — | **cotar** (só 1 fonte) | 100,84 |
| Correia 13AV1045 | 79,70 (Gates) | — | — | **cotar** (só 1 fonte) | 81,15 |

"Referência proposta" é a média simples das fontes comparáveis com menos de 1 ano. Onde há uma fonte só, ou nenhuma, a IN 65 pede outros parâmetros: cotação com pelo menos 3 fornecedores (inciso IV) ou preços de sites especializados com data e hora (inciso III).

## Achados

1. **Preço caiu em relação ao estimado de 2026**: os homologados de fev/2026 ficaram de 3% a 22% abaixo do estimado no TR 1/2026 (FC165 22,00 contra 28,25; PL447 64,49 contra 74,77).
2. **O filtro de ar B125005 não foi comprado em nenhuma das duas dispensas.** O CATMAT 615937 descreve um filtro de combustível FC164; o fornecedor que procura "filtro de ar" não acha o item. Trocar o CATMAT é a primeira providência.
3. **Os impelidores 17935 variam de R$ 460 a R$ 854** em compras de 2026. Vale cotar o kit original Jabsco (com junta) e um similar e decidir no ETP se aceita similar.
4. Os navios da mesma flotilha (Rio Xingu, NHiB) compram os mesmos filtros todo ano. Uma compra conjunta ou uma ata de registro de preços da flotilha ganharia escala; fica como sugestão para o CHN-4.

## Como refazer este levantamento

A API não aceita chamadas a partir do site do CHEMAQ (bloqueio de CORS), então o site guarda estes números em `js/sobressalentes.js`. Para atualizar, abra no navegador o endereço acima trocando o CATMAT, filtre pelas UASG 7845xx e pela marca, e corrija os preços no site (aba Dispensa, card "Dispensa anual de sobressalentes").
