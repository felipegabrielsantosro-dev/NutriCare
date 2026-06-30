import './app/config/env.js';
import { app } from 'electron';
import Template from './app/mixin/Template.js';
import path from 'path'; // 1. Importa o módulo de caminhos
import { fileURLToPath } from 'url';

// Carrega as rotas IPC
import './app/route/route.js';

// Resolve o caminho da raiz do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.whenReady().then(() => {
    const win = Template.create('main', {
        width: 1280,
        height: 800,
        title: 'NutriCare',
        // 2. 👇 Aponta direto para o arquivo na raiz 👇
        icon: path.join(__dirname, 'images.ico'),
    });

    Template.loadView(win, 'pages/home');
    win.maximize();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});