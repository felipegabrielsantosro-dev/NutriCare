import { describe, it, expect, vi, beforeEach } from 'vitest';
import Product from '../../app/controller/Product.js'; // Ajuste o caminho se necessário
import connection from '../../app/database/Connection.js';

// Transforma a conexão do Knex em um mock do Vitest
vi.mock('../../app/database/Connection.js', () => ({
    default: vi.fn(),
}));

describe('Product Model - Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // TESTES DO MÉTODO: INSERT
    // ==========================================
    describe('insert', () => {
        it('deve inserir um produto com sucesso e aplicar o valor padrão para ativo', async () => {
            const produtoSalvo = {
                id: 10,
                alimentos: 'Arroz',
                refeicoes: 'Almoço',
                preco_compra: 5.00,
                preco_venda: 12.00,
                margem_lucro: 140.00,
                ativo: true
            };

            // Configura a cascata de mocks do Knex para o insert
            const returningMock = vi.fn().mockResolvedValue([produtoSalvo]);
            const insertMock = vi.fn().mockReturnValue({ returning: returningMock });
            connection.mockReturnValue({ insert: insertMock });

            const payload = {
                alimentos: 'Arroz',
                refeicoes: 'Almoço',
                preco_compra: 5.00,
                preco_venda: 12.00,
                margem_lucro: 140.00
                // ativo omitido de propósito para testar o operador ??
            };

            const result = await Product.insert(payload);

            expect(connection).toHaveBeenCalledWith('products');
            expect(insertMock).toHaveBeenCalledWith({
                alimentos: 'Arroz',
                refeicoes: 'Almoço',
                preco_compra: 5.00,
                preco_venda: 12.00,
                margem_lucro: 140.00,
                ativo: true // Espera true por causa do operador ?? true
            });
            expect(result).toStrictEqual({
                status: true,
                msg: 'Produto cadastrado com sucesso.',
                id: 10,
                data: [produtoSalvo]
            });
        });

        it('deve capturar falhas vindas do banco de dados no catch', async () => {
            const insertMock = vi.fn().mockImplementation(() => {
                throw new Error('Erro de chave estrangeira violada');
            });
            connection.mockReturnValue({ insert: insertMock });

            const result = await Product.insert({ alimentos: 'Quebrado' });

            expect(result).toStrictEqual({
                status: false,
                msg: 'Erro: Erro de chave estrangeira violada',
                data: []
            });
        });
    });

    // ==========================================
    // TESTES DO MÉTODO: UPDATE
    // ==========================================
    describe('update', () => {
        it('deve retornar erro se o ID não for fornecido', async () => {
            const result = await Product.update(null, { alimentos: 'Teste' });

            expect(result).toStrictEqual({
                status: false,
                msg: 'ID é obrigatório',
                data: []
            });
            expect(connection).not.toHaveBeenCalled();
        });

        it('deve atualizar o produto com sucesso se o ID existir', async () => {
            const produtoAtualizado = { id: 1, alimentos: 'Feijão', ativo: false };

            const returningMock = vi.fn().mockResolvedValue([produtoAtualizado]);
            const updateMock = vi.fn().mockReturnValue({ returning: returningMock });
            const whereMock = vi.fn().mockReturnValue({ update: updateMock });
            connection.mockReturnValue({ where: whereMock });

            const payload = { alimentos: 'Feijão', ativo: false };
            const result = await Product.update(1, payload);

            expect(connection).toHaveBeenCalledWith('products');
            expect(whereMock).toHaveBeenCalledWith({ id: 1 });
            expect(updateMock).toHaveBeenCalledWith({
                alimentos: 'Feijão',
                refeicoes: undefined,
                preco_compra: undefined,
                preco_venda: undefined,
                margem_lucro: undefined,
                ativo: false
            });
            expect(result).toStrictEqual({
                status: true,
                msg: 'Produto atualizado com sucesso.',
                id: 1,
                data: [produtoAtualizado]
            });
        });

        it('deve retornar erro se o produto não for encontrado no banco', async () => {
            // Se o update retornar um array vazio [], significa que nenhuma linha foi afetada
            const returningMock = vi.fn().mockResolvedValue([]);
            const updateMock = vi.fn().mockReturnValue({ returning: returningMock });
            const whereMock = vi.fn().mockReturnValue({ update: updateMock });
            connection.mockReturnValue({ where: whereMock });

            const result = await Product.update(999, { alimentos: 'Inexistente' });

            expect(result).toStrictEqual({
                status: false,
                msg: 'Produto não encontrado',
                data: []
            });
        });
    });

    // ==========================================
    // TESTES DO MÉTODO: DELETE
    // ==========================================
    describe('delete', () => {
        it('deve retornar erro se o ID não for enviado', async () => {
            const result = await Product.delete(undefined);
            expect(result).toStrictEqual({ status: false, msg: 'ID é obrigatório' });
        });

        it('deve deletar com sucesso caso o ID seja válido', async () => {
            const delMock = vi.fn().mockResolvedValue(1); // 1 linha deletada
            const whereMock = vi.fn().mockReturnValue({ del: delMock });
            connection.mockReturnValue({ where: whereMock });

            const result = await Product.delete(3);

            expect(whereMock).toHaveBeenCalledWith({ id: 3 });
            expect(result).toStrictEqual({ status: true, msg: 'Produto excluído com sucesso.' });
        });
    });

    // ==========================================
    // TESTES DO MÉTODO: FIND (DataTable)
    // ==========================================
    describe('find', () => {
        it('deve realizar as queries de paginação e contagem corretamente', async () => {
            const rowsMock = [{ id: 1, alimentos: 'Batata' }];

            // Criamos um mock dinâmico "fluent" (reutilizável)
            const queryBuilderMock = {};
            queryBuilderMock.count = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.select = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.where = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.orderBy = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.limit = vi.fn().mockImplementation(function () { return this; });
            queryBuilderMock.offset = vi.fn().mockImplementation(function () { return this; });

            // Fazemos o builder agir como uma Promise (then) retornando dados diferentes por chamada
            queryBuilderMock.then = vi.fn()
                .mockImplementationOnce((resolve) => resolve([{ count: 50 }]))  // 1º await (Total)
                .mockImplementationOnce((resolve) => resolve([{ count: 50 }]))  // 2º await (Filtered)
                .mockImplementationOnce((resolve) => resolve(rowsMock));        // 3º await (Linhas reais)

            connection.mockReturnValue(queryBuilderMock);

            const result = await Product.find({
                term: '',
                limit: 10,
                offset: 0,
                column: 1
            });

            expect(result).toStrictEqual({
                draw: 1,
                recordsTotal: 50,
                recordsFiltered: 50,
                data: rowsMock
            });
            expect(queryBuilderMock.orderBy).toHaveBeenCalledWith('alimentos', 'asc');
            expect(queryBuilderMock.limit).toHaveBeenCalledWith(10);
            expect(queryBuilderMock.offset).toHaveBeenCalledWith(0);
        });
    });
});