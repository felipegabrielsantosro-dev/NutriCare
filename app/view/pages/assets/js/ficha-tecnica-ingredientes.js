let ingredientesVinculados = [];
let indiceEdicao = null;
const fichaId = 1; // Substitua pela sua lógica dinâmica se necessário
const nomeDoPratoParaBuscar = "Nome do Seu Prato Aqui";

document.addEventListener('DOMContentLoaded', async () => {
    const fieldFicha = document.getElementById('ficha_id');
    if (fieldFicha) fieldFicha.value = fichaId;

    await carregarDadosFicha();
    await carregarSeletorProdutos();       // Alimenta o select "product_id" (Produto)
    await carregarSeletorMateriasPrimas(); // Alimenta o select "refeicao_itens" (Ingrediente)

    renderizarTabela();
    renderizarResumoFinanceiro();

    // Ouvintes de eventos centralizados
    document.getElementById('btn-add')?.addEventListener('click', adicionarIngredienteNaLista);
    document.getElementById('btn-salvar')?.addEventListener('click', salvarFichaTecnica);

    // Atualiza o resumo financeiro ao mudar o tempo de preparo em tempo real
    document.getElementById('tempo_preparo')?.addEventListener('input', renderizarResumoFinanceiro);
});

/**
 * 1. Busca os dados da receita original do banco
 */
async function carregarDadosFicha() {
    try {
        console.log(`Buscando ingredientes salvos para a ficha ID: ${fichaId}...`);

        const resultado = await api.fichaTecnicaIngredientes.findByFichaId(Number(fichaId));
        console.log("Ingredientes retornados pelo Electron:", resultado);

        if (resultado && resultado.status && resultado.data) {
            const listaIngredientes = resultado.data;

            if (document.getElementById('titulo')) {
                document.getElementById('titulo').innerText = `Ingredientes da Ficha Técnica #${fichaId}`;
            }

            if (listaIngredientes.length > 0) {
                ingredientesVinculados = listaIngredientes.map(ing => ({
                    id: ing.id || null,
                    produto_id: String(ing.produto_id),
                    nome_ingrediente: ing.nome_ingrediente || ing.nome || 'Ingrediente',
                    quantidade: parseFloat(ing.quantidade) || 0,
                    unidade: ing.unidade || 'g',
                    preco_compra: parseFloat(ing.preco_unitario || ing.preco_compra || 0)
                }));
            } else {
                ingredientesVinculados = [];
            }

            renderizarTabela();
            renderizarResumoFinanceiro();
        } else {
            console.warn("Nenhum ingrediente vinculado encontrado para esta ficha.");
            ingredientesVinculados = [];
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
            console.log('Tentando carregar produtos via api.product.find...');
            response = await api.product.find({ limit: 150, offset: 0 });
        } else {
            console.log('Objeto api não encontrado. Tentando rotas via fetch direto...');
            let fetchReq = await fetch('/api/product');

            if (!fetchReq.ok) {
                console.warn(`Rota /api/product retornou status ${fetchReq.status}. Tentando /api/produtos...`);
                fetchReq = await fetch('/api/produtos');
            }
            response = await fetchReq.json();
        }

        const produtos = response?.data || response?.rows || response || [];
        console.log("Produtos encontrados para listar:", produtos);

        select.innerHTML = '<option value="" selected disabled>Selecione o Produto...</option>';

        if (produtos.length === 0) {
            select.innerHTML = '<option value="">Nenhum produto encontrado</option>';
            return;
        }

        produtos.forEach(prod => {
            const option = document.createElement('option');
            option.value = String(prod.id || prod.produto_id || '');
            option.textContent = prod.alimentos || prod.nome || prod.nome_produto || prod.nome_heading || `Produto #${prod.id}`;
            select.appendChild(option);
        });

        select.addEventListener('change', carregarIngredientesDoProdutoSelecionado);

    } catch (error) {
        console.error('Erro detalhado ao carregar produtos:', error);
    }
}

/**
 * 3. Busca e filtra as matérias-primas relacionadas ao produto selecionado
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
        console.log(`Buscando matérias-primas para o produto: ${produtoId}`);
        let response = null;

        if (typeof api !== 'undefined' && api.materiaPrima && typeof api.materiaPrima.find === 'function') {
            response = await api.materiaPrima.find({ limit: 150, offset: 0 });
        } else {
            const fetchReq = await fetch('/api/product');
            response = await fetchReq.json();
        }

        const listaBruta = response?.data || response?.rows || response || [];
        const subItens = listaBruta.filter(item =>
            String(item.produto_id) === String(produtoId) || String(item.id) === String(produtoId)
        );

        if (subItens.length > 0 && listaHtml) {
            listaHtml.innerHTML = '';

            subItens.forEach(ing => {
                const nome = ing.alimentos || ing.nome || ing.nome_ingrediente || `Insumo #${ing.id}`;
                const qtd = ing.quantidade || 0;
                const unidade = ing.unidade || ing.unidade_medida || 'g';

                const li = document.createElement('li');
                li.className = "mb-1";
                li.innerHTML = `• <strong>${nome}</strong> — ${qtd} ${unidade}`;
                listaHtml.appendChild(li);
            });

            container?.classList.remove('d-none');
        } else {
            container?.classList.add('d-none');
        }

    } catch (error) {
        console.error('Erro ao processar e listar as matérias-primas:', error);
        container?.classList.add('d-none');
    }
}

/**
 * 4. CORREÇÃO: Adiciona ou atualiza um item coletando do select de INGREDIENTES (id="refeicao_itens")
 */
function adicionarIngredienteNaLista() {
    const select = document.getElementById('refeicao_itens'); // Corrigido para capturar o ingrediente
    const inputQuantidade = document.getElementById('quantidade');
    const inputUnidade = document.getElementById('unidade');
    const btnAdd = document.getElementById('btn-add');

    if (!select || !inputQuantidade || !inputUnidade) return;

    const ingredienteId = select.value;
    const nomeIngrediente = select.options[select.selectedIndex]?.text;
    const quantidade = parseFloat(inputQuantidade.value);
    const unidade = inputUnidade.value.trim();

    if (!ingredienteId || isNaN(quantidade) || quantidade <= 0 || !unidade) {
        alert('Por favor, selecione um ingrediente e preencha a quantidade/unidade corretamente.');
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
        const jaExiste = ingredientesVinculados.some(item => String(item.produto_id) === String(ingredienteId));
        if (jaExiste) {
            alert('Este ingrediente já foi adicionado à lista.');
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
 * 5. Renderiza a tabela de insumos vinculados
 */
function renderizarTabela() {
    const tbody = document.getElementById('tbody-ingredientes');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!ingredientesVinculados || ingredientesVinculados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Nenhum ingrediente adicionado ainda.</td></tr>`;
        return;
    }

    ingredientesVinculados.forEach((item, index) => {
        const tr = document.createElement('tr');
        const nomeMateriaPrima = item.nome_ingrediente || item.nome || 'Sem nome';
        const unidadeMedida = item.unidade || 'un';
        const quantidade = item.quantidade || 0;

        tr.innerHTML = `
            <td><strong>${nomeMateriaPrima}</strong></td>
            <td>${quantidade}</td>
            <td><span class="badge bg-secondary">${unidadeMedida}</span></td>
            <td class="text-center">
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

/**
 * 6. CORREÇÃO: Gerenciadores de Edição corrigidos para o ID "refeicao_itens"
 */
window.editarIngrediente = function (index) {
    const item = ingredientesVinculados[index];
    const select = document.getElementById('refeicao_itens'); // Corrigido
    const btnAdd = document.getElementById('btn-add');

    if (!select) return;

    select.value = String(item.produto_id);
    if (document.getElementById('quantidade')) document.getElementById('quantidade').value = item.quantidade || '';
    if (document.getElementById('unidade')) document.getElementById('unidade').value = item.unidade || '';

    indiceEdicao = index;

    if (btnAdd) {
        btnAdd.innerHTML = '<i class="fa-solid fa-check me-1"></i> Atualizar';
        btnAdd.className = "btn btn-warning";
    }
};

window.removerIngrediente = function (index) {
    if (indiceEdicao === index) {
        indiceEdicao = null;
        const btnAdd = document.getElementById('btn-add');
        if (btnAdd) {
            btnAdd.innerHTML = '<i class="fa-solid fa-plus me-1"></i> Adicionar';
            btnAdd.className = "btn btn-success";
        }
    }
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
        const quantidadeKg = Number(item.quantidade || 0) / 1000;
        const custo = quantidadeKg * precoKg;

        custoIngredientes += custo;

        html += `
            <tr>
                <td>${item.nome_ingrediente || item.nome} (${item.quantidade} ${item.unidade})</td>
                <td>R$ ${custo.toFixed(2)}</td>
            </tr>
        `;
    });

    const fieldTempo = document.getElementById('tempo_preparo');
    const tempo = Number(fieldTempo ? fieldTempo.value : 0);
    const custoMaoObra = tempo * 1.00;
    const custoTotal = custoIngredientes + custoMaoObra;
    const margemLucro = 30;
    const precoVenda = custoTotal * (1 + margemLucro / 100);

    html += `
        <tr class="table-light">
            <td><strong>Total Ingredientes</strong></td>
            <td><strong>R$ ${custoIngredientes.toFixed(2)}</strong></td>
        </tr>
        <tr class="table-light">
            <td>Mão de Obra (${tempo} min)</td>
            <td>R$ ${custoMaoObra.toFixed(2)}</td>
        </tr>
        <tr class="table-warning fw-bold">
            <td>Custo Total da Receita</td>
            <td>R$ ${custoTotal.toFixed(2)}</td>
        </tr>
        <tr class="table-success fw-bold">
            <td>Preço Sugerido de Venda (+${margemLucro}%)</td>
            <td>R$ ${precoVenda.toFixed(2)}</td>
        </tr>
    `;

    tbody.innerHTML = html;
}

/**
 * 8. Envia o Payload para o Electron
 */
async function salvarFichaTecnica() {
    if (ingredientesVinculados.length === 0) {
        alert('Adicione pelo menos um ingrediente antes de salvar a ficha técnica.');
        return;
    }

    const btnSalvar = document.getElementById('btn-salvar');
    if (btnSalvar) btnSalvar.disabled = true;

    try {
        const fieldFichaId = document.getElementById('ficha_id');
        const fichaIdAtual = Number(fieldFichaId ? fieldFichaId.value : fichaId);

        console.log("Limpando registros antigos da ficha ID:", fichaIdAtual);
        await api.fichaTecnicaIngredientes.delete(fichaIdAtual);

        const listaParaInserir = ingredientesVinculados.map(ing => ({
            produto_id: Number(ing.produto_id),
            quantidade: parseFloat(ing.quantidade) || 0,
            unidade: ing.unidade || 'G'
        }));

        console.log("Enviando dados puros e compatíveis com a nova Migration:", listaParaInserir);

        const payloadDoHandle = {
            ficha_tecnica_id: fichaIdAtual,
            ingredientes: listaParaInserir
        };

        const respostaInsert = await api.fichaTecnicaIngredientes.insert(payloadDoHandle);

        if (respostaInsert && (respostaInsert.status || respostaInsert.success)) {
            alert('Todos os ingredientes foram salvos com sucesso!');
            await carregarDadosFicha();
        } else {
            alert('Erro ao salvar no banco: ' + (respostaInsert?.msg || 'Erro de validação.'));
        }

    } catch (error) {
        console.error('Erro crítico no processo de salvamento do frontend:', error);
        alert('Erro ao processar o salvamento.');
    } finally {
        if (btnSalvar) btnSalvar.disabled = false;
    }
}

/**
 * 9. Popula o Select de INGREDIENTES / MATÉRIAS-PRIMAS (id="refeicao_itens")
 */
async function carregarSeletorMateriasPrimas() {
    try {
        const select = document.getElementById('refeicao_itens');
        if (!select) return;

        console.log('Buscando matérias-primas via api.materiaPrima.find...');

        const response = await api.materiaPrima.find({ limit: 500, offset: 0 });
        const materiasPrimas = response?.data || response?.rows || response || [];

        select.innerHTML = '<option value="" selected disabled>Selecione o ingrediente...</option>';

        if (materiasPrimas.length === 0) {
            select.innerHTML = '<option value="">Nenhum ingrediente encontrado</option>';
            return;
        }

        materiasPrimas.forEach(item => {
            const option = document.createElement('option');
            option.value = String(item.id);
            option.textContent = item.nome || item.alimentos || item.nome_ingrediente || `Insumo #${item.id}`;
            option.dataset.preco = item.preco_compra || item.preco || 0;
            option.dataset.unidade = item.unidade_medida || item.unidade || "g";
            select.appendChild(option);
        });

        console.log("Select de ingredientes ('refeicao_itens') populado com sucesso!");

    } catch (error) {
        console.error('Erro detalhado ao carregar matérias-primas:', error);
    }
}

function renderizarTabelaItens() {
    tableBody.innerHTML = '';

    if (!itensFicha.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-3">
                    Nenhum ingrediente encontrado para este produto.
                </td>
            </tr>`;
        calcularCustosFNutricional();
        return;
    }

    itensFicha.forEach((item, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${item.produto_alvo_nome || '-'}</strong></td>
            <td>${item.nome || '-'}</td>
            <td>${item.quantidade}</td>
            <td>${item.unidade}</td>
            <td>R$ ${Number(item.precoUnitario || 0).toFixed(2)}</td>
            <td>R$ ${Number(item.total || 0).toFixed(2)}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm" onclick="editarItemFicha(${index})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="removerItemFicha(${index})">🗑</button>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    calcularCustosFNutricional();
}

async function carregarReceitaProduto(produtoId) {

    if (!produtoId) return;

    try {
        const response = await api.fichaTecnica.findByProductId(produtoId);

        // ajuste conforme sua API retorna
        const itens = response?.data?.itens || response?.itens || [];

        itensFicha = itens;

        renderizarTabelaItens();

    } catch (error) {
        console.error("Erro ao carregar receita:", error);
        toast('error', 'Erro', 'Não foi possível carregar a receita do produto.');
    }
}