// Vetores globais para controle em memória
let itensFicha = [];
let listaDeProdutosGlobais = [];

// Elementos do DOM mapeados
const selectProduto = document.getElementById('produto_id');
const inputUnidade = document.getElementById('unidade');
const inputQuantidade = document.getElementById('quantidade');
const btnAddItem = document.getElementById('add-item');
const tableBody = document.querySelector('#table-itens tbody');
const inputRendimento = document.getElementById('rendimento');
const inputPesoFinal = document.getElementById('peso_final');

// Elementos de Resumo/Totais da Receita
const elQtdItens = document.getElementById('qtd-itens');
const elPesoTotalReceita = document.getElementById('peso-total-receita');
const elCustoTotalReceita = document.getElementById('custo-total-receita');
const elCustoPorcao = document.getElementById('custo-porcao');

// Elementos da Tabela Nutricional da Receita
const totalCalorias = document.getElementById('total_calorias');
const totalProteinas = document.getElementById('total_proteinas');
const totalCarboidratos = document.getElementById('total_carboidratos');
const totalGorduras = document.getElementById('total_gorduras');
const totalFibras = document.getElementById('total_fibras');
const totalSodio = document.getElementById('total_sodio');
const totalAcucar = document.getElementById('total_acucar');

const btnSalvar = document.getElementById('insert');

// =========================================================================
// FUNÇÕES DE CONVERSÃO MATEMÁTICA
// =========================================================================

// Converte qualquer entrada para Quilogramas (kg) ou Litros (L)
function converterParaQuilos(quantidade, unidade) {
    const uni = unidade.toLowerCase().trim();
    if (uni === 'g' || uni === 'ml') return quantidade / 1000;
    if (uni === 'mg') return quantidade / 1000000;
    return quantidade; // kg, l, un
}

// Clona o cálculo com base na tabela nutricional padrão (100g ou 100ml)
function obterFatorNutricional(quantidade, unidade) {
    const uni = unidade.toLowerCase().trim();
    let emGramasOuMl = quantidade;

    if (uni === 'kg' || uni === 'l') emGramasOuMl = quantidade * 1000;
    if (uni === 'mg') emGramasOuMl = quantidade / 1000;

    return emGramasOuMl / 100; // Fator multiplicador sobre a base de 100g
}

// =========================================================================
// 1. CARREGAR PRODUTOS NO SELECT
// =========================================================================
async function carregarProdutosNoSelect() {
    try {
        const response = await api.product.find({ limit: 150, offset: 0 });
        // Garante a extração correta independente da paginação da api
        listaDeProdutosGlobais = response.data || response || [];

        selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';

        listaDeProdutosGlobais.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            option.textContent = prod.alimentos || prod.refeicoes || prod.nome || `Produto #${prod.id}`;
            selectProduto.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao popular o select de produtos:", error);
        selectProduto.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
}

// =========================================================================
// 2. CÁLCULO DINÂMICO DOS TOTAIS DA RECEITA (VERSÃO BLINDADA)
// =========================================================================
function calcularCustosFNutricional() {
    let custoTotalAcumulado = 0;
    let pesoTotalBruto = 0;

    let nutCalorias = 0;
    let nutCarboidratos = 0;
    let nutAcucar = 0;
    let nutProteinas = 0;
    let nutGorduras = 0;
    let nutFibras = 0;
    let nutSodio = 0;

    // 1. Percorre os itens e soma os valores ponderados
    itensFicha.forEach(item => {
        custoTotalAcumulado += item.total;
        pesoTotalBruto += converterParaQuilos(item.quantidade, item.unidade);

        // Soma calculada multiplicando o valor base (100g) pelo fator da quantidade
        nutCalorias += (item.nutrientesBase.calorias * item.fatorNutricional);
        nutCarboidratos += (item.nutrientesBase.carboidratos * item.fatorNutricional);
        nutAcucar += (item.nutrientesBase.acucar * item.fatorNutricional);
        nutProteinas += (item.nutrientesBase.proteinas * item.fatorNutricional);
        nutGorduras += (item.nutrientesBase.gorduras * item.fatorNutricional);
        nutFibras += (item.nutrientesBase.fibras * item.fatorNutricional);
        nutSodio += (item.nutrientesBase.sodio * item.fatorNutricional);
    });

    // Diagnóstico no Console (Aperte F12 no navegador para checar se os números saíram do zero aqui)
    console.log("Valores Calculados internamente:", { nutCalorias, nutProteinas, nutCarboidratos });

    const rendimento = parseFloat(inputRendimento.value) || 1;
    const custoUnitario = custoTotalAcumulado / (rendimento > 0 ? rendimento : 1);

    const pesoFinalDigitado = parseFloat(inputPesoFinal.value);
    const pesoExibicao = !isNaN(pesoFinalDigitado) && pesoFinalDigitado > 0 ? pesoFinalDigitado : pesoTotalBruto;

    // Atualiza o bloco "Resumo da Receita"
    if (elQtdItens) elQtdItens.textContent = itensFicha.length;
    if (elPesoTotalReceita) elPesoTotalReceita.textContent = `${pesoExibicao.toFixed(3)} kg`;
    if (elCustoTotalReceita) elCustoTotalReceita.textContent = `R$ ${custoTotalAcumulado.toFixed(2)}`;
    if (elCustoPorcao) elCustoPorcao.textContent = `R$ ${custoUnitario.toFixed(2)}`;

    // 2. ATUALIZAÇÃO BLINDADA: Tenta pelo ID, se falhar, busca pela posição na tabela
    const atualizarCampo = (elemento, idAlternativo, sufixo, valor) => {
        const el = elemento || document.getElementById(idAlternativo);
        if (el) {
            el.textContent = `${valor.toFixed(1)} ${sufixo}`;
        }
    };

    atualizarCampo(totalCalorias, 'total_calorias', 'kcal', nutCalorias);
    atualizarCampo(totalProteinas, 'total_proteinas', 'g', nutProteinas);
    atualizarCampo(totalCarboidratos, 'total_carboidratos', 'g', nutCarboidratos);
    atualizarCampo(totalGorduras, 'total_gorduras', 'g', nutGorduras);
    atualizarCampo(totalFibras, 'total_fibras', 'g', nutFibras);
    atualizarCampo(totalSodio, 'total_sodio', 'mg', nutSodio);
    atualizarCampo(totalAcucar, 'total_acucar', 'g', nutAcucar);

    // 3. Força bruta caso os seletores acima falhem (Injeta direto pelas posições das colunas da tabela)
    const tabelaNutricional = document.querySelector('h5 + .table-responsive .table tbody tr');
    if (tabelaNutricional && tabelaNutricional.children.length >= 7) {
        tabelaNutricional.children[0].textContent = `${nutCalorias.toFixed(1)} kcal`;
        tabelaNutricional.children[1].textContent = `${nutProteinas.toFixed(1)} g`;
        tabelaNutricional.children[2].textContent = `${nutCarboidratos.toFixed(1)} g`;
        tabelaNutricional.children[3].textContent = `${nutGorduras.toFixed(1)} g`;
        tabelaNutricional.children[4].textContent = `${nutFibras.toFixed(1)} g`;
        tabelaNutricional.children[5].textContent = `${nutSodio.toFixed(1)} mg`;
        tabelaNutricional.children[6].textContent = `${nutAcucar.toFixed(1)} g`;
    }
}

// Observadores para mudança de estado em tempo de execução
inputRendimento.addEventListener('input', calcularCustosFNutricional);
inputPesoFinal.addEventListener('input', calcularCustosFNutricional);

// =========================================================================
// 3. EVENTOS DA TABELA DE PRODUTOS/INSUMOS
// =========================================================================
function renderizarTabelaItens() {
    tableBody.innerHTML = '';

    itensFicha.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
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

    calcularCustosFNutricional();
}

btnAddItem.addEventListener('click', () => {
    const produtoId = selectProduto.value;
    const unidade = inputUnidade.value.trim();
    const quantidade = parseFloat(inputQuantidade.value) || 0;

    if (!produtoId || !unidade || quantidade <= 0) {
        toast('error', 'Atenção', 'Selecione o produto, a unidade e defina uma quantidade válida.');
        return;
    }

    const produtoOriginal = listaDeProdutosGlobais.find(p => p.id == produtoId);
    const nomeProduto = produtoOriginal ? (produtoOriginal.alimentos || produtoOriginal.refeicoes || produtoOriginal.nome) : 'Desconhecido';

    const precoCompraTabela = parseFloat(produtoOriginal?.preco_compra || produtoOriginal?.preco) || 0;
    let precoUnitarioCalculado = precoCompraTabela;

    // Tratamento de conversão financeira proporcional
    const uniBaixa = unidade.toLowerCase();
    if (uniBaixa === 'g' || uniBaixa === 'ml') {
        precoUnitarioCalculado = precoCompraTabela / 1000;
    } else if (uniBaixa === 'mg') {
        precoUnitarioCalculado = precoCompraTabela / 1000000;
    }

    const totalItem = precoUnitarioCalculado * quantidade;
    const fatorNutricional = obterFatorNutricional(quantidade, unidade);

    // Mapeamento tolerante a variações comuns de nomenclatura em bancos de dados (Back-end)
    itensFicha.push({
        produto_id: parseInt(produtoId),
        nome: nomeProduto,
        quantidade: quantidade,
        unidade: unidade,
        precoUnitario: precoUnitarioCalculado,
        total: totalItem,
        fatorNutricional: fatorNutricional,
        nutrientesBase: {
            calorias: parseFloat(produtoOriginal?.valor_energetico || produtoOriginal?.calorias || produtoOriginal?.energia) || 0,
            carboidratos: parseFloat(produtoOriginal?.carboidratos || produtoOriginal?.carboidrato) || 0,
            acucar: parseFloat(produtoOriginal?.acucares_totais || produtoOriginal?.acucar || produtoOriginal?.acucares) || 0,
            proteinas: parseFloat(produtoOriginal?.proteinas || produtoOriginal?.proteina) || 0,
            gorduras: parseFloat(produtoOriginal?.gorduras_totais || produtoOriginal?.gorduras || produtoOriginal?.gordura) || 0,
            fibras: parseFloat(produtoOriginal?.fibra_alimentar || produtoOriginal?.fibra || produtoOriginal?.fibras) || 0,
            sodio: parseFloat(produtoOriginal?.sodio || produtoOriginal?.sal) || 0
        }
    });

    // Reseta o painel de inserção rápida
    selectProduto.value = '';
    inputUnidade.value = '';
    inputQuantidade.value = '';
    document.getElementById('produto-info').classList.add('d-none');

    renderizarTabelaItens();
});

window.removerItemFicha = function (index) {
    itensFicha.splice(index, 1);
    renderizarTabelaItens();
};

// =========================================================================
// 4. INICIALIZAÇÃO DA PÁGINA (CREATE / EDIT)
// =========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    await carregarProdutosNoSelect();

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
// 5. PERSISTÊNCIA DOS DADOS (SALVAR NO BANCO)
// =========================================================================
btnSalvar.addEventListener('click', async () => {
    const action = document.getElementById('action').value;
    const id = document.getElementById('id').value;
    const nome_produto = document.getElementById('nome_produto').value.trim();

    if (!nome_produto) {
        toast('error', 'Validação', 'O nome do produto da ficha é obrigatório.');
        return;
    }

    btnSalvar.disabled = true;

    const custoTotalLimpo = parseFloat(elCustoTotalReceita.textContent.replace('R$', '').trim()) || 0;
    const custoUnitarioLimpo = parseFloat(elCustoPorcao.textContent.replace('R$', '').trim()) || 0;

    const data = {
        nome_produto: nome_produto,
        categoria: document.getElementById('categoria').value,
        rendimento: parseFloat(inputRendimento.value) || 1,
        peso_final: parseFloat(inputPesoFinal.value) || 0,
        observacao: document.getElementById('observacao').value,
        ativo: document.getElementById('ativo').checked ? 1 : 0,
        custo_total: custoTotalLimpo,
        custo_unitario: custoUnitarioLimpo,
        itens: itensFicha
    };

    try {
        let response;
        if (action === 'e' && id) {
            response = await api.fichaTecnica.update(id, data);
        } else {
            response = await api.fichaTecnica.insert(data);
        }

        if (response && response.status) {
            toast('success', 'Sucesso', response.msg || response.message);
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
// 6. CARD DINÂMICO DE VISUALIZAÇÃO DO PRODUTO (ON CHANGE)
// =========================================================================
selectProduto.addEventListener('change', async () => {
    const id = selectProduto.value;

    if (!id) {
        document.getElementById('produto-info').classList.add('d-none');
        return;
    }

    const response = await api.product.findById(id);
    const produto = response.data || response;

    document.getElementById('produto-info').classList.remove('d-none');

    document.getElementById('info-preco').textContent = `R$ ${Number(produto.preco_compra || 0).toFixed(2)}`;
    document.getElementById('info-venda').textContent = `R$ ${Number(produto.preco_venda || 0).toFixed(2)}`;
    document.getElementById('info-porcao').textContent = `${produto.peso_liquido || produto.peso_bruto || 0} kg`;
    document.getElementById('info-porcoes').textContent = produto.rendimento || 0;

    // Tratamento preventivo para exibição no painel intermediário
    document.getElementById('info-calorias').textContent = `${produto.valor_energetico || produto.calorias || produto.energia || 0} kcal`;
    document.getElementById('info-proteinas').textContent = `${produto.proteinas || produto.proteina || 0} g`;
    document.getElementById('info-carboidratos').textContent = `${produto.carboidratos || produto.carboidrato || 0} g`;
    document.getElementById('info-gorduras').textContent = `${produto.gorduras_totais || produto.gorduras || produto.gordura || 0} g`;
    document.getElementById('info-acucar').textContent = `${produto.acucares_totais || produto.acucar || produto.acucares || 0} g`;
    document.getElementById('info-fibras').textContent = `${produto.fibra_alimentar || produto.fibra || produto.fibras || 0} g`;
    document.getElementById('info-sodio').textContent = `${produto.sodio || produto.sal || 0} mg`;
});