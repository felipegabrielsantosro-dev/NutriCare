import connection from '../database/Connection.js';

export default class Product {

    static table = 'products';

    static #columns = [
        'id',
        'alimentos',
        'refeicoes',
        'preco_compra',
        'preco_venda',
        'margem_lucro',
        'ativo',
        null
    ];

    static #searchable = [
        'alimentos',
        'refeicoes',
    ];

    static async find(data = {}) {
        const {
            term = '',
            limit = 10,
            offset = 0,
            orderType = 'asc',
            column = 0,
            draw = 1
        } = data;

        const [{ count: total }] = await connection(Product.table).count('id as count');

        const search = term?.trim();

        function applySearch(query) {
            if (search) {
                query.where(function () {
                    for (const col of Product.#searchable) {
                        this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
                    }
                });
            }
            return query;
        }

        const filteredQ = connection(Product.table).count('id as count');
        applySearch(filteredQ);
        const [{ count: filtered }] = await filteredQ;

        const orderColumn = Product.#columns[column] || 'id';
        const orderDir = orderType === 'desc' ? 'desc' : 'asc';

        const dataQ = connection(Product.table).select('*');
        applySearch(dataQ);
        dataQ.orderBy(orderColumn, orderDir);
        dataQ.limit(parseInt(limit));
        dataQ.offset(parseInt(offset));

        const rows = await dataQ;

        return {
            draw: parseInt(draw),
            recordsTotal: parseInt(total),
            recordsFiltered: parseInt(filtered),
            data: rows,
        };
    }

    static async findById(id) {
        if (!id) return null;
        return await connection(Product.table).where({ id }).first() || null;
    }

    static async insert(data) {
        try {
            const [result] = await connection(Product.table).insert({
                alimentos: data.alimentos,
                refeicoes: data.refeicoes,
                preco_compra: data.preco_compra,
                preco_venda: data.preco_venda,
                margem_lucro: data.margem_lucro,
                ativo: data.ativo ?? true,
            }).returning('*');

            return { status: true, msg: 'Produto cadastrado com sucesso.', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message, data: [] };
        }
    }

    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório', data: [] };
        try {
            const [result] = await connection(Product.table).where({ id }).update({
                alimentos: data.alimentos,
                refeicoes: data.refeicoes,
                preco_compra: data.preco_compra,
                preco_venda: data.preco_venda,
                margem_lucro: data.margem_lucro,
                ativo: data.ativo,
            }).returning('*');

            if (!result) return { status: false, msg: 'Produto não encontrado', data: [] };
            return { status: true, msg: 'Produto atualizado com sucesso.', id: result.id, data: [result] };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message, data: [] };
        }
    }

    static async count() {
        const result = await connection(Product.table).count('id as count').first();
        return parseInt(result.count);
    }

    static async countPorMes(ano) {
        const rows = await connection(Product.table)
            .select(connection.raw('EXTRACT(MONTH FROM created_at)::int as mes, COUNT(*) as total'))
            .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [ano])
            .groupByRaw('EXTRACT(MONTH FROM created_at)')
            .orderByRaw('EXTRACT(MONTH FROM created_at)');

        const dados = Array(12).fill(0);
        for (const row of rows) dados[row.mes - 1] = parseInt(row.total);
        return dados;
    }

    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };
        try {
            await connection(Product.table).where({ id }).del();
            return { status: true, msg: 'Produto excluído com sucesso.' };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }
}