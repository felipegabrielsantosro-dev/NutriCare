import connection from '../database/Connection.js';

export default class FichaTecnica {

    static table = 'ficha_tecnica';
    static ingredientsTable = 'ficha_tecnica_ingredientes';

    static async find(where = {}) {

        const fichas = await connection(this.table)
            .where(where)
            .orderBy('id', 'desc');

        for (const ficha of fichas) {

            ficha.itens = await connection(this.ingredientsTable)
                .leftJoin(
                    'materia_prima',
                    'materia_prima.id',
                    `${this.ingredientsTable}.produto_id`
                )
                .where({
                    ficha_tecnica_id: ficha.id
                })
                .select(
                    `${this.ingredientsTable}.produto_id`,
                    `${this.ingredientsTable}.quantidade`,
                    `${this.ingredientsTable}.unidade`,
                    `${this.ingredientsTable}.preco_unitario`,
                    `${this.ingredientsTable}.valor_ingrediente`,

                    'materia_prima.nome',
                    'materia_prima.preco_compra'

                );

        }

        return {
            status: true,
            data: fichas
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

        data.itens = await connection(this.ingredientsTable)
            .leftJoin(
                'materia_prima',
                'materia_prima.id',
                `${this.ingredientsTable}.produto_id`
            )
            .where({
                ficha_tecnica_id: id
            })
            .select(
                `${this.ingredientsTable}.produto_id`,
                `${this.ingredientsTable}.quantidade`,
                `${this.ingredientsTable}.unidade`,
                `${this.ingredientsTable}.preco_unitario`,
                `${this.ingredientsTable}.valor_ingrediente`,

                'materia_prima.nome',
                'materia_prima.preco_compra'
            );
        return {
            status: true,
            data
        };
    }

    static async insert(data) {
        const trx = await connection.transaction();

        try {
            // 1. Insere a Ficha Técnica principal
            const [insertedRow] = await trx(this.table)
                .insert({
                    nome_produto: data.nome_produto,
                    categoria: data.categoria,
                    rendimento: data.rendimento,
                    peso_final: data.peso_final,
                    custo_total: data.custo_total,
                    custo_unitario: data.custo_unitario,
                    observacao: data.observacao,
                    ativo: data.ativo ? true : false
                })
                .returning('id');

            const id = typeof insertedRow === 'object' ? insertedRow.id : insertedRow;

            // 2. MONTA A ARRAY COM TODOS OS INGREDIENTES PRIMEIRO
            if (Array.isArray(data.itens) && data.itens.length > 0) {
                const itensParaInserir = [];

                for (const [index, item] of data.itens.entries()) {
                    const prodId = Number(item.produto_id);

                    // Validação de segurança para cada item
                    if (!prodId || isNaN(prodId)) {
                        throw new Error(`O ingrediente na posição ${index + 1} está sem um produto_id válido.`);
                    }

                    itensParaInserir.push({
                        ficha_tecnica_id: id,

                        produto_id: prodId,

                        quantidade: parseFloat(item.quantidade) || 0,

                        unidade: item.unidade || 'UN',

                        preco_unitario: parseFloat(item.precoUnitario) || 0,

                        valor_ingrediente: parseFloat(item.total) || 0,

                        ativo: true
                    });
                }

                // 3. FAZ APENAS UMA QUERY PARA TODOS OS ITENS (Mágica do Bulk Insert)
                // Isso aceita 2, 20 ou 100 ingredientes de uma vez só sem travar
                await trx(this.ingredientsTable).insert(itensParaInserir);
            }

            // Finaliza a transação salvando tudo junto
            await trx.commit();
            return { status: true, id, message: 'Ficha técnica cadastrada com sucesso.' };

        } catch (error) {
            // Se der qualquer erro em qualquer ingrediente, desfaz tudo para não sujar o banco
            await trx.rollback();
            console.error("Erro no Model FichaTecnica (Insert):", error);

            return {
                status: false,
                message: error.message.includes('violates foreign key constraint')
                    ? 'Erro: Um ou mais produtos selecionados não existem no banco de dados.'
                    : 'Erro interno: ' + error.message
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
                    ativo: data.ativo ? true : false
                });

            // Limpa os ingredientes antigos da ficha antes de reinserir os novos atualizados
            await trx(this.ingredientsTable).where({ ficha_tecnica_id: id }).del();

            if (Array.isArray(data.itens) && data.itens.length > 0) {
                const itensParaInserir = [];

                for (const [index, item] of data.itens.entries()) {
                    const prodId = Number(item.produto_id);

                    if (!prodId || isNaN(prodId)) {
                        throw new Error(`O ingrediente na posição ${index + 1} está sem um produto_id válido.`);
                    }

                    itensParaInserir.push({
                        ficha_tecnica_id: id,

                        produto_id: prodId,

                        quantidade: parseFloat(item.quantidade) || 0,

                        unidade: item.unidade || 'UN',

                        preco_unitario: parseFloat(item.precoUnitario) || 0,

                        valor_ingrediente: parseFloat(item.total) || 0,

                        ativo: true
                    });
                }

                await trx(this.ingredientsTable).insert(itensParaInserir);
            }

            await trx.commit();
            return { status: true, message: 'Ficha técnica atualizada com sucesso.' };

        } catch (error) {
            await trx.rollback();
            console.error("Erro no Model FichaTecnica (Update):", error);
            return { status: false, message: 'Erro interno no banco: ' + error.message };
        }
    }

    static async delete(id) {
        try {
            await connection(this.table).where({ id }).del();
            return { status: true, message: 'Ficha técnica removida com sucesso.' };
        } catch (error) {
            return { status: false, message: error.message };
        }
    }

    static async findRecipeByName(nomeProduto) {
        try {

            const prato = await connection(this.table)
                .where('nome_produto', 'like', `%${nomeProduto}%`)
                .andWhere({ ativo: true })
                .first();

            if (!prato) {
                return {
                    status: false,
                    message: `A receita de "${nomeProduto}" não foi encontrada.`
                };
            }

            prato.ingredientes = await connection(this.ingredientsTable)
                .leftJoin(
                    'materia_prima',
                    'materia_prima.id',
                    `${this.ingredientsTable}.produto_id`
                )
                .where({
                    ficha_tecnica_id: prato.id
                })
                .select(
                    'materia_prima.nome as nome_ingrediente',

                    'materia_prima.preco_compra',

                    `${this.ingredientsTable}.quantidade`,

                    `${this.ingredientsTable}.unidade`,

                    `${this.ingredientsTable}.preco_unitario`,

                    `${this.ingredientsTable}.valor_ingrediente`
                );

            return {
                status: true,
                data: prato
            };

        } catch (error) {

            console.error(error);

            return {
                status: false,
                message: error.message
            };
        }
    }
    static async count() {

        const result = await connection(this.table)
            .count('id as count')
            .first();

        return Number(result.count);

    }

    static async countPorMes(ano) {

        const rows = await connection(this.table)
            .select(
                connection.raw('EXTRACT(MONTH FROM data_criacao)::int as mes'),
                connection.raw('COUNT(*) as total')
            )
            .whereRaw(
                'EXTRACT(YEAR FROM data_criacao) = ?',
                [ano]
            )
            .groupByRaw('EXTRACT(MONTH FROM data_criacao)')
            .orderByRaw('EXTRACT(MONTH FROM data_criacao)');

        const dados = Array(12).fill(0);

        rows.forEach(r => {
            dados[r.mes - 1] = Number(r.total);
        });

        return dados;
    }
}