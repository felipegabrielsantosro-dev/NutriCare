let ingredientesVinculados = [];
let indiceEdicao = null;
const fichaId = 1; // Substitua pela sua lógica dinâmica se necessário

document.addEventListener('DOMContentLoaded', async () => {
    const fieldFicha = document.getElementById('ficha_id');
    if (fieldFicha) fieldFicha.value = fichaId;

    // Inicialização assíncrona sequencial ordenada
    await carregarDadosFicha();
    await carregarSeletorProdutos();
    await carregarSeletorMateriasPrimas();

    renderizarTabela();
    renderizarResumoFinanceiro();

    // Ouvintes de eventos
    document.getElementById('btn-add')?.addEventListener('click', adicionarIngredienteNaLista);

    // Mapeamento do botão de salvar
    document.getElementById('btn-salvar')?.addEventListener('click', (e) => {
        e.preventDefault();
        processarSalvamentoFicha();
    });

    document.getElementById('tempo_preparo')?.addEventListener('input', renderizarResumoFinanceiro);
});

/**
 * 1. Busca os dados da receita original do banco
 */
async function carregarDadosFicha() {
    try {
        if (!api?.fichaTecnicaIngredientes?.findByFichaId) return;

        const resultado = await api.fichaTecnicaIngredientes.findByFichaId(Number(fichaId));

        if (resultado && resultado.status && resultado.data) {
            const listaIngredientes = resultado.data;

            if (document.getElementById('titulo')) {
                document.getElementById('titulo').innerText = `Ingredientes da Ficha Técnica #${fichaId}`;
            }

            if (listaIngredientes.length > 0) {
                ingredientesVinculados = listaIngredientes.map(ing => ({
                    id: ing.id || null,
                    produto_id: String(ing.produto_id || ing.materia_prima_id || ing.ingrediente_id),
                    nome_ingrediente: ing.nome_ingrediente || ing.nome || 'Ingrediente',
                    quantidade: parseFloat(ing.quantidade) || 0,
                    unidade: ing.unidade || 'g',
                    preco_compra: parseFloat(ing.preco_unitario || ing.preco_compra || 0)
                }));
            }
            renderizarTabela();
            renderizarResumoFinanceiro();
        }
    } catch (error) {
        console.error('Erro ao carregar dados da ficha técnica:', error);
    }
}

/**
 * 2. Popula o Select de PRODUTOS PRINCIPAIS (id="product_id")
 */
async function carregarSeletorProdutos() {
    try {
        const select = document.getElementById('product_id');
        if (!select) return;

        let response = null;
        if (typeof api !== 'undefined' && api.product && typeof api.product.find === 'function') {
            response = await api.product.find({ limit: 150, offset: 0 });
        } else {
            let fetchReq = await fetch('/api/product');
            response = await fetchReq.json();
        }

        const produtos = response?.data || response?.rows || response || [];
        select.innerHTML = '<option value="" selected disabled>Selecione o produto...</option>';

        produtos.forEach(prod => {
            const option = document.createElement('option');
            option.value = String(prod.id || prod.produto_id || '');
            option.textContent = prod.alimentos || prod.nome || prod.nome_produto || `Produto #${prod.id}`;
            select.appendChild(option);
        });

        // Sincroniza o input oculto de nome sempre que o produto mudar
        select.addEventListener('change', (e) => {
            const nomeOculto = document.getElementById('nome_produto');
            if (nomeOculto) nomeOculto.value = select.options[select.selectedIndex].text;
            carregarIngredientesDoProdutoSelecionado(e);
        });

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

/**
 * 3. Mostra a composição base
 */
async function carregarIngredientesDoProdutoSelecionado(event) {
    const produtoId = event.target.value;
    const container = document.getElementById('container-sub-ingredientes');
    const listaHtml = document.getElementById('lista-sub-ingredientes');

    if (!produtoId) {
        container?.classList.add('d-none');
        return;
    }

    try {
        let response = await api.materiaPrima.find({ limit: 150, offset: 0 });
        const listaBruta = response?.data || response?.rows || response || [];
        const subItens = listaBruta.filter(item => String(item.produto_id) === String(produtoId));

        if (subItens.length > 0 && listaHtml) {
            listaHtml.innerHTML = '';
            subItens.forEach(ing => {
                const li = document.createElement('li');
                li.className = "mb-1";
                li.innerHTML = `• <strong>${ing.nome || 'Insumo'}</strong> — ${ing.quantidade || 0} ${ing.unidade || 'g'}`;
                listaHtml.appendChild(li);
            });
            container?.classList.remove('d-none');
        } else {
            container?.classList.add('d-none');
        }
    } catch (error) {
        container?.classList.add('d-none');
    }
}

/**
 * 4. Adiciona ou atualiza um item na tabela
 */
function adicionarIngredienteNaLista() {
    const select = document.getElementById('refeicao_itens');
    const inputQuantidade = document.getElementById('quantidade');
    const inputUnidade = document.getElementById('unidade');
    const btnAdd = document.getElementById('btn-add');

    if (!select || !inputQuantidade || !inputUnidade) return;

    const ingredienteId = select.value;
    const nomeIngrediente = select.options[select.selectedIndex]?.text;
    const quantidade = parseFloat(inputQuantidade.value);
    const unidade = inputUnidade.value.trim();

    if (!ingredienteId || isNaN(quantidade) || quantidade <= 0 || !unidade) {
        alert('Por favor, selecione um ingrediente e preencha a quantidade/unidade.');
        return;
    }

    const preco_compra = parseFloat(select.options[select.selectedIndex].dataset.preco || 0);

    const ingrediente = {
        produto_id: String(ingredienteId),
        nome_ingrediente: nomeIngrediente,
        quantidade,
        unidade,
        preco_compra
    };

    if (indiceEdicao !== null) {
        ingredientesVinculados[indiceEdicao] = ingrediente;
        indiceEdicao = null;
        if (btnAdd) {
            btnAdd.innerHTML = '<i class="fa-solid fa-plus me-1"></i> Adicionar';
            btnAdd.className = "btn btn-success";
        }
    } else {
        if (ingredientesVinculados.some(item => String(item.produto_id) === String(ingredienteId))) {
            alert('Este ingrediente já foi adicionado.');
            return;
        }
        ingredientesVinculados.push(ingrediente);
    }

    select.value = '';
    inputQuantidade.value = '';
    inputUnidade.value = '';

    renderizarTabela();
    renderizarResumoFinanceiro();
}

/**
 * 5. Renderiza a tabela de insumos vinculados (AGORA COM CUSTO POR ITEM)
 */
function renderizarTabela() {
    const tbody = document.getElementById('tbody-ingredientes');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (ingredientesVinculados.length === 0) {
        // Atualizado para colspan="5" por causa da nova coluna
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Nenhum ingrediente adicionado ainda.</td></tr>`;
        return;
    }

    ingredientesVinculados.forEach((item, index) => {
        const tr = document.createElement('tr');

        // Faz o cálculo do custo individual do item para exibir na linha
        const precoKg = Number(item.preco_compra || 0);
        const uni = item.unidade ? item.unidade.toLowerCase().trim() : '';
        let fatorConversao = (uni === 'g' || uni === 'ml') ? 1000 : 1;
        const custoItem = (Number(item.quantidade || 0) / fatorConversao) * precoKg;

        tr.innerHTML = `
            <td><strong>${item.nome_ingrediente}</strong></td>
            <td>${item.quantidade}</td>
            <td><span class="badge bg-secondary">${item.unidade}</span></td>
            <td class="text-success fw-bold">R$ ${custoItem.toFixed(2)}</td> <td class="text-center">
                <button type="button" class="btn btn-warning btn-sm me-1" onclick="editarIngrediente(${index})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="removerIngrediente(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editarIngrediente = function (index) {
    const item = ingredientesVinculados[index];
    document.getElementById('refeicao_itens').value = String(item.produto_id);
    document.getElementById('quantidade').value = item.quantidade;
    document.getElementById('unidade').value = item.unidade;
    indiceEdicao = index;
    const btnAdd = document.getElementById('btn-add');
    if (btnAdd) {
        btnAdd.innerHTML = '<i class="fa-solid fa-check me-1"></i> Atualizar';
        btnAdd.className = "btn btn-warning";
    }
};

window.removerIngrediente = function (index) {
    ingredientesVinculados.splice(index, 1);
    renderizarTabela();
    renderizarResumoFinanceiro();
};

/**
 * 7. Renderiza o Resumo Financeiro da Receita
 */
function renderizarResumoFinanceiro() {
    const tbody = document.getElementById('tbody-resumo');
    if (!tbody) return;

    let html = '';
    let custoIngredientes = 0;

    ingredientesVinculados.forEach(item => {
        const precoKg = Number(item.preco_compra || 0);
        const uni = item.unidade.toLowerCase().trim();
        let fatorConversao = (uni === 'g' || uni === 'ml') ? 1000 : 1;

        const custo = (Number(item.quantidade || 0) / fatorConversao) * precoKg;
        custoIngredientes += custo;

        html += `
            <tr>
                <td>${item.nome_ingrediente} (${item.quantidade} ${item.unidade})</td>
                <td>R$ ${custo.toFixed(2)}</td>
            </tr>
        `;
    });

    const tempo = Number(document.getElementById('tempo_preparo')?.value || 0);
    const custoMaoObra = tempo * 1.00;
    const custoTotal = custoIngredientes + custoMaoObra;
    const margemLucro = 30;
    const precoVenda = custoTotal * (1 + margemLucro / 100);

    // Injeta os IDs diretamente nas tags para o salvamento conseguir capturar os valores corretos
    html += `
        <tr class="table-light">
            <td><strong>Total Ingredientes</strong></td>
            <td>R$ ${custoIngredientes.toFixed(2)}</td>
        </tr>
        <tr class="table-light">
            <td>Mão de Obra (${tempo} min)</td>
            <td id="valor-mao-obra">R$ ${custoMaoObra.toFixed(2)}</td>
        </tr>
        <tr class="table-warning fw-bold">
            <td>Custo Total da Receita</td>
            <td id="custo-total-receita">R$ ${custoTotal.toFixed(2)}</td>
        </tr>
        <tr class="table-success fw-bold">
            <td>Preço Sugerido de Venda (+${margemLucro}%)</td>
            <td id="preco-venda-final">R$ ${precoVenda.toFixed(2)}</td>
        </tr>
    `;

    tbody.innerHTML = html;
}

/**
 * 8. PROCESSAR SALVAMENTO (INTEGRADO AO HTML ADAPTADO)
 */
async function processarSalvamentoFicha() {
    const btn = document.getElementById('btn-salvar');

    // Força a validação do nome usando o Produto Selecionado caso esteja em branco
    let nome_produto = document.getElementById('nome_produto')?.value?.trim();
    if (!nome_produto) {
        const selectProd = document.getElementById('product_id');
        if (selectProd && selectProd.selectedIndex > 0) {
            nome_produto = selectProd.options[selectProd.selectedIndex].text;
        }
    }

    if (!nome_produto || nome_produto.startsWith("Selecione")) {
        alert('Por favor, selecione um Produto no topo antes de salvar os ingredientes.');
        return;
    }

    if (btn) btn.disabled = true;

    // Função interna para ler os valores gerados na tabela de resumo
    const obterValorLinha = (id) => {
        const txt = document.getElementById(id)?.innerText || '0';
        return parseFloat(txt.replace(/R\$\s?/g, '').replace(',', '.')) || 0;
    };

    const ingredientesFormatados = ingredientesVinculados.map(item => ({
        ficha_tecnica_id: Number(document.getElementById('id')?.value) || null,
        produto_alvo_id: Number(document.getElementById('product_id')?.value) || null,
        produto_id: Number(item.produto_id),
        materia_prima_id: Number(item.produto_id),
        quantidade: parseFloat(item.quantidade) || 0,
        unidade: item.unidade || 'g',
        preco_unitario: parseFloat(item.preco_compra) || 0,
        custo_total_item: parseFloat(item.quantidade * (item.preco_compra / (item.unidade === 'g' || item.unidade === 'ml' ? 1000 : 1))) || 0
    }));

    const data = {
        nome_produto,
        categoria: '',
        rendimento: 1,
        peso_final: 0,
        observacao: 'Salvo via gerenciador de ingredientes',
        ativo: 1,
        custo_total: obterValorLinha('custo-total-receita'),
        custo_unitario: obterValorLinha('custo-total-receita'),
        mao_obra: obterValorLinha('valor-mao-obra'),
        taxa_15: 0,
        preco_venda: obterValorLinha('preco-venda-final'),
        itens: ingredientesFormatados,
        ingredientes: ingredientesFormatados
    };

    try {
        const action = document.getElementById('action')?.value || 'c';
        const id = document.getElementById('id')?.value;
        let response = (action === 'e' && id) ? await api.fichaTecnica.update(id, data) : await api.fichaTecnica.insert(data);

        if (response && (response.status || response.id || response.success)) {
            alert('Sucesso: Ingredientes vinculados e salvos com sucesso!');
            setTimeout(() => api.window.close(), 500);
        } else {
            alert('Erro no banco: ' + (response?.message || 'Falha ao salvar.'));
            if (btn) btn.disabled = false;
        }
    } catch (err) {
        alert('Erro Crítico: ' + err.message);
        if (btn) btn.disabled = false;
    }
}

/**
 * 9. Popula o Select de INGREDIENTES
 */
async function carregarSeletorMateriasPrimas() {
    try {
        const select = document.getElementById('refeicao_itens');
        if (!select) return;

        const response = await api.materiaPrima.find({ limit: 500, offset: 0 });
        const materiasPrimas = response?.data || response?.rows || response || [];

        select.innerHTML = '<option value="" selected disabled>Selecione o ingrediente...</option>';

        materiasPrimas.forEach(item => {
            const option = document.createElement('option');
            option.value = String(item.id);
            option.textContent = item.nome || item.alimentos || `Insumo #${item.id}`;
            option.dataset.preco = item.preco_compra || item.preco || 0;
            option.dataset.unidade = item.unidade_medida || item.unidade || "g";
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar matérias-primas:', error);
    }
}