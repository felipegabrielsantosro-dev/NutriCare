import connection from '../database/Connection.js';

export default class FichaTecnicaIngredientes {

    // 1. CORRIGIDO: Agora aponta para o nome correto que você criou na Migration!
    static table = 'ficha_tecnica_ingredientes';

    /**
     * Busca os ingredientes de uma determinada Ficha Técnica
     */
    static async findByFichaTecnica(fichaTecnicaId) {
        try {
            const data = await connection(this.table)
                .leftJoin('products', 'products.id', `${this.table}.produto_id`)
                .where({ [`${this.table}.ficha_tecnica_id`]: fichaTecnicaId })
                .select(
                    `${this.table}.*`,
                    'products.alimentos as nome_ingrediente',
                    'products.preco_compra as preco_compra' // Busca o preço do produto dinamicamente para a tela calcular os custos!
                );

            return {
                status: true,
                data
            };
        } catch (error) {
            console.error("Erro ao buscar receita:", error);
            return {
                status: false,
                message: 'Erro ao buscar os ingredientes da receita: ' + error.message
            };
        }
    }

    /**
     * Insere múltiplos ingredientes de uma vez
     */
    static async insertMany(fichaTecnicaId, itens, trx = null) {
        const queryRunner = trx || connection;

        if (!Array.isArray(itens) || itens.length === 0) {
            return { status: true, message: 'Nenhum ingrediente para inserir.' };
        }

        // 2. CORRIGIDO: Mapeia APENAS as colunas que realmente existem na sua Migration!
        const rowsToInsert = itens.map(item => ({
            ficha_tecnica_id: Number(fichaTecnicaId),
            produto_id: Number(item.produto_id),
            quantidade: parseFloat(item.quantidade) || 0,
            unidade: item.unidade || 'G',
            ativo: true
        }));

        await queryRunner(this.table).insert(rowsToInsert);

        return {
            status: true,
            message: 'Ingredientes adicionados com sucesso.'
        };
    }

    /**
     * Remove todos os ingredientes de uma ficha técnica específica antes de atualizar
     */
    static async deleteByFichaTecnica(fichaTecnicaId, trx = null) {
        const queryRunner = trx || connection;

        await queryRunner(this.table)
            .where({ ficha_tecnica_id: fichaTecnicaId })
            .del();

        return {
            status: true,
            message: 'Ingredientes removidos com sucesso.'
        };
    }
}