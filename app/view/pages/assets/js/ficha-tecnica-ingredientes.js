static = async findRecipeByName(nomeProduto) {
    try {
        // 1. Busca o prato principal
        const prato = await connection(this.table)
            .where('nome_produto', 'like', `%${nomeProduto}%`)
            .andWhere({ ativo: 1 })
            .first();

        if (!prato) {
            return {
                status: false,
                message: `A comida "${nomeProduto}" não foi encontrada no sistema.`
            };
        }

        // 2. Busca os ingredientes associados
        const ingredientes = await connection('ficha_tecnica_itens')
            .join('products', 'products.id', '=', 'ficha_tecnica_itens.produto_id')
            .where('ficha_tecnica_itens.ficha_tecnica_id', prato.id)
            .select(
                'products.alimentos as nome_ingrediente',
                'ficha_tecnica_itens.quantidade',
                'ficha_tecnica_itens.unidade'
            );

        // Se a tabela intermediária estiver vazia para esse prato
        if (ingredientes.length === 0) {
            return {
                status: true,
                message: `O prato "${nomeProduto}" existe, mas ainda não tem nenhum ingrediente cadastrado na receita.`,
                data: { ...prato, ingredientes: [] }
            };
        }

        prato.ingredientes = ingredientes;
        return { status: true, data: prato };

    } catch (error) {
        console.error("Erro ao buscar receita:", error);
        return { status: false, message: 'Erro ao processar: ' + error.message };
    }
}