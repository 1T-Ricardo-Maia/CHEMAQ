/* Configurações: dados do navio, parâmetros de combustível e backup. */
'use strict';

const Config = {
  render() {
    preencherForm($('#formNavio'), DB.dados.navio);
    preencherForm($('#formCombCfg'), DB.dados.combConfig);
    preencherForm($('#formDispCfg'), DB.dados.dispCfg || {});
    Processo.renderModelos();
    $('#nomeNavio').textContent = DB.dados.navio.nome || 'Departamento de Máquinas';
    const d = DB.dados;
    $('#infoBackup').textContent = 'O backup leva tudo num arquivo só: ' + d.equipamentos.length + ' equipamentos, ' + d.rotinas.length + ' rotinas, ' +
      d.os.length + ' OS, ' + d.combustivel.length + ' lançamentos de combustível, ' + (d.dispensas || []).length + ' dispensas, ' +
      (d.pacotes || []).length + ' pacotes de serviço salvos, ' + Object.keys(d.modelosDisp || {}).length + ' modelos de atos e os ajustes da aba Material.';
    Backup.renderConfig();
  },

  ligar() {
    const grava = (form, alvo) => form.addEventListener('change', () => {
      const o = lerForm(form);
      DB.dados[alvo] = Object.assign(DB.dados[alvo] || {}, o);
      DB.salvar();
      toast('Configuração salva.');
    });
    grava($('#formNavio'), 'navio');
    grava($('#formCombCfg'), 'combConfig');
    grava($('#formDispCfg'), 'dispCfg');

    $('#btnBackup').onclick = () => Backup.baixar();
    $('#inBackup').onchange = async e => {
      const arq = e.target.files[0]; e.target.value = '';
      if (!arq) return;
      try {
        const novo = JSON.parse(await arq.text());
        if (!confirmar('Importar este backup vai SUBSTITUIR todos os dados deste navegador. Continuar?')) return;
        DB.substituir(novo);
        toast('Backup importado.');
      } catch (err) { toast('Não foi possível importar: ' + err.message, true); }
    };
    $('#btnApagar').onclick = () => {
      if (!confirmar('Apagar TODOS os dados do CHEMAQ deste navegador? Exporte um backup antes.')) return;
      DB.dados = bancoVazio();
      DB.salvar();
      toast('Dados apagados.');
    };
  }
};
