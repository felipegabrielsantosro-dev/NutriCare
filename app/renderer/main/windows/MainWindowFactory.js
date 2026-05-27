const { BrowserWindow } = require('electron');
const path = require('path');

class MainWindowFactory {

    // Função privada para criar uma janela genérica
    static #createWindow(htmlFile, options = {}) {
        const win = new BrowserWindow({
            width: options.width || 900,
            height: options.height || 600,
            webPreferences: {
                preload: path.join(__dirname, '../../preload/preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                ...options.webPreferences
            },
            ...options
        });

        win.loadFile(path.join(__dirname, `../../renderer/pages/${htmlFile}`));
        return win;
    }

    // Janela Home
    static createHomeWindow() {
        return this.#createWindow('home.html');
    }

    // Janela Cliente
    static createClientWindow() {
        return this.#createWindow('client.html');
    }
}

module.exports = MainWindowFactory;