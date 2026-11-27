# CHEMAQ

Site do Departamento de Máquinas, no mesmo estilo do SIGAB: plano de manutenção (estilo TM Master), consumo de combustível e geração de dispensas eletrônicas.

Abra `index.html` no navegador (ou publique pelo GitHub Pages). Não precisa instalar nada.

## Módulos

- **Painel**: manutenções vencidas e a vencer, OS abertas, horímetros e ROB, cada pendência com a ação à mão (Executar, Abrir OS, Dispensa, Concluir, Atualizar horímetro). O nome de qualquer equipamento abre a **ficha** dele: rotinas, OS, últimos serviços, materiais, dispensas e manuais.
- **Manutenção**: equipamentos com horímetro, rotinas por horas ou por calendário, ordens de serviço e histórico por equipamento. Concluir uma OS ligada a uma rotina reinicia a contagem dela.
- **Combustível**: lançamento diário por motor (litros e horas), recebimentos e sondagem, ROB calculado, gráfico de consumo e L/h por motor. As horas lançadas podem ser somadas aos horímetros, e as "Horas de navegação" da sondagem somam nos MCP. O Planejar comissão usa o consumo por região (Belém–Marajó 8,5 L/nm, Amazonas subindo 12 L/nm, editáveis) e separa dias parado em comissão (430 L/dia) e na base.
- **Material**: filtros, impelidores, correias e baterias de uso comum, com histórico das dispensas de 2025 e 2026, onde cada um é usado, intervalo de troca do manual, consumo anual calculado pelas horas de uso, estoque a bordo e preço de referência. Marque os itens e as quantidades e a dispensa anual de material (vários itens) sai pronta na aba Dispensa.
- **Serviço**: escolha o equipamento (MCP, redutora, MCA, gerador, máquina do leme, bombas, compressor, ventiladores, separador, molinete/turcos, motor de popa) e o serviço; o escopo vem da tabela de manutenção do manual, mais as peças que costumam estar degradadas e o painel elétrico de comando e alarme. Gera o pedido de orçamento para as empresas, compara as propostas (média, mediana, menor) e cria a dispensa de serviço na aba Dispensa, com critérios de aceitação e CATSER sugerido.
- **Dispensa**: no modo rápido, o formulário mostra só o que falta preencher. A partir do equipamento e do que foi constatado, gera o DFD em Word e os textos do ETP, do TR e do Aviso no formato dos campos do Compras.gov.br, no padrão da última dispensa da Divisão de Máquinas. Há um pedido pronto para colar no claude.ai e trazer a redação técnica de volta.
- **Configurações**: dados do navio, dados fixos da dispensa e backup.

## Onde ficam os dados

Os dados ficam no navegador (localStorage). No Chrome ou Edge do computador, **Configurações › Backup automático numa pasta** grava `chemaq-backup.json` sozinho a cada mudança, mais uma cópia diária em `diarios/`; escolha a pasta do Google Drive para computador e o backup vai para o Drive. Nos outros navegadores, baixe o backup; o Painel avisa depois de 7 dias sem backup. O site também pode ser instalado no celular (manifest.webmanifest e sw.js), com o atalho "Colar sondagem". Toda leitura e gravação passa por `js/store.js`, para facilitar a troca por um banco na nuvem depois.

## Estrutura

```
index.html        páginas e janelas
css/style.css     visual (paleta do SIGAB)
js/util.js        datas, números, CSV
js/store.js       armazenamento
js/manutencao.js  plano, OS, equipamentos, histórico
js/combustivel.js lançamentos, ROB, gráfico
js/dispensa.js    textos da dispensa e pedido para a IA
js/docx.js        gerador de .docx sem bibliotecas
js/backup.js      backup automático na pasta / download
js/ficha.js       ficha do equipamento
js/painel.js, js/config.js, js/exemplo.js, js/app.js
manifest.webmanifest, sw.js, img/app/   aplicativo instalável
```
