/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('tabela_nutricional', function (table) {
        table.increments('id').primary();

        table.integer('usuario_id').unsigned().notNullable();
        table.string('produto', 255).notNullable();

        table.string('porcao', 100).notNullable();
        table.integer('porcoes_embalagem').notNullable();

        table.decimal('valor_energetico', 10, 2).defaultTo(0);
        table.decimal('carboidratos', 10, 2).defaultTo(0);
        table.decimal('acucares_totais', 10, 2).defaultTo(0);
        table.decimal('acucares_adicionados', 10, 2).defaultTo(0);
        table.decimal('proteinas', 10, 2).defaultTo(0);
        table.decimal('gorduras_totais', 10, 2).defaultTo(0);
        table.decimal('gorduras_saturadas', 10, 2).defaultTo(0);
        table.decimal('gorduras_trans', 10, 2).defaultTo(0);
        table.decimal('fibra_alimentar', 10, 2).defaultTo(0);
        table.decimal('sodio', 10, 2).defaultTo(0);

        table.text('descricao').nullable();

        table.boolean('ativo').defaultTo(true);

        table.timestamps(true, true);

        table
            .foreign('usuario_id')
            .references('id')
            .inTable('users')
            .onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTableIfExists('tabela_nutricional');
};