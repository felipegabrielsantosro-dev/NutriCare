import { SellingPriceCalculator } from '../components/SellingPriceCalculator.js';

// Função responsável por calcular e rodar a lógica fluid
function calcularPrecoVendaAutomatico() {
    const precoCompraInput = document.getElementById('preco_compra');
    const totalImpostoInput = document.getElementById('total_imposto');
    const margemLucroInput = document.getElementById('margem_lucro');
    const custoOperacionalInput = document.getElementById('custo_operacional');
    const precoVendaInput = document.getElementById('preco_venda');

    const precoCompra = parseFloat(precoCompraInput.value) || 0;
    const totalImposto = parseFloat(totalImpostoInput.value) || 0;
    const margemLucro = parseFloat(margemLucroInput.value) || 0;
    const custoOperacional = parseFloat(custoOperacionalInput.value) || 0;

    if (precoCompra <= 0) {
        precoVendaInput.value = '';
        return;
    }

    try {
        const resultado = SellingPriceCalculator.create()
            .addPurchasePrice(precoCompra)
            .addTotalTax(totalImposto)
            .addProfitMargin(margemLucro)
            .addOperatingCost(custoOperacional)
            .getData();

        precoVendaInput.value = resultado.valor_venda_sugerido.toFixed(2);
        precoVendaInput.classList.remove('is-invalid');
    } catch (error) {
        precoVendaInput.value = '';
        precoVendaInput.classList.add('is-invalid');
        console.warn('Cálculo bloqueado temporariamente:', error.message);
    }
}

// Carrega os dados e popula componentes no boot do DOM
window.addEventListener('DOMContentLoaded', async () => {
    const temp = await api.temp.get('product:edit');
    const selectMateriaPrima = document.getElementById('refeicao_itens');

    // 1. Carrega as matérias-primas no Select de forma limpa
    try {
        const response = await api.materiaPrima.find({ limit: 100, offset: 0 });
        const listaMaterias = response.data || response || [];

        selectMateriaPrima.innerHTML = '<option value="">Selecione uma matéria-prima</option>';

        listaMaterias.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.nome} (${item.unidade_medida || 'UN'})`;
            selectMateriaPrima.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar matérias-primas:", error);
        selectMateriaPrima.innerHTML = '<option value="">Erro ao carregar matérias-primas</option>';
    }

    // 2. Se for modo edição, restaura todos os campos
    if (temp && temp.action === 'e') {
        document.getElementById('id').value = temp.id ?? '';
        document.getElementById('action').value = 'e';

        document.getElementById('alimentos').value = temp.alimentos ?? '';
        document.getElementById('refeicoes').value = temp.refeicoes ?? '';
        document.getElementById('descricao').value = temp.descricao ?? '';

        selectMateriaPrima.value = temp.refeicao_itens ?? '';

        // Restaura campos numéricos de cálculo
        document.getElementById('preco_compra').value = temp.preco_compra ?? '';
        document.getElementById('total_imposto').value = temp.total_imposto ?? '';
        document.getElementById('margem_lucro').value = temp.margem_lucro ?? '';
        document.getElementById('custo_operacional').value = temp.custo_operacional ?? '';
        document.getElementById('preco_venda').value = temp.preco_venda ?? '';

        document.getElementById('ativo').checked = temp.ativo === true || temp.ativo === 1;

        document.querySelector('h2').textContent = 'Editar Produto';
        document.getElementById('insert').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar';
    } else {
        document.getElementById('action').value = 'c';
    }

    // 3. Ativa os ouvintes para cálculo instantâneo enquanto o usuário digita
    const camposCusto = ['preco_compra', 'total_imposto', 'margem_lucro', 'custo_operacional'];
    camposCusto.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('input', calcularPrecoVendaAutomatico);
        }
    });

    // Roda uma vez caso seja edição de produto existente
    calcularPrecoVendaAutomatico();
});

// Envia dados salvando ou atualizando
document.getElementById('insert').addEventListener('click', async () => {
    const action = document.getElementById('action').value;
    const id = document.getElementById('id').value;
    const btn = document.getElementById('insert');

    btn.disabled = true;

    const data = {
        alimentos: document.getElementById('alimentos').value,
        refeicoes: document.getElementById('refeicoes').value,
        refeicao_itens: document.getElementById('refeicao_itens').value,
        preco_compra: parseFloat(document.getElementById('preco_compra').value) || 0,
        total_imposto: parseFloat(document.getElementById('total_imposto').value) || 0,
        margem_lucro: parseFloat(document.getElementById('margem_lucro').value) || 0,
        custo_operacional: parseFloat(document.getElementById('custo_operacional').value) || 0,
        preco_venda: parseFloat(document.getElementById('preco_venda').value) || 0,
        descricao: document.getElementById('descricao').value,
        ativo: document.getElementById('ativo').checked ? 1 : 0,
    };

    let response;

    try {
        if (action === 'e' && id) {
            response = await api.product.update(id, data);
        } else {
            response = await api.product.insert(data);
        }

        if (response && response.status) {
            toast('success', 'Sucesso', response.msg);
            // CORREÇÃO: Limpando via set null para não dar erro de api.temp.delete()
            await api.temp.set('product:edit', null).catch(() => { });
            setTimeout(() => api.window.close(), 1000);
        } else {
            toast('error', 'Erro', response?.msg || 'Não foi possível salvar o produto.');
            btn.disabled = false;
        }
    } catch (err) {
        toast('error', 'Erro', err.message);
        btn.disabled = false;
    }
});