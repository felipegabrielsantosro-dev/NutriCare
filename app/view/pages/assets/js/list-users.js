import { Datatables } from "../components/Datatables.js";

api.users.onReload(() => {
    $('#table-users').DataTable().ajax.reload(null, false);
});

// Inicializa a tabela
Datatables.SetTable('#table-users', [
    { data: 'id' },
    { data: 'nome' },
    { data: 'email' },
    { data: 'sexo' },
    { data: 'idade' },
    { data: 'altura' },
    { data: 'peso' },
    {
        data: null,
        orderable: false,
        searchable: false,
        render: function (row) {
            return `
                <button onclick="editUser(${row.id})" class="btn btn-xs btn-warning btn-sm">
                    <i class="fa-solid fa-pen-to-square"></i> Editar
                </button>
                <button onclick="deleteUser(${row.id})" class="btn btn-xs btn-danger btn-sm">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            `;
        }
    }
]).getData(filter => api.users.find(filter));

async function deleteUser(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
        const response = await api.users.delete(id);

        if (response.status) {
            toast('success', 'Excluído', response.msg);
            $('#table-users').DataTable().ajax.reload();
        } else {
            toast('error', 'Erro', response.msg);
        }
    }
}

async function editUser(id) {
    try {
        const user = await api.users.findById(id);

        if (!user) {
            toast('error', 'Erro', 'Usuário não encontrado.');
            return;
        }

        // Define o estado temporário idêntico ao que fizemos nos produtos
        await api.temp.set('user:edit', {
            action: 'e',
            ...user,
        });

        // CORREÇÃO: Mudou de api.window.open para api.window.openModal
        // E ajustou o tamanho (900x600) para manter o padrão correto do seu form
        api.window.openModal('pages/users', {
            width: 900,
            height: 600,
            title: 'Editar Usuário',
        });

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message);
    }
}

window.deleteUser = deleteUser;
window.editUser = editUser;