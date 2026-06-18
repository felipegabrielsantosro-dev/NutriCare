import connection from '../database/Connection.js';

export default class MateriaPrima {

    // Tabela no banco
    static table = 'materia_prima';

    // ALINHADO COM O SEU DATATABLES FRONTEND:
    // Mapeamento exato do índice da coluna enviado pelo DataTable → nome real na tabela do banco
    static #columns = [
        'id',
        'nome',
        'categoria',
        'unidade_medida',
        'preco_compra',
        'peso_bruto',
        'peso_liquido',
        'fator_correcao',
        'custo_por_kg',
        'custo_por_litro',
        'preco_venda',
        'valor_total',
        'data_criacao',
        'data_atualizacao',
        'id' // Última coluna (botões de ação) aponta para o ID de segurança para não quebrar a ordenação
    ];

    // Colunas pesquisáveis no filtro global (adicionado categoria também)
    static #searchable = [
        'nome',
        'categoria',
        'unidade_medida'
    ];

    // INSERIR
    static async insert(data) {
        if (!data.nome || data.nome.trim() === '') {
            return { status: false, msg: 'O campo nome é obrigatório', id: null, data: [] };
        }

        try {
            const clean = MateriaPrima.#sanitize(data);

            const [result] = await connection(MateriaPrima.table)
                .insert(clean)
                .returning('*');

            return {
                status: true,
                msg: 'Matéria-Prima salva com sucesso!',
                id: result.id,
                data: [result]
            };

        } catch (err) {
            return {
                status: false,
                msg: 'Erro: ' + err.message,
                id: null,
                data: []
            };
        }
    }

    // LISTAR (DataTable com paginação e busca avançada)
    static async find(data = {}) {
        try {
            const {
                term = '',
                limit = 10,
                offset = 0,
                orderType = 'asc',
                column = 0,
                draw = 1
            } = data;

            const [{ count: total }] = await connection(MateriaPrima.table).count('id as count');

            const search = term?.trim();

            function applySearch(query) {
                if (search) {
                    query.where(function () {
                        for (const col of MateriaPrima.#searchable) {
                            this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
                        }
                    });
                }
                return query;
            }

            const filteredQ = connection(MateriaPrima.table).count('id as count');
            applySearch(filteredQ);
            const [{ count: filtered }] = await filteredQ;

            // Pega a coluna correta baseada no array mapeado
            const orderColumn = MateriaPrima.#columns[column] || 'id';
            const orderDir = orderType === 'desc' ? 'desc' : 'asc';

            const dataQ = connection(MateriaPrima.table).select('*');

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
        } catch (err) {
            console.error("Erro na busca do DataTables:", err);
            return {
                draw: 1,
                recordsTotal: 0,
                recordsFiltered: 0,
                data: [],
                error: err.message
            };
        }
    }

    // DELETE
    static async delete(id) {
        if (!id) return { status: false, msg: 'ID é obrigatório' };

        try {
            await connection(MateriaPrima.table).where({ id }).del();
            return { status: true, msg: 'Matéria-Prima excluída com sucesso!' };
        } catch (err) {
            return { status: false, msg: 'Erro: ' + err.message };
        }
    }

    // UPDATE
    static async update(id, data) {
        if (!id) return { status: false, msg: 'ID é obrigatório', data: [] };

        if (!data.nome || data.nome.trim() === '') {
            return { status: false, msg: 'O campo nome é obrigatório', data: [] };
        }

        try {
            const clean = MateriaPrima.#sanitize(data);

            delete clean.id;

            const [result] = await connection(MateriaPrima.table)
                .where({ id })
                .update(clean)
                .returning('*');

            if (!result) {
                return { status: false, msg: 'Matéria-Prima não encontrada', data: [] };
            }

            return {
                status: true,
                msg: 'Matéria-Prima atualizada com sucesso!',
                id: result.id,
                data: [result]
            };

        } catch (err) {
            return {
                status: false,
                msg: 'Erro: ' + err.message,
                data: []
            };
        }
    }

    // FIND BY ID
    static async findById(id) {
        if (!id) return null;

        const row = await connection(MateriaPrima.table)
            .where({ id })
            .first();

        return row || null;
    }

    // Métodos para o Dashboard
    static async count() {
        const result = await connection(MateriaPrima.table).count('id as count').first();
        return parseInt(result.count);
    }

    static async countPorMes(ano) {
        const rows = await connection(MateriaPrima.table)
            .select(connection.raw('EXTRACT(MONTH FROM data_criacao)::int as mes, COUNT(*) as total'))
            .whereRaw('EXTRACT(YEAR FROM data_criacao) = ?', [ano])
            .groupByRaw('EXTRACT(MONTH FROM data_criacao)')
            .orderByRaw('EXTRACT(MONTH FROM data_criacao)');

        const dados = Array(12).fill(0);
        for (const row of rows) dados[row.mes - 1] = parseInt(row.total);
        return dados;
    }

    static #sanitize(data) {
        // Adicione 'margem_lucro' e 'observacoes' (se necessário) na lista de exclusão
        const ignore = ['id', 'action', 'ativo', 'margem_lucro'];

        const clean = {};

        for (const [key, value] of Object.entries(data)) {
            if (ignore.includes(key)) continue;
            if (value === '' || value === null || value === undefined) continue;

            if (value === 'true') { clean[key] = true; continue; }
            if (value === 'false') { clean[key] = false; continue; }

            clean[key] = value;
        }

        return clean;
    }
}