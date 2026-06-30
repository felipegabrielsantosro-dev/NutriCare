const moeda = v =>
    Number(v || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

// ================= PRODUTOS =================
async function carregarProdutos() {
    const res = await api.product.find({ draw: 1, term: '', limit: 9999, offset: 0 });
    const tbody = document.getElementById('tbody-produtos');
    if (!tbody) return;

    const lista = res?.data || [];

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.alimentos ?? ''}</td>
            <td>${p.refeicoes ?? ''}</td>
            <td>${moeda(p.preco_compra)}</td>
            <td>${moeda(p.preco_venda)}</td>
            <td>${Number(p.margem_lucro || 0).toFixed(2)}%</td>
            <td>
                ${p.ativo
            ? '<span class="badge bg-success">Ativo</span>'
            : '<span class="badge bg-danger">Inativo</span>'}
            </td>
        </tr>
    `).join('');
}

async function carregarFichaTecnica() {
    const tbody = document.getElementById('tbody-ficha-tecnica');
    if (!tbody) return;

    try {
        // Removemos o 'draw' e o 'term' que estavam quebrando o banco de dados
        const res = await api.fichaTecnica.find({ limit: 9999, offset: 0 });

        const lista = res?.data || res?.rows || (Array.isArray(res) ? res : []);

        if (!lista.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma ficha técnica encontrada.</td></tr>';
            return;
        }

        tbody.innerHTML = lista.map(f => `
            <tr>
                <td>${f.id}</td>
                <td><strong>${f.produto || f.nome || ''}</strong></td>
                <td>${f.categoria ?? ''}</td>
                <td>${f.rendimento || 1}</td>
                <td>${f.peso_final || f.peso || ''}</td>
                <td class="text-danger fw-bold">${moeda(f.custo_total || f.preco_custo)}</td>
                <td class="text-primary fw-bold">${moeda(f.custo_unitario || (f.custo_total / (f.rendimento || 1)))}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Erro detalhado:", error);

        // Caso o seu backend seja ainda mais estrito e não queira NENHUM parâmetro, tentamos sem nada:
        try {
            const res = await api.fichaTecnica.find({});
            const lista = res?.data || res?.rows || (Array.isArray(res) ? res : []);

            if (!lista.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma ficha técnica encontrada.</td></tr>';
                return;
            }

            tbody.innerHTML = lista.map(f => `
                <tr>
                    <td>${f.id}</td>
                    <td><strong>${f.produto || f.nome || ''}</strong></td>
                    <td>${f.categoria ?? ''}</td>
                    <td>${f.rendimento || 1}</td>
                    <td>${f.peso_final || f.peso || ''}</td>
                    <td class="text-danger fw-bold">${moeda(f.custo_total || f.preco_custo)}</td>
                    <td class="text-primary fw-bold">${moeda(f.custo_unitario || (f.custo_total / (f.rendimento || 1)))}</td>
                </tr>
            `).join('');

        } catch (erroGrave) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                <strong>Erro crítico no Banco de Dados:</strong><br>
                <small>${erroGrave.message}</small>
            </td></tr>`;
        }
    }
}

// ================= MATÉRIA PRIMA =================
async function carregarMateriaPrima() {
    const tbody = document.getElementById('tbody-materia-prima');
    if (!tbody) return [];

    try {
        const res = await api.materiaPrima.find({ draw: 1, term: '', limit: 9999, offset: 0 });

        const lista = res?.data || [];

        if (!lista.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        Nenhuma matéria-prima encontrada.
                    </td>
                </tr>`;
            return [];
        }

        tbody.innerHTML = lista.map(m => `
            <tr>
                <td>${m.id}</td>
                <td><strong>${m.nome || m.alimentos || ''}</strong></td>
                <td>${m.categoria ?? ''}</td>
                <td>
                    <span class="badge bg-secondary">
                        ${m.unidade_medida || m.unidade || 'g'}
                    </span>
                </td>
                <td class="text-success fw-bold">
                    ${moeda(m.preco_compra || m.preco)}
                </td>
            </tr>
        `).join('');

        return lista;

    } catch (err) {
        console.error('Erro matéria-prima:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Erro ao carregar dados.
                </td>
            </tr>`;
        return [];
    }
}

// ================= PDF =================
window.exportarPDF = function (tipo) {
    const titulos = {
        'produtos': 'Relatório de Produtos',
        'ficha-tecnica': 'Relatório de Fichas Técnicas',
        'materia-prima': 'Relatório de Matérias-Primas'
    };

    // Garante que o ID correto da tabela seja capturado
    const idTabela = `relatorio-${tipo}`;
    const tabela = document.getElementById(idTabela);

    if (!tabela) {
        alert(`Erro: A tabela com o ID "${idTabela}" não foi encontrada na página.`);
        return;
    }

    // Clonamos a tabela para limpar qualquer lixo ou IDs duplicados antes de enviar para o gerador de PDF
    const tabelaClone = tabela.cloneNode(true);

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    color: #333;
                }
                h1 {
                    color: #198754;
                    margin-bottom: 5px;
                }
                p {
                    font-size: 12px;
                    color: #666;
                    margin-top: 0;
                    margin-bottom: 20px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                th {
                    background: #198754;
                    color: #fff;
                    padding: 10px 8px;
                    border: 1px solid #ccc;
                    text-align: left;
                    font-size: 13px;
                }
                td {
                    padding: 8px;
                    border: 1px solid #ccc;
                    font-size: 12px;
                }
                .text-danger { color: #dc3545 !important; }
                .text-primary { color: #0d6efd !important; }
                .text-success { color: #198754 !important; }
                .fw-bold { font-weight: bold !important; }
            </style>
        </head>
        <body>
            <h1>${titulos[tipo] || 'Relatório'}</h1>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            ${tabelaClone.outerHTML}
        </body>
        </html>
    `;

    try {
        // Envia a string HTML limpa para a API de relatórios
        api.report.print(html, {
            landscape: tipo === 'ficha-tecnica' // Ativa modo paisagem para a Ficha Técnica se tiver muitas colunas
        });
    } catch (error) {
        console.error("Erro ao invocar o método de PDF:", error);
        alert("Não foi possível gerar o PDF. Detalhe: " + error.message);
    }
};


carregarProdutos();
carregarFichaTecnica();
carregarNutricional();
carregarMateriaPrima();