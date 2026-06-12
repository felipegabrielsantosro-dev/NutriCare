// URL do endpoint do seu sistema. Ajuste a rota de acordo com o seu back-end.
const API_URL = '/api/nutricional';

// Armazenamento local dos dados para filtros rápidos
let dadosNutricionais = [];

document.addEventListener('DOMContentLoaded', () => {
    initRelatorio();
});

/**
 * Inicializa a página carregando os dados reais e configurando os eventos
 */
async function initRelatorio() {
    await carregarDadosDoServidor();
    configurarEventos();
}

/**
 * Busca os dados reais vindos do banco de dados/back-end
 */
async function carregarDadosDoServidor() {
    try {
        // Faz a requisição real para o seu servidor
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }

        // Alimenta a variável global com o JSON retornado do back-end
        dadosNutricionais = await response.json();

        // Renderiza a tela com os dados vindos do banco
        renderizarRelatorio(dadosNutricionais);

    } catch (error) {
        console.error('Erro ao carregar dados do relatório:', error);

        // Alerta visual amigável em caso de erro na rota
        const tbody = document.querySelector('#table-relatorio-nutricional tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    <i class="fa-solid fa-circle-exclamation"></i> 
                    Erro ao conectar com o servidor para buscar os cadastros. Verifique a rota API.
                </td>
            </tr>
        `;
    }
}

/**
 * Renderiza os Cards de KPIs e a Tabela com os dados atuais
 */
function renderizarRelatorio(dados) {
    renderizarCards(dados);
    renderizarTabela(dados);
}

/**
 * Calcula e renderiza as médias nos cards de KPI
 */
function renderizarCards(dados) {
    const total = dados.length;

    if (total === 0) {
        document.getElementById('media-kcal').innerHTML = `0 <span class="fs-6">kcal</span>`;
        document.getElementById('media-carbos').innerHTML = `0 <span class="fs-6">g</span>`;
        document.getElementById('media-proteinas').innerHTML = `0 <span class="fs-6">g</span>`;
        document.getElementById('total-produtos').textContent = '0';
        return;
    }

    const somaKcal = dados.reduce((acc, curr) => acc + Number(curr.kcal || 0), 0);
    const somaCarbos = dados.reduce((acc, curr) => acc + Number(curr.carbos || 0), 0);
    const somaProteinas = dados.reduce((acc, curr) => acc + Number(curr.proteinas || 0), 0);

    document.getElementById('media-kcal').innerHTML = `${Math.round(somaKcal / total)} <span class="fs-6">kcal</span>`;
    document.getElementById('media-carbos').innerHTML = `${(somaCarbos / total).toFixed(1)} <span class="fs-6">g</span>`;
    document.getElementById('media-proteinas').innerHTML = `${(somaProteinas / total).toFixed(1)} <span class="fs-6">g</span>`;
    document.getElementById('total-produtos').textContent = total;
}

/**
 * Popula a tabela HTML dinamicamente
 */
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

        // Mapeia as propriedades exatamente como costumam vir do back-end
        tr.innerHTML = `
            <td><strong>${item.usuario || item.user || '—'}</strong></td>
            <td>${item.produto || item.alimentos || '—'}</td>
            <td><span class="badge bg-secondary">${item.porcao || '—'}</span></td>
            <td>${item.kcal || item.valor_energetico || 0} kcal</td>
            <td>${item.carbos || item.carboidratos || 0}g</td>
            <td>${item.proteinas || 0}g</td>
            <td>${item.gorduras || item.gorduras_totais || 0}g</td>
            <td>${item.sodio || 0}mg</td>
            <td class="text-center acao-coluna">
                <button class="btn btn-sm btn-outline-info btn-ver-detalhes" data-id="${item.id}" title="Ver Tabela Completa">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    vincularAcoesTabela();
}

/**
 * Configura os ouvintes de eventos da página
 */
function configurarEventos() {
    const btnFiltrar = document.getElementById('btn-filtrar');

    // Evento do botão de filtrar
    btnFiltrar.addEventListener('click', executarFiltro);

    // Filtro dinâmico ao pressionar "Enter"
    ['filtro-usuario', 'filtro-produto'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executarFiltro();
            }
        });
    });

    // Evento do botão de Exportar / Imprimir para PDF
    const btnImprimir = document.querySelector('button[onclick="window.print()"]');
    if (btnImprimir) {
        // Removemos o atributo antigo do HTML e colocamos a função tratada via JS
        btnImprimir.removeAttribute('onclick');
        btnImprimir.addEventListener('click', gerenciarExportacaoPDF);
    }
}

/**
 * Regra de filtragem em memória
 */
function executarFiltro() {
    const filtroUsuario = document.getElementById('filtro-usuario').value.toLowerCase().trim();
    const filtroProduto = document.getElementById('filtro-produto').value.toLowerCase().trim();

    const dadosFiltrados = dadosNutricionais.filter(item => {
        const nomeUsuario = (item.usuario || item.user || '').toLowerCase();
        const nomeProduto = (item.produto || item.alimentos || '').toLowerCase();

        return nomeUsuario.includes(filtroUsuario) && nomeProduto.includes(filtroProduto);
    });

    renderizarRelatorio(dadosFiltrados);
}

/**
 * Vincula as funções dos botões internos da tabela
 */
function vincularAcoesTabela() {
    const botoesDetalhes = document.querySelectorAll('.btn-ver-detalhes');
    botoesDetalhes.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            verDetalhesTabelaCompleta(id);
        });
    });
}

/**
 * Abre a modal contendo a tabela nutricional completa do item
 */
function verDetalhesTabelaCompleta(id) {
    if (window.api && window.api.window) {
        api.window.openModal(`pages/nutricional/detalhes?id=${id}`, {
            width: 1000,
            height: 600,
            title: 'Visualizar Tabela Nutricional Completa'
        });
    }
}

/**
 * Prepara o layout e chama o gerenciador de impressão para salvar em PDF de forma limpa
 */
function gerenciarExportacaoPDF() {
    // Adiciona uma folha de estilo temporária para que o PDF não saia com botões e campos de busca estranhos
    const estiloImpressao = document.createElement('style');
    estiloImpressao.id = 'estilo-pdf-temporario';
    estiloImpressao.innerHTML = `
        @media print {
            /* Esconde os filtros e botões de ação que não fazem sentido no PDF impresso */
            #form-filtros-relatorio, .card.mb-4, button, .acao-coluna, th:last-child {
                display: none !important;
            }
            body {
                padding: 20px;
                background-color: #fff !important;
            }
            .card {
                border: 1px solid #dee2e6 !important;
                box-shadow: none !important;
            }
        }
    `;
    document.head.appendChild(estiloImpressao);

    // Dispara a janela nativa. O usuário poderá escolher "Salvar como PDF" direto no sistema operacional
    window.print();

    // Remove o estilo temporário após fechar a janela de impressão
    setTimeout(() => {
        const elementoEstilo = document.getElementById('estilo-pdf-temporario');
        if (elementoEstilo) elementoEstilo.remove();
    }, 1000);
}