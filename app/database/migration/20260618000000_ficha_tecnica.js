exports.up = async function (knex) {
    // Mantém apenas a tabela principal da Ficha Técnica
    await knex.schema.createTable('ficha_tecnica', (table) => {
        table.increments('id').primary();
        table.string('nome_produto', 150).notNullable();
        table.string('categoria', 100);
        table.integer('rendimento').defaultTo(0);
        table.decimal('peso_final', 10, 3).defaultTo(0);
        table.decimal('custo_total', 10, 2).defaultTo(0);
        table.decimal('custo_unitario', 10, 2).defaultTo(0);
        table.text('observacao');
        table.boolean('ativo').defaultTo(true);
        table.timestamp('data_criacao').defaultTo(knex.fn.now());
        table.timestamp('data_atualizacao').defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    // Remove apenas a tabela que este arquivo criou
    await knex.schema.dropTableIfExists('ficha_tecnica');
};