// SEM fetch, SEM API_URL — tudo via IPC
let dadosNutricionais = [];

document.addEventListener('DOMContentLoaded', () => {
    initRelatorio();
});

async function initRelatorio() {
    await carregarDadosDoServidor();
    configurarEventos();
}

async function carregarDadosDoServidor() {
    try {
        dadosNutricionais = await window.api.relatorioNutricional();
        renderizarRelatorio(dadosNutricionais);
    } catch (error) {
        console.error('Erro IPC relatorio:nutricional:', error);
        const tbody = document.querySelector('#table-relatorio-nutricional tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Erro ao buscar dados. Verifique o handler no route.js.
                </td>
            </tr>
        `;
    }
}

function renderizarRelatorio(dados) {
    renderizarCards(dados);
    renderizarTabela(dados);
}

function renderizarCards(dados) {
    const total = dados.length;

    if (total === 0) {
        document.getElementById('media-kcal').innerHTML = `0 <span class="fs-6">kcal</span>`;
        document.getElementById('media-carbos').innerHTML = `0 <span class="fs-6">g</span>`;
        document.getElementById('media-proteinas').innerHTML = `0 <span class="fs-6">g</span>`;
        document.getElementById('total-produtos').textContent = '0';
        return;
    }

    const somaKcal = dados.reduce((acc, c) => acc + Number(c.kcal || 0), 0);
    const somaCarbos = dados.reduce((acc, c) => acc + Number(c.carbos || 0), 0);
    const somaProteinas = dados.reduce((acc, c) => acc + Number(c.proteinas || 0), 0);

    document.getElementById('media-kcal').innerHTML = `${Math.round(somaKcal / total)} <span class="fs-6">kcal</span>`;
    document.getElementById('media-carbos').innerHTML = `${(somaCarbos / total).toFixed(1)} <span class="fs-6">g</span>`;
    document.getElementById('media-proteinas').innerHTML = `${(somaProteinas / total).toFixed(1)} <span class="fs-6">g</span>`;
    document.getElementById('total-produtos').textContent = total;
}

function renderizarTabela(dados) {
    const tbody = document.querySelector('#table-relatorio-nutricional tbody');
    tbody.innerHTML = '';

    if (dados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    Nenhum cadastro encontrado.
                </td>
            </tr>
        `;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.usuario || '—'}</strong></td>
            <td>${item.produto || '—'}</td>
            <td><span class="badge bg-secondary">${item.porcao || '—'}</span></td>
            <td>${item.kcal || 0} kcal</td>
            <td>${item.carbos || 0}g</td>
            <td>${item.proteinas || 0}g</td>
            <td>${item.gorduras || 0}g</td>
            <td>${item.sodio || 0}mg</td>
            <td class="text-center acao-coluna">
                <button class="btn btn-sm btn-outline-info btn-ver-detalhes" 
                        data-id="${item.id}" title="Ver Tabela Completa">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    vincularAcoesTabela();
}

function configurarEventos() {
    document.getElementById('btn-filtrar')
        .addEventListener('click', executarFiltro);

    ['filtro-usuario', 'filtro-produto'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); executarFiltro(); }
        });
    });

    // Botão PDF — usa o handler 'print' que você já tem no route.js
    const btnImprimir = document.querySelector('button[onclick="window.print()"]');
    if (btnImprimir) {
        btnImprimir.removeAttribute('onclick');
        btnImprimir.addEventListener('click', gerenciarExportacaoPDF);
    }
}

function executarFiltro() {
    const filtroUsuario = document.getElementById('filtro-usuario').value.toLowerCase().trim();
    const filtroProduto = document.getElementById('filtro-produto').value.toLowerCase().trim();

    const filtrados = dadosNutricionais.filter(item => {
        return (item.usuario || '').toLowerCase().includes(filtroUsuario) &&
            (item.produto || '').toLowerCase().includes(filtroProduto);
    });

    renderizarRelatorio(filtrados);
}

function vincularAcoesTabela() {
    document.querySelectorAll('.btn-ver-detalhes').forEach(botao => {
        botao.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            verDetalhesTabelaCompleta(id);
        });
    });
}

function verDetalhesTabelaCompleta(id) {
    // Usa o handler window:openModal que você já tem no route.js
    window.api.openModal('nutricional/detalhes', {
        width: 1000,
        height: 600,
        title: 'Tabela Nutricional Completa'
    });
    // Passa o id via temp store para a janela de detalhes
    window.api.tempSet('nutricional_detalhe_id', id);
}

async function gerenciarExportacaoPDF() {
    // Monta o HTML da tabela atual para passar ao handler 'print' do route.js
    const tabela = document.getElementById('table-relatorio-nutricional').outerHTML;
    const html = `
        <h2>Relatório Nutricional</h2>
        ${tabela}
    `;
    await window.api.print(html, { landscape: true });
}