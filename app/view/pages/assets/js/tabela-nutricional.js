import { Datatables } from "../components/Datatables.js"
api.nutricional.onReload(() => {
    $('#tabela_nutricional').DataTable().ajax.reload(null, false);
});
// Inicializa a tabela
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
]).getData(async (filter) => {
    // 🔍 MAPEAMENTO DO FILTRO: Traduz o formato do DataTables para o seu Backend
    const parametrosParaOBanco = {
        term: filter.search?.value || '',          // Pega o texto digitado na busca
        limit: filter.length || 10,                // Quantidade de registros por página
        offset: filter.start || 0,                 // Onde começa a paginação
        draw: filter.draw || 1,                    // Controle interno do DataTables
        column: filter.order?.[0]?.column || 0,    // Índice da coluna que está ordenada
        orderType: filter.order?.[0]?.dir || 'asc' // Direção da ordenação (asc/desc)
    };

    // Envia os dados tratados para a sua API
    return await api.nutricional.find(parametrosParaOBanco);
});

// Função auxiliar segura para avisos (caso seu toast original esteja quebrando)
function exibirAviso(tipo, titulo, mensagem) {
    if (typeof toast === 'function') {
        toast(tipo, titulo, mensagem);
    } else {
        // Fallback seguro usando SweetAlert caso a função 'toast' não exista
        Swal.fire({
            icon: tipo === 'success' ? 'success' : 'error',
            title: titulo,
            text: mensagem,
            timer: 2500,
            showConfirmButton: false
        });
    }
}

async function deleteNutricional(id) {
    try {
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

            if (response && response.status) {
                exibirAviso('success', 'Excluído', response.msg);
                $('#tabela_nutricional').DataTable().ajax.reload(null, false);
            } else {
                exibirAviso('error', 'Erro', response?.msg || 'Erro desconhecido ao excluir.');
            }
        }
    } catch (error) {
        console.error("Erro ao deletar:", error);
        exibirAviso('error', 'Falha', error.message);
    }
}

async function editNutricional(id) {
    try {
        const nutricional = await api.nutricional.findById(id);
        if (!nutricional) {
            exibirAviso('error', 'Erro', 'Tabela Nutricional não encontrada.');
            return;
        }
        
        await api.temp.set('tabela-nutricional:edit', {
            action: 'e',
            ...nutricional,
        });
        
        api.window.openModal('pages/tabela-nutricional', {
            width: 800,
            height: 420,
            title: 'Editar Tabela Nutricional',
        });
    } catch (err) {
        console.error("Erro ao abrir edição:", err);
        exibirAviso('error', 'Falha', 'Erro: ' + err.message);
    }
}

// Garante que o HTML do Datatables consiga enxergar as funções ao clicar
window.deleteNutricional = deleteNutricional;
window.editNutricional = editNutricional;