import connection from '../database/Connection.js';
import { ipcMain, BrowserWindow, app } from 'electron';
import Template from '../mixin/Template.js';
import Users from '../controller/Users.js';
import TabelaNutricional from '../controller/TabelaNutricional.js';
import { Print } from '../mixin/Print.js';
import Product from '../controller/Product.js';
import MateriaPrima from '../controller/MateriaPrima.js';
import FichaTecnica from '../controller/FichaTecnica.js';
import FichaTecnicaIngredientes from '../controller/FichaTecnicaIngredientes.js';

function getWin(event) {
    return BrowserWindow.fromWebContents(event.sender);
}
// Avisa todas as janelas para recarregar
function broadcastReload(channel) {
    for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(channel);
    }
}
//Imprimir PDF
ipcMain.handle('print', async (_e, stringHtml, args = {}) => {
    await Print.create()
        .stringCss(`<style>body { font-family: Arial; } h1 { color: #1a1a2e; }</style>`)
        .stringHTML(stringHtml)
        .setOptions(args)
        .print();
});
//  WINDOW
ipcMain.handle('window:open', (_e, name, opts = {}) => {
    const win = Template.create(name, opts);
    Template.loadView(win, name);
});
ipcMain.handle('window:openModal', (e, name, opts = {}) => {
    const parent = getWin(e);
    if (!parent) return;
    const win = Template.create(name, {
        width: 560,
        height: 420,
        resizable: false,
        minimizable: false,
        maximizable: false,
        parent: parent,
        modal: true,
        ...opts,
    });
    Template.loadView(win, name);
});
ipcMain.handle('window:close', (e) => {
    getWin(e)?.close();
});
//  TEMP STORE — dados temporários entre janelas
let tempData = {};
ipcMain.handle('temp:set', (_e, key, data) => {
    tempData[key] = data;
});
ipcMain.handle('temp:get', (_e, key) => {
    const data = tempData[key] || null;
    delete tempData[key];
    return data;
});
//  users
ipcMain.handle('users:insert', async (_e, data) => {
    const result = await Users.insert(data);
    if (result.status) broadcastReload('users:reload');
    return result;
});
ipcMain.handle('users:find', async (_e, where = {}) => {
    return await Users.find(where);
});
ipcMain.handle('users:findById', async (_e, id) => {
    return await Users.findById(id);
});
ipcMain.handle('users:update', async (_e, id, data) => {
    const result = await Users.update(id, data);
    if (result.status) broadcastReload('users:reload');
    return result;
});
ipcMain.handle('users:delete', async (_e, id) => {
    const result = await Users.delete(id);
    if (result.status) broadcastReload('users:reload');
    return result;
});

//  tabela nutricional
ipcMain.handle('tabela_nutricional:insert', async (_e, data) => {
    const result = await TabelaNutricional.insert(data);
    if (result.status) broadcastReload('tabela_nutricional:reload');
    return result;
});
ipcMain.handle('tabela_nutricional:find', async (_e, where = {}) => {
    return await TabelaNutricional.find(where);
});
ipcMain.handle('tabela_nutricional:findById', async (_e, id) => {
    return await TabelaNutricional.findById(id);
});
ipcMain.handle('tabela_nutricional:update', async (_e, id, data) => {
    const result = await TabelaNutricional.update(id, data);
    if (result.status) broadcastReload('tabela_nutricional:reload');
    return result;
});
ipcMain.handle('tabela_nutricional:delete', async (_e, id) => {
    const result = await TabelaNutricional.delete(id);
    if (result.status) broadcastReload('tabela_nutricional:reload');
});
ipcMain.handle('tabela-nutricional:insert', async (_e, data) => {
    const result = await TabelaNutricional.insert(data);
    if (result.status) broadcastReload('tabela-nutricional:reload');
    return result;
});
ipcMain.handle('tabela-nutricional:find', async (_e, where = {}) => {
    return await TabelaNutricional.find(where);
});
ipcMain.handle('tabela-nutricional:findById', async (_e, id) => {
    return await TabelaNutricional.findById(id);
});
ipcMain.handle('tabela-nutricional:update', async (_e, id, data) => {
    const result = await TabelaNutricional.update(id, data);
    if (result.status) broadcastReload('tabela-nutricional:reload');
    return result;
});
ipcMain.handle('tabela-nutricional:delete', async (_e, id) => {
    const result = await TabelaNutricional.delete(id);
    if (result.status) broadcastReload('tabela-nutricional:reload');
    return result;
});

// Produtos
ipcMain.handle('product:find', async (_e, where = {}) => {
    return await Product.find(where);
});
ipcMain.handle('product:findById', async (_e, id) => {
    return await Product.findById(id);
});
ipcMain.handle('product:insert', async (_e, data) => {
    const result = await Product.insert(data);
    if (result.status) broadcastReload('product:reload');
    return result;
});
ipcMain.handle('product:update', async (_e, id, data) => {
    const result = await Product.update(id, data);
    if (result.status) broadcastReload('product:reload');
    return result;
});
ipcMain.handle('product:delete', async (_e, id) => {
    const result = await Product.delete(id);
    if (result.status) broadcastReload('product:reload');
    return result;
});


// Dashboard
ipcMain.handle('dashboard:totais', async () => {

    const ano = new Date().getFullYear();

    const meses = [
        'Jan', 'Fev', 'Mar', 'Abr',
        'Mai', 'Jun', 'Jul', 'Ago',
        'Set', 'Out', 'Nov', 'Dez'
    ];

    const [
        usuarios,
        produtos,
        materiasPrimas,
        fichas
    ] = await Promise.all([

        Users.count(),

        Product.count(),

        MateriaPrima.count(),

        FichaTecnica.count()

    ]);

    const dadosProdutos = await Product.countPorMes(ano);
    const dadosUsuarios = await Users.countPorMes(ano);

    return {

        usuarios,

        produtos,

        materiasPrimas,

        fichas,

        meses,

        dadosProdutos,

        dadosUsuarios

    };

});

// Quit
ipcMain.handle('app:quit', () => {
    app.quit();
});

// Matéria-Prima
ipcMain.handle('materia_prima:find', async (_e, data = {}) => {
    return await MateriaPrima.find(data);
});

ipcMain.handle('materia_prima:findById', async (_e, id) => {
    return await MateriaPrima.findById(id);
});

ipcMain.handle('materia_prima:insert', async (_e, data) => {
    const result = await MateriaPrima.insert(data);
    if (result.status) broadcastReload('materia_prima:reload');
    return result;
});

ipcMain.handle('materia_prima:update', async (_e, id, data) => {
    const result = await MateriaPrima.update(id, data);
    if (result.status) broadcastReload('materia_prima:reload');
    return result;
});

ipcMain.handle('materia_prima:delete', async (_e, id) => {
    const result = await MateriaPrima.delete(id);
    if (result.status) broadcastReload('materia_prima:reload');
    return result;
});

// ficha técnica
ipcMain.handle('ficha-tecnica:find', async (_e, where = {}) => {
    return await FichaTecnica.find(where);
});

ipcMain.handle('ficha-tecnica:findById', async (_e, id) => {
    return await FichaTecnica.findById(id);
});

ipcMain.handle('ficha-tecnica:insert', async (_e, data) => {
    const result = await FichaTecnica.insert(data);
    if (result.status) broadcastReload('ficha-tecnica:reload');
    return result;
});

ipcMain.handle('ficha-tecnica:update', async (_e, id, data) => {
    const result = await FichaTecnica.update(id, data);
    if (result.status) broadcastReload('ficha-tecnica:reload');
    return result;
});

ipcMain.handle('ficha-tecnica:delete', async (_e, id) => {
    const result = await FichaTecnica.delete(id);
    if (result.status) broadcastReload('ficha-tecnica:reload');
    return result;
});

// =========================================================================
// RETORNADO: COMPLEMENTO PARA GERENCIAMENTO DE INGREDIENTES DA FICHA
// =========================================================================

ipcMain.handle('ficha-tecnica-ingredientes:insert', async (_e, data) => {
    try {
        let result;

        // Verifica se o payload veio em lote completo (passado pelo frontend otimizado)
        if (data.ingredientes && Array.isArray(data.ingredientes)) {
            result = await FichaTecnicaIngredientes.insertMany(data.ficha_tecnica_id, data.ingredientes);
        } else {
            // Se vier um único objeto solto, envolve em um array para o insertMany aceitar
            result = await FichaTecnicaIngredientes.insertMany(data.ficha_tecnica_id, [data]);
        }

        if (result.status) {
            broadcastReload('ficha-tecnica:reload');
            broadcastReload('ficha-tecnica-ingredientes:reload');
        }
        return result;
    } catch (error) {
        console.error("Erro no Electron ao rodar insertMany:", error);
        return { status: false, msg: 'Erro interno no banco: ' + error.message };
    }
});

ipcMain.handle('ficha-tecnica-ingredientes:delete', async (_e, fichaId) => {
    try {
        // Usa o método correto do seu Model para limpar a ficha técnica
        const result = await FichaTecnicaIngredientes.deleteByFichaTecnica(fichaId);

        if (result.status) {
            broadcastReload('ficha-tecnica:reload');
            broadcastReload('ficha-tecnica-ingredientes:reload');
        }
        return result;
    } catch (error) {
        console.error("Erro no Electron ao rodar deleteByFichaTecnica:", error);
        return { status: false, msg: 'Erro interno ao deletar: ' + error.message };
    }
});

// Lista todos os ingredientes vinculados a um ID de ficha técnica específico
ipcMain.handle('ficha-tecnica-ingredientes:findByFichaId', async (_e, fichaId) => {
    try {
        // Usa o método de busca correto do seu Model
        return await FichaTecnicaIngredientes.findByFichaTecnica(fichaId);
    } catch (error) {
        console.error("Erro no Electron ao rodar findByFichaTecnica:", error);
        return { status: false, msg: 'Erro interno ao buscar ingredientes: ' + error.message };
    }
});