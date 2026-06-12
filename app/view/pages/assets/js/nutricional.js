import { SellingPriceCalculator } from "../components/SellingPriceCalculator.js";

const form = document.getElementById('form');
const Action = document.getElementById('action');
const Id = document.getElementById('id');

const inputTotalTax = document.getElementById('total_imposto');
const inputProfitMargin = document.getElementById('margem_lucro');
const inputOperatingCost = document.getElementById('custo_operacional');
const inputPurchasePrice = document.getElementById('preco_compra');

// Inicialização Assíncrona da Página
async function carregarUsuarios() {
    const selectUser = document.getElementById('user');
    if (!selectUser) return;

    try {
        // Criamos uma promessa que "explode" se demorar mais de 3 segundos
        const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Tempo limite esgotado (Timeout)")), 3000)
        );

        // Criamos a promessa real que busca os dados
        const buscaDados = (async () => {
            if (window.api && api.users && typeof api.users.list === 'function') {
                return await api.users.list();
            } else if (window.api && api.user && typeof api.user.list === 'function') {
                return await api.user.list();
            }
            return null;
        })();

        // Corrida: O que acontecer primeiro (os dados chegarem ou dar 3 segundos)
        const usuarios = await Promise.race([buscaDados, timeout]);

        selectUser.innerHTML = '<option value="">Selecione um usuário...</option>';

        if (usuarios && usuarios.length > 0) {
            usuarios.forEach(usuario => {
                const option = document.createElement('option');
                option.value = usuario.id;
                option.textContent = usuario.nome;
                selectUser.appendChild(option);
            });
        } else {
            selectUser.innerHTML = '<option value="">Nenhum usuário localizado no banco</option>';
        }

    } catch (error) {
        console.error("A requisição travou ou falhou:", error);
        selectUser.innerHTML = '<option value="">Erro: A API do Electron não respondeu</option>';
    }
}

// Configurações das Máscaras de Entrada (Se aplicável à sua tela)
if (typeof Inputmask !== 'undefined') {
    Inputmask("currency", {
        radixPoint: ',',
        inputtype: "text",
        prefix: 'R$ ',
        autoGroup: true,
        groupSeparator: '.',
        rightAlign: false,
        onBeforeMask: function (value) { return String(value).replace('.', ','); }
    }).mask("#preco_venda, #preco_compra");

    Inputmask("currency", {
        radixPoint: ',',
        inputtype: "text",
        prefix: '% ',
        autoGroup: true,
        groupSeparator: '.',
        rightAlign: false,
        onBeforeMask: function (value) { return String(value).replace('.', ','); }
    }).mask("#total_imposto, #margem_lucro, #custo_operacional");
}

// Cálculo de preço sugerido (Mantido para compatibilidade com o seu escopo de produto)
function determineSalePrice() {
    if (!inputPurchasePrice || !inputTotalTax || !inputProfitMargin || !inputOperatingCost) return;

    const purchasePrice = parseFloat(String(inputPurchasePrice.value).replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
    const tax = parseFloat(String(inputTotalTax.value).replace('%', '').replace(',', '.')) || 0;
    const profitMargin = parseFloat(String(inputProfitMargin.value).replace('%', '').replace(',', '.')) || 0;
    const operatingCost = parseFloat(String(inputOperatingCost.value).replace('%', '').replace(',', '.')) || 0;

    if (profitMargin <= 0 && purchasePrice <= 0) {
        const rowResult = document.getElementById('resultado-row');
        if (rowResult) rowResult.className = 'resultado-row mb-2 d-none';
        return;
    }

    if (typeof SellingPriceCalculator !== 'undefined') {
        const result = SellingPriceCalculator.create()
            .addTotalTax(tax)
            .addProfitMargin(profitMargin)
            .addOperatingCost(operatingCost)
            .addPurchasePrice(purchasePrice)
            .getData();

        document.getElementById('val-venda').innerHTML = `${result.valor_venda_sugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        document.getElementById('val-margem').innerHTML = `${result.valor_margem_lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        document.getElementById('val-custo').innerHTML = `${result.valor_custo_operacional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        document.getElementById('val-imposto').innerHTML = `${result.valor_total_imposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
        document.getElementById('resultado-row').className = 'resultado-row mb-2';
    }
}

// Ouvintes para Inputs de cálculo
[inputTotalTax, inputProfitMargin, inputOperatingCost, inputPurchasePrice].forEach(input => {
    if (input) input.addEventListener('input', determineSalePrice);
});

// Ação de Envio e Persistência do Formulário
document.getElementById('insert').addEventListener('click', async () => {
    try {
        const data = Object.fromEntries(new FormData(form).entries());

        const campoAtivo = document.getElementById('ativo');
        data.ativo = campoAtivo ? campoAtivo.checked : false;

        let response;

        if (Action.value === 'e') {
            response = await api.nutricional.update(data);
        } else {
            response = await api.nutricional.insert(data);
        }

        if (response.status) {
            toast('success', 'Sucesso', response.msg || 'Registro salvo com sucesso!');
            if (api.nutricional && typeof api.nutricional.reload === 'function') api.nutricional.reload();
            if (api.window && typeof api.window.close === 'function') api.window.close();
        } else {
            toast('error', 'Erro', response.msg || 'Não foi possível salvar os dados.');
        }
    } catch (err) {
        toast('error', 'Erro', err.message);
    }
});