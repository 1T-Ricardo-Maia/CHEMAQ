# Dispensa 4/2025: eletrodomésticos do rancho (planilha de metadados)

Fonte: planilha `Modelo-Auto-AvHoFluRioTocantins-aIRFRYER.xlsx`, enviada pelo usuário em 27/11/2026. A planilha não fica no repositório porque traz nome, telefone, NIP e e-mail.

| Campo | Valor |
|---|---|
| Processo | 63387.000619/2025-11 |
| Dispensa | 4/2025 |
| Objeto | Aquisição de sanduicheira, cafeteira e termômetro digital para o rancho (material permanente/equipamento) |
| Valor | R$ 1.075,60 |
| Conclusão | outubro; prioridade média |

## Como a planilha funciona

A aba **METADADOS** é o formulário único; as outras abas são as peças, com fórmulas que puxam os campos:

| Aba | Peça | Campos de METADADOS que usa |
|---|---|---|
| Capa | 01 | NUP, assunto, nº da dispensa, data de hoje |
| DFD | 03 | responsável, telefone, NIP, e-mail, objeto (escolhe o quadro marcado na aba BD), justificativa, descrição, quantidades, valor + extenso (aba EXTENSO), mês, prioridade |
| Termo-Autuacao | 02 | responsável, NUP, nº da dispensa |
| Ato_Aprovacao-ETP | 05 | texto fixo, escrito à mão |
| Autorizacao_Abertura | 06 | NUP, nº da dispensa, "descrição da finalidade" |
| Declaracao_Orcamentaria | 09 | texto fixo, escrito à mão |
| Ato-Aprovacao-TR | 14 | texto fixo, escrito à mão |
| BD | — | os 5 quadros de "Objeto" do DFD e a lista de responsáveis (nome, posto, função) |
| EXTENSO | — | valor por extenso |

No CHEMAQ o mesmo papel é do formulário da aba Dispensa: os campos Nº da dispensa, NUP, data da capa, quem rubrica, assunto, finalidade e "contribui para" alimentam a capa, a autuação, os atos, a autorização e a declaração (ver [processo.md da 26/2026](../2026-mcp-be-lubrificacao-arrefecimento/processo.md)).
