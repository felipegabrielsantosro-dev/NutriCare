import connection from '../database/Connection.js';

export default class FichaTecnica {

    static table = 'ficha_tecnica';
    // Centralizando o nome da tabela de ingredientes corrigida da migration
    static ingredientsTable = 'ficha_tecnica_ingredientes';

    static async find(where = {}) {
        const data = await connection(this.table)
            .where(where)
            .orderBy('id', 'desc');

        return {
            status: true,
            data
        };
    }

    static async findById(id) {
        const data = await connection(this.table)
            .where({ id })
            .first();

        if (!data) {
            return {
                status: false,
                message: 'Ficha técnica não encontrada.'
            };
        }

        // CORRIGIDO: Busca na tabela nova criada pela migration
        data.itens = await connection(this.ingredientsTable)
            .leftJoin(
                'products',
                'products.id',
                `${this.ingredientsTable}.produto_id`
            )
            .where({
                ficha_tecnica_id: id
            })
            .select(
                `${this.ingredientsTable}.*`,
                'products.alimentos'
            );

        return {
            status: true,
            data
        };
    }

    static async insert(data) {
        const trx = await connection.transaction();

        try {
            const [insertedRow] = await trx(this.table)
                .insert({
                    nome_produto: data.nome_produto,
                    categoria: data.categoria,
                    rendimento: data.rendimento,
                    peso_final: data.peso_final,
                    custo_total: data.custo_total,
                    custo_unitario: data.custo_unitario,
                    observacao: data.observacao,
                    ativo: data.ativo ? 1 : 0
                })
                .returning('id');

            const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;

            if (Array.isArray(data.itens)) {
                for (const item of data.itens) {
                    // CORRIGIDO: Salva apenas as colunas reais da migration
                    await trx(this.ingredientsTable)
                        .insert({
                            ficha_tecnica_id: id,
                            produto_id: Number(item.produto_id),
                            quantidade: parseFloat(item.quantidade) || 1,
                            unidade: item.unidade || 'UN',
                            ativo: true
                        });
                }
            }

            await trx.commit();

            return {
                status: true,
                id,
                message: 'Ficha técnica cadastrada com sucesso.'
            };

        } catch (error) {
            await trx.rollback();
            console.error("Erro no Model FichaTecnica (Insert):", error);
            return {
                status: false,
                message: 'Erro interno no banco: ' + error.message
            };
        }
    }

    static async update(id, data) {
        const trx = await connection.transaction();

        try {
            await trx(this.table)
                .where({ id })
                .update({
                    nome_produto: data.nome_produto,
                    categoria: data.categoria,
                    rendimento: data.rendimento,
                    peso_final: data.peso_final,
                    custo_total: data.custo_total,
                    custo_unitario: data.custo_unitario,
                    observacao: data.observacao,
                    ativo: data.ativo ? 1 : 0
                });

            // CORRIGIDO: Limpa os registros da tabela correta
            await trx(this.ingredientsTable)
                .where({ ficha_tecnica_id: id })
                .del();

            if (Array.isArray(data.itens)) {
                for (const item of data.itens) {
                    // CORRIGIDO: Insere com as colunas limpas da nova migration
                    await trx(this.ingredientsTable)
                        .insert({
                            ficha_tecnica_id: id,
                            produto_id: Number(item.produto_id),
                            quantidade: parseFloat(item.quantidade) || 1,
                            unidade: item.unidade || 'UN',
                            ativo: true
                        });
                }
            }

            await trx.commit();

            return {
                status: true,
                message: 'Ficha técnica atualizada com sucesso.'
            };

        } catch (error) {
            await trx.rollback();
            console.error("Erro no Model FichaTecnica (Update):", error);
            return {
                status: false,
                message: 'Erro interno no banco: ' + error.message
            };
        }
    }

    static async delete(id) {
        try {
            await connection(this.table)
                .where({ id })
                .del();

            return {
                status: true,
                message: 'Ficha técnica removida com sucesso.'
            };
        } catch (error) {
            return {
                status: false,
                message: error.message
            };
        }
    }

    static async findRecipeByName(nomeProduto) {
        try {
            const prato = await connection(this.table)
                .where('nome_produto', 'like', `%${nomeProduto}%`)
                .andWhere({ ativo: 1 })
                .first();

            if (!prato) {
                return {
                    status: false,
                    message: `A receita de "${nomeProduto}" não foi encontrada.`
                };
            }

            // CORRIGIDO: Busca os ingredientes na tabela da migration
            prato.ingredientes = await connection(this.ingredientsTable)
                .leftJoin('products', 'products.id', `${this.ingredientsTable}.produto_id`)
                .where({ ficha_tecnica_id: prato.id })
                .select(
                    'products.alimentos as nome_ingrediente',
                    `${this.ingredientsTable}.quantidade`,
                    `${this.ingredientsTable}.unidade`
                );

            return {
                status: true,
                data: prato
            };

        } catch (error) {
            console.error("Erro ao buscar ingredientes da receita por nome:", error);
            return {
                status: false,
                message: 'Erro ao processar a receita: ' + error.message
            };
        }
    }
}