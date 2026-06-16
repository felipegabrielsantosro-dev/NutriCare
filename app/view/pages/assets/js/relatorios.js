const moeda = v => parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

async function carregarProdutos() {
    const res = await api.product.find({ draw: 1, term: '', limit: 9999, offset: 0 });
    const tbody = document.getElementById('tbody-produtos');
    if (!res?.data?.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = res.data.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.alimentos ?? ''}</td>
            <td>${p.refeicoes ?? ''}</td>
            <td>${moeda(p.preco_compra)}</td>
            <td>${moeda(p.preco_venda)}</td>
            <td>${parseFloat(p.margem_lucro || 0).toFixed(2)}%</td>
            <td>${p.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-danger">Inativo</span>'}</td>
        </tr>
    `).join('');
}

async function carregarUsuarios() {
    const res = await api.users.find({ draw: 1, term: '', limit: 9999, offset: 0 });
    const tbody = document.getElementById('tbody-usuarios');
    if (!res?.data?.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum usuário encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = res.data.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nome ?? ''}</td>
            <td>${u.email ?? ''}</td>
            <td>${u.sexo ?? ''}</td>
            <td>${u.idade ?? ''}</td>
            <td>${u.peso ?? ''}</td>
            <td>${u.altura ?? ''}</td>
        </tr>
    `).join('');
}

async function carregarNutricional() {
    const res = await api.nutricional.find({ draw: 1, term: '', limit: 9999, offset: 0 });
    const tbody = document.getElementById('tbody-nutricional');
    if (!res?.data?.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum registro encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = res.data.map(n => `
        <tr>
            <td>${n.id}</td>
            <td>${n.produto ?? ''}</td>
            <td>${n.porcao ?? ''}</td>
            <td>${n.valor_energetico ?? ''}</td>
            <td>${n.carboidratos ?? ''}</td>
            <td>${n.proteinas ?? ''}</td>
            <td>${n.gorduras_totais ?? ''}</td>
            <td>${n.sodio ?? ''}</td>
        </tr>
    `).join('');
}

window.exportarPDF = function (tipo) {
    const titulos = {
        produtos: 'Relatório de Produtos',
        usuarios: 'Relatório de Usuários',
        nutricional: 'Relatório de Tabelas Nutricionais',
    };

    const tabela = document.getElementById(`relatorio-${tipo}`);

    const html = `
        <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 16px; }
            h1 { color: #198754; border-bottom: 2px solid #198754; padding-bottom: 6px; font-size: 1.4rem; }
            p { color: #666; font-size: 11px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #198754; color: white; padding: 6px 10px; text-align: left; font-size: 11px; }
            td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
            tr:nth-child(even) td { background: #f9f9f9; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; }
            .bg-success { background: #198754; color: white; }
            .bg-danger  { background: #dc3545; color: white; }
        </style>
        <h1>${titulos[tipo]}</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        ${tabela.outerHTML}
    `;

    api.report.print(html, { landscape: tipo === 'nutricional' });
};

// Carrega tudo ao abrir
carregarProdutos();
carregarUsuarios();
carregarNutricional();