exports.up = function (knex) {
  return knex.schema.createTable('refeicao_itens', (table) => {
    table.increments('id').primary();

    table
      .integer('refeicao_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('refeicoes')
      .onDelete('CASCADE');

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
  return knex.schema.dropTable('refeicao_itens');
};