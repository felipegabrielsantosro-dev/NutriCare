async function init() {
    const totais = await api.dashboard.totais();

    // Atualiza os cards
    document.getElementById('total-tabelas').textContent = totais.tabelas;
    document.getElementById('total-usuarios').textContent = totais.usuarios;
    document.getElementById('total-produtos').textContent = totais.produtos;

    // Gráfico 1 — Produtos por mês (barras)
    new window.Chart(document.getElementById('graficoProdutos'), {
        type: 'bar',
        data: {
            labels: totais.meses,
            datasets: [{
                label: 'Produtos cadastrados',
                data: totais.dadosProdutos,
                backgroundColor: '#198754',
                borderRadius: 8,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico 2 — Usuários por mês (linha)
    new window.Chart(document.getElementById('graficoUsuarios'), {
        type: 'line',
        data: {
            labels: totais.meses,
            datasets: [{
                label: 'Usuários cadastrados',
                data: totais.dadosUsuarios,
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13,110,253,0.1)',
                tension: 0.4,
                fill: true,
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico 3 — Rosca distribuição
    new window.Chart(document.getElementById('graficoUsuariosMes'), {
        type: 'doughnut',
        data: {
            labels: ['Produtos', 'Usuários', 'Tabelas Nutricionais'],
            datasets: [{
                data: [totais.produtos, totais.usuarios, totais.tabelas],
                backgroundColor: ['#198754', '#ffc107', '#0d6efd'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico 4 — Pizza
    new window.Chart(document.getElementById('graficoPizza'), {
        type: 'pie',
        data: {
            labels: ['Produtos', 'Usuários', 'Tabelas'],
            datasets: [{
                data: [totais.produtos, totais.usuarios, totais.tabelas],
                backgroundColor: ['#198754', '#ffc107', '#0d6efd'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

window.exportarPDF = function () {
    const totalTabelas = document.getElementById('total-tabelas').textContent;
    const totalUsuarios = document.getElementById('total-usuarios').textContent;
    const totalProdutos = document.getElementById('total-produtos').textContent;

    const html = `
        <style>
            body { font-family: Arial, sans-serif; color: #333; padding: 20px; }
            h1 { color: #198754; border-bottom: 2px solid #198754; padding-bottom: 8px; }
            h2 { color: #444; font-size: 1.1rem; margin-top: 24px; }
            .cards { display: flex; gap: 16px; margin: 20px 0; }
            .card { flex: 1; border-radius: 12px; padding: 16px; color: white; }
            .azul { background: #0d6efd; } .amarelo { background: #ffc107; color: #333; } .verde { background: #198754; }
            .num { font-size: 2rem; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #198754; color: white; padding: 8px 12px; text-align: left; }
            td { padding: 8px 12px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) td { background: #f9f9f9; }
            .rodape { margin-top: 32px; font-size: 0.8rem; color: #999; text-align: center; }
        </style>
        <h1>📊 Relatório NutriCare</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <h2>Resumo Geral</h2>
        <div class="cards">
            <div class="card azul"><div class="num">${totalTabelas}</div><div>Tabelas Nutricionais</div></div>
            <div class="card amarelo"><div class="num">${totalUsuarios}</div><div>Usuários</div></div>
            <div class="card verde"><div class="num">${totalProdutos}</div><div>Produtos</div></div>
        </div>
        <h2>Distribuição do Sistema</h2>
        <table>
            <thead><tr><th>Categoria</th><th>Total</th></tr></thead>
            <tbody>
                <tr><td>Tabelas Nutricionais</td><td>${totalTabelas}</td></tr>
                <tr><td>Usuários</td><td>${totalUsuarios}</td></tr>
                <tr><td>Produtos</td><td>${totalProdutos}</td></tr>
            </tbody>
        </table>
        <div class="rodape">NutriCare — Relatório gerado automaticamente</div>
    `;

    api.report.print(html, { landscape: false });
};

// Garante que Chart.js já carregou antes de inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}