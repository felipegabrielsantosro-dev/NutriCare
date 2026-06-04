import { Datatables } from "../components/Datatables.js";

api.nutricional.onReload(() => {
    $('#tabela_nutricional').DataTable().ajax.reload(null, false);
});

Datatables.SetTable('#tabela_nutricional', [
    { data: 'id' },
    { data: 'usuario_id' },
    { data: 'produto' },
    { data: 'porcao' },
    { data: 'porcoes_embalagem' },
    { data: 'valor_energetico' },
    { data: 'carboidratos' },
    { data: 'acucares_totais' },
    { data: 'acucares_adicionados' },
    { data: 'proteinas' },
    { data: 'gorduras_totais' },
    { data: 'gorduras_saturadas' },
    { data: 'gorduras_trans' },
    { data: 'fibra_alimentar' },
    { data: 'sodio' },

    {
        data: 'criado_em',
        render(data) {
            return new Date(data).toLocaleString('pt-BR');
        }
    },

    {
        data: 'atualizado_em',
        render(data) {
            return new Date(data).toLocaleString('pt-BR');
        }
    },

    {
        data: null,
        orderable: false,
        searchable: false,
        render(row) {
            return `
                <button onclick="editNutricional(${row.id})"
                        class="btn btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Editar
                </button>

                <button onclick="deleteNutricional(${row.id})"
                        class="btn btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i>
                    Excluir
                </button>
            `;
        }
    }
]).getData(async (filter) => {

    const parametrosParaOBanco = {
        term: filter.search?.value || '',
        limit: filter.length || 10,
        offset: filter.start || 0,
        draw: filter.draw || 1,
        column: filter.order?.[0]?.column || 0,
        orderType: filter.order?.[0]?.dir || 'asc'
    };

    return await api.nutricional.find(parametrosParaOBanco);
});

function exibirAviso(tipo, titulo, mensagem) {
    if (typeof toast === 'function') {
        toast(tipo, titulo, mensagem);
        return;
    }

    Swal.fire({
        icon: tipo === 'success' ? 'success' : 'error',
        title: titulo,
        text: mensagem,
        timer: 2500,
        showConfirmButton: false
    });
}

async function deleteNutricional(id) {
    try {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, excluir',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        const response = await api.nutricional.delete(id);

        if (response?.status) {
            exibirAviso('success', 'Excluído', response.msg);
            $('#tabela_nutricional').DataTable().ajax.reload(null, false);
        } else {
            exibirAviso(
                'error',
                'Erro',
                response?.msg || 'Erro ao excluir.'
            );
        }

    } catch (error) {
        console.error(error);
        exibirAviso('error', 'Falha', error.message);
    }
}

async function editNutricional(id) {
    try {

        const nutricional = await api.nutricional.findById(id);

        if (!nutricional) {
            exibirAviso(
                'error',
                'Erro',
                'Tabela Nutricional não encontrada.'
            );
            return;
        }

        await api.temp.set('tabela-nutricional:edit', {
            action: 'e',
            ...nutricional
        });

        api.window.openModal('pages/tabela-nutricional', {
            width: 800,
            height: 420,
            title: 'Editar Tabela Nutricional'
        });

    } catch (error) {
        console.error(error);
        exibirAviso('error', 'Falha', error.message);
    }
}

window.deleteNutricional = deleteNutricional;
window.editNutricional = editNutricional;