import { SellingPriceCalculator } from '../components/SellingPriceCalculator.js';

// Função responsável por calcular e rodar a lógica fluid
function calcularPrecoVendaAutomatico() {
    const precoCompraInput = document.getElementById('preco_compra');
    const totalImpostoInput = document.getElementById('total_imposto');
    const margemLucroInput = document.getElementById('margem_lucro');
    const custoOperacionalInput = document.getElementById('custo_operacional');
    const precoVendaInput = document.getElementById('preco_venda');

    if (!precoCompraInput || !precoVendaInput) return;

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

    // 1. PRIMEIRO: Carrega as matérias-primas no Select e aguarda a renderização das opções
    try {
        const response = await api.materiaPrima.find({ limit: 100, offset: 0 });
        const listaMaterias = response.data || response || [];

        if (selectMateriaPrima) {
            selectMateriaPrima.innerHTML = '<option value="">Selecione uma matéria-prima</option>';
            listaMaterias.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.nome} (${item.unidade_medida || 'UN'})`;
                selectMateriaPrima.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar matérias-primas:", error);
        if (selectMateriaPrima) {
            selectMateriaPrima.innerHTML = '<option value="">Erro ao carregar matérias-primas</option>';
        }
    }

    // 2. SEGUNDO: Se for modo edição, restaura todos os campos perfeitamente
    if (temp && temp.action === 'e') {
        if (document.getElementById('id')) document.getElementById('id').value = temp.id ?? '';
        if (document.getElementById('action')) document.getElementById('action').value = 'e';

        if (document.getElementById('alimentos')) document.getElementById('alimentos').value = temp.alimentos ?? '';
        if (document.getElementById('refeicoes')) document.getElementById('refeicoes').value = temp.refeicoes ?? '';
        if (document.getElementById('descricao')) document.getElementById('descricao').value = temp.descricao ?? '';

        // Agora o select vai encontrar o ID correspondente e selecionar o item correto
        if (selectMateriaPrima) selectMateriaPrima.value = temp.refeicao_itens ?? '';

        // Restaura campos numéricos de cálculo
        if (document.getElementById('preco_compra')) document.getElementById('preco_compra').value = temp.preco_compra ?? '';
        if (document.getElementById('total_imposto')) document.getElementById('total_imposto').value = temp.total_imposto ?? '';
        if (document.getElementById('margem_lucro')) document.getElementById('margem_lucro').value = temp.margem_lucro ?? '';
        if (document.getElementById('custo_operacional')) document.getElementById('custo_operacional').value = temp.custo_operacional ?? '';
        if (document.getElementById('preco_venda')) document.getElementById('preco_venda').value = temp.preco_venda ?? '';

        const ativoCheckbox = document.getElementById('ativo');
        if (ativoCheckbox) {
            ativoCheckbox.checked = temp.ativo === true || temp.ativo === 1 || temp.ativo === '1';
        }

        const titulo = document.querySelector('h2');
        if (titulo) titulo.textContent = 'Editar Produto';

        const btnInsert = document.getElementById('insert');
        if (btnInsert) btnInsert.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar';
    } else {
        if (document.getElementById('action')) document.getElementById('action').value = 'c';
    }

    // 3. Ativa os ouvintes para cálculo instantâneo enquanto o usuário digita
    const camposCusto = ['preco_compra', 'total_imposto', 'margem_lucro', 'custo_operacional'];
    camposCusto.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('input', calcularPrecoVendaAutomatico);
        }
    });

    // Roda uma vez logo após renderizar tudo para atualizar o preço sugerido na tela de edição
    calcularPrecoVendaAutomatico();
});

// Envia dados salvando ou atualizando
const btnInsert = document.getElementById('insert');
if (btnInsert) {
    btnInsert.addEventListener('click', async () => {
        const action = document.getElementById('action')?.value;
        const id = document.getElementById('id')?.value;

        btnInsert.disabled = true;

        const data = {
            alimentos: document.getElementById('alimentos')?.value || '',
            refeicoes: document.getElementById('refeicoes')?.value || '',
            refeicao_itens: document.getElementById('refeicao_itens')?.value || '',
            preco_compra: parseFloat(document.getElementById('preco_compra')?.value) || 0,
            total_imposto: parseFloat(document.getElementById('total_imposto')?.value) || 0,
            margem_lucro: parseFloat(document.getElementById('margem_lucro')?.value) || 0,
            custo_operacional: parseFloat(document.getElementById('custo_operacional')?.value) || 0,
            preco_venda: parseFloat(document.getElementById('preco_venda')?.value) || 0,
            descricao: document.getElementById('descricao')?.value || '',
            ativo: document.getElementById('ativo')?.checked ? 1 : 0,
        };

        let response;

        try {
            if (action === 'e' && id) {
                response = await api.product.update(id, data);
            } else {
                response = await api.product.insert(data);
            }

            if (response && response.status) {
                toast('success', 'Sucesso', response.msg || 'Operação realizada com sucesso.');
                await api.temp.set('product:edit', null).catch(() => { });
                setTimeout(() => api.window.close(), 1000);
            } else {
                toast('error', 'Erro', response?.msg || 'Não foi possível salvar o produto.');
                btnInsert.disabled = false;
            }
        } catch (err) {
            toast('error', 'Erro', err.message);
            btnInsert.disabled = false;
        }
    });
}