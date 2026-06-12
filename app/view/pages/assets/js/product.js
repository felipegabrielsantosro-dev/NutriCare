const { ipcMain } = require('electron');
const knex = require('../../../../database/Connection');

// REGISTRA O HANDLER DO INSERT DE PRODUTOS
ipcMain.handle('product:insert', async (event, data) => {
    try {
        // 1. Limpa propriedades auxiliares que vieram do formulário mas não existem na tabela do banco
        delete data.action;
        if (data.id === '' || data.id === undefined) {
            delete data.id;
        }

        // 2. Tratamento de Máscaras (Opcional)
        // Se os valores de preço vierem com "R$ " ou "%", limpe-os aqui antes de salvar no banco:
        const limparNumero = (val) => {
            if (!val) return 0;
            return parseFloat(String(val).replace('R$', '').replace('%', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
        };

        const dadosParaSalvar = {
            alimentos: data.alimentos,
            refeicoes: data.refeicoes,
            refeicao_itens: data.refeicao_itens,
            preco_compra: limparNumero(data.preco_compra),
            total_imposto: limparNumero(data.total_imposto),
            margem_lucro: limparNumero(data.margem_lucro),
            custo_operacional: limparNumero(data.custo_operacional),
            preco_venda: limparNumero(data.preco_venda),
            descricao: data.descricao,
            // Converte o valor de ativo para booleano ou inteiro aceito pelo banco (0 ou 1)
            ativo: data.ativo === true || data.ativo === 'true' ? 1 : 0
        };

        // 3. Executa o insert na tabela criada pela sua migration
        await knex('produtos').insert(dadosParaSalvar);

        // 4. Notifica as janelas abertas para atualizar a listagem automaticamente
        // (Isso faz o api.product.onReload disparar e atualizar o seu DataTable!)
        if (event.sender && typeof event.sender.send === 'function') {
            event.sender.send('product:reload'); 
        }

        // Retorna a resposta de sucesso esperada pelo seu front-end
        return { status: true, msg: 'Produto cadastrado com sucesso!' };

    } catch (error) {
        console.error("🚨 Erro crítico no handle 'product:insert':", error);
        return { status: false, msg: `Erro interno no banco de dados: ${error.message}` };
    }
});