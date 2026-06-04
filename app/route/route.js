import { ipcMain, BrowserWindow } from 'electron';
import Template from '../mixin/Template.js';
import Users from '../controller/Users.js';
import TabelaNutricional from '../controller/TabelaNutricional.js';
import { Print } from '../mixin/Print.js';

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
