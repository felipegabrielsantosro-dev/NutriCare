/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('products', function (table) {
        table.increments('id').primary();

        // Campos de texto do formulário
        table.string('alimentos', 255).nullable();
        table.string('refeicoes', 255).nullable();
        table.string('refeicao_itens', 255).nullable();

        // Campos financeiros e métricas (10 dígitos no total, 2 casas decimais)
        table.decimal('preco_compra', 10, 2).defaultTo(0.00);
        table.decimal('total_imposto', 10, 2).defaultTo(0.00);
        table.decimal('margem_lucro', 10, 2).defaultTo(0.00);
        table.decimal('custo_operacional', 10, 2).defaultTo(0.00);
        table.decimal('preco_venda', 10, 2).defaultTo(0.00);

        // Status e observações
        table.text('descricao').nullable();
        table.boolean('ativo').defaultTo(true);

        // Cria automaticamente as colunas 'created_at' e 'updated_at'
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('products');
};