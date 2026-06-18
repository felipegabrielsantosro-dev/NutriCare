export async function up(knex) {
    await knex.schema.createTable('products', (table) => {

        table.increments('id').primary();

        table.string('alimentos', 255);
        table.string('refeicoes', 255);
        table.string('refeicao_itens', 255);

        table.decimal('preco_compra', 10, 2).defaultTo(0);
        table.decimal('total_imposto', 10, 2).defaultTo(0);
        table.decimal('margem_lucro', 10, 2).defaultTo(0);
        table.decimal('custo_operacional', 10, 2).defaultTo(0);
        table.decimal('preco_venda', 10, 2).defaultTo(0);

        table.text('descricao');
        table.boolean('ativo').defaultTo(true);

        table.timestamps(true, true);
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('products');
}