# MCP BB e BE: MTU 6R 199 TB60 (294 kW a 1.850 rpm)

Resumo dos quatro documentos do fabricante que temos. Os PDFs **não** ficam no repositório (público), porque a MTU proíbe a reprodução sem autorização. Eles estão guardados nos arquivos do projeto, em `manuais/mtu-6r199tb60/`.

| Documento | Páginas | Conteúdo |
|---|---|---|
| Technical Sales Documentation 6R199, rev. 09/2009 | 4 | Ficha de dados do motor (potência, consumo, temperaturas, pressões, vazões, volumes) |
| Performance Diagram 0.199.381 | 1 | Curva de potência e mapa de consumo específico |
| Desenho de instalação MTU do Brasil nº 1199112415, rev. 0 | 1 (A0) | Vistas, dimensões e conexões do motor |
| Manual de Instalação de Motores Marítimos, séries 099, 1000 e 1800 (MTU do Brasil, mar/2002) | 58 | Requisitos de instalação por sistema (ar, escape, arrefecimento, combustível, lubrificação, elétrico, montagem, alinhamento, tomadas de força) |

| Manual de Operação e Manutenção, motores 6R 199 TB50A/TB50B/TB60, doc. 1199112201, rev. 05/2012 | 85 | Operação, diagnóstico de defeitos, **plano de manutenção**, procedimentos, dados técnicos, torques, óleos e aditivos |

O arquivo local do Manual de O&M se chama "Manual Operação e Manutenção series 099 1000 1800.pdf", mas o conteúdo é o manual da **série 6R 199**. Há também, na pasta local, o Manual de Oficina da série 199 (242 páginas), o catálogo de peças 1199112200 rev. 2 e a lista de sobressalentes do painel ADKL; ver o [catálogo do acervo](../../acervo.md).

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

## Manual de Operação e Manutenção (1199112201, rev. 05/2012)

É a fonte "seção Dados Técnicos" citada no TR. O MCP do navio é o **6R 199 TB60, regime 1A (serviço pesado)**, coluna **M61** das tabelas (1.850 rpm, 294 kW).

### Dados técnicos da coluna M61 (1.850 rpm)

| Item | Valor |
|---|---|
| Consumo específico (FSP, garantido) | 205 g/kWh |
| Pressão do ar antes do cilindro (abs.) | 2,45 bar |
| Temperatura de escape após o turbo | 420 °C |
| Calor dissipado pelo fluido de arrefecimento (com resfriador de óleo) | 198 kW |
| Temperatura do fluido na saída do cabeçote: projeto / operação | 85 °C / 75 a 90 °C |
| Alarme / parada por temperatura | 96 °C / 99 °C |
| Bomba de circulação, vazão | 22,5 m³/h |
| Pressão de entrada da bomba de circulação mín./máx. | 0,1 / 1,2 bar |
| Diferencial máximo fora do motor (fluido) | 0,5 bar |
| Válvula da tampa: sobrepressão / depressão | 1,0 / 0,1 bar |
| Pressão de projeto do equipamento de arrefecimento | 2,5 bar |
| Bomba de água bruta, vazão (e vazão no trocador) | 13,5 m³/h |
| Bomba de água bruta, diferencial | 0,6 bar |
| Bomba de água bruta, pressão de entrada mín./máx. | -0,2 / 0,5 bar |
| Diferencial máximo fora do motor (água bruta) | 0,5 bar |
| Óleo: temperatura após / antes do resfriador | 80 a 90 °C / 90 a 100 °C |
| Óleo: pressão de operação | 3,5 a 5,0 bar |
| Óleo: alarme / parada / marcha lenta | 3,0 bar / 2,0 bar / > 1,5 bar |
| Bomba alimentadora: vazão | 4,5 L/min |
| Pressão de injeção dos bicos (nominal / mínima) | 200 + 8 bar / 180 bar |
| Pressão de compressão mínima | 20 bar |
| Folga de válvulas (frio): admissão / escape | 0,30 mm / 0,50 mm |
| Ordem de injeção | 1-5-3-6-2-4 (cilindro 6 do lado do volante); rotação anti-horária vista pelo volante |
| Sobrerrotação: sinal / corte de ar | 2.080 / 2.130 rpm |
| Temperatura mínima para plena carga | 50 °C |
| Volume de fluido de arrefecimento (com trocador) | 32 L |
| Óleo: enchimento inicial / cárter MIN / MAX | 29 L / 17 L / 26 L |
| Peso seco | 975 kg |

### Plano de manutenção para o regime 1A (Categoria III)

| Horas | Manutenção |
|---|---|
| 25 a 30 h (motor novo ou recondicionado) | Inicial |
| a cada 250 h (250, 750, 1.250, 1.750...) | A |
| a cada 500 h (500, 1.500, 2.500, 3.500) | B |
| a cada 1.000 h (1.000, 3.000) | C |
| 2.000 h | D |
| 4.000 h | E |

A manutenção A deve ser feita pelo menos uma vez por ano. Com combustível acima de 1% de enxofre, usar o plano da Categoria I (mais frequente). Independentemente das horas: fluido de arrefecimento todo ano, elemento do filtro de ar a cada 2 anos, mangueiras e abraçadeiras de arrefecimento e combustível a cada 4 anos.

Diário: nível do fluido, estanqueidade do arrefecimento, drenar o pré-filtro separador, estanqueidade do combustível, nível do óleo, estanqueidade da admissão.

O que entra em cada manutenção (Tabela de Categorias, p. 5-3; conferir no PDF antes de usar em OS):

| Item (procedimento) | Inicial | A | B | C | D | E |
|---|---|---|---|---|---|---|
| Folga de válvulas (MB01) | x | | x | x | x | x |
| Compressão dos cilindros (MB02) | | | | | | x |
| Aperto dos elementos de fixação (MB03) | x | | x | x | x | x |
| Nível do fluido, bomba de circulação, conexões do arrefecimento (SR01, SR08, SR09) | x | x | x | x | x | x |
| Válvula termostática (SR06) | | | | | | x |
| Mangueiras do arrefecimento (SR07) | x | | | x | x | x |
| Trocador de calor: limpar e testar estanqueidade (SR12, SR13) | | | | x | x | x |
| Trocador de calor: anodo (SR15) | | x | x | x | x | x |
| Filtro de água bruta (SR16) | x | x | x | x | x | x |
| Bomba de água bruta: verificar rotor (SR17) | | x | x | x | | x |
| Bomba de água bruta: substituir rotor (SR18) | | | | x | x | x |
| Pré-filtro separador (SC03), conexões e mangueiras de combustível (SC16, SC17) | x | x | x | x | x | x |
| Filtro duplo de combustível (SC05) | | | x | x | x | x |
| Pré-filtro da bomba injetora (SC06), alavancas da bomba (SC15) | x | | x | x | x | x |
| Início de fornecimento da bomba injetora (SC09) | | | | | | x |
| Teste dos bicos injetores (SC12) | | | | | x | x |
| Nível do óleo, filtro de óleo, **troca de óleo** (SL01, SL05, SL06) | x | x | x | x | x | x |
| Análise do óleo (SL04) | | | | | | x |
| Filtro de ar: limpar (SA01) / substituir elemento (SA02) | x / | x / | / x | / x | / x | / x |
| Pós-arrefecedor: limpar, estanqueidade, anodo (SA04 a SA06) | | | | x | x | x |
| Estanqueidade de admissão e escape (SA07, ST02) | x | | x | x | x | x |
| Bateria, aterramento, cabos (SE01 a SE03) | x | | | | | |
| Motor de partida e alternador (SE04 a SE06) | | | | | x | x |
| Válvula PCV (SV01) | | | | x | x | x |
| Correias: estado e tensão (SP01, SP02) | x | x | x | x | x | x |

Na prática, para o MCP do navio: **troca de óleo e filtro de óleo a cada 250 h**, filtro de combustível a cada 500 h, limpeza do trocador e do pós-arrefecedor e troca do rotor da bomba de água bruta a cada 1.000 h, bicos a cada 2.000 h e revisão completa (compressão, termostática, bomba injetora, análise de óleo) a cada 4.000 h.

### Torques principais (p. 7-12 a 7-14, tolerância 15%, rosca levemente oleada)

| Elemento | Torque |
|---|---|
| Parafuso do cabeçote | 10 → 50 → 100 → 140+10 → 180+10 N·m, mais 90°+10° |
| Capa do mancal / bloco | 300+30 N·m + 90°+10° |
| Capa de biela | 40+10 N·m + 90°+10° |
| Volante / árvore de manivelas | 200+20 N·m + 90°+20° |
| Polia da árvore de manivelas | 200 N·m |
| Bujão de drenagem do cárter | 80 N·m |
| Bujão de dreno do fluido / bloco | 55 N·m |
| Resfriador de óleo / bloco | 40 N·m |
| Tampa de válvulas | 25 N·m |
| Bico injetor: fixação / porta-bico | 70 / 80 N·m |
| Tubo de alta pressão (porcas) | 25 N·m |
| Tubo de lubrificação (pressão) / turbo e / resfriador | 40 N·m |
| Curva de escape e coletor de escape / cabeçote | 60+10 N·m |
| Coletor de admissão / cabeçote | 25 N·m |
| Turbo / curva de escape | 50 N·m |
| Filtro de óleo / bloco | 60 N·m |
| Motor de partida / carcaça do volante | 80 N·m |

Para parafusos normalizados, há tabela por bitola e classe 8.8 / 10.9 (norma MTN 5008) na p. 7-14.

### Óleos, aditivos e combustível (p. 7-15 a 7-17)

- **Óleo do motor**: SAE 15W40 (ou 10W40/5W40 sintético), classe Mercedes-Benz 228.1 ou 228.3. Exemplos da lista: Lubrax Extra Turbo / Top Turbo, Rimula, Delvac, Ursa, Urania, Essolube, Total Rubia, Castrol Tection.
- **Fluido de arrefecimento em clima quente** (duas opções): aditivo anticorrosivo solúvel (ex.: Glysacorr) a 9 a 11%, trocar no máximo a cada 3 anos; ou óleo anticorrosivo emulsionável (ex.: Shell Donax CS, Celurust S-120) a 1 a 2%, trocar no máximo a cada 6 meses. Anticongelante só abaixo de 0 °C. Usar só água limpa: nunca água salobra, de chuva, industrial ou destilada.
- **Limpeza do sistema de arrefecimento**: desengordurante solúvel a 5% (ex.: P3 AL 580 E).
- **Combustível**: diesel DIN 51601 / ASTM D 975 1D-2D, no máximo 1% de enxofre, filtrado e sem água. O manual diz que não deve ser usado "Diesel Marítimo (Marine Diesel)". Vale confirmar se o ODM fornecido ao navio atende à especificação, já que o nome coincide.

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

A Tabela 2 do Anexo III do TR 35/2026 diz ter sido tirada da seção Dados Técnicos do Manual de O&M, mas parte dos valores não confere com o manual:

| Parâmetro (1.850 rpm) | TR 35/2026 | Manual de O&M (M61) | Ficha técnica de vendas |
|---|---|---|---|
| Temperatura de operação na saída do cabeçote | 83 a 95 °C | **75 a 90 °C** | 75 a 90 °C |
| Alarme / máxima (parada) | 97 / 100 °C | **96 / 99 °C** | 97 / 100 °C |
| Vazão da bomba de água bruta | 13,5 m³/h | 13,5 m³/h | 16,3 m³/h |
| Pressão de entrada da bomba de água bruta, mín. | -0,2 bar | -0,2 bar | 0,1 bar |
| Volume de fluido de arrefecimento | 32 L | 32 L | 36 L |
| Pressão de projeto do trocador | ≥ 2,0 bar (exigência do TR) | **2,5 bar** | 2,5 bar |
| Calor rejeitado ao fluido de arrefecimento | (não citado) | 198 kW | 260 kW |

Vazões da bomba de circulação, pressões da tampa, pressão de entrada da bomba de circulação e volume batem entre o TR e o manual. Para a próxima especificação de trocador ou de teste de aceitação:

- usar a faixa de operação de 75 a 90 °C e o alarme de 96 °C do manual de bordo;
- exigir pressão de projeto de 2,5 bar;
- na memória de cálculo, dimensionar para o maior calor rejeitado (260 kW, da ficha de vendas), por segurança.
