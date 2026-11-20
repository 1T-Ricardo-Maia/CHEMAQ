# MCP BB e BE: MTU 6R 199 TB60 (294 kW a 1.850 rpm)

Resumo dos quatro documentos do fabricante que temos. Os PDFs **não** ficam no repositório (público), porque a MTU proíbe a reprodução sem autorização. Eles estão guardados nos arquivos do projeto, em `manuais/mtu-6r199tb60/`.

| Documento | Páginas | Conteúdo |
|---|---|---|
| Technical Sales Documentation 6R199, rev. 09/2009 | 4 | Ficha de dados do motor (potência, consumo, temperaturas, pressões, vazões, volumes) |
| Performance Diagram 0.199.381 | 1 | Curva de potência e mapa de consumo específico |
| Desenho de instalação MTU do Brasil nº 1199112415, rev. 0 | 1 (A0) | Vistas, dimensões e conexões do motor |
| Manual de Instalação de Motores Marítimos, séries 099, 1000 e 1800 (MTU do Brasil, mar/2002) | 58 | Requisitos de instalação por sistema (ar, escape, arrefecimento, combustível, lubrificação, elétrico, montagem, alinhamento, tomadas de força) |

Ainda falta o **Manual de Operação e Manutenção** (seção Dados Técnicos e Tabela de Manutenção), que é a fonte citada no TR 35/2026.

## Dados do motor (Technical Sales Documentation)

Condições de referência: ar de admissão 45 °C, água bruta 32 °C, 1000 mbar, 100 m de altitude. Índice: A = projeto, R = orientativo, L = limite, G = garantido.

### Geral

| Item | Valor |
|---|---|
| Configuração | 6 cilindros em linha, turboalimentado com pós-arrefecimento (1 turbo, 1 intercooler), coletor de escape arrefecido a líquido |
| Diâmetro x curso | 128 x 155 mm |
| Cilindrada | 1,99 L por cilindro; 11,97 L total |
| Taxa de compressão | 16,25 |
| Válvulas | 1 admissão e 1 escape por cilindro |
| Potência (FSP, ISO 3046) | 294 kW a 1.850 rpm |
| Velocidade média do pistão | 9,6 m/s |
| Pressão média efetiva | 15,9 bar |
| Marcha lenta mínima | 700 rpm |
| Sinal de sobrevelocidade / corte de ar de emergência | 2.250 / 2.350 rpm |
| Peso seco | 1.150 kg (desenho: 1.173 ± 5 kgf sem água e óleo) |

### Consumo

| Item | Valor |
|---|---|
| Consumo específico na potência máxima | 216 g/kWh (G, com bomba de água bruta, tolerância +5%, diesel EN 590 de 42,8 MJ/kg) |
| Consumo em marcha lenta | 1,5 kg/h |
| Consumo de óleo após 100 h | 0,5% do consumo de combustível |

Mapa de consumo (Performance Diagram, leitura aproximada do gráfico): a região abaixo de 200 g/kWh vai de cerca de 1.350 a 1.850 rpm e de 140 a 280 kW. Na curva de hélice, o motor fica nessa região mais econômica entre uns 1.500 e 1.800 rpm. Em marcha lenta e baixa carga, o consumo específico passa de 230 g/kWh.

Conta rápida: 216 g/kWh x 294 kW ≈ 63,5 kg/h ≈ 76 L/h por motor a plena carga (diesel a 0,84 kg/L). Útil para conferir o lançamento de combustível no site.

### Ar e escape

| Item | Valor |
|---|---|
| Depressão na admissão (filtro novo / limite) | 15 / 30 mbar |
| Contrapressão de escape (projeto / limite) | 30 / 50 mbar |
| Pressão do ar de sobrealimentação (abs.) | 2,80 bar |
| Vazão de ar de combustão | 0,390 m³/s |
| Vazão de gases (na temperatura de escape) | 0,90 m³/s |
| Temperatura após o turbo | 350 °C |
| Temperatura máxima na praça de máquinas (aspiração do filtro) | 45 °C (Manual de Instalação) |

### Arrefecimento

| Item | Valor |
|---|---|
| Calor rejeitado ao fluido de arrefecimento (com resfriador de óleo) | 260 kW |
| Calor irradiado pelo motor | 10 kW |
| Temperatura após o motor (projeto do trocador) | 85 °C |
| Temperatura de operação na saída do motor | 75 a 90 °C |
| Alarme / parada | 97 °C / 100 °C |
| Bomba de circulação, vazão (±5%) | 22,5 m³/h |
| Bomba de circulação, pressão de entrada mín./máx. | 0,1 / 1,2 bar |
| Diferencial máximo no circuito externo ao motor | 0,5 bar |
| Válvula de alívio: sobrepressão / depressão | 1,0 / 0,1 bar |
| Pressão de projeto do trocador | 2,5 bar |
| Bomba de água bruta, vazão | 16,3 m³/h |
| Bomba de água bruta, diferencial | 0,6 bar |
| Bomba de água bruta, pressão de entrada mín./máx. | 0,1 / 0,5 bar |
| Volume de fluido de arrefecimento (com trocador) | 36 L |
| Temperatura mínima do fluido para plena carga | 55 °C |

### Lubrificação

| Item | Valor |
|---|---|
| Temperatura do óleo antes / depois do motor | 80 a 90 °C / 90 a 105 °C |
| Pressão do óleo antes do motor (operação) | 3,5 a 5,0 bar |
| Alarme / parada por baixa pressão | 3,0 bar / 2,0 bar |
| Pressão em marcha lenta | > 1,5 bar |
| Óleo: enchimento inicial | 28,5 L |
| Cárter: marca mínima / máxima da vareta | 20 L / 26,5 L |

### Combustível

| Item | Valor |
|---|---|
| Pressão na entrada da bomba alimentadora mín./máx. | -0,1 / 1,0 bar |
| Vazão da bomba alimentadora | 4,5 L/min |
| Contrapressão máxima no retorno | 1,0 bar |
| Temperatura do combustível: projeto / sem perda de potência / máxima | 32 / 35 / 60 °C |

### Partida e inclinações

| Item | Valor |
|---|---|
| Motor de partida | 6,0 kW, 24 V |
| Bateria recomendada | 150 a 180 Ah |
| Partida a frio sem auxílio | -10 °C, óleo SAE 10W30 |
| Rotação de partida | 100 a 120 rpm |
| Inclinação contínua máxima | longitudinal 12° (proa para baixo) / 6° (para cima); transversal 10° |

## Desenho de instalação 1199112415

- Comprimento total 1.880 mm; largura 1.009 mm; altura 1.521 mm. Embalagem: 2.000 x 1.100 x 1.650 mm.
- Água bruta: entrada Ø 51 x 15 mm mín. e saída Ø 51 x 35 mm mín.; bomba de água bruta Jabsco.
- Combustível: entrada e retorno Ø 10 mm.
- Drenos de óleo: bujão M26x1,5 (cárter), bujão SW17, dreno do reversor M22x1,5; bomba manual de dreno de óleo do motor e do reversor.
- Sensores mostrados: interruptor/sensor de pressão do óleo, interruptor/sensor de temperatura da água, sensor de pressão do turbo, sensor de nível de água (opcional), indicador de restrição do filtro de ar.
- Solenoide de parada (fios: preto terra, branco puxa, vermelho segura). Alternador 24 V. Tomada W do alternador para tacômetro.
- Junta de expansão na saída de escape; alça de içamento dianteira e traseira.

## Manual de Instalação (séries 099, 1000 e 1800)

Cuidado: o manual cobre as séries 099, 1000 e 1800, **não** a 199. O TR cita "no que couber", e é assim que deve continuar sendo citado.

Pontos que importam para a manutenção a bordo:

- **Arrefecimento indireto em água lodosa** (cap. 5): o manual diz que o sistema indireto "não é recomendado para aplicações nas quais a água de navegação seja lodosa, muito contaminada por partículas em suspensão". É o argumento usado nas dispensas para justificar a troca preventiva do trocador e do rotor da bomba de água bruta em rios amazônicos.
- **Materiais do circuito de água bruta**: cobre-níquel DIN 1755 CuNiFe ou aço inox SAE J405 30316.
- **Tubulação de água bruta**: mangueiras DN 51 sem dobras, raio de curvatura mínimo igual ao diâmetro, comprimento máximo de 2 m e altura de sucção máxima de 1,5 m. Válvula anti-retorno se a bomba ficar 1 m acima da linha d'água.
- **Filtro de água bruta**: tela de no máximo 2 mm, área útil maior que 2 vezes a seção de entrada, tampa uns 150 mm acima da linha d'água. Pode ter dois em paralelo com válvula seletora.
- **Grelha da tomada de mar**: área útil de pelo menos 2 vezes a seção do tubo; limpar o filtro, não a grelha.
- **Pontos de medição**: prever conexões M18x1,5 nos pontos da Figura 5.3 para medir temperatura e restrição; conferir todos os valores da seção Dados Técnicos antes de operar.
- **Fluido de arrefecimento**: só o especificado no Manual de Operação e Manutenção; não usar anticongelante com água acima de 20 °C. Circuitos de motores diferentes sempre independentes.
- **Combustível**: tubos de aço-carbono (ex. DIN 2391 St 35), nunca cobre ou galvanizado; ligação ao motor por mangueira flexível; alimentação DN 10, retorno DN 8; pré-filtro separador de água obrigatório; captação a 50 mm do fundo do tanque.
- **Lubrificação**: só óleos e filtros especificados pela MTU; sensores de pressão originais na substituição.
- **Elétrico**: cabos presos a cada 300 mm no máximo; ao soldar no casco, desligar o motor e desconectar alternador e bateria; barramento principal ligado a anodo de sacrifício contra corrosão galvânica.
- **Alinhamento de correias** (tomada de força): desalinhamento menor que 1 mm a cada 200 mm de correia.

## Divergências com o TR 35/2026

A Tabela 2 do Anexo III do TR foi tirada do Manual de Operação e Manutenção. A ficha técnica de vendas traz alguns valores diferentes:

| Parâmetro | TR 35/2026 (Manual de O&M) | Technical Sales Documentation |
|---|---|---|
| Temperatura de operação na saída | 83 a 95 °C | 75 a 90 °C |
| Vazão da bomba de água bruta a 1.850 rpm | 13,5 m³/h | 16,3 m³/h |
| Pressão mínima de entrada da bomba de água bruta | -0,2 bar | 0,1 bar |
| Volume de fluido de arrefecimento | 32 L | 36 L (com trocador) |
| Pressão de projeto do trocador | ≥ 2,0 bar (exigência do TR) | 2,5 bar |

Alarme (97 °C), máxima (100 °C), vazão da bomba de circulação (22,5 m³/h), pressões da válvula de alívio e da entrada da bomba de circulação batem nos dois documentos. As diferenças podem vir de revisões diferentes ou de outra bomba de água bruta. Na próxima especificação de trocador, conferir com o Manual de O&M de bordo e usar os 260 kW de calor rejeitado na memória de cálculo.
