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
                    <button onclick="editFicha(${item.id})" class="btn btn-warning btn-smme-1">
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
// 2. INICIALIZAÇÃO AUTOMÁTICA (DOM LOAD)
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
    carregarFichasTecnicas();
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

async function editFicha(id) {
    try {
        const response = await api.fichaTecnica.findById(id);
        const ficha = response.data || response;

        if (!ficha) {
            toast('error', 'Erro', 'Ficha técnica não encontrada.');
            return;
        }

        // Envia a ficha e seus sub-itens vinculados para a memória cache do form
        await api.temp.set('ficha-tecnica:edit', {
            action: 'e',
            ...ficha
        });

        // Abre a tela modal mapeada na sua rota de visualização
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
        text: 'Esta ação não poderá ser desfeita e removerá os insumos vinculados.',
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
                carregarFichasTecnicas(); // Atualiza a lista na hora
            } else {
                toast('error', 'Erro', response.message || 'Não foi possível excluir.');
            }
        } catch (err) {
            toast('error', 'Erro', err.message);
        }
    }
}

// Garante o funcionamento dos cliques dos botões devido ao tipo "module" do arquivo script
window.editFicha = editFicha;
window.deleteFicha = deleteFicha;