let ingredientesVinculados = [];
let indiceEdicao = null;
// file:///assets/js/ficha-tecnica-ingredientes.js
// Estado da aplicação para controle local antes de salvar no banco
const fichaId = 1; // Substitua pela lógica que pega o ID atual (ex: via URL ou dataset)

document.addEventListener('DOMContentLoaded', async () => {

    document.getElementById('ficha_id').value = fichaId;

    await carregarDadosFicha();
    await carregarSeletorProdutos();

    renderizarTabela();
    renderizarResumoFinanceiro();

    document.getElementById('btn-add')
        .addEventListener('click', adicionarIngredienteNaLista);

    document.getElementById('btn-salvar')
        .addEventListener('click', salvarFichaTecnica);
});

/**
 * 1. Busca os dados da receita (usando aquele método findRecipeByName do backend)
 */
// Altere para testar com o nome de um prato que você sabe que tem ingredientes no banco
const nomeDoPratoParaBuscar = "Nome do Seu Prato Aqui";

async function carregarDadosFicha() {
    try {
        // Codifica o nome para evitar problemas com espaços e acentos na URL
        const urlNome = encodeURIComponent(nomeDoPratoParaBuscar);

        // Chamada para a sua rota que executa o método findRecipeByName
        const response = await fetch(`/api/receitas?nome=${urlNome}`);
        const resultado = await response.json();

        if (resultado.status && resultado.data) {
            const prato = resultado.data;

            // Preenche o ID oculto com o ID real que veio do banco
            document.getElementById('ficha_id').value = prato.id;

            // Atualiza o título
            document.getElementById('titulo').innerText = `Ingredientes da Ficha Técnica: ${prato.nome_produto || prato.alimentos}`;

            // Força o mapeamento correto das colunas vindas do banco
            if (prato.ingredientes && prato.ingredientes.length > 0) {
                ingredientesVinculados = prato.ingredientes.map(ing => ({
                    produto_id: ing.produto_id,
                    nome_ingrediente: ing.nome_ingrediente,
                    quantidade: ing.quantidade,
                    unidade: ing.unidade,
                    preco_compra: ing.preco_compra || 0
                }));
            } else {
                ingredientesVinculados = [];
            }

            renderizarTabela();
        } else {
            console.warn("Aviso do backend:", resultado.message);
        }
    } catch (error) {
        console.error('Erro ao carregar dados da ficha técnica:', error);
    }
}

/**
 * 2. Carrega as matérias-primas no <select> (Lista geral de produtos/insumos)
 */
async function carregarSeletorProdutos() {
    try {

        const select = document.getElementById('ingrediente_id');

        const response = await api.materiaPrima.find({
            limit: 150,
            offset: 0
        });

        const produtos = response.data || response || [];

        select.innerHTML =
            '<option value="" selected disabled>Selecione o Ingrediente...</option>';

        produtos.forEach(prod => {
            const option = document.createElement('option');

            option.value = prod.id;
            option.textContent = prod.nome || `Insumo #${prod.id}`;

            select.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar matérias-primas:', error);

        document.getElementById('ingrediente_id').innerHTML =
            '<option value="">Erro ao carregar matérias-primas</option>';
    }
}
/**
 * 3. Adiciona o ingrediente selecionado à lista temporária (Interface)
 */
function adicionarIngredienteNaLista() {
    const select = document.getElementById('ingrediente_id');
    const inputQuantidade = document.getElementById('quantidade');
    const inputUnidade = document.getElementById('unidade');

    const produtoId = select.value;
    const nomeIngrediente = select.options[select.selectedIndex].text;
    const quantidade = parseFloat(inputQuantidade.value);
    const unidade = inputUnidade.value.trim();

    // Validações simples
    if (!produtoId || isNaN(quantidade) || quantidade <= 0 || !unidade) {
        alert('Por favor, preencha todos os campos corretamente antes de adicionar.');
        return;
    }
    const preco_compra =
        Number(
            select.options[
                select.selectedIndex
            ].dataset.preco || 0
        );

    // Adiciona ao array de controle
    const ingrediente = {
        produto_id: produtoId,
        nome_ingrediente: nomeIngrediente,
        quantidade,
        unidade,
        preco_compra
    };

    if (indiceEdicao !== null) {

        ingredientesVinculados[indiceEdicao] = ingrediente;

        indiceEdicao = null;

    } else {

        const jaExiste = ingredientesVinculados.some(
            item => item.produto_id == produtoId
        );

        if (jaExiste) {
            alert('Este ingrediente já foi adicionado à lista.');
            return;
        }

        ingredientesVinculados.push(ingrediente);
    }


    // Limpa os campos de input para a próxima digitação
    select.value = '';
    inputQuantidade.value = '';
    inputUnidade.value = '';
    renderizarTabela();
    renderizarResumoFinanceiro();
}

/**
 * 4. Renderiza as linhas do <tbody> com base no array local
 */
function renderizarTabela() {
    const tbody = document.getElementById('tbody-ingredientes');
    tbody.innerHTML = '';

    // Se o array estiver vazio, mostra a mensagem de aviso
    if (!ingredientesVinculados || ingredientesVinculados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum ingrediente adicionado ainda.</td></tr>`;
        return;
    }

    // Varre as matérias-primas e monta as linhas da tabela
    ingredientesVinculados.forEach((item, index) => {
        const tr = document.createElement('tr');

        // IMPORTANTE: O "item.nome" e "item.unidade" devem bater com o .select() do Knex
        const nomeMateriaPrima = item.nome || item.nome_ingrediente || 'Sem nome';
        const unidadeMedida = item.unidade || item.unidade_medida || 'un';
        const quantidade = item.quantidade || 0;

        tr.innerHTML = `
            <td><strong>${nomeMateriaPrima}</strong></td>
            <td>${quantidade}</td>
            <td><span class="badge bg-secondary">${unidadeMedida}</span></td>
            <td>

    <button
        type="button"
        class="btn btn-warning btn-sm"
        onclick="editarIngrediente(${index})">

        <i class="fa-solid fa-pen"></i>

    </button>

    <button
        type="button"
        class="btn btn-danger btn-sm"
        onclick="removerIngrediente(${index})">

        <i class="fa-solid fa-trash"></i>

    </button>

</td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 5. Remove um item da lista antes de salvar
 * Escopado na janela (window) para o 'onclick' inline do botão funcionar
 */
window.removerIngrediente = function (index) {

    ingredientesVinculados.splice(index, 1);

    renderizarTabela();

    renderizarResumoFinanceiro();
};


renderizarResumoFinanceiro();

/**
 * 6. Envia o array completo de ingredientes para o backend persistir no banco
 */
async function salvarFichaTecnica() {
    if (ingredientesVinculados.length === 0) {
        alert('Adicione pelo menos um ingrediente antes de salvar a ficha técnica.');
        return;
    }

    try {
        const payload = {
            ficha_tecnica_id: document.getElementById('ficha_id').value,
            ingredientes: ingredientesVinculados
        };

        const response = await fetch('/api/ficha-tecnica/salvar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (resultado.status) {
            alert('Ficha técnica salva com sucesso!');
        } else {
            alert('Erro ao salvar: ' + resultado.message);
        }
    } catch (error) {
        console.error('Erro ao enviar dados para o servidor:', error);
        alert('Erro de comunicação com o servidor.');
    }
}

window.editarIngrediente = function (index) {

    const item = ingredientesVinculados[index];

    const select =
        document.getElementById('ingrediente_id');

    // força encontrar a opção correta
    Array.from(select.options).forEach(option => {

        option.selected =
            String(option.value) ===
            String(item.produto_id);

    });

    document.getElementById('quantidade').value =
        item.quantidade || '';

    document.getElementById('unidade').value =
        item.unidade || '';

    indiceEdicao = index;

    console.log(
        'Editando ingrediente:',
        item
    );
};

function renderizarResumoFinanceiro() {

    const tbody =
        document.getElementById(
            'tbody-resumo'
        );

    let html = '';

    let custoIngredientes = 0;

    ingredientesVinculados.forEach(item => {

        const precoKg =
            Number(item.preco_compra || 0);

        const quantidadeKg =
            Number(item.quantidade || 0) / 1000;

        const custo =
            quantidadeKg * precoKg;

        custoIngredientes += custo;

        html += `
            <tr>
                <td>
                    ${item.nome_ingrediente}
                    ${item.quantidade}${item.unidade}
                </td>

                <td>
                    R$ ${custo.toFixed(2)}
                </td>
            </tr>
        `;
    });

    const tempo =
        Number(
            document.getElementById(
                'tempo_preparo'
            ).value || 0
        );

    const custoMaoObra =
        tempo * 1;

    const custoTotal =
        custoIngredientes +
        custoMaoObra;

    const margemLucro =
        30;

    const precoVenda =
        custoTotal *
        (1 + margemLucro / 100);

    html += `
        <tr>
            <td>Total Ingredientes</td>
            <td>
                R$ ${custoIngredientes.toFixed(2)}
            </td>
        </tr>

        <tr>
            <td>
                Mão de Obra (${tempo} min)
            </td>

            <td>
                R$ ${custoMaoObra.toFixed(2)}
            </td>
        </tr>

        <tr class="table-warning">
            <td>Custo Total</td>
            <td>
                R$ ${custoTotal.toFixed(2)}
            </td>
        </tr>

        <tr class="table-success">
            <td>
                <strong>
                    Preço Final de Venda
                </strong>
            </td>

            <td>
                <strong>
                    R$ ${precoVenda.toFixed(2)}
                </strong>
            </td>
        </tr>
    `;

    tbody.innerHTML = html;
}