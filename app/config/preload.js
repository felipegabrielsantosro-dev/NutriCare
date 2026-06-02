'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    report: {
        print(stringHtml, args = {}) { return ipcRenderer.invoke('print', stringHtml, args = {}); }
    },
    window: {
        open(name, opts) { return ipcRenderer.invoke('window:open', name, opts); },
        openModal(name, opts) { return ipcRenderer.invoke('window:openModal', name, opts); },
        close() { return ipcRenderer.invoke('window:close'); }
    },
    // Armazena dados temporários entre janelas
    temp: {
        set(key, data) { return ipcRenderer.invoke('temp:set', key, data); },
        get(key) { return ipcRenderer.invoke('temp:get', key); },
    },
    users: {
        insert(data) { return ipcRenderer.invoke('users:insert', data); },
        find(where) { return ipcRenderer.invoke('users:find', where); },
        findById(id) { return ipcRenderer.invoke('users:findById', id); },
        update(id, data) { return ipcRenderer.invoke('users:update', id, data); },
        delete(id) { return ipcRenderer.invoke('users:delete', id); },
        onReload(callback) {
            ipcRenderer.on('users:reload', () => callback());
        },
    },
    nutricional: {
        insert(data) { return ipcRenderer.invoke('tabela_nutricional:insert', data); },
        find(where) { return ipcRenderer.invoke('tabela_nutricional:find', where); },
        findById(id) { return ipcRenderer.invoke('tabela_nutricional:findById', id); },
        update(id, data) { return ipcRenderer.invoke('tabela_nutricional:update', id, data); },
        delete(id) { return ipcRenderer.invoke('tabela_nutricional:delete', id); },
        // ADICIONE ESTA LINHA ABAIXO:
        reload(data) { return ipcRenderer.invoke('tabela_nutricional:find', data); },
        onReload(callback) {
            ipcRenderer.on('tabela_nutricional:reload', () => callback());
        },
    },
    product: {
        find(where) { return ipcRenderer.invoke('product:find', where); },
        findById(id) { return ipcRenderer.invoke('product:findById', id); },
        onReload(callback) {
            ipcRenderer.on('product:reload', () => callback());
        },
    },
    insert(data) { return ipcRenderer.invoke('users:insert', data); },
    find(where) { return ipcRenderer.invoke('users:find', where); },
    findById(id) { return ipcRenderer.invoke('users:findById', id); },
    update(id, data) { return ipcRenderer.invoke('users:update', id, data); },
    delete(id) { return ipcRenderer.invoke('users:delete', id); },
    onReload(callback) {
        ipcRenderer.on('users:reload', () => callback());
    },

});

