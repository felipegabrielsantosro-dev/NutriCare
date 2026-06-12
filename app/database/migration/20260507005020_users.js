exports.up = function (knex) {
  return knex.schema.createTable('users', function (table) {
    table.increments('id').primary();

    table.string('nome').notNullable();

    table.string('email').notNullable().unique();

    table.string('senha').notNullable();

    table.integer('idade').notNullable();

    table.string('sexo').notNullable();

    table.decimal('altura', 5, 2).notNullable();

    table.decimal('peso', 5, 2).notNullable();

    table.string('objetivo').nullable();
    
    table.timestamp('data_criacao')
      .defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('users');
};