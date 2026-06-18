exports.up = async function (knex) {

    await knex.schema.createTable('ficha_tecnica', (table) => {
        table.increments('id');
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

    await knex.schema.createTable('ficha_tecnica_itens', (table) => {
        table.increments('id');

        table.integer('ficha_tecnica_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('ficha_tecnica')
            .onDelete('CASCADE');

        table.integer('produto_id')
            .unsigned()
            .notNullable()
            .references('id')
            .inTable('products')
            .onDelete('CASCADE');

        table.decimal('quantidade', 10, 3).defaultTo(0);
        table.string('unidade', 20);
        table.decimal('preco_unitario', 10, 2).defaultTo(0);
        table.decimal('valor_total', 10, 2).defaultTo(0);
        table.timestamp('data_criacao').defaultTo(knex.fn.now());
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('ficha_tecnica_itens');
    await knex.schema.dropTableIfExists('ficha_tecnica');
};