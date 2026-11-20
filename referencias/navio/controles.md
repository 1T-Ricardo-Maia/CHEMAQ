# Planilhas de controle do navio

Resumo das três planilhas de controle que ficam na pasta local `Navio/`. Os originais têm nomes da tripulação e mensagens de WhatsApp; nada disso vem para cá.

## Controle de PPSS (pedidos de serviço ao BNVC)

Arquivo: `AvHoFluRioTocantins-Controle de PPSS-OUT2026.ods`. Uma linha por pedido de serviço, com orçamento (FR-170/FR-171), aditamentos, mensagens de solicitação e indicação de recurso, situação e ALTCRED.

| PS | Descrição | DS | Valor (R$) | Situação |
|---|---|---|---|---|
| 0001/2025 | Manutenção preventiva de 6.000 h do MCA 01 (BE), MWM 229-6 | 5908 | 74.337,09 | Terminado |
| 0003/2025 | Bomba de águas cinzas | 5958 | 1.187,06 (832,18 + aditamento 354,88) | Terminado |
| 0004/2025 | Quadro elétrico principal | 6010 | 34.587,66 | Recurso indicado (serviço iniciado em 16 DEZ) |
| 0007/2025 | Bote | 6035 | 7.469,87 | Recurso indicado |
| 0010/2025 | MCA 01 (BE), MWM 229-6 (itens restantes) | 5932 | 34.679,99 | Recurso indicado, aguardando fornecimento |
| 0013/2025 | Retificador de baterias | – | não orçado | Encaminhado pelo Of. nº 59/2025 |

Total alocado e indicado: R$ 152.261,67 (ALTCRED P4HN.2025.AC.00185). Legenda de situação usada: terminado, cancelado, recurso indicado, orçado e não indicado, não orçado, recurso segurado.

## Controle de consumo de ODM (CONTROLE CLG)

Arquivo: `CONTROLE CLG.xlsx`. É a base que mais se aproxima do módulo de combustível do site.

| Aba | Conteúdo |
|---|---|
| Painel | Indicadores do ano escolhido em B4: consumo relatado, nº de lançamentos, média por lançamento, recebimentos |
| Registro | Uma linha por sondagem ou movimentação: data, hora, tipo, consumo, recebido, transferido, anterior, tanque BE, tanque BB, serviço, saldo BE+BB, saldo declarado |
| Resumo mensal | Agregação por mês e ano |
| Importar WhatsApp | Cola-se a mensagem de sondagem e a planilha extrai ODM e água; bloqueia mensagens repetidas |
| Fontes | Mensagem original de cada lançamento (rastreabilidade) |
| Resumo de Aguada | Água, separada do ODM |
| Leia-me | Regras: só conta o que a mensagem identifica como consumo de ODM (fora lubrificante 15W40, CCD410, hidráulico e gasolina) |

| Ano | Consumo (L) | Lançamentos | Recebido (L) | Transferido (L) |
|---|---|---|---|---|
| 2025 | 23.956 | 54 | 15.000 | – |
| 2026 | 60.258 | 95 | 49.603 | 2.400 |

Para o site: os campos do Registro (sondagem dos tanques BE e BB, tanque de serviço, consumo, recebido, transferido) são o formulário de lançamento de combustível.

## Modelo de SITREP de CLG ao CHN

Arquivo: `modelo padrao de sitrep de clg pare enviar ao chn.xlsx`. Relatório por período com quatro blocos: estoque anterior, recebimentos (data, origem), transferências (data, destino) e consumos por comissão (PGAD/PMPE, período, porto/comissão), seguidos de estoque atual, recebimento acumulado e consumo acumulado. Colunas: gasolina, óleo diesel, óleo lubrificante, graxa, convênio.

PIs usados no relatório:

| PI | Uso no modelo |
|---|---|
| 190024045 | Óleo diesel (ODM) |
| 190009503 | Gasolina |
| 190021148, 190010827, 190010865, 190026489, 190029467 | Lubrificantes e graxa (conferir a que produto cada um corresponde) |

Exemplo do modelo (30/07/2026): estoque anterior de 13.951 L de ODM; recebimento de 10.000 L do CeIMBe em 14/07; transferência de 1.300 L em 27/07; consumo de 10.822 L na comissão Rio Amazonas VIII (parte I, 22 JUN a 28 JUL); estoque atual de 11.829 L. Acumulado no ano: 35.500 L recebidos e 50.454 L consumidos.

O SITREP e o CONTROLE CLG contam a mesma coisa de dois jeitos (por comissão e por sondagem). O módulo de combustível do site pode gerar o SITREP a partir dos lançamentos.
