import connection from '../database/Connection.js';

export default class TabelaNutricional {
    // Tabela no banco
    static table = 'tabela_nutricional';
    // Mapeamento: índice da coluna no DataTable → nome no banco
    static #columns = ['id', 'usuario_id', 'produto', 'porcao', 'porcoes_embalagem', 'valor_energetico', 'carboidratos', 'acucares_totais', 'acucares_adicionados', 'proteinas', 'gorduras_totais', 'gorduras_saturadas', 'gorduras_trans', 'fibra_alimentar', 'sodio', 'preco_compra', 'preco_venda', 'ativo', 'criado_em', 'atualizado_em', null];
    // Colunas pesquisáveis pelo termo de busca
    static #searchable = ['usuario_id', 'produto', 'porcao', 'porcoes_embalagem', 'valor_energetico', 'carboidratos', 'acucares_totais', 'acucares_adicionados', 'proteinas', 'gorduras_totais', 'gorduras_saturadas', 'gorduras_trans', 'fibra_alimentar', 'sodio', 'preco_compra', 'preco_venda'];

    // Auxiliar para limpar strings vazias de campos numéricos
    static #tratarCamposNumericos(objeto) {
        const camposNumericos = [
            'porcao', 'porcoes_embalagem', 'valor_energetico', 'carboidratos',
            'acucares_totais', 'acucares_adicionados', 'proteinas', 'gorduras_totais',
            'gorduras_saturadas', 'gorduras_trans', 'fibra_alimentar', 'sodio'
        ];

        for (const campo of camposNumericos) {
            if (objeto[campo] === "") {
                objeto[campo] = 0; // Altere para null se o seu banco aceitar valores nulos
            }
        }
        return objeto;
    }

    // Implementamos a pesquisa completa para o produto
    static async find(data = {}) {
        const { term = '', limit = 10, offset = 0, orderType = 'asc', column = 0, draw = 1 } = data;
        // Total sem filtro
        const [{ count: total }] = await connection(TabelaNutricional.table).count('id as count');
        // Monta WHERE da busca
        const search = term?.trim();
        function applySearch(query) {
            if (search) {
                query.where(function () {
                    for (const col of TabelaNutricional.#searchable) {
                        this.orWhereRaw(`CAST("${col}" AS TEXT) ILIKE ?`, [`%${search}%`]);
                    }
                });
            }
            return query;
        }
        // Total filtrado
        const filteredQ = connection(TabelaNutricional.table).count('id as count');
        applySearch(filteredQ);
        const [{ count: filtered }] = await filteredQ;
        // Dados paginados
        const orderColumn = TabelaNutricional.#columns[column] || 'id';
        const orderDir = orderType === 'desc' ? 'desc' : 'asc';
        const dataQ = connection(TabelaNutricional.table).select('*');
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

    // Retorna apenas um produto pelo seu ID
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

            // Remove strings vazias dos campos numéricos antes de salvar
            data = TabelaNutricional.#tratarCamposNumericos(data);

            await connection(TabelaNutricional.table).insert(data);

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

            // Remove strings vazias dos campos numéricos antes de atualizar
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