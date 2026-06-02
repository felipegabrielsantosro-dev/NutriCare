exports.up = function (knex) {
  return knex.schema.createTable('dietas', (table) => {
    table.increments('id').primary();

    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('nome').notNullable();

    table.decimal('calorias_totais', 10, 2).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('dietas');
};