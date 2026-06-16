import { SellingPriceCalculator } from '../components/SellingPriceCalculator.js';

// Função responsável por instanciar e rodar o cálculo fluido
function calcularPrecoVendaAutomatico() {
    // 1. Captura os elementos do DOM
    const precoCompraInput = document.getElementById('preco_compra');
    const totalImpostoInput = document.getElementById('total_imposto');
    const margemLucroInput = document.getElementById('margem_lucro');
    const custoOperacionalInput = document.getElementById('custo_operacional');
    const precoVendaInput = document.getElementById('preco_venda');

    // 2. Converte os valores para Float (usa 0 se estiver vazio)
    const precoCompra = parseFloat(precoCompraInput.value) || 0;
    const totalImposto = parseFloat(totalImpostoInput.value) || 0;
    const margemLucro = parseFloat(margemLucroInput.value) || 0;
    const custoOperacional = parseFloat(custoOperacionalInput.value) || 0;

    // 3. Regra de segurança: O preço de compra precisa ser maior que zero 
    // para não disparar o RangeError da classe à toa enquanto digita
    if (precoCompra <= 0) {
        precoVendaInput.value = '';
        return;
    }

    try {
        // 4. Executa o encadeamento fluido (padrão Builder) da sua classe
        const resultado = SellingPriceCalculator.create()
            .addPurchasePrice(precoCompra)
            .addTotalTax(totalImposto)
            .addProfitMargin(margemLucro)
            .addOperatingCost(custoOperacional)
            .getData(); // Executa validações matemáticas e retorna o objeto decomposto

        // 5. Aplica o preço de venda sugerido final de volta na tela
        precoVendaInput.value = resultado.valor_venda_sugerido.toFixed(2);

        // Remove qualquer marcação de erro prévia se o cálculo funcionou
        precoVendaInput.classList.remove('is-invalid');
    } catch (error) {
        // Se a soma dos percentuais der >= 100% ou falhar nas regras da sua classe:
        precoVendaInput.value = '';
        precoVendaInput.classList.add('is-invalid');

        // Opcional: printar no console de desenvolvimento o motivo do bloqueio do cálculo
        console.warn('Cálculo bloqueado temporariamente:', error.message);
    }
}

// Carrega os dados do temp quando for edição
window.addEventListener('DOMContentLoaded', async () => {
    const temp = await api.temp.get('product:edit');

    if (temp && temp.action === 'e') {
        // Preenche os campos ocultos
        document.getElementById('id').value = temp.id ?? '';
        document.getElementById('action').value = 'e';

        // Preenche os campos de texto
        document.getElementById('alimentos').value = temp.alimentos ?? '';
        document.getElementById('refeicoes').value = temp.refeicoes ?? '';
        document.getElementById('refeicao_itens').value = temp.refeicao_itens ?? '';
        document.getElementById('descricao').value = temp.descricao ?? '';

        // Preenche os campos numéricos
        document.getElementById('preco_compra').value = temp.preco_compra ?? '';
        document.getElementById('total_imposto').value = temp.total_imposto ?? '';
        document.getElementById('margem_lucro').value = temp.margem_lucro ?? '';
        document.getElementById('custo_operacional').value = temp.custo_operacional ?? '';
        document.getElementById('preco_venda').value = temp.preco_venda ?? '';

        // Preenche o checkbox ativo
        document.getElementById('ativo').checked = temp.ativo === true || temp.ativo === 1;

        // Muda o título e o botão para modo edição
        document.querySelector('h2').textContent = 'Editar Produto';
        document.getElementById('insert').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Atualizar';
    }

    // =========================================================================
    // Ouvintes em tempo real mapeados para disparar o cálculo
    // =========================================================================
    const camposCusto = ['preco_compra', 'total_imposto', 'margem_lucro', 'custo_operacional'];

    camposCusto.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('input', calcularPrecoVendaAutomatico);
        }
    });
});

// Salvar / Atualizar
document.getElementById('insert').addEventListener('click', async () => {
    const action = document.getElementById('action').value;
    const id = document.getElementById('id').value;

    const data = {
        action,
        id,
        alimentos: document.getElementById('alimentos').value,
        refeicoes: document.getElementById('refeicoes').value,
        refeicao_itens: document.getElementById('refeicao_itens').value,
        preco_compra: document.getElementById('preco_compra').value,
        total_imposto: document.getElementById('total_imposto').value,
        margem_lucro: document.getElementById('margem_lucro').value,
        custo_operacional: document.getElementById('custo_operacional').value,
        preco_venda: document.getElementById('preco_venda').value,
        descricao: document.getElementById('descricao').value,
        ativo: document.getElementById('ativo').checked,
    };

    let response;

    if (action === 'e' && id) {
        response = await api.product.update(id, data);
    } else {
        response = await api.product.insert(data);
    }

    if (response && response.status) {
        toast('success', 'Sucesso', response.msg);
        setTimeout(() => api.window.close(), 1000);
    } else {
        toast('error', 'Erro', response?.msg || 'Não foi possível salvar o produto.');
    }
});