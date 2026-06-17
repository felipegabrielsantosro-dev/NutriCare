import connection from '../database/Connection.js';

export default class TabelaNutricional {

    static table = 'tabela_nutricional';

    static #columns = [
        'id',
        'usuario_id',
        'produto',
        'porcao',
        'porcoes_embalagem',
        'valor_energetico',
        'carboidratos',
        'acucares_totais',
        'acucares_adicionados',
        'proteinas',
        'gorduras_totais',
        'gorduras_saturadas',
        'gorduras_trans',
        'fibra_alimentar',
        'sodio',
        'criado_em',
        'atualizado_em',
        null
    ];

    static #searchable = [
        'usuario_id',
        'produto',
        'porcao',
        'porcoes_embalagem',
        'valor_energetico',
        'carboidratos',
        'acucares_totais',
        'acucares_adicionados',
        'proteinas',
        'gorduras_totais',
        'gorduras_saturadas',
        'gorduras_trans',
        'fibra_alimentar',
        'sodio'
    ];

    static #tratarCamposNumericos(objeto) {
        const camposNumericos = [
            'porcao',
            'porcoes_embalagem',
            'valor_energetico',
            'carboidratos',
            'acucares_totais',
            'acucares_adicionados',
            'proteinas',
            'gorduras_totais',
            'gorduras_saturadas',
            'gorduras_trans',
            'fibra_alimentar',
            'sodio'
        ];

        for (const campo of camposNumericos) {
            if (objeto[campo] === '') {
                objeto[campo] = 0;
            }
        }

        return objeto;
    }

    static async find(data = {}) {
        const {
            term = '',
            limit = 10,
            offset = 0,
            orderType = 'asc',
            column = 0,
            draw = 1
        } = data;

        const [{ count: total }] = await connection(TabelaNutricional.table)
            .count('id as count');

        const search = term?.trim();

        function applySearch(query) {
            if (search) {
                query.where(function () {
                    for (const col of TabelaNutricional.#searchable) {
                        this.orWhereRaw(
                            `CAST("${col}" AS TEXT) ILIKE ?`,
                            [`%${search}%`]
                        );
                    }
                });
            }

            return query;
        }

        const filteredQ = connection(TabelaNutricional.table)
            .count('id as count');

        applySearch(filteredQ);

        const [{ count: filtered }] = await filteredQ;

        const orderColumn =
            TabelaNutricional.#columns[column] || 'id';

        const orderDir =
            orderType === 'desc' ? 'desc' : 'asc';

        const dataQ = connection(TabelaNutricional.table)
            .select('*');

        applySearch(dataQ);

        dataQ.orderBy(orderColumn, orderDir);
        dataQ.limit(Number(limit));
        dataQ.offset(Number(offset));

        const rows = await dataQ;

        return {
            draw: Number(draw),
            recordsTotal: Number(total),
            recordsFiltered: Number(filtered),
            data: rows
        };
    }

    static async findById(id) {
        if (!id) return null;

        const row = await connection(TabelaNutricional.table)
            .where({ id })
            .first();

        return row || null;
    }

    static async insert(data) {
        try {
            delete data.id;
            delete data.action;
            delete data.usuario;

            data = {
                produto: data.produto,
                porcao: data.porcao,
                porcoes_embalagem: data.porcoes_embalagem,
                valor_energetico: data.valor_energetico,
                carboidratos: data.carboidratos,
                acucares_totais: data.acucares_totais,
                acucares_adicionados: data.acucares_adicionados,
                proteinas: data.proteinas,
                gorduras_totais: data.gorduras_totais,
                gorduras_saturadas: data.gorduras_saturadas,
                gorduras_trans: data.gorduras_trans,
                fibra_alimentar: data.fibra_alimentar,
                sodio: data.sodio,
                descricao: data.descricao,
                ativo: true
            };

            data = TabelaNutricional.#tratarCamposNumericos(data);

            await connection(TabelaNutricional.table)
                .insert(data);

            return {
                status: true,
                msg: 'Tabela nutricional cadastrada com sucesso.'
            };
        } catch (error) {
            return {
                status: false,
                msg: error.message
            };
        }
    }

    static async update(id, data) {
        try {
            delete data.id;
            delete data.action;

            data.usuario_id = data.usuario;
            delete data.usuario;

            data = TabelaNutricional.#tratarCamposNumericos(data);

            await connection(TabelaNutricional.table)
                .where({ id })
                .update(data);

            return {
                status: true,
                msg: 'Tabela nutricional atualizada com sucesso.'
            };
        } catch (error) {
            return {
                status: false,
                msg: error.message
            };
        }
    }

    static async count() {
        const result = await connection(TabelaNutricional.table).count('id as count').first();
        return parseInt(result.count);
    }

    static async countPorMes(ano) {
        const rows = await connection(TabelaNutricional.table)
            .select(connection.raw('EXTRACT(MONTH FROM criado_em)::int as mes, COUNT(*) as total'))
            .whereRaw('EXTRACT(YEAR FROM criado_em) = ?', [ano])
            .groupByRaw('EXTRACT(MONTH FROM criado_em)')
            .orderByRaw('EXTRACT(MONTH FROM criado_em)');

        const dados = Array(12).fill(0);
        for (const row of rows) dados[row.mes - 1] = parseInt(row.total);
        return dados;
    }

    static async delete(id) {
        try {
            await connection(TabelaNutricional.table)
                .where({ id })
                .delete();

            return {
                status: true,
                msg: 'Tabela nutricional excluída com sucesso.'
            };
        } catch (error) {
            return {
                status: false,
                msg: error.message
            };
        }
    }
}