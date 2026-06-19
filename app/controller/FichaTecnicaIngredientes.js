import connection from '../database/Connection.js';

export default class FichaTecnicaIngredientes {

    static table = 'ficha_tecnica_itens';

    /**
     * Busca os ingredientes (receita) de uma determinada Ficha Técnica (Comida)
     * @param {number} fichaTecnicaId - ID da comida/receita
     */
    static async findByFichaTecnica(fichaTecnicaId) {
        try {
            const data = await connection(this.table)
                .leftJoin('products', 'products.id', `${this.table}.produto_id`)
                .where({ ficha_tecnica_id: fichaTecnicaId })
                .select(
                    `${this.table}.*`,
                    'products.alimentos as nome_ingrediente' // Traz o nome (ex: Peito de Frango)
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
     * Insere múltiplos ingredientes de uma vez (usando transação se necessário)
     */
    static async insertMany(fichaTecnicaId, itens, trx = null) {
        // Usa a transação passada por parâmetro ou cria uma nova conexão limpa
        const queryRunner = trx || connection;

        if (!Array.isArray(itens) || itens.length === 0) {
            return { status: true, message: 'Nenhum ingrediente para inserir.' };
        }

        const rowsToInsert = itens.map(item => ({
            ficha_tecnica_id: fichaTecnicaId,
            produto_id: item.produto_id,
            quantidade: parseFloat(item.quantidade) || 0,
            unidade: item.unidade || 'G', // Ex: 'G' para gramas, 'ML' para azeite
            preco_unitario: parseFloat(item.preco_unitario || item.precoUnitario) || 0,
            valor_total: parseFloat(item.total || item.valor_total) || 0
        }));

        await queryRunner(this.table).insert(rowsToInsert);

        return {
            status: true,
            message: 'Ingredientes adicionados com sucesso.'
        };
    }

    /**
     * Remove todos os ingredientes de uma ficha técnica específica
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