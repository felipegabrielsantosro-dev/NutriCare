// Vetores globais para controle em memória
let itensFicha = [];
let listaDeProdutosGlobais = [];

// Elementos do DOM mapeados
const selectProduto = document.getElementById('produto_id');
const inputUnidade = document.getElementById('unidade');
const btnAddItem = document.getElementById('add-item');
const tableBody = document.querySelector('#table-itens tbody');

const inputRendimento = document.getElementById('rendimento');
const inputCustoTotal = document.getElementById('custo_total');
const inputCustoUnitario = document.getElementById('custo_unitario');

const btnSalvar = document.getElementById('insert');

// =========================================================================
// 1. CARREGAR PRODUTOS NO SELECT
// =========================================================================
async function carregarProdutosNoSelect() {
    try {
        const response = await api.product.find({ limit: 150, offset: 0 });
        listaDeProdutosGlobais = response.data || response || [];

        selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';

        listaDeProdutosGlobais.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            option.textContent = prod.alimentos || prod.refeicoes || `Produto #${prod.id}`;
            selectProduto.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao popular o select de produtos:", error);
        selectProduto.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
}

// =========================================================================
// 2. CÁLCULO AUTOMÁTICO DE CUSTOS
// =========================================================================
function calcularCustosFicha() {
    let custoTotalAcumulado = 0;

    itensFicha.forEach(item => {
        custoTotalAcumulado += item.total;
    });

    const rendimento = parseFloat(inputRendimento.value) || 1;

    // Atualiza os inputs formatados visualmente
    inputCustoTotal.value = `R$ ${custoTotalAcumulado.toFixed(2)}`;

    const custoUnitario = custoTotalAcumulado / (rendimento > 0 ? rendimento : 1);
    inputCustoUnitario.value = `R$ ${custoUnitario.toFixed(2)}`;
}

// Recalcula se o usuário alterar o rendimento
inputRendimento.addEventListener('input', calcularCustosFicha);

// =========================================================================
// 3. ADICIONAR E RENDERIZAR ITENS NA TABELA DINÂMICA
// =========================================================================
function renderizarTabelaItens() {
    tableBody.innerHTML = '';

    itensFicha.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.unidade}</td>
            <td>R$ ${item.precoUnitario.toFixed(2)}</td>
            <td>R$ ${item.total.toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn btn-danger btn-sm" onclick="removerItemFicha(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    calcularCustosFicha();
}

btnAddItem.addEventListener('click', () => {
    const produtoId = selectProduto.value;
    const unidade = inputUnidade.value.trim();

    if (!produtoId || !unidade) {
        toast('error', 'Atenção', 'Selecione o produto e preencha a unidade/medida.');
        return;
    }

    const produtoOriginal = listaDeProdutosGlobais.find(p => p.id == produtoId);
    const nomeProduto = produtoOriginal ? (produtoOriginal.alimentos || produtoOriginal.refeicoes) : 'Desconhecido';

    // Pega o preço base do produto vindo do banco (ou assume 0 se não houver)
    const precoUnitario = parseFloat(produtoOriginal?.preco_compra) || 0;

    // Como a quantidade foi omitida, o total do item é o próprio preço base do insumo colocado
    const totalItem = precoUnitario;

    itensFicha.push({
        produto_id: parseInt(produtoId),
        nome: nomeProduto,
        unidade: unidade,
        precoUnitario: precoUnitario,
        total: totalItem
    });

    // Limpa campos de inserção rápida
    selectProduto.value = '';
    inputUnidade.value = '';

    renderizarTabelaItens();
});

// Remove item da lista e limpa do HTML
window.removerItemFicha = function (index) {
    itensFicha.splice(index, 1);
    renderizarTabelaItens();
};

// =========================================================================
// 4. FLUXO DE EDIÇÃO / INICIALIZAÇÃO (CARREGAMENTO DO TEMP)
// =========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    // 1º Carrega os produtos no select primeiro
    await carregarProdutosNoSelect();

    // 2º Verifica se é uma edição
    const temp = await api.temp.get('ficha-tecnica:edit');

    if (temp && temp.action === 'e') {
        document.getElementById('id').value = temp.id ?? '';
        document.getElementById('action').value = 'e';

        document.getElementById('nome_produto').value = temp.nome_produto ?? '';
        document.getElementById('categoria').value = temp.categoria ?? '';
        document.getElementById('rendimento').value = temp.rendimento ?? 1;
        document.getElementById('peso_final').value = temp.peso_final ?? '';
        document.getElementById('observacao').value = temp.observacao ?? '';
        document.getElementById('ativo').checked = temp.ativo === true || temp.ativo === 1;

        // Recupera os itens salvos anteriormente se o banco retornar em formato de array
        if (temp.itens && Array.isArray(temp.itens)) {
            itensFicha = temp.itens;
        }

        document.querySelector('h2').textContent = 'Editar Ficha Técnica';
        btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar Ficha Técnica';
    } else {
        document.getElementById('action').value = 'c';
    }

    renderizarTabelaItens();
});

// =========================================================================
// 5. ENVIAR CADASTRO / ATUALIZAÇÃO PARA O BANCO DE DADOS
// =========================================================================
btnSalvar.addEventListener('click', async () => {
    const action = document.getElementById('action').value;
    const id = document.getElementById('id').value;
    const nome_produto = document.getElementById('nome_produto').value.trim();

    if (!nome_produto) {
        toast('error', 'Validação', 'O nome do produto da ficha é obrigatório.');
        return;
    }

    // Desativa o botão para evitar cliques duplos idênticos
    btnSalvar.disabled = true;

    // Extrai os números limpando a formatação visual do cifrão
    const custoTotalLimpo = parseFloat(inputCustoTotal.value.replace('R$', '').trim()) || 0;
    const custoUnitarioLimpo = parseFloat(inputCustoUnitario.value.replace('R$', '').trim()) || 0;

    // Constrói o objeto estruturado com os dados e a lista de itens inclusos
    const data = {
        nome_produto: nome_produto,
        categoria: document.getElementById('categoria').value,
        rendimento: parseFloat(inputRendimento.value) || 1,
        peso_final: parseFloat(document.getElementById('peso_final').value) || 0,
        observacao: document.getElementById('observacao').value,
        ativo: document.getElementById('ativo').checked ? 1 : 0,
        custo_total: custoTotalLimpo,
        custo_unitario: custoUnitarioLimpo,
        itens: itensFicha // Envia os sub-itens associados para o model processar
    };

    try {
        let response;
        if (action === 'e' && id) {
            response = await api.fichaTecnica.update(id, data);
        } else {
            response = await api.fichaTecnica.insert(data);
        }

        console.log("Resposta do Servidor IPC:", response);

        if (response && response.status) {
            toast('success', 'Sucesso', response.msg || response.message);
            await api.temp.set('ficha-tecnica:edit', null).catch(() => { });
            setTimeout(() => api.window.close(), 1000);
        } else {
            // Se o backend retornou status: false, exibe o erro e REATIVA o botão
            toast('error', 'Erro', response?.message || response?.msg || 'Não foi possível salvar a ficha técnica.');
            btnSalvar.disabled = false;
        }
    } catch (err) {
        // Se houver uma falha catastrófica de comunicação/código, REATIVA o botão aqui também
        console.error("Erro no front-end durante o salvamento:", err);
        toast('error', 'Erro', 'Falha na requisição: ' + err.message);
        btnSalvar.disabled = false;
    }
});

const produtoSelect = document.getElementById('produto_id');

produtoSelect.addEventListener('change', async () => {

    const id = produtoSelect.value;

    if (!id) return;

    const response = await api.product.findById(id);

    const produto = response.data || response;

    document.getElementById('produto-info').classList.remove('d-none');

    document.getElementById('info-preco').textContent =
        `R$ ${Number(produto.preco_compra || 0).toFixed(2)}`;

    document.getElementById('info-venda').textContent =
        `R$ ${Number(produto.preco_venda || 0).toFixed(2)}`;

    document.getElementById('info-peso').textContent =
        `${produto.peso_liquido || produto.peso_bruto || 0} kg`;

    document.getElementById('info-rendimento').textContent =
        produto.rendimento || 0;

    document.getElementById('info-calorias').textContent =
        `${produto.valor_energetico || 0} kcal`;

    document.getElementById('info-proteinas').textContent =
        `${produto.proteinas || 0} g`;

    document.getElementById('info-carboidratos').textContent =
        `${produto.carboidratos || 0} g`;

    document.getElementById('info-gorduras').textContent =
        `${produto.gorduras_totais || 0} g`;

    document.getElementById('info-acucar').textContent =
        `${produto.acucares_totais || 0} g`;

    document.getElementById('info-sodio').textContent =
        `${produto.sodio || 0} mg`;

});