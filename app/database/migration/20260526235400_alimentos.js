exports.up = function (knex) {
  return knex.schema.createTable('alimentos', (table) => {
    table.increments('id').primary();

    table.string('nome').notNullable();

    table.decimal('calorias', 10, 2).notNullable();

    table.decimal('carboidratos', 10, 2).notNullable();

    table.decimal('proteinas', 10, 2).notNullable();

    table.decimal('gorduras', 10, 2).notNullable();

    table.decimal('fibras', 10, 2).notNullable();

    table.decimal('sodio', 10, 2).notNullable();

    table.string('porcao').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('alimentos');
};