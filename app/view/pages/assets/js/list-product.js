import { Datatables } from '../components/datatables.js';

// Inicializa a tabela trazendo de volta as colunas de precificação
Datatables.SetTable('#table-products', [
    { data: 'id' },
    { data: 'alimentos' }, // Coluna Alimento / Produto
    { data: 'refeicoes' }, // Coluna Refeição

    // Formatação para moeda R$
    {
        data: 'preco_compra',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    // Formatação para moeda R$
    {
        data: 'preco_venda',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    // Formatação para percentual %
    {
        data: 'margem_lucro',
        render(data) {
            return `${parseFloat(data || 0).toFixed(2)}%`;
        }
    },

    {
        data: 'ativo',
        render(data) {
            const isActive = data === true || data === 1 || data === '1';
            return isActive
                ? `<span class="badge bg-success">Ativo</span>`
                : `<span class="badge bg-danger">Inativo</span>`;
        }
    },

    {
        data: null,
        orderable: false,
        searchable: false,
        render(data, type, row) {
            return `
                <button onclick="editProduct(${row.id})"
                        class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Editar
                </button>

                <button onclick="deleteProduct(${row.id})"
                        class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i>
                    Excluir
                </button>
            `;
        }
    }
]).getData((filter) => api.product.find(filter));

// Escuta o recarregamento assíncrono do Electron (quando salvar ou atualizar um produto)
api.product.onReload(() => {
    if ($.fn.DataTable.isDataTable('#table-products')) {
        $('#table-products').DataTable().ajax.reload(null, false);
    }
});

// =========================================================================
// FUNÇÕES DE AÇÃO (EXPOSTAS PARA O WINDOW)
// =========================================================================

async function deleteProduct(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Deseja realmente excluir este produto?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await api.product.delete(id);

            if (response && response.status) {
                toast('success', 'Excluído', response.msg || 'Produto removido com sucesso.');
                if ($.fn.DataTable.isDataTable('#table-products')) {
                    $('#table-products').DataTable().ajax.reload(null, false);
                }
            } else {
                toast('error', 'Erro', response?.msg || 'Não foi possível excluir o produto.');
            }
        } catch (err) {
            console.error("Erro ao deletar produto:", err);
            toast('error', 'Erro', err.message);
        }
    }
}

async function editProduct(id) {
    try {
        const response = await api.product.findById(id);

        // 1. ANÁLISE DE SEGURANÇA: Descobre onde estão os dados reais do produto
        let productData = null;

        if (response) {
            // Se a API retornar os dados direto ou dentro de .data
            productData = response.data || response;

            // Caso o backend retorne um Array [ {...} ], pega o primeiro item
            if (Array.isArray(productData)) {
                productData = productData[0];
            }
        }

        if (!productData || Object.keys(productData).length === 0) {
            toast('error', 'Erro', 'Os dados do produto não foram localizados pelo sistema.');
            return;
        }

        // 2. PERSISTÊNCIA LIMPA: Passa as chaves diretas para o cache temporário
        await api.temp.set('product:edit', {
            action: 'e',
            id: productData.id,
            alimentos: productData.alimentos || '',
            refeicoes: productData.refeicoes || '',
            refeicao_itens: productData.refeicao_itens || '',
            preco_compra: productData.preco_compra ?? '',
            total_imposto: productData.total_imposto ?? '',
            margem_lucro: productData.margem_lucro ?? '',
            custo_operacional: productData.custo_operacional ?? '',
            preco_venda: productData.preco_venda ?? '',
            descricao: productData.descricao || '',
            ativo: productData.ativo
        });

        // 3. ABRE A JANELA (Corrigido: Removido a duplicidade do openModal que estava fora do timeout)
        setTimeout(() => {
            api.window.openModal('pages/product', {
                width: 900,
                height: 600,
                title: 'Editar Produto'
            });
        }, 100);

    } catch (err) {
        console.error("Erro detalhado ao editar produto:", err);
        toast('error', 'Falha', 'Erro ao carregar dados para edição: ' + err.message);
    }
}

// Vincula ao escopo global por causa do type="module" do script
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;