// Vetor global para dar suporte caso precise ler os dados na tela
let listaDeFichasGlobais = [];

const tbody = document.querySelector('#table-fichas tbody');

// =========================================================================
// 1. FUNÇÃO RESPONSÁVEL POR RENDERIZAR A TABELA NA TELA
// =========================================================================
async function carregarFichasTecnicas() {
    try {
        // Busca os dados da API sem passar os filtros complexos que quebravam o Knex
        const response = await api.fichaTecnica.find({});

        console.log("Fichas carregadas com sucesso:", response);

        // Limpa as linhas antigas para não duplicar ao recarregar
        if (tbody) tbody.innerHTML = '';

        // Trata se o retorno vem envelopado em .data ou direto em array
        listaDeFichasGlobais = response.data || response || [];

        if (listaDeFichasGlobais.length === 0) {
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Nenhuma ficha técnica cadastrada.</td></tr>`;
            }
            return;
        }

        listaDeFichasGlobais.forEach(item => {
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${item.nome_produto}</strong></td>
                <td>${item.categoria ?? '—'}</td>
                <td>R$ ${Number(item.custo_total || 0).toFixed(2)}</td>
                <td>R$ ${Number(item.custo_unitario || 0).toFixed(2)}</td>
                <td>${item.rendimento || 1}</td>
                <td>
                    ${item.ativo == 1 || item.ativo === true
                    ? `<span class="badge bg-success">Ativo</span>`
                    : `<span class="badge bg-danger">Inativo</span>`
                }
                </td>
                <td>
                    <button onclick="addIngredientes(${item.id})" class="btn btn-dark btn-sm me-1">
                        <i class="fa-solid fa-plus"></i> Ingredientes
                    </button>
                    <button onclick="editFicha(${item.id})" class="btn btn-warning btn-sm me-1">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                    <button onclick="deleteFicha(${item.id})" class="btn btn-danger btn-sm">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            if (tbody) tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro ao renderizar tabela de fichas:", error);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Erro ao carregar dados do banco de dados.</td></tr>`;
        }
    }
}

// =========================================================================
// 2. INICIALIZAÇÃO AUTOMÁTICA E EVENTOS DO DOM
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    carregarFichasTecnicas();

    // Captura o botão de nova ficha mapeado no HTML para garantir cache limpo
    const btnNovaFicha = document.getElementById('btn-nova-ficha');
    if (btnNovaFicha) {
        btnNovaFicha.addEventListener('click', async () => {
            await api.temp.set('ficha-tecnica:edit', null).catch(() => { });

            api.window.openModal('pages/ficha-tecnica', {
                width: 950,
                height: 650,
                title: 'Cadastrar Nova Ficha Técnica'
            });
        });
    }
});

// =========================================================================
// 3. ESCUTA ATIVA DO RECARREGAMENTO (INTEGRAÇÃO COM O PRELOAD)
// =========================================================================
if (api.fichaTecnica && typeof api.fichaTecnica.onReload === 'function') {
    api.fichaTecnica.onReload(() => {
        console.log("🔄 Recarregamento automático disparado via IPC broadcast!");
        carregarFichasTecnicas();
    });
}

// =========================================================================
// 4. FUNÇÕES DE AÇÃO DOS BOTÕES (EXPOSTAS NO ESCOPO GLOBAL WINDOW)
// =========================================================================

async function addIngredientes(id) {
    try {

        const response = await api.fichaTecnica.findById(id);
        const ficha = response.data || response;

        if (!ficha) {
            toast('error', 'Erro', 'Ficha técnica não encontrada.');
            return;
        }

        await api.temp.set('ficha-tecnica:ingredientes', {
            id: ficha.id,
            nome_produto: ficha.nome_produto
        });

        api.window.open('pages/ficha-tecnica-ingredientes', {
            width: 1200,
            height: 800,
            title: `Ingredientes - ${ficha.nome_produto}`
        });

    } catch (err) {
        console.error(err);
        toast(
            'error',
            'Falha',
            'Não foi possível abrir a tela de ingredientes.'
        );
    }
}

async function editFicha(id) {
    try {
        const response = await api.fichaTecnica.findById(id);
        const ficha = response.data || response;

        if (!ficha) {
            toast('error', 'Erro', 'Ficha técnica não encontrada.');
            return;
        }

        await api.temp.set('ficha-tecnica:edit', {
            action: 'e',
            ...ficha
        });

        api.window.openModal('pages/ficha-tecnica', {
            width: 950,
            height: 650,
            title: 'Editar Ficha Técnica'
        });

    } catch (err) {
        toast('error', 'Falha', 'Não foi possível carregar a edição: ' + err.message);
    }
}

async function deleteFicha(id) {
    const result = await Swal.fire({
        title: 'Tem certeza?',
        text: 'Esta ação não poderá ser desfeita e removerá os ingredientes vinculados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
        try {
            const response = await api.fichaTecnica.delete(id);

            if (response.status) {
                toast('success', 'Removido', response.message || 'Ficha técnica excluída.');
                carregarFichasTecnicas();
            } else {
                toast('error', 'Erro', response.message || 'Não foi possível excluir.');
            }
        } catch (err) {
            toast('error', 'Erro', err.message);
        }
    }
}

// Garante o funcionamento dos cliques dos botões devido ao tipo "module" do arquivo script
window.addIngredientes = addIngredientes;
window.editFicha = editFicha;
window.deleteFicha = deleteFicha;