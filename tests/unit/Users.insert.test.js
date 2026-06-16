import { describe, it, expect, vi, beforeEach } from 'vitest';
import Users from '../../app/controller/Users.js';
import connection from '../../app/database/Connection.js';

// Transforma a conexão em um mock do Vitest
vi.mock('../../app/database/Connection.js', () => ({
    default: vi.fn(),
}));

describe('Users.insert', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ==========================================
    // TESTE 1: VALIDAÇÃO DE CAMPO VAZIO
    // ==========================================
    it('deve retornar erro quando o nome estiver vazio e não acessar o banco', async () => {
        // Monta o payload com nome contendo apenas espaços
        const payload = {
            nome: '   ',        // inválido
            email: 'teste@email.com',
            senha: '123',
            action: 'create',
        };

        // CORREÇÃO: Chamando "Users" (o nome correto do seu import)
        const result = await Users.insert(payload);

        // Verifica o retorno exato esperado pela sua classe
        expect(result).toStrictEqual({
            status: false,
            msg: 'O campo nome é obrigatório',
            id: null,
            data: [],
        });

        // Garante que o banco jamais foi acessado
        expect(connection).not.toHaveBeenCalled();
    });

    // ==========================================
    // TESTE 2: INSERÇÃO COM SUCESSO
    // ==========================================
    it('deve inserir com sucesso quando os dados forem válidos', async () => {
        // O que o banco retornaria
        const insertedRow = {
            id: 1,
            nome: 'Maria Souza',
            email: 'maria@email.com',
            sexo: 'F'
        };

        // Mocks das funções encadeadas do Knex
        const returningMock = vi.fn().mockResolvedValue([insertedRow]);
        const insertMock = vi.fn().mockReturnValue({
            returning: returningMock,
        });

        // Faz o connection('users') retornar o objeto com o .insert()
        connection.mockReturnValue({
            insert: insertMock,
        });

        // CORREÇÃO: Payload com TODOS os campos obrigatórios que a sua classe Users pede
        const payload = {
            nome: 'Maria Souza',
            email: 'maria@email.com',
            senha: '123',
            sexo: 'F',
            action: 'c',
            id: '',
        };

        // Executa o método real
        const result = await Users.insert(payload);

        // CORREÇÃO: A tabela na sua classe está configurada como 'users'
        expect(connection).toHaveBeenCalledWith('users');

        // Verifica se o sanitize limpou 'id' e 'action', mantendo o resto
        expect(insertMock).toHaveBeenCalledWith({
            nome: 'Maria Souza',
            email: 'maria@email.com',
            senha: '123',
            sexo: 'F'
        });

        expect(returningMock).toHaveBeenCalledWith('*');

        // Verifica o retorno de sucesso exato da sua classe
        expect(result).toStrictEqual({
            status: true,
            msg: 'Usuário salvo com sucesso!',
            id: 1,
            data: [insertedRow],
        });
    });
});