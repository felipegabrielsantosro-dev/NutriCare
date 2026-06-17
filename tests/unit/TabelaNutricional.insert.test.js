import { describe, it, expect, vi, beforeEach } from 'vitest';
import TabelaNutricional from '../../app/controller/TabelaNutricional.js';
import connection from '../../app/database/Connection.js';

vi.mock('../../app/database/Connection.js', () => ({
    default: vi.fn(),
}));

describe('TabelaNutricional Model - Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // TESTES DO MÉTODO: INSERT
    // ==========================================
    describe('insert', () => {
        it('deve cadastrar uma tabela nutricional tratando strings vazias como zero', async () => {
            const insertMock = vi.fn().mockResolvedValue([1]);
            connection.mockReturnValue({ insert: insertMock });

            const payload = {
                id: 'deve-ser-deletado',
                action: 'create',
                usuario: 'deve-ser-deletado-no-insert',
                produto: 'Iogurte Natural',
                porcao: '200',
                valor_energetico: '130',
                carboidratos: '',
                proteinas: '6.8',
                sodio: ''
            };

            const result = await TabelaNutricional.insert(payload);

            expect(connection).toHaveBeenCalledWith('tabela_nutricional');

            // CORREÇÃO: Propriedades não enviadas ficam como undefined (comportamento real do seu código)
            expect(insertMock).toHaveBeenCalledWith({
                produto: 'Iogurte Natural',
                porcao: '200',
                porcoes_embalagem: undefined,
                valor_energetico: '130',
                carboidratos: 0,
                acucares_totais: undefined,
                acucares_adicionados: undefined,
                proteinas: '6.8',
                gorduras_totais: undefined,
                gorduras_saturadas: undefined,
                gorduras_trans: undefined,
                fibra_alimentar: undefined,
                sodio: 0,
                descricao: undefined,
                ativo: true
            });

            expect(result).toStrictEqual({
                status: true,
                msg: 'Tabela nutricional cadastrada com sucesso.'
            });
        });

        it('deve capturar erros de banco de dados e retornar falso no status', async () => {
            const insertMock = vi.fn().mockImplementation(() => {
                throw new Error('Erro de validação de Schema no banco');
            });
            connection.mockReturnValue({ insert: insertMock });

            const result = await TabelaNutricional.insert({ produto: 'Erro' });

            expect(result).toStrictEqual({
                status: false,
                msg: 'Erro de validação de Schema no banco'
            });
        });
    });

    // ==========================================
    // TESTES DO MÉTODO: UPDATE
    // ==========================================
    describe('update', () => {
        it('deve atualizar mapeando o campo usuario para usuario_id', async () => {
            const updateMock = vi.fn().mockResolvedValue(1);
            const whereMock = vi.fn().mockReturnValue({ update: updateMock });
            connection.mockReturnValue({ where: whereMock });

            const payload = {
                id: 'ignorado',
                action: 'edit',
                usuario: 42,
                produto: 'Whey Protein',
                carboidratos: ''
            };

            const result = await TabelaNutricional.update(10, payload);

            expect(connection).toHaveBeenCalledWith('tabela_nutricional');
            expect(whereMock).toHaveBeenCalledWith({ id: 10 });

            // CORREÇÃO: O seu código altera apenas quem foi passado no payload original
            expect(updateMock).toHaveBeenCalledWith({
                usuario_id: 42,
                produto: 'Whey Protein',
                carboidratos: 0
            });

            expect(result).toStrictEqual({
                status: true,
                msg: 'Tabela nutricional atualizada com sucesso.'
            });
        });
    });

    // ==========================================
    // TESTES DO MÉTODO: DELETE
    // ==========================================
    describe('delete', () => {
        it('deve deletar o registro utilizando o método correto do Knex', async () => {
            const deleteMock = vi.fn().mockResolvedValue(1);
            const whereMock = vi.fn().mockReturnValue({ delete: deleteMock });
            connection.mockReturnValue({ where: whereMock });

            const result = await TabelaNutricional.delete(5);

            expect(whereMock).toHaveBeenCalledWith({ id: 5 });
            expect(deleteMock).toHaveBeenCalled();
            expect(result).toStrictEqual({
                status: true,
                msg: 'Tabela nutricional excluída com sucesso.'
            });
        });
    });

    // ==========================================
    // TESTES DO MÉTODO: FIND (DataTable)
    // ==========================================
    describe('find', () => {
        it('deve responder à estrutura padrão do DataTable mapeando colunas corretamente', async () => {
            const mockRows = [{ id: 1, produto: 'Creatina', usuario_id: 2 }];

            // Mesma estrutura fluida inteligente
            const queryBuilderMock = {};
            queryBuilderMock.count = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.select = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.where = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.orderBy = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.limit = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.offset = vi.fn().mockImplementation(function () { return this; });

            // Modula os retornos síncronos dos 3 awaits do método
            queryBuilderMock.then = vi.fn()
                .mockImplementationOnce((resolve) => resolve([{ count: 100 }])) // 1º await
                .mockImplementationOnce((resolve) => resolve([{ count: 15 }]))  // 2º await
                .mockImplementationOnce((resolve) => resolve(mockRows));         // 3º await

            connection.mockReturnValue(queryBuilderMock);

            const result = await TabelaNutricional.find({
                term: 'Creatina',
                limit: '5',
                offset: '0',
                column: 2
            });

            expect(result).toStrictEqual({
                draw: 1,
                recordsTotal: 100,
                recordsFiltered: 15,
                data: mockRows
            });
            expect(queryBuilderMock.limit).toHaveBeenCalledWith(5);
            expect(queryBuilderMock.offset).toHaveBeenCalledWith(0);
            expect(queryBuilderMock.where).toHaveBeenCalled();
        });
    });
});