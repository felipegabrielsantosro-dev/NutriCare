import { Datatables } from "../components/Datatables.js"
api.product.onReload(() => {
    $('#tabela-nutricional').DataTable().ajax.reload(null, false);
});
// Inicializa a tabela
Datatables.SetTable('#tabela-nutricional', [
    { data: 'id' },
    { data: 'nome' },
    { data: 'codigo_barra' },
    { data: 'unidade' },
    {
        data: 'preco_compra',
        render: function (data) {
            return parseFloat(data).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    },
    {
        data: 'preco_venda',
        render: function (data) {
            return parseFloat(data).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
    },
    {
        data: 'ativo',
        render: function (data) {
            return data
                ? `<span>Ativo <i class="fa-regular fa-square-check"></i></span>`
                : `<span>Inativo <i class="fa-regular fa-square-full"></i></span>`;
        }
    },
    {
        data: 'criado_em',
        render: function (data) {
            return new Date(data).toLocaleString('pt-BR');
        }
    },
    {
        data: 'atualizado_em',
        render: function (data) {
            return new Date(data).toLocaleString('pt-BR');
        }
    },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editNutricional(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteNutricional(${row.id})" class="btn btn-xs btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.nutricional.find(filter));
async function deleteNutricional(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        const response = await api.nutricional.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#tabela-nutricional').DataTable().ajax.reload();
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}
async function editNutricional(id) {
    try {
        // 1. Busca os dados completos do produto
        const product = await api.product.findById(id);
        if (!product) {
            toast('error', 'Erro', 'Tabela Nutricional não encontrado.');
            return;
        }
        // 2. Salva no temp store com a ação 'e' (editar)
        await api.temp.set('nutricional:edit', {
            action: 'e',
            ...product,
        });
        // 3. Abre a modal
        api.window.openModal('pages/nutricional', {
            width: 800,
            height: 420,
            title: 'Editar Produto',
        });
    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;