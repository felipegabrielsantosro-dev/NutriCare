export async function up(knex) {
    await knex.schema.createTable('ficha_tecnica_ingredientes', table => {
        table.increments('id');

        table.integer('ficha_tecnica_id')
            .unsigned()
            .notNullable();

        table.integer('produto_id')
            .unsigned()
            .notNullable();

        table.decimal('quantidade', 10, 3).defaultTo(0);

        table.string('unidade', 20);

        table.boolean('ativo').defaultTo(true);

        table.timestamps(true, true);

        table.foreign('ficha_tecnica_id')
            .references('id')
            .inTable('ficha_tecnica')
            .onDelete('CASCADE');

        // ALTERADO
        table.foreign('produto_id')
            .references('id')
            .inTable('materia_prima')
            .onDelete('CASCADE');
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('ficha_tecnica_ingredientes');
}