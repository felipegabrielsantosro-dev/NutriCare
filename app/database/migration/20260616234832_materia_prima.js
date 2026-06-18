export async function up(knex) {
    await knex.schema.createTable('materia_prima', (table) => {
        table.increments('id');
        table.string('nome', 150).notNullable();
        table.string('categoria', 100);
        table.string('unidade_medida', 20);
        table.decimal('preco_compra', 10, 2).defaultTo(0);
        table.decimal('peso_bruto', 10, 3).defaultTo(0);
        table.decimal('peso_liquido', 10, 3).defaultTo(0);
        table.decimal('fator_correcao', 10, 3).defaultTo(0);
        table.decimal('custo_por_kg', 10, 2).defaultTo(0);
        table.decimal('custo_por_litro', 10, 2).defaultTo(0);

        // ADICIONADOS: Campos que estavam quebrando o INSERT
        table.decimal('margem_lucro', 10, 2).defaultTo(0);
        table.decimal('valor_total', 10, 2).defaultTo(0);
        table.text('observacoes'); // Usado text para observações mais longas

        table.decimal('preco_venda', 10, 2).defaultTo(0);
        table.timestamp('data_criacao').defaultTo(knex.fn.now());
        table.timestamp('data_atualizacao').defaultTo(knex.fn.now());
    });
}

export async function down(knex) {
    await knex.schema.dropTableIfExists('materia_prima');
}