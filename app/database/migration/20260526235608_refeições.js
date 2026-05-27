
exports.up = function (knex) {
  return knex.schema.createTable('refeicoes', (table) => {
    table.increments('id').primary();

    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('tipo_refeicao').notNullable();

    table.timestamp('data_hora')
      .defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('refeicoes');
};