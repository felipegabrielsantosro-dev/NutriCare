exports.up = function (knex) {
  return knex.schema.createTable('historico_exercicios', (table) => {
    table.increments('id').primary();

    table
      .integer('usuario_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .integer('exercicio_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('exercicios')
      .onDelete('CASCADE');

    table.integer('duracao').notNullable(); // em minutos

    table.decimal('calorias_gastas', 10, 2).notNullable();

    table.date('data').notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('historico_exercicios');
};