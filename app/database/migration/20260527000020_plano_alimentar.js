exports.up = function (knex) {
  return knex.schema.createTable('plano_alimentar', (table) => {
    table.increments('id').primary();

    table
      .integer('dieta_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('dietas')
      .onDelete('CASCADE');

    table.string('refeicao').notNullable();

    table.time('horario').notNullable();

    table
      .integer('alimento_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('alimentos')
      .onDelete('CASCADE');

    table.decimal('quantidade', 10, 2).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('plano_alimentar');
};