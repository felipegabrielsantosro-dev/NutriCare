import connection from '../database/Connection.js';

export default class FichaTecnica {

    static table = 'ficha_tecnica';

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

        data.itens = await connection('ficha_tecnica_itens')
            .leftJoin(
                'products',
                'products.id',
                'ficha_tecnica_itens.produto_id'
            )
            .where({
                ficha_tecnica_id: id
            })
            .select(
                'ficha_tecnica_itens.*',
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
                    await trx('ficha_tecnica_itens')
                        .insert({
                            ficha_tecnica_id: id,
                            produto_id: item.produto_id,
                            quantidade: parseFloat(item.quantidade) || 1,
                            unidade: item.unidade || 'UN',
                            preco_unitario: parseFloat(item.preco_unitario || item.precoUnitario) || 0,
                            valor_total: parseFloat(item.total || item.valor_total) || 0
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

            await trx('ficha_tecnica_itens')
                .where({ ficha_tecnica_id: id })
                .del();

            if (Array.isArray(data.itens)) {
                for (const item of data.itens) {
                    await trx('ficha_tecnica_itens')
                        .insert({
                            ficha_tecnica_id: id,
                            produto_id: item.produto_id,
                            quantidade: parseFloat(item.quantidade) || 1,
                            unidade: item.unidade || 'UN',
                            preco_unitario: parseFloat(item.preco_unitario || item.precoUnitario) || 0,
                            valor_total: parseFloat(item.total || item.valor_total) || 0
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

    // =========================================================================
    // NOVO MÉTODO: Busca receita completa com ingredientes limpos pelo nome
    // =========================================================================
    static async findRecipeByName(nomeProduto) {
        try {
            // 1. Busca os dados da ficha do prato (ex: Estrogonofe)
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

            // 2. Busca apenas os ingredientes e quantidades vinculadas
            prato.ingredientes = await connection('ficha_tecnica_itens')
                .leftJoin('products', 'products.id', 'ficha_tecnica_itens.produto_id')
                .where({ ficha_tecnica_id: prato.id })
                .select(
                    'products.alimentos as nome_ingrediente',
                    'ficha_tecnica_itens.quantidade',
                    'ficha_tecnica_itens.unidade'
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