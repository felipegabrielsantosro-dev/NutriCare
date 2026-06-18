const InsertButton = document.getElementById('insert');
const Action = document.getElementById('action');
const Id = document.getElementById('id');
const form = document.getElementById('form');

const precoCompra = document.getElementById('preco_compra');
const pesoBruto = document.getElementById('peso_bruto');
const pesoLiquido = document.getElementById('peso_liquido');

const fatorCorrecao = document.getElementById('fator_correcao');
const custoKg = document.getElementById('custo_por_kg');
const custoLitro = document.getElementById('custo_por_litro');
const precoVenda = document.getElementById('preco_venda');
const margemLucro = document.getElementById('margem_lucro');
const valorTotal = document.getElementById('valor_total');

// Função auxiliar para transformar o formulário em Objeto JSON
function formToJson(formElement) {
    const formData = new FormData(formElement);
    const object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });
    return object;
}

function calcularMateriaPrima() {
    const preco = parseFloat(precoCompra?.value) || 0;
    const pb = parseFloat(pesoBruto?.value) || 0;
    const pl = parseFloat(pesoLiquido?.value) || 0;
    // Pega a margem digitada ou usa 30 como padrão se estiver vazio
    const margem = parseFloat(margemLucro?.value) || 30;

    let fc = 0;
    if (pb > 0 && pl > 0) {
        fc = pb / pl;
    }
    fatorCorrecao.value = fc.toFixed(3);

    let custoReal = 0;
    if (pl > 0) {
        custoReal = preco / pl;
    }

    custoKg.value = custoReal.toFixed(2);
    custoLitro.value = custoReal.toFixed(2);

    // Margem dinâmica baseada no input do usuário
    const precoFinal = custoReal * (1 + (margem / 100));
    precoVenda.value = precoFinal.toFixed(2);

    // valor total da compra já com margem
    const total = preco * (1 + margem / 100);

    if (valorTotal) {
        valorTotal.value = total.toFixed(2);
    }
}

precoCompra?.addEventListener('input', calcularMateriaPrima);
pesoBruto?.addEventListener('input', calcularMateriaPrima);
pesoLiquido?.addEventListener('input', calcularMateriaPrima);
margemLucro?.addEventListener('input', calcularMateriaPrima);
calcularMateriaPrima();

// ==========================
// EDIÇÃO
// ==========================
(async () => {
    try {
        // CORREÇÃO: Mudado de underline para hífen para sincronizar com list-materia-prima.js
        const editData = await api.temp.get('materia-prima:edit');

        if (editData) {
            Action.value = editData.action || 'e';
            Id.value = editData.id || '';

            for (const [key, value] of Object.entries(editData)) {
                const field = form.querySelector(`[name="${key}"]`);
                if (!field) continue;

                if (field.type === 'checkbox') {
                    field.checked = value === true || value === 1;
                } else {
                    field.value = value ?? '';
                }
            }
            calcularMateriaPrima();
        } else {
            Action.value = 'c';
            Id.value = '';
        }
    } catch (error) {
        console.error(error);
    }
})();

// ==========================
// VALIDAÇÃO
// ==========================
function validate(data) {
    if (!data.nome) return 'Matéria-Prima é obrigatória';
    if (!data.categoria) return 'Categoria é obrigatória';
    if (!data.unidade_medida) return 'Unidade é obrigatória';
    return null;
}

// ==========================
// SALVAR
// ==========================
InsertButton.addEventListener('click', async () => {
    const timer = 3000;

    // Desabilita o botão usando JS nativo para evitar conflito
    InsertButton.disabled = true;

    const data = formToJson(form);
    const error = validate(data);

    if (error) {
        toast('error', 'Erro', error, timer);
        InsertButton.disabled = false;
        return;
    }

    try {
        const response = Action.value === 'c'
            ? await api.materiaPrima.insert(data)
            : await api.materiaPrima.update(Id.value, data);

        if (!response.status) {
            toast('error', 'Erro', response.msg, timer);
            InsertButton.disabled = false; // Garante que reativa se a API rejeitar
            return;
        }

        toast('success', 'Sucesso', response.msg, timer);

        setTimeout(() => {
            api.window.close();
        }, timer);

    } catch (error) {
        toast('error', 'Erro', error.message, timer);
        InsertButton.disabled = false;
    }
});