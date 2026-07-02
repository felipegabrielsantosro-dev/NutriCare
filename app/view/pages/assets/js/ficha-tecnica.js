let ajusteNutricional = {
    calorias: null,
    carboidratos: null,
    acucar: null,
    proteinas: null,
    gorduras: null,
    fibras: null,
    sodio: null
};

// Vetores globais para controle em memória
let itensFicha = [];
let listaDeProdutosGlobais = []; // Matérias-Primas (Ingredientes)
let listaDeProdutosFinais = [];  // Produtos finais (Pratos/Venda)
let indexEdicaoItem = null;

// =========================================================================
// MAPEAMENTO DOS ELEMENTOS DO DOM
// =========================================================================
const selectProdutoAlvo = document.getElementById('product_id');      // ID do Produto Final
const selectMateriaPrima = document.getElementById('refeicao_itens');  // ID da Matéria-Prima
const inputUnidade = document.getElementById('unidade');
const inputQuantidade = document.getElementById('quantidade'); // Agora vai funcionar perfeitamente!
const btnAddItem = document.getElementById('add-item');
const tableBody = document.querySelector('#table-itens tbody');
const inputRendimento = document.getElementById('rendimento');
const inputPesoFinal = document.getElementById('peso_final');

// Elementos de Resumo
const elQtdItens = document.getElementById('qtd-itens');
const elPesoTotalReceita = document.getElementById('peso-total-receita');
const elCustoTotalReceita = document.getElementById('custo-total-receita');
const elCustoPorcao = document.getElementById('custo-porcao');

const btnSalvar = document.getElementById('insert');
const modalNutriente = new bootstrap.Modal(document.getElementById('modalNutriente'));

// Torna a função global para os inputs HTML usarem o oninput=""
window.calcularCustosFNutricional = calcularCustosFNutricional;

// =========================================================================
// FUNÇÕES DE CONVERSÃO MATEMÁTICA
// =========================================================================
function converterParaQuilos(quantidade, unidade) {
    const uni = unidade ? unidade.toLowerCase().trim() : '';
    if (uni === 'g' || uni === 'ml') return quantidade / 1000;
    if (uni === 'mg') return quantidade / 1000000;
    return quantidade;
}

// Helper para limpar strings de moeda e converter para float com segurança
function limparValorMoeda(elementoId) {
    const el = document.getElementById(elementoId);
    if (!el) return 0;
    const texto = el.innerText || el.textContent || '0';
    const valorLimpo = texto.replace(/R\$\s?/g, '').replace(/\s/g, '').replace(',', '.');
    return parseFloat(valorLimpo) || 0;
}

// =========================================================================
// 1. CARREGAR SELECTS (PRODUTOS FINAIS E MATÉRIAS-PRIMAS)
// =========================================================================
async function carregarProdutosFinaisNoSelect() {
    try {
        if (typeof api.product === 'undefined' || typeof api.product.find !== 'function') {
            console.warn("A rota api.product não foi encontrada.");
            selectProdutoAlvo.innerHTML = '<option value="">Erro: API não configurada</option>';
            return;
        }

        const response = await api.product.find({ limit: 150, offset: 0 });
        listaDeProdutosFinais = response.data || response || [];

        selectProdutoAlvo.innerHTML = '<option value="" selected disabled>Selecione o Produto Alvo...</option>';

        if (listaDeProdutosFinais.length === 0) {
            selectProdutoAlvo.innerHTML = '<option value="">Nenhum produto cadastrado</option>';
            return;
        }

        listaDeProdutosFinais.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            option.textContent = prod.refeicoes || prod.alimentos || prod.nome || prod.descricao || `Produto #${prod.id}`;
            selectProdutoAlvo.appendChild(option);
        });

    } catch (error) {
        console.error("Erro ao popular select de produtos alvo:", error);
        selectProdutoAlvo.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
}

async function carregarMateriasPrimasNoSelect() {
    try {
        if (typeof api.materiaPrima === 'undefined' || typeof api.materiaPrima.find !== 'function') {
            selectMateriaPrima.innerHTML = '<option value="">Objeto api.materiaPrima não encontrado</option>';
            return;
        }

        const response = await api.materiaPrima.find({ limit: 150, offset: 0 });
        listaDeProdutosGlobais = response.data || response || [];

        selectMateriaPrima.innerHTML = '<option value="" selected disabled>Selecione o Ingrediente...</option>';

        listaDeProdutosGlobais.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            option.textContent = prod.nome || `Insumo #${prod.id}`;
            selectMateriaPrima.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao popular o select de matérias-primas:", error);
        selectMateriaPrima.innerHTML = '<option value="">Erro ao carregar matérias-primas</option>';
    }
}

// =========================================================================
// 2. CÁLCULO DINÂMICO DOS TOTAIS DA RECEITA
// =========================================================================
function calcularCustosFNutricional() {
    let custoIngredientes = 0;
    let pesoTotalBruto = 0;

    itensFicha.forEach(item => {
        custoIngredientes += Number(item.total || 0);
        pesoTotalBruto += converterParaQuilos(Number(item.quantidade || 0), item.unidade);
    });

    const rendimento = parseFloat(inputRendimento.value) || 1;
    const minutos = parseFloat(document.getElementById('tempo_preparo').value) || 0;

    const maoObra = minutos; // R$ 1,00 por minuto
    const custoTotalReceita = custoIngredientes + maoObra;
    const lucro = custoTotalReceita * 0.30; // Lucro de 30%
    const precoVenda = custoTotalReceita + lucro;
    const custoPorcao = custoTotalReceita / rendimento;

    const pesoFinalDigitado = parseFloat(inputPesoFinal.value);
    const pesoExibicao = !isNaN(pesoFinalDigitado) && pesoFinalDigitado > 0 ? pesoFinalDigitado : pesoTotalBruto;

    // Atualiza os Cards na tela
    if (elQtdItens) elQtdItens.textContent = itensFicha.length;
    if (elPesoTotalReceita) elPesoTotalReceita.textContent = pesoExibicao.toFixed(3) + " kg";

    document.getElementById("valor-ingredientes").textContent = "R$ " + custoIngredientes.toFixed(2);
    document.getElementById("valor-mao-obra").textContent = "R$ " + maoObra.toFixed(2);
    document.getElementById("valor-percentual").textContent = "R$ " + lucro.toFixed(2);
    document.getElementById("custo-porcao").textContent = "R$ " + custoPorcao.toFixed(2);
    document.getElementById("custo-total-receita").textContent = "R$ " + custoTotalReceita.toFixed(2);
    document.getElementById("preco-venda-final").textContent = "R$ " + precoVenda.toFixed(2);
}

// =========================================================================
// 3. EVENTOS E RENDERIZAÇÃO DA LISTA DE INGREDIENTES
// =========================================================================
function renderizarTabelaItens() {
    tableBody.innerHTML = '';

    if (!itensFicha || itensFicha.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-3">
                    Nenhum produto ou ingrediente adicionado à lista.
                </td>
            </tr>`;
        calcularCustosFNutricional();
        return;
    }

    itensFicha.forEach((item, index) => {
        const precoUnitario = Number(item.precoUnitario) || 0;
        const total = Number(item.total) || 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.produto_alvo_nome || '-'}</strong></td>
            <td>${item.nome || '-'}</td>
            <td>${Number(item.quantidade).toFixed(3)}</td>
            <td>${item.unidade || '-'}</td>
            <td>R$ ${precoUnitario.toFixed(2)}</td>
            <td>R$ ${total.toFixed(2)}</td>
            <td class="text-center">
                <button type="button" class="btn btn-warning btn-sm me-1" onclick="editarItemFicha(${index})">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="removerItemFicha(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    calcularCustosFNutricional();
}

btnAddItem.addEventListener('click', async () => {
    const produtoAlvoId = selectProdutoAlvo.value;
    const materiaPrimaId = selectMateriaPrima.value;
    const unidade = inputUnidade.value.trim();

    // CORREÇÃO AQUI: Se o input não existe na tela, assume 1 como padrão com segurança
    const quantidade = inputQuantidade ? (parseFloat(inputQuantidade.value) || 1) : 1;

    if (!produtoAlvoId) {
        toast('error', 'Atenção', 'Selecione o Produto/Prato Final que receberá este ingrediente.');
        return;
    }

    if (!materiaPrimaId || materiaPrimaId === "refeicao_itens" || !unidade) {
        toast('error', 'Atenção', 'Selecione um ingrediente válido e defina a unidade de medida.');
        return;
    }

    try {
        const response = await api.materiaPrima.findById(materiaPrimaId);
        const produtoOriginal = response.data || response;

        const nomeMateriaPrima = produtoOriginal?.nome || `Insumo #${materiaPrimaId}`;
        const precoCompraTabela = parseFloat(produtoOriginal?.preco_compra || 0);
        const nomeProdutoAlvo = selectProdutoAlvo.options[selectProdutoAlvo.selectedIndex].text;

        const pesoLiquido = parseFloat(produtoOriginal.peso_liquido || 1);
        const uniBaixa = unidade.toLowerCase();

        let precoUnitarioCalculado = 0;

        switch (uniBaixa) {
            case "g":
            case "ml":
                // preço por grama ou ml
                precoUnitarioCalculado = precoCompraTabela / pesoLiquido;
                break;

            case "kg":
            case "l":
                // preço por kg ou litro
                precoUnitarioCalculado = precoCompraTabela / pesoLiquido;
                break;

            case "mg":
                precoUnitarioCalculado = precoCompraTabela / (pesoLiquido * 1000);
                break;

            default:
                toast('error', 'Atenção', `Unidade de medida "${unidade}" não reconhecida.`);
                return;
        }
        const totalItem = precoUnitarioCalculado * quantidade;

        const itemEstruturado = {
            produto_alvo_id: Number(produtoAlvoId),
            produto_alvo_nome: nomeProdutoAlvo,
            produto_id: Number(materiaPrimaId),
            nome: nomeMateriaPrima,
            quantidade,
            unidade,
            precoUnitario: precoUnitarioCalculado,
            total: totalItem
        };

        if (indexEdicaoItem !== null) {
            itensFicha[indexEdicaoItem] = itemEstruturado;
            indexEdicaoItem = null;
            btnAddItem.innerHTML = '<i class="fa-solid fa-plus"></i>';
        } else {
            itensFicha.push(itemEstruturado);
        }

        // Limpa apenas o select de matéria-prima
        selectMateriaPrima.value = '';
        if (inputQuantidade) inputQuantidade.value = '';

        document.getElementById('produto-info').classList.add('d-none');
        renderizarTabelaItens();

    } catch (error) {
        console.error(error);
        toast('error', 'Erro', 'Não foi possível processar a inclusão do ingrediente.');
    }
});

window.editarItemFicha = function (index) {
    const item = itensFicha[index];
    indexEdicaoItem = index;

    selectProdutoAlvo.value = item.produto_alvo_id;
    selectMateriaPrima.value = item.produto_id;
    inputUnidade.value = item.unidade;
    inputQuantidade.value = item.quantidade;

    selectMateriaPrima.dispatchEvent(new Event('change'));
    btnAddItem.innerHTML = '<i class="fa-solid fa-check"></i>';
};

window.removerItemFicha = function (index) {
    if (indexEdicaoItem === index) indexEdicaoItem = null;
    itensFicha.splice(index, 1);
    renderizarTabelaItens();
};

// =========================================================================
// 4. INICIALIZAÇÃO DOS DADOS (DOM READY)
// =========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    await carregarProdutosFinaisNoSelect();
    await carregarMateriasPrimasNoSelect();

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
// 5. ENVIAR FORMULÁRIO COMPLETO (SALVAR/ATUALIZAR)
// =========================================================================
btnSalvar.addEventListener('click', async () => {
    const action = document.getElementById('action').value;
    const id = document.getElementById('id').value;
    const nome_produto = document.getElementById('nome_produto').value.trim();

    if (!nome_produto) {
        toast('error', 'Validação', 'O nome da ficha técnica é obrigatório.');
        return;
    }

    btnSalvar.disabled = true;

    const custoTotalLimpo = limparValorMoeda('custo-total-receita');
    const custoUnitarioLimpo = limparValorMoeda('custo-porcao');
    const maoObraLimpo = limparValorMoeda('valor-mao-obra');
    const taxa15Limpo = limparValorMoeda('valor-percentual');
    const precoVendaLimpo = limparValorMoeda('preco-venda-final');

    const data = {
        nome_produto,
        categoria: document.getElementById('categoria').value,
        rendimento: parseFloat(inputRendimento.value) || 1,
        peso_final: parseFloat(inputPesoFinal.value) || 0,
        observacao: document.getElementById('observacao').value,
        ativo: document.getElementById('ativo').checked ? 1 : 0,
        custo_total: custoTotalLimpo,
        custo_unitario: custoUnitarioLimpo,
        mao_obra: maoObraLimpo,
        taxa_15: taxa15Limpo,
        preco_venda: precoVendaLimpo,
        itens: itensFicha
    };

    try {
        let response;
        if (action === 'e' && id) {
            response = await api.fichaTecnica.update(id, data);
        } else {
            response = await api.fichaTecnica.insert(data);
        }

        if (response && (response.status || response.id || response.success)) {
            toast('success', 'Sucesso', response.msg || response.message || 'Salvo com sucesso!');
            await api.temp.set('ficha-tecnica:edit', null).catch(() => { });
            setTimeout(() => api.window.close(), 1000);
        } else {
            toast('error', 'Erro', response?.message || response?.msg || 'Não foi possível salvar.');
            btnSalvar.disabled = false;
        }
    } catch (err) {
        console.error(err);
        toast('error', 'Erro', 'Falha na requisição: ' + err.message);
        btnSalvar.disabled = false;
    }
});

// =========================================================================
// 6. DETALHES INFORMATIVOS DA MATÉRIA-PRIMA SELECIONADA
// =========================================================================
selectMateriaPrima.addEventListener('change', async () => {
    const id = selectMateriaPrima.value;

    if (!id || id === "refeicao_itens") {
        document.getElementById('produto-info').classList.add('d-none');
        return;
    }

    try {
        const response = await api.materiaPrima.findById(id);
        const produto = response.data || response;

        document.getElementById('produto-info').classList.remove('d-none');

        document.getElementById('info-preco').textContent = `R$ ${Number(produto.preco_compra || 0).toFixed(2)}`;
        document.getElementById('info-venda').textContent = `R$ ${Number(produto.preco_venda || 0).toFixed(2)}`;
        document.getElementById('info-porcao').textContent = `${produto.peso_liquido || produto.peso_bruto || 0} kg`;

        if (produto.unidade_medida) {
            inputUnidade.value = produto.unidade_medida;
        }

        document.getElementById('info-porcoes').textContent = "1";
    } catch (e) {
        console.error("Erro ao carregar detalhes do insumo:", e);
    }
});