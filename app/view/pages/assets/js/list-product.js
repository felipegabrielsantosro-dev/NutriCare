import { Datatables } from '../components/datatables.js';

// Inicializa a tabela trazendo de volta as colunas de precificação
Datatables.SetTable('#table-products', [
    { data: 'id' },
    { data: 'alimentos' }, // Coluna Alimento / Produto
    { data: 'refeicoes' }, // Coluna Refeição

    // RETORNADO: Formatação para moeda R$
    {
        data: 'preco_compra',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    // RETORNADO: Formatação para moeda R$
    {
        data: 'preco_venda',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    // RETORNADO: Formatação para percentual %
    {
        data: 'margem_lucro',
        render(data) {
            return `${parseFloat(data || 0).toFixed(2)}%`;
        }
    },

    {
        data: 'ativo',
        render(data) {
            const isActive = data === true || data === 1;
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
        const response = await api.product.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#table-products').DataTable().ajax.reload(null, false);
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}

async function editProduct(id) {
    try {
        const product = await api.product.findById(id);

        if (!product) {
            toast('error', 'Erro', 'Produto não encontrado.');
            return;
        }

        // Passa os dados para o cache temporário
        await api.temp.set('product:edit', {
            action: 'e',
            ...product
        });

        // Abre a modal mapeada na rota 'pages/product'
        api.window.openModal('pages/product', {
            width: 900,
            height: 600,
            title: 'Editar Produto'
        });

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

// Vincula ao escopo global por causa do type="module" do script
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;