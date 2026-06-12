import { Datatables } from "../components/Datatables.js";

// Escuta o evento de recarregamento vindo do processo principal do Electron
if (window.api && api.product && typeof api.product.onReload === 'function') {
    api.product.onReload(() => {
        $('#table-products').DataTable().ajax.reload(null, false);
    });
}

// Inicializa a tabela de produtos com o componente padrão do sistema
Datatables.SetTable('#table-products', [
    { data: 'id' },
    { data: 'alimentos' },
    { data: 'refeicoes' },
    { 
        data: 'preco_compra',
        render: function (data) { return formatarMoeda(data); }
    },
    { 
        data: 'preco_venda',
        render: function (data) { return formatarMoeda(data); }
    },
    { 
        data: 'margem_lucro',
        render: function (data) { return data ? `${parseFloat(data).toFixed(2)}%` : '0.00%'; }
    },
    { 
        data: 'ativo',
        render: function (data) {
            return data 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';
        }
    },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editProduct(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteProduct(${row.id})" class="btn btn-xs btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.product.find(filter)); 
// Nota: Se seu backend usar list/findAll em vez de find, altere o "api.product.find(filter)" acima para a função exata de busca com filtros.

/**
 * Ação de exclusão de produto com o SweetAlert2 (Swal) integrado
 */
async function deleteProduct(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        const response = await api.product.delete(id);

        if (response && response.status) {
            toast('success', 'Excluído', response.msg || 'Produto removido com sucesso.');
            $('#table-products').DataTable().ajax.reload();
        } else {
            toast('error', 'Erro', (response && response.msg) || 'Não foi possível excluir o produto.');
        }
    }
}

/**
 * Ação de busca e preparação de dados para o modal de Edição
 */
async function editProduct(id) {
    try {
        // Busca os dados do produto específico pelo ID
        const product = await api.product.findById(id);

        if (!product) {
            toast('error', 'Erro', 'Produto não encontrado.');
            return;
        }

        // Salva temporariamente no estado do Electron indicando a Action 'e' (edição)
        await api.temp.set('product:edit', {
            action: 'e',
            ...product,
        });

        // Abre o modal de cadastro parametrizado
        api.window.openModal('pages/product', {
            width: 900,
            height: 600,
            title: 'Editar Produto',
        });

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

/**
 * Função utilitária para converter decimais na máscara de moeda brasileira
 */
function formatarMoeda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Expõe globalmente no escopo do window para que os gatilhos 'onclick' do HTML/DataTables encontrem as funções
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;