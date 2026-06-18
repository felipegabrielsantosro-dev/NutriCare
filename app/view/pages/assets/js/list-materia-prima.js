import { Datatables } from '../components/datatables.js';

// Inicializa a tabela CORRETAMENTE usando o encadeamento .getData()
Datatables.SetTable('#materia-prima', [
    { data: 'id' },
    { data: 'nome' },
    { data: 'categoria' },
    { data: 'unidade_medida' },

    {
        data: 'preco_compra',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    { data: 'peso_bruto' },
    { data: 'peso_liquido' },
    { data: 'fator_correcao' },

    {
        data: 'custo_por_kg',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    {
        data: 'custo_por_litro',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    {
        data: 'preco_venda',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    {
        data: 'valor_total',
        render(data) {
            return `R$ ${parseFloat(data || 0).toFixed(2)}`;
        }
    },

    {
        data: 'data_criacao',
        render(data) {
            return data
                ? new Date(data).toLocaleString('pt-BR')
                : '-';
        }
    },

    {
        data: 'data_atualizacao',
        render(data) {
            return data
                ? new Date(data).toLocaleString('pt-BR')
                : '-';
        }
    },

    {
        data: null,
        orderable: false,
        searchable: false,
        render(data, type, row) {
            return `
                <button onclick="editMateriaPrima(${row.id})"
                        class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Editar
                </button>

                <button onclick="deleteMateriaPrima(${row.id})"
                        class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i>
                    Excluir
                </button>
            `;
        }
    }
]).getData((filter) => api.materiaPrima.find(filter)); // <-- O SEGREDO ESTAVA AQUI!

// Escuta o recarregamento assíncrono do Electron
api.materiaPrima.onReload(() => {
    if ($.fn.DataTable.isDataTable('#materia-prima')) {
        $('#materia-prima').DataTable().ajax.reload(null, false);
    }
});

async function deleteMateriaPrima(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const response = await api.materiaPrima.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#materia-prima').DataTable().ajax.reload(null, false);
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}

async function editMateriaPrima(id) {
    try {
        const materiaPrima = await api.materiaPrima.findById(id);

        if (!materiaPrima) {
            toast('error', 'Erro', 'Matéria-Prima não encontrada.');
            return;
        }

        // Envia para o cache com o nome correto esperado pelo formulário
        await api.temp.set('materia-prima:edit', {
            action: 'e',
            ...materiaPrima
        });

        // Abre a tela correspondente ao arquivo
        api.window.openModal('pages/materia-prima', {
            width: 1000,
            height: 650,
            title: 'Editar Matéria-Prima'
        });

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

// Vincula obrigatoriamente ao escopo global por causa do type="module"
window.deleteMateriaPrima = deleteMateriaPrima;
window.editMateriaPrima = editMateriaPrima;