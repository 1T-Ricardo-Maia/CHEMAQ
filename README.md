# CHEMAQ

Site do Departamento de Máquinas, no mesmo estilo do SIGAB: plano de manutenção (estilo TM Master), consumo de combustível e geração de dispensas eletrônicas.

Abra `index.html` no navegador (ou publique pelo GitHub Pages). Não precisa instalar nada.

## Módulos

- **Painel**: manutenções vencidas e a vencer, OS abertas, horímetros e ROB.
- **Manutenção**: equipamentos com horímetro, rotinas por horas ou por calendário, ordens de serviço e histórico por equipamento. Concluir uma OS ligada a uma rotina reinicia a contagem dela.
- **Combustível**: lançamento diário por motor (litros e horas), recebimentos e sondagem, ROB calculado, gráfico de consumo e L/h por motor. As horas lançadas podem ser somadas aos horímetros.
- **Materiais**: filtros, impelidores, correias e baterias de uso comum, com histórico das dispensas de 2025 e 2026, onde cada um é usado, intervalo de troca do manual, consumo anual calculado pelas horas de uso, estoque a bordo e preço de referência. Marque os itens e as quantidades e a dispensa anual de material (vários itens) sai pronta na aba Dispensa.
- **Dispensa**: a partir do equipamento e do que foi constatado, gera o DFD em Word e os textos do ETP, do TR e do Aviso no formato dos campos do Compras.gov.br, no padrão da última dispensa da Divisão de Máquinas. Há um pedido pronto para colar no claude.ai e trazer a redação técnica de volta.
- **Configurações**: dados do navio, dados fixos da dispensa e backup.

## Onde ficam os dados

Nesta primeira versão os dados ficam no navegador (localStorage). Use **Configurações › Exportar backup** com frequência. Toda leitura e gravação passa por `js/store.js`, para facilitar a troca por um banco na nuvem depois.

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
js/painel.js, js/config.js, js/exemplo.js, js/app.js
```
