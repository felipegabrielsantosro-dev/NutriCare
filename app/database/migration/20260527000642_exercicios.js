exports.up = function (knex) {
  return knex.schema.createTable('exercicios', (table) => {
    table.increments('id').primary();

    table.string('nome').notNullable();

    table.decimal('calorias_por_hora', 10, 2).notNullable();

    table.string('categoria').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('exercicios');
};