exports.up = function (knex) {
  return knex.schema.createTable('medidas_corporais', (table) => {
    table.increments('id').primary();

    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.decimal('peso', 10, 2).notNullable();

    table.decimal('imc', 10, 2).notNullable();

    table.decimal('cintura', 10, 2).notNullable();

    table.decimal('percentual_gordura', 10, 2).notNullable();

    table.timestamp('data_registro')
      .defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('medidas_corporais');
};