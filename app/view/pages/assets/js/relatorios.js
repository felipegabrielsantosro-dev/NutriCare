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
        // Tentativa com paginação básica
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
            // Fallback sem nenhum parâmetro
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

// Armazenamento temporário global para acessar os ingredientes sem precisar fazer outra requisição à API
let fichasCarregadas = [];

function renderizarFichas(tbody, lista) {
    fichasCarregadas = lista; // Guarda a lista globalmente

    tbody.innerHTML = lista.map((f, index) => `
        <tr>
            <td>${f.id}</td>
<td>
    <strong>
        ${f.nome_produto ||
        f.produto ||
        f.nome ||
        (f.Produto?.nome) ||
        "Sem Nome"
        }
    </strong>
</td>            <td>${f.categoria ?? ''}</td>
            <td>${f.rendimento || 1}</td>
            <td>${f.peso_final || f.peso || ''}</td>
            <td class="text-danger fw-bold">${moeda(f.custo_total || f.preco_custo)}</td>
            <td class="text-primary fw-bold">${moeda(f.custo_unitario || (f.custo_total / (f.rendimento || 1)))}</td>
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
    `).join('');
}

// Função atualizada recebendo o INDEX para precisão total
  window.visualizarIngredientes = function (index) {

    const ficha = fichasCarregadas[index];

    if (!ficha) {
        alert("Ficha técnica não encontrada.");
        return;
    }

    const nomeProduto =
        ficha.nome_produto ||
        ficha.produto ||
        ficha.nome ||
        "Sem Nome";

    document.getElementById("nome-produto-modal").textContent = nomeProduto;

    let ingredientes = [];

    if (Array.isArray(ficha.itens))
        ingredientes = ficha.itens;
    else if (Array.isArray(ficha.ingredientes))
        ingredientes = ficha.ingredientes;

    const tbody = document.getElementById("tbody-ingredientes-modal");

    if (!ingredientes.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">
                    Nenhum ingrediente encontrado.
                </td>
            </tr>
        `;

    } else {

        tbody.innerHTML = ingredientes.map(i => {

            const nomeIngrediente =
                i.nome ||
                i.nome_ingrediente ||
                "Ingrediente";

            const quantidade = Number(i.quantidade || 0);

            const unidade = (i.unidade || "g").toLowerCase();

            let quantidadeFormatada = "";

            switch (unidade) {

                case "g":
                    quantidadeFormatada =
                        quantidade.toLocaleString("pt-BR") + " g";
                    break;

                case "kg":
                    quantidadeFormatada =
                        quantidade.toLocaleString("pt-BR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3
                        }) + " kg";
                    break;

                case "ml":
                    quantidadeFormatada =
                        quantidade.toLocaleString("pt-BR") + " ml";
                    break;

                case "l":
                    quantidadeFormatada =
                        quantidade.toLocaleString("pt-BR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 3
                        }) + " L";
                    break;

                default:
                    quantidadeFormatada =
                        quantidade.toLocaleString("pt-BR") + " " + unidade;
            }

            const custo =
                i.preco_unitario ||
                i.preco_compra ||
                0;

            return `
                <tr>
                    <td>${nomeIngrediente}</td>
                    <td>${quantidadeFormatada}</td>
                    <td>${moeda(custo)}</td>
                </tr>
            `;

        }).join("");

    }

    new bootstrap.Modal(
        document.getElementById("modalIngredientes")
    ).show();

};

// Função para baixar o PDF exclusivo de uma única Ficha Técnica com seus ingredientes
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
                    ${ingredientes.map(i => `
                        <tr>
                            <td>${i.nome || i.materia_prima || 'Ingrediente'}</td>
                            <td>${i.quantidade || 0} ${i.unidade || 'g'}</td>
                            <td>${moeda(i.preco_unitario || i.custo)}</td>
                            <td>${moeda(i.custo_total || (i.quantidade * (i.preco_unitario || 0)))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    const html = `
        <!DOCTYPE html>
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
            <h1>Ficha Técnica Otimizada: ${ficha.produto || ficha.nome}</h1>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            
            <div class="grid">
                <div class="card">
                    <strong>Categoria:</strong> ${ficha.categoria ?? 'N/A'}<br>
                    <strong>Rendimento:</strong> ${ficha.rendimento || 1} porções<br>
                    <strong>Peso Final:</strong> ${ficha.peso_final || ficha.peso || 'N/A'}
                </div>
                <div class="card">
                    <strong>Custo Total:</strong> <span style="color:#dc3545; font-weight:bold">${moeda(ficha.custo_total || ficha.preco_custo)}</span><br>
                    <strong>Custo Unitário:</strong> <span style="color:#0d6efd; font-weight:bold">${moeda(ficha.custo_unitario || (ficha.custo_total / (ficha.rendimento || 1)))}</span>
                </div>
            </div>

            ${tabelaIngredientesHTML}
        </body>
        </html>
    `;

    try {
        api.report.print(html, { landscape: false });
    } catch (error) {
        console.error("Erro ao gerar PDF da ficha única:", error);
        alert("Não foi possível gerar o PDF da ficha.");
    }
};

// ================= MATÉRIA PRIMA =================
async function carregarMateriaPrima() {
    const tbody = document.getElementById('tbody-materia-prima');
    if (!tbody) return [];

    try {
        // Caso seu banco também rejeite parâmetros aqui, o bloco try/catch captura e trata
        let res = await api.materiaPrima.find({ draw: 1, term: '', limit: 9999, offset: 0 });
        let lista = res?.data || res?.rows || (Array.isArray(res) ? res : []);

        if (!lista.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma matéria-prima encontrada.</td></tr>';
            return [];
        }

        renderizarMaterias(tbody, lista);
        return lista;
    } catch (err) {
        console.warn('Erro ao carregar matéria-prima com filtros, tentando busca limpa...', err);
        try {
            let res = await api.materiaPrima.find({});
            let lista = res?.data || res?.rows || (Array.isArray(res) ? res : []);

            if (!lista.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Nenhuma matéria-prima encontrada.</td></tr>';
                return [];
            }

            renderizarMaterias(tbody, lista);
            return lista;
        } catch (errGrave) {
            console.error('Erro crítico matéria-prima:', errGrave);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
            return [];
        }
    }
}

function renderizarMaterias(tbody, lista) {
    tbody.innerHTML = lista.map(m => `
        <tr>
            <td>${m.id}</td>
            <td><strong>${m.nome || m.alimentos || ''}</strong></td>
            <td>${m.categoria ?? ''}</td>
            <td><span class="badge bg-secondary">${m.unidade_medida || m.unidade || 'g'}</span></td>
            <td class="text-success fw-bold">${moeda(m.preco_compra || m.preco)}</td>
        </tr>
    `).join('');
}

// ================= PDF =================
window.exportarPDF = function (tipo) {
    const titulos = {
        'produtos': 'Relatório de Produtos',
        'ficha-tecnica': 'Relatório de Fichas Técnicas',
        'materia-prima': 'Relatório de Matérias-Primas'
    };

    const idTabela = `relatorio-${tipo}`;
    const tabela = document.getElementById(idTabela);

    if (!tabela) {
        alert(`Erro: A tabela com o ID "${idTabela}" não foi encontrada na página.`);
        return;
    }

    const tabelaClone = tabela.cloneNode(true);
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h1 { color: #198754; margin-bottom: 5px; }
                p { font-size: 12px; color: #666; margin-top: 0; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #198754; color: #fff; padding: 10px 8px; border: 1px solid #ccc; text-align: left; font-size: 13px; }
                td { padding: 8px; border: 1px solid #ccc; font-size: 12px; }
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
        api.report.print(html, { landscape: tipo === 'ficha-tecnica' });
    } catch (error) {
        console.error("Erro ao invocar o método de PDF:", error);
        alert("Não foi possível gerar o PDF. Detalhe: " + error.message);
    }
};

async function carregarProdutosSelect() {

    const select = document.getElementById("select-produto-ficha");

    const res = await api.product.find({
        draw: 1,
        term: "",
        limit: 9999,
        offset: 0
    });

    const produtos = res.data || [];

    select.innerHTML = '<option value="">Selecione um produto...</option>';

    produtos.forEach(p => {

        select.innerHTML += `
            <option value="${p.id}">
                ${p.alimentos}
            </option>
        `;

    });

}

async function carregarIngredientesProduto(idProduto) {

    const tbody = document.getElementById("tbody-ingredientes-modal");

    tbody.innerHTML =
        '<tr><td colspan="4">Carregando...</td></tr>';

    const ficha = await api.fichaTecnica.buscarPorProduto(idProduto);

    if (!ficha || !ficha.ingredientes.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    Nenhum ingrediente encontrado.
                </td>
            </tr>
        `;

        return;

    }

    tbody.innerHTML = ficha.ingredientes.map(i => `

        <tr>

            <td>${i.nome}</td>

            <td>${i.quantidade}</td>

            <td>${i.unidade}</td>

            <td>${moeda(i.preco_unitario)}</td>

        </tr>

    `).join("");

}

window.imprimirIngredientes = function () {

    const nomeProduto = document.getElementById("nome-produto-modal").textContent;

    const tabela = document.querySelector("#modalIngredientes table").outerHTML;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Ingredientes</title>

        <style>
            body{
                font-family: Arial, sans-serif;
                padding:30px;
                color:#333;
            }

            h2{
                margin-bottom:5px;
            }

            table{
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
            }

            th,td{
                border:1px solid #ccc;
                padding:8px;
                text-align:left;
            }

            th{
                background:#f2f2f2;
            }
        </style>

    </head>

    <body>

        <h2>Ingredientes da Receita</h2>

        <p><strong>Produto:</strong> ${nomeProduto}</p>

        ${tabela}

    </body>
    </html>
    `;

    api.report.print(html, {
        landscape: false
    });

};
// Inicialização das funções existentes
carregarProdutos();
carregarFichaTecnica();
carregarMateriaPrima();