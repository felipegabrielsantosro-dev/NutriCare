async function init() {
    const totais = await api.dashboard.totais();

    // Cards (🌟 Usuário removido)
    document.getElementById('total-tabelas').textContent = totais.fichas;
    document.getElementById('total-produtos').textContent = totais.produtos;
    document.getElementById('total-materia_prima').textContent = totais.materiasPrimas;

    // Produtos por mês
    new window.Chart(document.getElementById('graficoProdutos'), {
        type: 'bar',
        data: {
            labels: totais.meses,
            datasets: [{
                label: 'Produtos cadastrados',
                data: totais.dadosProdutos,
                backgroundColor: '#198754',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // 🌟 REMOVIDO: Gráfico de Usuários por mês (graficoUsuarios)

    // Distribuição (🌟 Usuário removido dos labels e dados)
    new window.Chart(document.getElementById('graficoUsuariosMes'), {
        type: 'doughnut',
        data: {
            labels: [
                'Produtos',
                'Matérias-Primas',
                'Fichas Técnicas'
            ],
            datasets: [{
                data: [
                    totais.produtos,
                    totais.materiasPrimas,
                    totais.fichas
                ],
                backgroundColor: [
                    '#198754',
                    '#0dcaf0',
                    '#0d6efd'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Pizza (🌟 Usuário removido dos labels e dados)
    new window.Chart(document.getElementById('graficoPizza'), {
        type: 'pie',
        data: {
            labels: [
                'Produtos',
                'Matérias-Primas',
                'Fichas Técnicas'
            ],
            datasets: [{
                data: [
                    totais.produtos,
                    totais.materiasPrimas,
                    totais.fichas
                ],
                backgroundColor: [
                    '#198754',
                    '#0dcaf0',
                    '#0d6efd'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

window.exportarPDF = function () {

    const totalFichas = document.getElementById('total-tabelas').textContent;
    const totalProdutos = document.getElementById('total-produtos').textContent;
    const totalMaterias = document.getElementById('total-materia_prima').textContent;

    const html = `
        <style>
            body{
                font-family:Arial,sans-serif;
                color:#333;
                padding:20px;
            }

            h1{
                color:#198754;
                border-bottom:2px solid #198754;
                padding-bottom:8px;
            }

            h2{
                color:#444;
                margin-top:25px;
            }

            .cards{
                display:flex;
                gap:15px;
                margin:20px 0;
            }

            .card{
                flex:1;
                border-radius:10px;
                padding:15px;
                color:white;
            }

            .azul{background:#0d6efd;}
            .verde{background:#198754;}
            .ciano{background:#0dcaf0;color:#333;}

            .num{
                font-size:30px;
                font-weight:bold;
            }

            table{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
            }

            th{
                background:#198754;
                color:white;
                padding:10px;
            }

            td{
                border:1px solid #ddd;
                padding:10px;
            }

            .rodape{
                margin-top:30px;
                text-align:center;
                color:#999;
                font-size:12px;
            }
        </style>

        <h1>📊 Relatório do Sistema</h1>

        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

        <h2>Resumo Geral</h2>

        <div class="cards">

            <div class="card azul">
                <div class="num">${totalFichas}</div>
                <div>Fichas Técnicas</div>
            </div>

            <div class="card verde">
                <div class="num">${totalProdutos}</div>
                <div>Produtos</div>
            </div>

            <div class="card ciano">
                <div class="num">${totalMaterias}</div>
                <div>Matérias-Primas</div>
            </div>

        </div>

        <h2>Distribuição do Sistema</h2>

        <table>

            <thead>
                <tr>
                    <th>Categoria</th>
                    <th>Total</th>
                </tr>
            </thead>

            <tbody>

                <tr>
                    <td>Fichas Técnicas</td>
                    <td>${totalFichas}</td>
                </tr>

                <tr>
                    <td>Matérias-Primas</td>
                    <td>${totalMaterias}</td>
                </tr>

                <tr>
                    <td>Produtos</td>
                    <td>${totalProdutos}</td>
                </tr>

            </tbody>

        </table>

        <div class="rodape">
            NutriCare — Relatório gerado automaticamente
        </div>
    `;

    api.report.print(html, {
        landscape: false
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}