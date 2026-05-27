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
    customer: {
        insert(data) { return ipcRenderer.invoke('customer:insert', data); },
        find(where) { return ipcRenderer.invoke('customer:find', where); },
        findById(id) { return ipcRenderer.invoke('customer:findById', id); },
        update(id, data) { return ipcRenderer.invoke('customer:update', id, data); },
        delete(id) { return ipcRenderer.invoke('customer:delete', id); },
        onReload(callback) {
            ipcRenderer.on('customer:reload', () => callback());
        },
    },
    product: {
        find(where) { return ipcRenderer.invoke('product:find', where); },
        findById(id) { return ipcRenderer.invoke('product:findById', id); },
        onReload(callback) {
            ipcRenderer.on('product:reload', () => callback());
        },
    }
});

