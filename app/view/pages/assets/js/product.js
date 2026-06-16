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