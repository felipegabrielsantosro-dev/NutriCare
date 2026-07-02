const moeda = v =>
    Number(v || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

// ================= PRODUTOS =================
async function carregarProdutos() {
    const tbody = document.getElementById('tbody-produtos');
    if (!tbody) return;

    try {
        const res = await api.product.find({ draw: 1, term: '', limit: 9999, offset: 0 });
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
    } catch (error) {
        console.error("Erro produtos:", error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar produtos.</td></tr>';
    }
}

// ================= FICHA TÉCNICA =================
async function carregarFichaTecnica() {
    const tbody = document.getElementById('tbody-ficha-tecnica');
    if (!tbody) return;

    try {
        let res = await api.fichaTecnica.find({ limit: 9999, offset: 0 });
        let lista = res?.data || res?.rows || (Array.isArray(res) ? res : []);

        if (!lista.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma ficha técnica encontrada.</td></tr>';
            return;
        }

        renderizarFichas(tbody, lista);
    } catch (error) {
        console.warn("Erro ao buscar fichas com parâmetros, tentando busca limpa...", error);
        try {
            const res = await api.fichaTecnica.find({});
            const lista = res?.data || res?.rows || (Array.isArray(res) ? res : []);

            if (!lista.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma ficha técnica encontrada.</td></tr>';
                return;
            }

            renderizarFichas(tbody, lista);
        } catch (erroGrave) {
            console.error("Erro crítico ficha técnica:", erroGrave);
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">
                <strong>Erro no Banco de Dados:</strong><br><small>${erroGrave.message}</small>
            </td></tr>`;
        }
    }
}

let fichasCarregadas = [];

function renderizarFichas(tbody, lista) {
    fichasCarregadas = lista;

    tbody.innerHTML = lista.map((f, index) => {
        const custoTotalFicha = Number(f.custo_total || f.preco_custo || f.custo || 0);
        const rendimentoFicha = Number(f.rendimento) > 0 ? Number(f.rendimento) : 1;
        const custoUnitarioCalculado = f.custo_unitario
            ? Number(f.custo_unitario)
            : (custoTotalFicha / rendimentoFicha);

        return `
            <tr>
                <td>${f.id}</td>
                <td>
                    <strong>
                        ${f.nome_produto || f.produto || f.nome || (f.Produto?.nome) || "Sem Nome"}
                    </strong>
                </td>
                <td>${f.categoria ?? ''}</td>
                <td>${rendimentoFicha}</td>
                <td>${f.peso_final || f.peso || ''}</td>
                <td class="text-danger fw-bold">${moeda(custoTotalFicha)}</td>
                <td class="text-primary fw-bold">${moeda(custoUnitarioCalculado)}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="visualizarIngredientes(${index})" title="Ver Ingredientes">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="baixarPDFFichaUnica(${f.id})" title="Baixar PDF">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.visualizarIngredientes = function (index) {
    const ficha = fichasCarregadas[index];
    if (!ficha) {
        alert("Ficha técnica não encontrada.");
        return;
    }

    const nomeProduto = ficha.nome_produto || ficha.produto || ficha.nome || "Sem Nome";
    document.getElementById("nome-produto-modal").textContent = nomeProduto;

    let ingredientes = [];
    if (Array.isArray(ficha.itens)) ingredientes = ficha.itens;
    else if (Array.isArray(ficha.ingredientes)) ingredientes = ficha.ingredientes;

    const tbody = document.getElementById("tbody-ingredientes-modal");

    if (!ingredientes.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum ingrediente encontrado.</td></tr>';
    } else {
        let totalIngredientes = 0;

        const linhas = ingredientes.map(i => {
            const nomeIngrediente = i.nome || i.nome_ingrediente || i.materia_prima || i.Alimento?.nome || "Ingrediente";

            let rawQtd = String(i.quantidade ?? "").trim().toLowerCase();
            let matchNumero = rawQtd.match(/[\d.,]+/);
            let numeroTexto = matchNumero ? matchNumero[0] : "0";
            let quantidade = parseFloat(numeroTexto.replace(",", ".")) || 0;

            let unidadeBruta = i.unidade || i.unidade_medida || rawQtd.replace(/[\d.,\s]/g, "") || "g";
            let unidade = unidadeBruta.trim().toLowerCase();

            let unidadeExibicao = "UN";

            if (/^(g|gr|grama|gramas|g\.)$/.test(unidade)) {
                unidadeExibicao = "G";
            } else if (/^(ml|mls|mililitro|mililitros|ml\.)$/.test(unidade)) {
                unidadeExibicao = "ML";
            } else if (/^(kg|kilo|quilo|kilos|quilos)$/.test(unidade)) {
                unidadeExibicao = "KG";
            } else if (/^(l|litro|litros|l\.)$/.test(unidade)) {
                unidadeExibicao = "L";
            } else {
                unidadeExibicao = unidade ? unidadeBruta.toUpperCase() : "UN";
            }

            const custoProporcional = Number(i.valor_ingrediente ?? i.total ?? 0);
            totalIngredientes += custoProporcional;

            // Altera para mostrar até 3 casas decimais se for um número quebrado, mas mantém limpo se for inteiro
            const quantidadeFormatada = quantidade.toLocaleString("pt-BR", {
                minimumFractionDigits: quantidade % 1 === 0 ? 0 : 3,
                maximumFractionDigits: 3
            });

            return `
            <tr>
                <td>${nomeIngrediente}</td>
                <td>${quantidadeFormatada}</td>
                <td><span class="badge bg-secondary">${unidadeExibicao}</span></td>
                <td class="text-success fw-bold">${moeda(custoProporcional)}</td>
            </tr>`;
        }).join("");

        tbody.innerHTML = `
            ${linhas}
            <tr class="table-dark fw-bold">
                <td class="text-end">TOTAL DOS INGREDIENTES</td>
                <td></td>
                <td></td>
                <td class="text-success fw-bold">${moeda(totalIngredientes)}</td>
            </tr>`;
    }

    new bootstrap.Modal(document.getElementById("modalIngredientes")).show();
};

// ================= DOWNLOAD PDF FICHA ÚNICA (CORRIGIDO) =================
window.baixarPDFFichaUnica = function (idFicha) {
    const ficha = fichasCarregadas.find(f => f.id === idFicha);
    if (!ficha) return;

    const ingredientes = ficha.ingredientes || ficha.itens || [];

    let tabelaIngredientesHTML = '';
    if (ingredientes.length > 0) {
        tabelaIngredientesHTML = `
            <h3>Componentes / Ingredientes</h3>
            <table>
                <thead>
                    <tr>
                        <th>Ingrediente</th>
                        <th>Quantidade</th>
                        <th>Custo Unitário</th>
                        <th>Custo Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${ingredientes.map(i => {
                        const qtd = parseFloat(i.quantidade) || 0;
                        const unidade = (i.unidade || i.unidade_medida || 'g').trim().toLowerCase();

                        let mult = 1;
                        if (unidade === 'g' || unidade === 'ml') mult = 0.001;

                        const custoBase = parseFloat(
                            i.preco_unitario ||
                            i.preco_compra ||
                            i.custo ||
                            i.MateriaPrima?.preco_compra ||
                            i.Produto?.preco_compra ||
                            i.materia_prima?.preco_compra ||
                            0
                        );

                        const totalItem = i.custo_total || (qtd * custoBase * mult);
                        
                        const qtdFormatada = qtd.toLocaleString("pt-BR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3
                        });

                        return `
                            <tr>
                                <td>${i.nome || i.nome_ingrediente || i.materia_prima || 'Ingrediente'}</td>
                                <td>${qtdFormatada} ${unidade.toUpperCase()}</td>
                                <td>${moeda(custoBase)}</td>
                                <td>${moeda(totalItem)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>`;
    }

    const custoTotalFicha = Number(ficha.custo_total || ficha.preco_custo || ficha.custo || 0);
    const rendimentoFicha = Number(ficha.rendimento) > 0 ? Number(ficha.rendimento) : 1;
    const custoUnitarioCalculado = ficha.custo_unitario ? Number(ficha.custo_unitario) : (custoTotalFicha / rendimentoFicha);

    // HTML limpo de espaços em branco nas tags estruturais
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { color: #0d6efd; margin-bottom: 5px; }
        h3 { color: #333; margin-top: 30px; border-bottom: 2px solid #0d6efd; padding-bottom: 5px; }
        p { font-size: 13px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #f8f9fa; color: #333; padding: 8px; border: 1px solid #ccc; text-align: left; font-size: 12px; }
        td { padding: 8px; border: 1px solid #ccc; font-size: 12px; }
        .grid { display: flex; gap: 20px; margin-top: 20px; }
        .card { flex: 1; border: 1px solid #ccc; padding: 10px; border-radius: 5px; background: #fafafa; }
    </style>
</head>
<body>
    <h1>Ficha Técnica Otimizada: ${ficha.produto || ficha.nome || ficha.nome_produto}</h1>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

    <div class="grid">
        <div class="card">
            <strong>Categoria:</strong> ${ficha.categoria ?? 'N/A'}<br>
            <strong>Rendimento:</strong> ${rendimentoFicha} porções<br>
            <strong>Peso Final:</strong> ${ficha.peso_final || ficha.peso || 'N/A'}<br>
        </div>
        <div class="card">
            <strong>Custo Total:</strong> ${moeda(custoTotalFicha)}<br>
            <strong>Custo Unitário:</strong> ${moeda(custoUnitarioCalculado)}<br>
        </div>
    </div>

    ${tabelaIngredientesHTML}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ficha_Tecnica_${ficha.id || ficha.nome || ficha.produto}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarFichaTecnica();
});     