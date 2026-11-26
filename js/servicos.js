/* Serviços de manutenção por equipamento.
 *
 * Ao escolher um equipamento e o serviço, o CHEMAQ monta o escopo com base no
 * manual do fabricante e em duas premissas de planejamento da Divisão de
 * Máquinas (ver a skill de revisão de sistemas navais):
 *   (A) peças que costumam estar degradadas ao abrir o equipamento (válvulas,
 *       rolamentos, rebobinamento, impelidores, vedações), previstas para
 *       substituição quando o orçamento permitir;
 *   (B) o painel elétrico de comando, controle e alarme, que quase nunca
 *       aparece no manual do equipamento e só nos desenhos elétricos.
 * Daí sai o pedido de orçamento para as empresas, o quadro comparativo das
 * propostas e a dispensa pronta na aba Dispensa (mesmo gerador da aba Material).
 *
 * Fontes lidas (originais na pasta CHEMAQ/Manuais do computador da Divisão;
 * fora do repositório por direito autoral):
 *   - MTU, Manual de Operação e Manutenção, motores série 6R 199, cap. 5
 *     (Tabela de Categorias e Tabela de Períodos de Manutenção);
 *   - Vision Marine, Manual Técnico de Instrução e Manutenção da Máquina do
 *     Leme AvHoFlu (fev/2012) e desenhos VM-1xx;
 *   - Twin Disc, Marine Transmission Service Manual nº 1021304 (MGX-5114SC);
 *   - Bauer, Manual de instruções dos compressores de ar respirável PE-TE;
 *   - Memorial Descritivo 831-AvHoFlu-801-001 (dados de placa das bombas).
 * O que não veio de manual lido está marcado "conferir" na tela. */
'use strict';

/* Frentes do escopo. */
const FRENTES = {
  M: { nome: 'Rotina do manual', dica: 'Itens da tabela de manutenção do fabricante.' },
  A: { nome: 'Peças que costumam estar degradadas', dica: 'Premissa de planejamento: substituir ao abrir o equipamento, se o orçamento permitir.' },
  B: { nome: 'Painel elétrico de comando, controle e alarme', dica: 'Componentes dos desenhos elétricos; revisar, aferir e substituir os defeituosos.' },
  T: { nome: 'Testes e aceitação', dica: 'Entram como critério de aceitação no TR.' }
};

/* Códigos CATSER já usados ou mapeados no projeto. Conferir sempre no Compras.gov.br. */
const CATSER = {
  13463: 'usado na revisão de lubrificação e arrefecimento do MCP BE (Proc. 63387.000262/2026-44)',
  16306: 'manutenção e reparo de embarcação: maquinaria e equipamentos',
  2330: 'manutenção de bombas e motobombas',
  2615: 'manutenção de motores elétricos',
  5657: 'enrolamento de campo de motor elétrico (rebobinamento)',
  2402: 'manutenção de válvulas e atuadores',
  1970: 'manutenção de quadro elétrico de comando',
  2739: 'manutenção de equipamento eletrônico/eletromecânico',
  2720: 'manutenção de instrumentos elétricos'
};

/* Tarefa: [frente, texto (com artigo, para entrar na frase), material incluído (opcional), referência do manual (opcional)] */
const SERV_FAMILIAS = [
  {
    id: 'mcp', nome: 'Motor de combustão principal MTU 6R 199 TB60',
    casa: e => /^MCP/i.test(e.tag) || /6R\s?199/i.test(e.modelo),
    identificacao: 'motor diesel marítimo MTU 6R 199 TB60, de 294 kW (400 CV) a 1.850 rpm',
    funcao: 'é um dos dois únicos meios de propulsão da embarcação',
    area: 'manutenção de motores diesel marítimos', catser: ['13463', '16306'],
    referencias: 'o Manual de Operação e Manutenção dos motores MTU série 6R 199 (cap. 5, Tabelas de Manutenção), o Manual de Oficina MTU Série 199 e o desenho de instalação MTU do Brasil nº 1199112415',
    fontes: 'Manual de O&M MTU 6R 199, cap. 5 (lido); Technical Sales Documentation 6R199 rev. 09; desenho 1199112415',
    pacotes: [
      {
        id: 'lubarref', titulo: 'revisão dos sistemas de lubrificação e de arrefecimento',
        constat: ['temperatura do fluido de arrefecimento acima da faixa de operação de 75 a 90 °C, com aproximação do alarme de 97 °C',
          'vazamento de fluido de arrefecimento nas conexões, mangueiras ou no trocador de calor',
          'degradação do rotor e da tampa da bomba de água bruta',
          'incrustação e perda de eficiência do trocador de calor e do pós-arrefecedor em razão da água lodosa dos rios da região',
          'vazamento de óleo lubrificante na rede de alimentação do turbocompressor ou no resfriador de óleo',
          'pressão de óleo em regime abaixo da faixa de 3,5 a 5,0 bar'],
        consequencias: 'Esses sistemas são essenciais à lubrificação dos mancais do motor e do turbocompressor e à manutenção da temperatura de operação, e sua deficiência compromete a disponibilidade da propulsão, a segurança da navegação e a prontidão operativa do meio.',
        tarefas: [
          ['M', 'a verificação e, se necessário, a substituição da válvula termostática', 'válvula termostática e junta', 'SR06'],
          ['M', 'a limpeza do trocador de calor do motor e o teste de estanqueidade', '', 'SR12/SR13'],
          ['M', 'a substituição dos ânodos de sacrifício do trocador de calor e do pós-arrefecedor', 'ânodos de sacrifício', 'SR15/SA06'],
          ['M', 'a limpeza do filtro de água bruta', '', 'SR16'],
          ['M', 'a substituição do rotor da bomba de água bruta', 'rotor (impelidor) e junta da tampa da bomba de água bruta', 'SR18'],
          ['M', 'a verificação da estanqueidade da bomba de circulação', '', 'SR08'],
          ['M', 'a limpeza e o teste de estanqueidade do pós-arrefecedor do ar de admissão', '', 'SA04/SA05'],
          ['M', 'a drenagem, a limpeza e o reabastecimento do circuito fechado com fluido de arrefecimento novo', 'fluido de arrefecimento com inibidor de corrosão', 'troca anual'],
          ['M', 'a substituição das mangueiras e abraçadeiras do sistema de arrefecimento', 'mangueiras e abraçadeiras', 'a cada 4 anos'],
          ['M', 'a troca do óleo lubrificante e do filtro de óleo, com coleta de amostra para análise', 'óleo lubrificante e filtro de óleo', 'SL04/SL05/SL06'],
          ['A', 'a substituição da bomba de água bruta por unidade nova, com seus sobressalentes', 'bomba de água bruta completa e um jogo de rotor, tampa e junta de reserva'],
          ['A', 'a confecção, o fornecimento e a instalação de trocador de calor novo, caso o teste hidrostático reprove o existente', 'trocador de calor do motor'],
          ['A', 'a substituição do selo mecânico e dos rolamentos da bomba de circulação', 'selo mecânico e rolamentos da bomba de circulação'],
          ['A', 'a substituição da rede de óleo do turbocompressor e das juntas do resfriador de óleo, com limpeza química do resfriador', 'rede de óleo do turbocompressor, juntas e produto de limpeza'],
          ['B', 'a aferição e, se necessário, a substituição dos sensores e interruptores de temperatura do fluido de arrefecimento e de pressão do óleo', 'sensores/interruptores de temperatura e de pressão'],
          ['B', 'a aferição dos termômetros e manômetros do painel do motor', ''],
          ['T', 'o teste dos alarmes de alta temperatura (97 °C) e de baixa pressão de óleo (3,0 bar) e das paradas (100 °C e 2,0 bar)'],
          ['T', 'o teste de funcionamento a bordo de, no mínimo, 2 (duas) horas, com registro de temperaturas e pressões em marcha lenta e em carga, dentro dos valores da seção Dados Técnicos do manual']
        ],
        fora: ['o motor de combustão principal do bordo oposto', 'a retífica geral do motor', 'o reparo interno ou a substituição do turbocompressor']
      },
      {
        id: 'comb', titulo: 'revisão do sistema de combustível e de injeção',
        constat: ['dificuldade de partida', 'fumaça preta ou branca no escape', 'perda de potência, sem atingir a rotação nominal de 1.850 rpm',
          'consumo de combustível acima do previsto na curva do fabricante', 'vazamento nas conexões ou mangueiras de combustível',
          'funcionamento irregular ou batida de injeção'],
        consequencias: 'A deficiência do sistema de injeção reduz a potência disponível, eleva o consumo de combustível e a emissão de fumaça e pode causar danos aos pistões e às válvulas, comprometendo a propulsão e a prontidão operativa do meio.',
        tarefas: [
          ['M', 'a drenagem do pré-filtro separador e a substituição dos seus elementos', 'elementos do pré-filtro separador', 'SC03'],
          ['M', 'a substituição dos elementos do filtro duplo de combustível', 'elementos do filtro duplo de combustível', 'SC05'],
          ['M', 'a limpeza do pré-filtro da bomba injetora', '', 'SC06'],
          ['M', 'o teste dos bicos injetores em bancada, com verificação da pressão de abertura, da estanqueidade e da pulverização', '', 'SC12'],
          ['M', 'a regulagem do início de fornecimento (ponto) da bomba injetora', '', 'SC09'],
          ['M', 'a verificação e o ajuste das alavancas e articulações da bomba injetora', '', 'SC14/SC15'],
          ['M', 'a verificação da estanqueidade das conexões e do estado das mangueiras de combustível', '', 'SC16/SC17'],
          ['A', 'a revisão da bomba injetora em linha em laboratório especializado, com calibração em bancada e substituição dos elementos e válvulas de recalque desgastados', 'reparo da bomba injetora (elementos, válvulas de recalque e vedações)'],
          ['A', 'a substituição dos bicos injetores (ou de suas pontas) reprovados no teste', 'bicos ou pontas injetoras e arruelas de vedação'],
          ['A', 'a substituição da bomba alimentadora de combustível', 'bomba alimentadora'],
          ['A', 'a substituição das mangueiras flexíveis de combustível', 'mangueiras de combustível', 'a cada 4 anos'],
          ['B', 'o teste e, se necessário, a substituição do solenoide de parada', 'solenoide de parada'],
          ['B', 'a aferição do tacômetro e do sensor de rotação', ''],
          ['T', 'o teste de funcionamento a bordo, com verificação da rotação de marcha lenta (700 rpm) e da rotação máxima em carga, sem fumaça anormal']
        ],
        fora: ['a retífica do cabeçote', 'os tanques e a rede de combustível do navio']
      },
      {
        id: 'topo', titulo: 'revisão de topo (cabeçote e válvulas)',
        constat: ['compressão baixa em um ou mais cilindros', 'folga de válvulas fora do especificado', 'vazamento de compressão ou de fluido pela junta do cabeçote',
          'consumo de óleo lubrificante acima de 0,5% do consumo de combustível'],
        consequencias: 'A perda de compressão e de estanqueidade do cabeçote reduz a potência, eleva o consumo e pode evoluir para a contaminação do óleo pelo fluido de arrefecimento e para danos graves ao motor.',
        tarefas: [
          ['M', 'a verificação da folga de válvulas', '', 'MB01'],
          ['M', 'a medição da compressão de todos os cilindros, antes e depois do serviço', '', 'MB02'],
          ['M', 'a verificação do aperto dos elementos de fixação', '', 'MB03'],
          ['A', 'a retífica dos cabeçotes, das sedes e das guias de válvulas', 'guias e sedes de válvulas'],
          ['A', 'a substituição das válvulas de admissão e de escape e das molas reprovadas', 'válvulas de admissão e de escape e molas'],
          ['A', 'o teste hidrostático dos cabeçotes', ''],
          ['A', 'a substituição do jogo de juntas do cilindro e do cabeçote', 'jogo de juntas do cilindro e do cabeçote'],
          ['T', 'a aceitação com compressão de todos os cilindros dentro do valor da seção Dados Técnicos do manual e teste de funcionamento a bordo']
        ],
        fora: ['a retífica do bloco, do virabrequim e das camisas', 'o turbocompressor']
      },
      {
        id: 'arescape', titulo: 'revisão dos sistemas de admissão de ar e de escape e do turbocompressor',
        constat: ['ruído anormal ou folga no eixo do turbocompressor', 'vazamento de óleo pelo turbocompressor', 'depressão na admissão acima do limite de 30 mbar',
          'vazamento de gases na junta de expansão ou no coletor de escape', 'temperatura de escape elevada'],
        consequencias: 'A deficiência do turbocompressor e do escape reduz a potência e aumenta a temperatura de escape e o consumo, com risco de dano ao motor e de incêndio na praça de máquinas.',
        tarefas: [
          ['M', 'a substituição do elemento do filtro de ar', 'elemento do filtro de ar', 'SA02'],
          ['M', 'a verificação da estanqueidade das conexões do sistema de admissão de ar', '', 'SA07'],
          ['M', 'a verificação da estanqueidade das conexões do sistema de escape', '', 'ST02'],
          ['M', 'a verificação da válvula de ventilação do bloco (PCV)', '', 'SV01'],
          ['A', 'a revisão do turbocompressor, com substituição dos mancais, das vedações e balanceamento do conjunto rotativo', 'kit de reparo do turbocompressor'],
          ['A', 'a substituição da junta de expansão do escape', 'junta de expansão'],
          ['A', 'o teste de estanqueidade do coletor de escape arrefecido', ''],
          ['B', 'a aferição do sensor de pressão do turbo e do indicador de restrição do filtro de ar', ''],
          ['T', 'o teste de funcionamento a bordo, com medição da pressão de sobrealimentação e da contrapressão de escape (limite de 50 mbar)']
        ],
        fora: ['a tubulação de escape do casco além da junta de expansão']
      },
      {
        id: 'eletrico', titulo: 'revisão do sistema elétrico e de partida',
        constat: ['falha ou demora de partida', 'baixa carga do alternador', 'alarme ou instrumento do painel do motor inoperante', 'baterias sem reter carga'],
        consequencias: 'A falha do sistema de partida e de alarme impede o emprego imediato da propulsão e retira a proteção do motor contra baixa pressão de óleo e alta temperatura.',
        tarefas: [
          ['M', 'a verificação das conexões e do aterramento das baterias e do motor', '', 'SE01/SE02'],
          ['M', 'a verificação da fixação e das conexões dos cabos e conectores', '', 'SE03'],
          ['M', 'a verificação das escovas e do coletor do motor de partida e a lubrificação do pinhão', '', 'SE04/SE05'],
          ['M', 'a verificação das escovas e dos anéis coletores do alternador', '', 'SE06'],
          ['A', 'a revisão do motor de partida de 24 V e 6,0 kW, com substituição de escovas, buchas, rolamentos, pinhão e solenoide', 'kit de reparo do motor de partida'],
          ['A', 'a revisão do alternador de 24 V, com substituição de escovas, rolamentos, diodos e regulador de tensão', 'kit de reparo do alternador'],
          ['A', 'a substituição das baterias de partida (2 de 12 V e 180 Ah em série)', '2 baterias de 12 V e 180 Ah'],
          ['B', 'a revisão do painel de instrumentos local e remoto do motor: chave de partida, relés, fusíveis, lâmpadas de sinalização, alarme sonoro, tacômetro, horímetro, manômetro e termômetro', 'componentes do painel substituídos'],
          ['B', 'a revisão dos chicotes e conectores entre o motor e o painel', ''],
          ['T', 'o teste de partida, de carga do alternador e de todos os alarmes e paradas do motor']
        ],
        fora: ['o quadro elétrico principal do navio']
      },
      {
        id: 'geral', titulo: 'recondicionamento geral',
        constat: ['compressão abaixo do valor da seção Dados Técnicos', 'consumo de óleo lubrificante acima de 0,5% do consumo de combustível',
          'pressão de óleo lubrificante abaixo do especificado, indicando desgaste dos mancais', 'horas de funcionamento elevadas desde o último recondicionamento'],
        consequencias: 'Segundo o manual do fabricante, essas condições indicam a necessidade de recondicionamento geral, sem o qual há risco de avaria grave e de perda da propulsão.',
        tarefas: [
          ['M', 'a desmontagem completa do motor, com medição e registro dimensional de camisas, pistões, anéis, bronzinas, virabrequim e comando de válvulas', '', 'Manual de Oficina'],
          ['A', 'a substituição dos conjuntos de camisas, pistões e anéis', 'jogos de camisa, pistão e anéis'],
          ['A', 'a substituição das bronzinas de biela e de mancal e das buchas do comando', 'bronzinas e buchas'],
          ['A', 'a retífica do virabrequim, se necessário', ''],
          ['A', 'a revisão de topo, da bomba injetora, dos bicos, do turbocompressor e das bombas de óleo, de circulação e de água bruta', 'kits de reparo correspondentes'],
          ['A', 'a substituição de todas as juntas, retentores e mangueiras', 'jogo completo de juntas e retentores'],
          ['B', 'a substituição dos sensores e a revisão do painel de instrumentos e alarmes do motor', ''],
          ['T', 'o amaciamento e a inspeção inicial de 20 a 30 horas previstos no manual e a prova de mar a 1.850 rpm']
        ],
        fora: ['a caixa redutora', 'a linha de eixo e o hélice']
      }
    ]
  },
  {
    id: 'cr', nome: 'Caixa redutora/reversora Twin Disc MGX-5114SC',
    casa: e => /^CR-/i.test(e.tag) || /MGX/i.test(e.modelo),
    identificacao: 'caixa redutora/reversora marítima Twin Disc MGX-5114SC, redução 3,0:1, com acoplamento torsional',
    funcao: 'transmite a potência do motor de combustão principal ao eixo propulsor e realiza a inversão de marcha',
    area: 'manutenção de transmissões e caixas redutoras marítimas', catser: ['16306'],
    referencias: 'o Marine Transmission Service Manual Twin Disc nº 1021304',
    fontes: 'Twin Disc Service Manual nº 1021304 (lido: óleo e filtro a cada 1.000 h e limpeza da tela de sucção)',
    pacotes: [{
      id: 'revisao', titulo: 'revisão',
      constat: ['patinação ou demora no engate da marcha', 'pressão de embreagem abaixo do especificado', 'temperatura do óleo elevada',
        'ruído ou vibração anormal', 'vazamento de óleo pelos retentores'],
      consequencias: 'A falha da redutora impede a transmissão de potência ao eixo e a inversão de marcha, com risco à manobra e à segurança da navegação.',
      tarefas: [
        ['M', 'a troca do óleo e do elemento filtrante e a limpeza da tela de sucção', 'óleo e elemento filtrante', 'a cada 1.000 h'],
        ['M', 'a inspeção visual periódica prevista no manual, com verificação de vazamentos, fixações e respiro', '', 'Periodic Visual Inspection'],
        ['M', 'a medição da pressão de embreagem e da temperatura do óleo em operação', ''],
        ['M', 'a verificação do alinhamento entre motor, redutora e eixo e a inspeção do acoplamento torsional', ''],
        ['A', 'a substituição dos discos das embreagens primária e secundária', 'pacotes de discos de embreagem'],
        ['A', 'a substituição dos rolamentos, retentores e vedações', 'rolamentos, retentores e jogo de vedações'],
        ['A', 'a limpeza e o teste de estanqueidade do trocador de calor do óleo da redutora', ''],
        ['A', 'a substituição do elemento elástico do acoplamento torsional', 'elemento elástico do acoplamento'],
        ['B', 'a revisão da válvula de controle e dos solenoides de engate e do módulo eletrônico de controle, com seus chicotes', ''],
        ['B', 'a aferição dos sensores e instrumentos de pressão e de temperatura do óleo', ''],
        ['T', 'o teste de engate avante e a ré, com registro de pressões e temperaturas e prova de mar']
      ],
      fora: ['o motor de combustão principal', 'a linha de eixo e o hélice']
    }]
  },
  {
    id: 'mca', nome: 'Motor de combustão auxiliar MWM D229-6',
    casa: e => /^MCA/i.test(e.tag) || /D229/i.test(e.modelo),
    identificacao: 'motor diesel MWM D229-6, de 110 CV a 2.500 rpm, acionador do grupo gerador Leon Heimer de 75 kVA',
    funcao: 'aciona um dos dois grupos geradores que suprem a energia elétrica de bordo',
    area: 'manutenção de motores diesel e grupos geradores', catser: ['16306'],
    referencias: 'o manual técnico do grupo gerador Leon Heimer (motor MWM D229-6) e o Catálogo de Peças do Motor MWM',
    fontes: 'Manual técnico Leon Heimer e catálogo MWM (não lidos em detalhe: intervalos a conferir)',
    pacotes: [{
      id: 'revisao', titulo: 'revisão dos sistemas de lubrificação, arrefecimento, combustível e partida',
      constat: ['temperatura de arrefecimento elevada', 'vazamento de óleo ou de fluido de arrefecimento', 'fumaça anormal no escape', 'dificuldade de partida',
        'queda de rotação (frequência) com carga', 'ruído anormal'],
      consequencias: 'A indisponibilidade do grupo gerador reduz a redundância da geração de energia, deixando o navio dependente de uma única máquina para os serviços essenciais.',
      tarefas: [
        ['M', 'a troca do óleo lubrificante e dos filtros de óleo e de combustível', 'óleo lubrificante e filtros', 'conferir intervalo'],
        ['M', 'a limpeza do trocador de calor e do filtro de água bruta e a troca do fluido de arrefecimento', 'fluido de arrefecimento'],
        ['M', 'a regulagem da folga de válvulas', ''],
        ['M', 'o teste dos bicos injetores e a verificação do ponto da bomba injetora', ''],
        ['M', 'a substituição das correias e do rotor da bomba de água bruta', 'correias e rotor da bomba de água bruta'],
        ['A', 'a substituição da bomba d\'água e dos retentores', 'bomba d\'água e retentores'],
        ['A', 'a revisão do motor de partida e do alternador de carga', 'kits de reparo'],
        ['A', 'a substituição das mangueiras e abraçadeiras', 'mangueiras e abraçadeiras'],
        ['B', 'a revisão do painel do grupo gerador e do controlador, com aferição dos sensores de temperatura e de pressão e teste das paradas automáticas', ''],
        ['T', 'o ensaio do grupo gerador com banco de carga resistivo, em patamares de 25%, 50%, 75% e 100% da potência nominal, com registro de tensão, frequência e temperaturas']
      ],
      fora: ['o grupo gerador do outro bordo', 'a retífica geral do motor']
    }]
  },
  {
    id: 'ger', nome: 'Gerador (alternador) Leon Heimer 75 kVA',
    casa: e => /^GER/i.test(e.tag) || /gerador|alternador/i.test(e.nome) && /heimer|kva/i.test((e.fabricante || '') + (e.modelo || '')),
    identificacao: 'gerador síncrono Leon Heimer de 75 kVA, fator de potência 0,8, 220 V trifásico, 60 Hz, isolamento classe F',
    funcao: 'é uma das duas fontes de energia elétrica do navio',
    area: 'manutenção de máquinas elétricas girantes', catser: ['2615', '16306'],
    referencias: 'o manual técnico do grupo gerador Leon Heimer e o desenho 832-7-AvHoFlu-310-001 (EA do Grupo Diesel Gerador)',
    fontes: 'Memorial Descritivo 9.2; manual Leon Heimer e controlador DSE 8610 (não lidos em detalhe)',
    pacotes: [{
      id: 'revisao', titulo: 'revisão',
      constat: ['resistência de isolamento baixa', 'tensão instável ou fora do valor nominal', 'aquecimento ou ruído nos mancais', 'falha de excitação'],
      consequencias: 'A falha do gerador reduz a redundância da geração de energia e pode deixar sem alimentação os serviços essenciais de bordo.',
      tarefas: [
        ['M', 'a limpeza interna com ar seco e produto dielétrico', ''],
        ['M', 'a medição da resistência de isolamento e do índice de polarização dos enrolamentos do estator, do rotor e da excitatriz', ''],
        ['M', 'a verificação dos diodos girantes e do varistor', ''],
        ['A', 'a substituição dos rolamentos', 'rolamentos'],
        ['A', 'a secagem em estufa e a aplicação de verniz isolante, ou o rebobinamento, se o isolamento não se recuperar', 'verniz isolante / material de rebobinamento'],
        ['A', 'a substituição do regulador automático de tensão (AVR) e da ponte de diodos', 'regulador de tensão e ponte de diodos'],
        ['B', 'a revisão do painel do gerador: disjuntor, transformadores de corrente, relés de proteção, instrumentos de medição e controlador', ''],
        ['T', 'o ensaio com banco de carga resistivo, com registro de tensão, frequência, corrente e temperatura dos mancais']
      ],
      fora: ['o motor de combustão auxiliar', 'o quadro elétrico principal']
    }]
  },
  {
    id: 'leme', nome: 'Máquina do leme eletro-hidráulica (bombas Sperry, sistema Vision Marine)',
    casa: e => /^BML/i.test(e.tag) || /leme/i.test(e.nome),
    identificacao: 'Sperry Marine VMBR-100, sistema montado pela Vision Marine, do tipo eletro-hidráulico de fluxo simples, de 5,7 kN·m, pressão de trabalho de 70 bar, válvula de segurança regulada a 80 bar, unidades de força com motor elétrico de 3 HP (2,3 kW) e bomba de palhetas, tanque de 70 L, dois cilindros de dupla ação e barra de ligação (tie-bar)',
    alvo: 'a máquina do leme (unidades de força BML-1 e BML-2)',
    funcao: 'é o único meio de governo da embarcação',
    area: 'manutenção de sistemas eletro-hidráulicos de governo', catser: ['16306', '2402', '2615', '1970'],
    referencias: 'o Manual Técnico de Instrução e Manutenção da Máquina do Leme (Vision Marine, fev/2012) e os desenhos VM-113.005 (circuito hidráulico), VM-115.007 (esquema de ligação), VM-116.005 (demarrador), VM-116.006 (painel remoto) e VM-117.008 (unidade hidráulica)',
    fontes: 'Manual Vision Marine (lido: componentes, defeitos, demarrador, painéis local e remoto, planejamento e sobressalentes)',
    pacotes: [{
      id: 'revisao', titulo: 'revisão geral',
      constat: ['tempo de 35° a 35° acima de 10 segundos', 'leme movendo-se somente para um bordo', 'vazamento nos cilindros, mangueiras ou válvulas',
        'ruído anormal na bomba', 'alarme de baixa pressão, baixo nível, filtro sujo ou sobrecarga do motor', 'lâmpadas de sinalização ou indicador de ângulo inoperantes'],
      consequencias: 'A falha da máquina do leme retira o governo da embarcação, com risco imediato de colisão ou encalhe, sobretudo na navegação fluvial em canais estreitos.',
      tarefas: [
        ['M', 'a troca total do óleo hidráulico (mineral, Lubrax HR-48 E ou similar), com drenagem dos cilindros, limpeza do tanque e flushing do sistema', 'óleo hidráulico para o tanque de 70 L e o flushing', 'anual'],
        ['M', 'a limpeza do filtro de sucção e a substituição do elemento do filtro de retorno e do filtro de ar do bocal de enchimento', 'elementos filtrantes', 'anual'],
        ['M', 'a purga do ar do sistema após o reabastecimento', '', 'anual'],
        ['M', 'a lubrificação das rótulas autoalinhantes dos cilindros e da barra de ligação', 'graxa', 'semanal'],
        ['M', 'a verificação da regulagem da válvula de segurança (80 bar) e das válvulas de alívio dos cilindros (crossover)', ''],
        ['A', 'a substituição das bobinas solenoides e do conjunto de vedação da válvula direcional (CETOP 3)', 'solenoides e conjunto de vedação da válvula direcional'],
        ['A', 'a substituição da válvula de retenção dupla e das válvulas de retenção da bomba manual', 'válvulas de retenção'],
        ['A', 'a revisão das válvulas de alívio dos cilindros, com substituição do conjunto de vedação', 'conjunto de vedação das válvulas de alívio'],
        ['A', 'o rebobinamento do estator e a substituição dos rolamentos dos motores elétricos de 3 HP das unidades de força, com revisão das resistências de aquecimento', 'rolamentos e material de rebobinamento'],
        ['A', 'a substituição do cartucho de palhetas, dos rolamentos e das vedações das bombas hidráulicas', 'kit de reparo da bomba de palhetas'],
        ['A', 'a substituição do elemento elástico do acoplamento motor/bomba', 'elemento elástico do acoplamento'],
        ['A', 'a substituição dos conjuntos de vedação dos cilindros hidráulicos (gaxetas, raspadores e anéis O-ring)', 'conjuntos de vedação dos cilindros'],
        ['A', 'a substituição das mangueiras hidráulicas e a revisão da bomba manual de emergência', 'mangueiras e vedações da bomba manual'],
        ['B', 'a revisão do demarrador e do painel de alarme local: contatores, relés térmicos de sobrecarga, relés auxiliares, fusíveis e fontes de 24 VCC', 'componentes do painel substituídos'],
        ['B', 'a revisão das chaves seletoras (modo emergência/remoto/local, alimentação 220 VAC BB/BE e canal 1/2), das botoeiras de partida, parada, teste de lâmpadas e reconhecimento de alarme e da buzina', ''],
        ['B', 'a substituição das lâmpadas de sinalização queimadas do painel local e do painel remoto do passadiço, com o dimmer', 'lâmpadas de sinalização'],
        ['B', 'a aferição do pressostato de baixa pressão, do termostato de 65 °C, da chave de nível, do vacuostato do filtro de sucção, dos sensores de filtro sujo e dos limites de fim de curso', ''],
        ['B', 'a verificação do controlador eletrônico, com ajustes de zero, sensibilidade e ganho, e a aferição do transmissor de ângulo e dos indicadores de ângulo do passadiço e da máquina do leme', ''],
        ['T', 'a prova de governo nos modos timão (MP), NFU (MAD), local e emergência, com tempo de 35° de um bordo a 35° do outro de até 10 segundos com cada unidade de força'],
        ['T', 'o teste de todos os alarmes do painel local e do painel remoto e a medição da pressão de trabalho']
      ],
      fora: ['as madres, buchas e mancais do leme e as porta-lemes', 'o timão e a agulha giroscópica do passadiço']
    }]
  },
  {
    id: 'bombac', nome: 'Motobomba centrífuga',
    casa: e => /^(BIE|BAP|BAC|BAN)/i.test(e.tag) || /bomba/i.test(e.nome) && /centr|jet|BCA|RK-/i.test((e.obs || '') + (e.modelo || '')),
    identificacao: e => 'motobomba ' + [e.fabricante, e.modelo].filter(Boolean).join(' ') + (e.obs ? ', ' + primeiraFrase(e.obs) : ''),
    funcao: e => /BIE/i.test(e.tag) ? 'atende aos serviços de combate a incêndio e de esgoto do navio' :
      /BAP/i.test(e.tag) ? 'pressuriza a rede de água potável (hidróforo)' : 'atende ao sistema de controle de poluição do navio',
    area: 'manutenção de bombas e motores elétricos', catser: ['2330', '2615', '5657'],
    referencias: 'o manual do fabricante da motobomba e o Memorial Descritivo 831-AvHoFlu-801-001',
    fontes: 'Memorial Descritivo (dados de placa); manual do fabricante da bomba a anexar',
    pacotes: [{
      id: 'revisao', titulo: 'revisão geral',
      constat: ['vazão ou pressão abaixo da nominal', 'vazamento pelo selo mecânico', 'ruído ou vibração nos rolamentos', 'aquecimento do motor elétrico ou desarme do relé térmico',
        'perda de escorva'],
      consequencias: 'A indisponibilidade da bomba compromete o sistema atendido e reduz a redundância de bordo.',
      tarefas: [
        ['M', 'a desmontagem, a limpeza e a inspeção dimensional da bomba', ''],
        ['M', 'a medição da resistência de isolamento do motor elétrico', ''],
        ['A', 'a substituição do selo mecânico', 'selo mecânico'],
        ['A', 'a substituição do rotor (impelidor) e dos anéis de desgaste', 'rotor e anéis de desgaste'],
        ['A', 'a substituição dos rolamentos da bomba e do motor elétrico', 'rolamentos'],
        ['A', 'o rebobinamento do estator do motor elétrico, se a resistência de isolamento estiver abaixo do mínimo', 'material de rebobinamento'],
        ['A', 'a substituição das juntas e anéis O-ring', 'juntas e anéis O-ring'],
        ['B', 'a revisão da chave de partida: contator, relé térmico, botoeiras, fusíveis e lâmpadas de sinalização', ''],
        ['B', 'a aferição do pressostato ou da chave de nível que comanda a bomba, quando houver', ''],
        ['T', 'o teste de vazão e de pressão no ponto nominal de placa, com medição da corrente do motor']
      ],
      fora: ['as redes e válvulas do sistema atendido']
    }]
  },
  {
    id: 'bombae', nome: 'Motobomba de engrenagens',
    casa: e => /^BOC/i.test(e.tag) || /engrenage/i.test(e.obs || ''),
    identificacao: e => 'motobomba de engrenagens ' + [e.fabricante, e.modelo].filter(Boolean).join(' ') + (e.obs ? ', ' + primeiraFrase(e.obs) : ''),
    funcao: 'faz a transferência e o esgotamento de óleo combustível',
    area: 'manutenção de bombas e motores elétricos', catser: ['2330', '2615'],
    referencias: 'o manual do fabricante da motobomba e o diagrama do sistema de óleo combustível 831-AvHoFlu-261-001',
    fontes: 'Memorial Descritivo 14.1; manual do fabricante a anexar',
    pacotes: [{
      id: 'revisao', titulo: 'revisão geral',
      constat: ['vazão abaixo da nominal', 'vazamento pelo selo ou pela gaxeta', 'ruído nas engrenagens ou nos rolamentos', 'desarme do relé térmico'],
      consequencias: 'A indisponibilidade da bomba impede a transferência de combustível entre tanques e o esgotamento, afetando o abastecimento dos motores.',
      tarefas: [
        ['M', 'a desmontagem, a limpeza e a inspeção dimensional das engrenagens, buchas e corpo', ''],
        ['M', 'a medição da resistência de isolamento do motor elétrico', ''],
        ['A', 'a substituição das engrenagens e das buchas desgastadas', 'engrenagens e buchas'],
        ['A', 'a substituição do selo mecânico e das vedações', 'selo mecânico e vedações'],
        ['A', 'a revisão e a regulagem da válvula de alívio incorporada', ''],
        ['A', 'a substituição dos rolamentos do motor elétrico e o rebobinamento, se necessário', 'rolamentos'],
        ['B', 'a revisão da chave de partida: contator, relé térmico, botoeiras e sinalização', ''],
        ['T', 'o teste de vazão e de pressão no ponto nominal de placa, sem vazamentos']
      ],
      fora: ['os tanques e a rede de combustível']
    }]
  },
  {
    id: 'caa', nome: 'Compressor de ar respirável de alta pressão',
    casa: e => /^CAA/i.test(e.tag) || /PE\s?250|compressor/i.test((e.modelo || '') + e.nome),
    identificacao: 'compressor de alta pressão de ar respirável PE 250 (família Bauer PE-TE), de 200 bar, 220 V, com estação de filtragem e estações de recarga',
    funcao: 'recarrega os cilindros dos equipamentos de respiração autônoma usados no combate a incêndio',
    area: 'manutenção de compressores de ar respirável', catser: ['16306'],
    referencias: 'o Manual de instruções dos compressores de alta pressão de ar respirável PE-TE',
    fontes: 'Manual Bauer PE-TE (lido em parte: óleo mineral a cada 1.000 h ou anual); cadastro do navio diz Scubatec PE250, conferir placa',
    pacotes: [{
      id: 'revisao', titulo: 'revisão',
      constat: ['tempo de enchimento acima do normal', 'pressão final não atingida', 'vazamento de ar', 'óleo no ar ou nos drenos', 'cartucho filtrante vencido'],
      consequencias: 'Sem o compressor, os cilindros das máscaras de combate a incêndio não podem ser recarregados, o que compromete a segurança do navio e da tripulação.',
      tarefas: [
        ['M', 'a troca do óleo do compressor (óleo mineral a cada 1.000 horas de serviço ou anualmente)', 'óleo do compressor', '1.000 h ou anual'],
        ['M', 'a substituição do cartucho filtrante da estação de filtragem e do filtro de admissão', 'cartucho filtrante e elemento de admissão'],
        ['M', 'a verificação das válvulas de segurança de cada estágio, da válvula de manutenção de pressão e das válvulas de enchimento', ''],
        ['M', 'a verificação dos drenos de condensado e da tensão da correia', ''],
        ['A', 'a substituição das válvulas de admissão e de descarga de todos os estágios', 'jogo de válvulas dos estágios'],
        ['A', 'a substituição dos anéis de pistão e das vedações', 'anéis e vedações'],
        ['A', 'a substituição dos rolamentos do compressor e do motor elétrico', 'rolamentos'],
        ['B', 'a revisão do disjuntor do motor, da chave de partida, do pressostato de pressão final e do contador de horas', ''],
        ['B', 'a aferição dos manômetros', ''],
        ['T', 'a análise da qualidade do ar respirável produzido por laboratório, conforme a norma EN 12021, com laudo'],
        ['T', 'o teste de enchimento até a pressão final, com verificação do disparo das válvulas de segurança']
      ],
      fora: ['os cilindros dos equipamentos de respiração (teste hidrostático)']
    }]
  },
  {
    id: 'vent', nome: 'Ventilador/exaustor',
    casa: e => /^(VPM|EXB)/i.test(e.tag) || /ventilador|exaustor/i.test(e.nome),
    identificacao: e => [e.nome.toLowerCase(), e.fabricante, e.modelo].filter(Boolean).join(' ') + (e.obs ? ', ' + primeiraFrase(e.obs) : ''),
    funcao: 'renova o ar e retira o calor do compartimento atendido, condição necessária ao funcionamento dos motores',
    area: 'manutenção de ventiladores e motores elétricos', catser: ['2615', '5657'],
    referencias: 'o desenho 832-7-AvHoFlu-512-001 (EA dos Ventiladores) e o manual do fabricante',
    fontes: 'Memorial Descritivo 14.3/14.4',
    pacotes: [{
      id: 'revisao', titulo: 'revisão',
      constat: ['vibração ou ruído', 'vazão de ar reduzida', 'aquecimento do motor ou desarme do relé térmico'],
      consequencias: 'A ventilação deficiente eleva a temperatura do compartimento e reduz a potência e a vida útil dos motores e equipamentos instalados.',
      tarefas: [
        ['M', 'a limpeza do rotor, da carcaça e das grelhas', ''],
        ['M', 'a medição da resistência de isolamento do motor elétrico', ''],
        ['A', 'a substituição dos rolamentos do motor elétrico', 'rolamentos'],
        ['A', 'o rebobinamento do estator, se necessário', 'material de rebobinamento'],
        ['A', 'o balanceamento dinâmico do rotor', ''],
        ['B', 'a revisão da chave de partida: contator, relé térmico, botoeiras e sinalização', ''],
        ['T', 'o teste de funcionamento com medição de corrente e de vibração']
      ],
      fora: ['os dutos e abafadores']
    }]
  },
  {
    id: 'sao', nome: 'Separador de água e óleo',
    casa: e => /^SAO/i.test(e.tag) || /separador de água e óleo/i.test(e.nome),
    identificacao: 'separador de água e óleo Recovered Energy Boss 2.2T, gravitacional de placas coalescentes, de 0,5 m³/h',
    funcao: 'trata a água oleosa do porão antes do descarte, conforme a Lei nº 9.966/2000',
    area: 'manutenção de equipamentos de controle de poluição', catser: ['16306'],
    referencias: 'o manual MNT-AvHoFlu-593-001 e o desenho 832-7-AvHoFlu-593-001 (Separador de Água e Óleo)',
    fontes: 'Memorial Descritivo 14.12; manual MNT-AvHoFlu-593-001 (não lido em detalhe)',
    pacotes: [{
      id: 'revisao', titulo: 'revisão',
      constat: ['teor de óleo no efluente acima de 15 ppm', 'alarme do monitor de óleo', 'bomba sem vazão', 'placas coalescentes saturadas'],
      consequencias: 'Sem o separador, a água oleosa não pode ser descartada, e o descarte irregular sujeita a Organização às sanções da Lei nº 9.966/2000.',
      tarefas: [
        ['M', 'a limpeza do tanque separador e das placas coalescentes', ''],
        ['M', 'a limpeza dos filtros e a verificação das válvulas', ''],
        ['A', 'a substituição das placas ou elementos coalescentes saturados', 'elementos coalescentes'],
        ['A', 'a revisão da bomba de alimentação, com substituição do rotor, do selo e dos rolamentos', 'kit de reparo da bomba'],
        ['B', 'a calibração do monitor de teor de óleo (15 ppm) e o teste do alarme e da válvula de recirculação', ''],
        ['B', 'a revisão do painel de controle: contatores, relés, sensores de nível e sinalização', ''],
        ['T', 'o teste de funcionamento com efluente abaixo de 15 ppm, com registro']
      ],
      fora: ['o tanque de borra e a rede de esgoto de porão']
    }]
  },
  {
    id: 'conves', nome: 'Molinete ou turco',
    casa: e => /^(MOL|TUR)/i.test(e.tag) || /molinete|turco/i.test(e.nome),
    identificacao: e => [e.nome.toLowerCase(), e.fabricante, e.modelo].filter(Boolean).join(' ') + (e.obs ? ', ' + primeiraFrase(e.obs) : ''),
    funcao: e => /MOL/i.test(e.tag) ? 'realiza o fundeio e o suspender da embarcação' : 'arria e iça a embarcação orgânica e cargas',
    area: 'manutenção de equipamentos de convés', catser: ['16306', '2615'],
    referencias: 'o manual do fabricante e o desenho 831-AvHoFlu-582-001 (Arranjo do Sistema de Amarração e Reboque)',
    fontes: 'Memorial Descritivo 10.1/12.1',
    pacotes: [{
      id: 'revisao', titulo: 'revisão eletromecânica',
      constat: ['ruído no redutor', 'freio patinando', 'vazamento de óleo no redutor', 'motor elétrico aquecendo ou desarmando', 'cabo de aço com fios rompidos ou corrosão'],
      consequencias: 'A falha do equipamento impede o fundeio, o suspender ou o emprego da embarcação orgânica, com reflexo na segurança e no cumprimento das comissões.',
      tarefas: [
        ['M', 'a troca do óleo do redutor e a lubrificação dos mancais e engrenagens abertas', 'óleo e graxa'],
        ['M', 'a medição da resistência de isolamento do motor elétrico', ''],
        ['A', 'a substituição dos rolamentos, retentores e vedações do redutor e do motor', 'rolamentos e retentores'],
        ['A', 'a substituição das lonas ou pastilhas do freio e a regulagem do freio', 'lonas/pastilhas do freio'],
        ['A', 'o rebobinamento do motor elétrico, se necessário', ''],
        ['A', 'a substituição do cabo de aço, se reprovado na inspeção', 'cabo de aço'],
        ['B', 'a revisão do painel de comando: contatores reversores, relé térmico, botoeiras, chaves de fim de curso e sinalização', ''],
        ['T', 'o teste de carga e de funcionamento, com verificação do freio']
      ],
      fora: ['a estrutura de fixação no convés']
    }]
  },
  {
    id: 'popa', nome: 'Motor de popa',
    casa: e => /^MP-/i.test(e.tag) || /motor de popa/i.test(e.nome),
    identificacao: e => 'motor de popa ' + [e.fabricante, e.modelo].filter(Boolean).join(' ') + ', de partida elétrica',
    funcao: 'propulsiona o bote de serviço, empregado nas fainas hidrográficas e de apoio',
    area: 'manutenção de motores de popa', catser: ['16306'],
    referencias: 'o manual do fabricante do motor de popa',
    fontes: 'Memorial Descritivo 13.5; fabricante a confirmar',
    pacotes: [{
      id: 'revisao', titulo: 'revisão geral',
      constat: ['falha de partida', 'perda de potência', 'jato de água de arrefecimento fraco', 'vazamento de óleo na rabeta'],
      consequencias: 'A indisponibilidade do bote de serviço impede as fainas hidrográficas e o apoio ao navio.',
      tarefas: [
        ['M', 'a substituição do rotor da bomba d\'água', 'rotor da bomba d\'água'],
        ['M', 'a troca do óleo da rabeta e do óleo do motor, quando houver', 'óleos'],
        ['M', 'a substituição das velas e dos filtros de combustível', 'velas e filtros'],
        ['M', 'a substituição dos ânodos de sacrifício', 'ânodos'],
        ['A', 'a revisão do carburador ou do sistema de injeção', 'kit de reparo'],
        ['A', 'a revisão do motor de partida e do sistema de carga', ''],
        ['A', 'a substituição dos retentores da rabeta e a inspeção das engrenagens', 'retentores'],
        ['B', 'a revisão do comando, do chicote, da chave de partida e do corta-corrente', ''],
        ['T', 'o teste de funcionamento na água, com verificação da rotação máxima e do jato de arrefecimento']
      ],
      fora: ['o casco do bote']
    }]
  }
];

/* Família genérica, para qualquer equipamento fora da lista. */
const SERV_GENERICO = {
  id: 'gen', nome: 'Equipamento sem modelo de serviço',
  identificacao: e => [e.fabricante, e.modelo].filter(Boolean).join(' ') || '',
  funcao: '', area: 'manutenção de equipamentos navais', catser: ['16306'],
  referencias: 'o manual do fabricante', fontes: 'sem manual cadastrado: descreva o escopo nos campos livres',
  pacotes: [{ id: 'revisao', titulo: 'revisão', constat: [], consequencias: '', tarefas: [
    ['M', 'a inspeção e a manutenção preventiva previstas no manual do fabricante', ''],
    ['A', 'a substituição dos rolamentos, vedações e componentes de desgaste', ''],
    ['B', 'a revisão do painel elétrico de comando e alarme', ''],
    ['T', 'o teste de funcionamento']], fora: [] }]
};

function primeiraFrase(s) { const f = String(s || '').split(/\.\s/)[0].replace(/\.$/, ''); return f.charAt(0).toLowerCase() + f.slice(1); }
function familiaDe(e) { return (e && SERV_FAMILIAS.find(f => f.casa(e))) || SERV_GENERICO; }
const valorDe = (v, e) => typeof v === 'function' ? v(e) : v;

/* ---------- estado (rascunho por equipamento e serviço) ---------- */
function servCfg() {
  const d = DB.dados;
  d.servicos = Object.assign({ equipId: '', pacote: '', rasc: {} }, d.servicos || {});
  return d.servicos;
}
function rascunho(equipId, pacId) {
  const c = servCfg(), k = equipId + '|' + pacId;
  return c.rasc[k] || (c.rasc[k] = { fora: {}, constat: {}, outras: '', extras: '', orcs: [], criterio: 'media' });
}

function estatOrc(orcs) {
  const v = orcs.map(o => num(String(o.valor || '').replace(/\./g, ''))).filter(x => x != null && x > 0).sort((a, b) => a - b);
  if (!v.length) return null;
  const media = v.reduce((s, x) => s + x, 0) / v.length;
  const mediana = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  const dp = Math.sqrt(v.reduce((s, x) => s + (x - media) ** 2, 0) / (v.length > 1 ? v.length - 1 : 1));
  return { n: v.length, media, mediana, menor: v[0], cv: v.length > 1 ? dp / media : 0 };
}

const Servicos = {
  atual() {
    const c = servCfg(), e = DB.equip(c.equipId);
    if (!e) return null;
    const fam = familiaDe(e);
    const pac = fam.pacotes.find(p => p.id === c.pacote) || fam.pacotes[0];
    return { e, fam, pac, r: rascunho(e.id, pac.id) };
  },

  /* Monta os textos do escopo a partir das tarefas marcadas. */
  escopo(A) {
    const { e, fam, pac, r } = A;
    const tarefas = pac.tarefas.map((t, i) => ({ i, frente: t[0], txt: t[1], mat: t[2] || '', ref: t[3] || '', ok: !r.fora[i] }));
    const sel = tarefas.filter(t => t.ok);
    const extras = linhasDe(r.extras);
    const servicos = sel.filter(t => t.frente !== 'T').map(t => t.txt + (t.ref && /^[A-Z]{2}\d/.test(t.ref) ? ' (' + t.ref + ')' : '')).concat(extras);
    const materiais = [...new Set(sel.map(t => t.mat).filter(Boolean))];
    const aceitacao = sel.filter(t => t.frente === 'T').map(t => t.txt);
    const constat = pac.constat.filter((_, i) => r.constat[i]).concat(linhasDe(r.outras));
    const temA = sel.some(t => t.frente === 'A'), temB = sel.some(t => t.frente === 'B');
    const premissa = (temA || temB) ? 'O escopo prevê ' + enumerar([].concat(
      temA ? ['a substituição preventiva dos componentes que, pela experiência de manutenção da Marinha do Brasil, costumam estar degradados ao abrir o equipamento'] : [],
      temB ? ['a revisão e a aferição do painel elétrico de comando, controle e alarme, cujos componentes não constam do plano de manutenção do fabricante, mas apenas dos desenhos elétricos'] : [])) +
      ', o que evita nova intervenção a curto prazo e preserva a prontidão operativa da Organização Militar.' : '';
    return {
      tarefas, servicos, materiais, aceitacao, constat, premissa, extras,
      identificacao: valorDe(fam.identificacao, e), funcao: valorDe(fam.funcao, e)
    };
  },

  pedidoOrcamento() {
    const A = this.atual(); if (!A) return '';
    const S = this.escopo(A), C = DB.dados.dispCfg || {};
    const alvo = A.fam.alvo || Dispensa.dadosEquip(A.e.id).alvo;
    const linhas = [
      'SOLICITAÇÃO DE ORÇAMENTO',
      '',
      (C.om || '[Organização Militar]') + (C.uasg ? ' (UASG ' + C.uasg + ')' : '') + ' — ' + (C.setor || 'Divisão de Máquinas'),
      '',
      'Objeto: ' + maiusc1(A.pac.titulo) + ' ' + contr(alvo) + (S.identificacao ? ', ' + S.identificacao : '') + '.',
      'Local de execução: ' + (C.local || 'a bordo do navio') + '.',
      '',
      'Solicitamos proposta de preço para o serviço abaixo, com fornecimento de todas as peças e materiais, novos, de primeiro uso, originais ou tecnicamente equivalentes.',
      '',
      'ESCOPO'
    ].concat(S.servicos.map((s, i) => (i + 1) + '. ' + maiusc1(s) + '.'));
    if (S.materiais.length) linhas.push('', 'PEÇAS E MATERIAIS INCLUÍDOS', ...S.materiais.map(m => '- ' + maiusc1(m)));
    if (S.aceitacao.length) linhas.push('', 'TESTES E ACEITAÇÃO', ...S.aceitacao.map(m => '- ' + maiusc1(m)));
    if (A.pac.fora.length) linhas.push('', 'NÃO FAZEM PARTE DO ESCOPO', ...A.pac.fora.map(m => '- ' + maiusc1(m)));
    linhas.push('', 'A PROPOSTA DEVE INFORMAR',
      '- valor de cada item do escopo, separando mão de obra e peças (com a quantidade e o preço unitário de cada peça);',
      '- valor global;',
      '- prazo de execução em dias corridos;',
      '- garantia dos serviços e das peças;',
      '- validade da proposta (mínimo de 60 dias);',
      '- razão social, CNPJ, endereço, telefone e nome do responsável, com data e assinatura.',
      '', 'É facultada a vistoria prévia a bordo, mediante agendamento com a ' + (C.setor || 'Divisão de Máquinas') + '.',
      '', 'Referência técnica: ' + A.fam.referencias + '.');
    return linhas.join('\n');
  },

  render() {
    const sec = $('#tab-servicos'); if (!sec) return;
    const c = servCfg();
    opcoesEquip($('#sEquip'), '— escolha o equipamento —');
    $('#sEquip').value = c.equipId && DB.equip(c.equipId) ? c.equipId : '';
    const A = this.atual();
    $('#servCorpo').classList.toggle('hidden', !A);
    $('#servVazio').classList.toggle('hidden', !!A);
    $('#servVazio').innerHTML = DB.dados.equipamentos.length ? 'Escolha um equipamento acima.' :
      'Nenhum equipamento cadastrado ainda. <button class="btn ghost" data-carregar-navio>Cadastrar equipamentos do navio</button>';
    $$('[data-carregar-navio]', $('#servVazio')).forEach(b => b.onclick = () => {
      const n = carregarEquipamentosNavio(); toast(n + ' equipamentos cadastrados.');
    });
    if (!A) { $('#servFicha').innerHTML = ''; return; }
    const { e, fam, pac, r } = A, S = this.escopo(A);

    $('#servFicha').innerHTML = '<div class="ficha"><div><b>' + esc(fam.nome) + '</b><div class="sub">' + esc(S.identificacao) + '</div></div>' +
      '<div class="sub">Manuais: ' + esc(fam.fontes) + '</div>' +
      '<div class="sub">CATSER sugerido: ' + fam.catser.map(k => '<b>' + k + '</b> (' + esc(CATSER[k] || '') + ')').join('; ') +
      '. Conferir a descrição no Compras.gov.br antes de usar.</div></div>' +
      (fam.pacotes.length > 1 ? '<div class="subtabs pacotes" role="tablist">' + fam.pacotes.map(p => '<button data-pacote="' + p.id + '" aria-selected="' +
        (p.id === pac.id) + '">' + esc(maiusc1(p.titulo)) + '</button>').join('') + '</div>' : '<p><b>' + esc(maiusc1(pac.titulo)) + '</b></p>');

    $('#servConstat').innerHTML = pac.constat.map((t, i) => '<label class="check"><input type="checkbox" data-constat="' + i + '"' +
      (r.constat[i] ? ' checked' : '') + '> ' + esc(maiusc1(t)) + '</label>').join('') || '<p class="hint">Sem constatações típicas cadastradas.</p>';
    $('#sOutras').value = r.outras || '';
    $('#sExtras').value = r.extras || '';

    $('#servEscopo tbody').innerHTML = ['M', 'A', 'B', 'T'].map(fr => {
      const ts = S.tarefas.filter(t => t.frente === fr);
      if (!ts.length) return '';
      return '<tr class="grupo"><td colspan="3">' + esc(FRENTES[fr].nome) + ' <span class="sub">' + esc(FRENTES[fr].dica) + '</span></td></tr>' +
        ts.map(t => '<tr' + (t.ok ? '' : ' class="fora"') + '><td><label class="selmat"><input type="checkbox" data-tarefa="' + t.i + '"' + (t.ok ? ' checked' : '') +
          '> <span>' + esc(maiusc1(t.txt)) + '</span></label></td><td class="sub">' + esc(t.mat) + '</td><td class="sub">' + esc(t.ref) + '</td></tr>').join('');
    }).join('');
    $('#servFora').textContent = pac.fora.length ? 'Fora do escopo: ' + enumerar(pac.fora) + '.' : '';
    this.renderOrc();
  },

  renderOrc() {
    const A = this.atual(); if (!A) return;
    const r = A.r;
    $('#servOrc tbody').innerHTML = r.orcs.map((o, i) => '<tr>' +
      ['fornecedor', 'cnpj', 'data', 'mo', 'pecas', 'valor', 'prazo'].map(k => '<td><input class="mini-in' + (['fornecedor', 'cnpj'].includes(k) ? ' texto' : ' larga') +
        '" type="' + (k === 'data' ? 'date' : 'text') + '"' + (['mo', 'pecas', 'valor'].includes(k) ? ' inputmode="decimal"' : '') +
        ' data-orc="' + i + '" data-campo="' + k + '" value="' + esc(o[k] || '') + '"></td>').join('') +
      '<td class="botoes"><button class="mini del" data-tirarorc="' + i + '">Tirar</button></td></tr>').join('') ||
      '<tr><td colspan="8" class="sub">Nenhuma proposta lançada. Copie o pedido de orçamento, envie às empresas e lance aqui o que voltar.</td></tr>';
    const st = estatOrc(r.orcs);
    $('#sCriterio').value = r.criterio || 'media';
    $('#servEstat').innerHTML = st ? 'Propostas válidas: <b>' + st.n + '</b> · média R$ <b>' + moeda(st.media) + '</b> · mediana R$ <b>' + moeda(st.mediana) +
      '</b> · menor R$ <b>' + moeda(st.menor) + '</b>' + (st.n > 1 ? ' · coeficiente de variação <b>' + fmt(st.cv * 100, 1) + '%</b>' : '') +
      (st.cv > 0.25 ? '<div class="alerta">Coeficiente de variação acima de 25%: as propostas estão dispersas. Considere a mediana, ou descarte a proposta destoante com justificativa (IN SEGES/ME nº 65/2021).</div>' : '') +
      (st.n < 3 ? '<div class="alerta">Menos de três propostas. Complete a pesquisa de preços no Compras.gov.br (painel de preços e contratações similares).</div>' : '')
      : 'Sem valores ainda.';
  },

  valorEscolhido(r) {
    const st = estatOrc(r.orcs); if (!st) return null;
    return r.criterio === 'mediana' ? st.mediana : r.criterio === 'menor' ? st.menor : st.media;
  },

  criarDispensa() {
    const A = this.atual(); if (!A) return;
    const S = this.escopo(A), { e, fam, pac, r } = A;
    if (!S.servicos.length) { toast('Marque pelo menos um serviço do escopo.', true); return; }
    const base = Dispensa.dadosEquip(e.id);
    const v = this.valorEscolhido(r);
    irPara('dispensa');
    Dispensa.nova({
      equipId: e.id, tipoObjeto: 'Serviço não continuado', servicoTitulo: pac.titulo, alvo: fam.alvo || base.alvo,
      identificacao: S.identificacao, funcao: S.funcao, area: fam.area, carater: 'preventivo e corretivo',
      defeitos: S.constat.length ? enumerar(S.constat) : '', consequencias: pac.consequencias || '',
      servicos: S.servicos.join('\n'), materiais: S.materiais.join('\n'), foraEscopo: pac.fora.join('\n'),
      referencias: fam.referencias, catTipo: 'CATSER', codigo: fam.catser[0], unidade: 'SERV', qtd: '1',
      valor: v != null ? v.toFixed(2).replace('.', ',') : '', aceitacao: S.aceitacao.join('\n'), premissa: S.premissa,
      orcamentos: r.orcs.map(o => Object.assign({}, o)), criterioPreco: r.criterio || 'media', origem: 'servicos:' + fam.id + ':' + pac.id
    });
    toast('Dispensa de serviço criada. Confira o CATSER e preencha NUP, PAR e pesquisa de preços.');
  },

  ligar() {
    const sec = $('#tab-servicos'); if (!sec) return;
    $('#sEquip').addEventListener('change', ev => { const c = servCfg(); c.equipId = ev.target.value; c.pacote = ''; DB.salvar(); });
    sec.addEventListener('change', ev => {
      const t = ev.target, A = this.atual(); if (!A) return;
      if (t.dataset.tarefa != null) { A.r.fora[t.dataset.tarefa] = !t.checked; t.closest('tr').classList.toggle('fora', !t.checked); DB.salvar(true); }
      else if (t.dataset.constat != null) { A.r.constat[t.dataset.constat] = t.checked; DB.salvar(true); }
      else if (t.dataset.orc != null) { A.r.orcs[t.dataset.orc][t.dataset.campo] = t.value.trim(); DB.salvar(true); this.renderOrc(); }
      else if (t.id === 'sCriterio') { A.r.criterio = t.value; DB.salvar(true); }
    });
    sec.addEventListener('input', ev => {
      const t = ev.target, A = this.atual(); if (!A) return;
      if (t.id === 'sOutras') A.r.outras = t.value; else if (t.id === 'sExtras') A.r.extras = t.value; else return;
      DB.salvar(true);
    });
    sec.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      const A = this.atual();
      if (b.dataset.pacote) { servCfg().pacote = b.dataset.pacote; DB.salvar(); }
      else if (b.dataset.tirarorc != null && A) { A.r.orcs.splice(Number(b.dataset.tirarorc), 1); DB.salvar(true); this.renderOrc(); }
      else if (b.id === 'btnOrcAdd' && A) { A.r.orcs.push({ data: hojeIso() }); DB.salvar(true); this.renderOrc(); }
      else if (b.id === 'btnPedidoOrc') {
        const txt = this.pedidoOrcamento();
        navigator.clipboard.writeText(txt).then(() => toast('Pedido de orçamento copiado. Cole no e-mail para as empresas.'),
          () => { $('#sPedido').value = txt; $('#sPedido').classList.remove('hidden'); toast('Não foi possível copiar; o texto está na caixa abaixo.', true); });
      }
      else if (b.id === 'btnVerPedido') { const p = $('#sPedido'); p.value = this.pedidoOrcamento(); p.classList.toggle('hidden'); }
      else if (b.id === 'btnServDispensa') this.criarDispensa();
    });
  }
};
