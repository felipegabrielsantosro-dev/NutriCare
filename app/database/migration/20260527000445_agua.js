exports.up = function (knex) {
  return knex.schema.createTable('agua', function (table) {
    table.increments('id').primary();

    table.string('nome').notNullable();
    table.decimal('litros').notNullable(); // ou integer se quiser

    table.integer('usuario_id').notNullable();
    table.integer('quantidade_ml').notNullable();

    table.date('data').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('agua');
};