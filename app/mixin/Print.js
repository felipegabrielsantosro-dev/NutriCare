// ES Module — require() não existe aqui; todos os módulos importados no topo
import { BrowserWindow, ipcMain, dialog } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import os from 'os'
import puppeteer from 'puppeteer'

// Resolve __dirname compatível com ES Module para localizar pdf-preload.js
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class Print {

  // Armazena o HTML do relatório recebido via stringHTML()
  #html = null

  // Armazena o CSS personalizado recebido via stringCss()
  #css = null

  // Configurações padrão de impressão — sobrescritas parcialmente via setOptions()
  #opcoes = { marginsType: 0, pageSize: 'A4', printBackground: true, landscape: false }

  // Factory — ponto de entrada da interface fluente
  static create() { return new Print(); }

  // Recebe o HTML do relatório e retorna this para encadeamento fluente
  stringHTML(html) { this.#html = html; return this; }

  // Recebe o CSS personalizado das páginas do relatório e retorna this para encadeamento fluente
  stringCss(css = '') { this.#css = css; return this; }

  // Mescla as opções recebidas com os padrões de #opcoes e retorna this para encadeamento fluente
  setOptions(opt = {}) { this.#opcoes = { ...this.#opcoes, ...opt }; return this; }

  // Monta o HTML completo do viewer recebendo a URL do PDF e o nome do arquivo já gerado
  assembleHTMLString(pdfUrl = '', pdfFileName = '') {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">

      <head>
        <meta charset="UTF-8">
        <title>Visualizar PDF</title>
        <style>
          *,
          *::before,
          *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #pdf-viewer {
            flex: 1;
            width: 100%;
            display: block;
            border: none;
          }
        </style>
      </head>
      <body>
        <embed id="pdf-viewer" src="${pdfUrl}#zoom=100&pagemode=none" type="application/pdf">
        <script>
          async function salvarPdf() {
            const btn = document.getElementById('btn-save');
            btn.disabled = true; btn.textContent = '⏳ Aguarde...';
            try {
              const result = await window.printApi.salvar();
              if (result?.status) {
                btn.style.background = '#0369a1'; btn.textContent = '✔ PDF Salvo!';
                setTimeout(() => { btn.removeAttribute('style'); btn.textContent = '⬇ Salvar PDF'; btn.disabled = false; }, 2000);
              } else { btn.disabled = false; btn.textContent = '⬇ Salvar PDF'; }
            } catch { btn.disabled = false; btn.textContent = '⬇ Salvar PDF'; }
          }
        </script>
      </body>
      </html>
    `;
  }

  // Gera o PDF via Puppeteer unindo #css e #html em um template dedicado ao Puppeteer
  async #gerarPdf(pdfPath) {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-extensions', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      // Template dedicado ao Puppeteer — une #css e #html sem estrutura do viewer
      await page.setContent(
        `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
                <style>${this.#css ?? ''}</style></head><body>${this.#html ?? ''}</body></html>`,
        { waitUntil: 'networkidle0' }
      );
      await page.pdf({
        path: pdfPath,
        format: this.#opcoes.pageSize,
        printBackground: this.#opcoes.printBackground,
        landscape: this.#opcoes.landscape,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });
    } finally {
      // Encerra o Chromium e libera memória — executado mesmo em caso de exceção
      if (browser) await browser.close();
    }
  }

  // Orquestra geração do PDF, abertura do modal e ciclo de vida dos arquivos temporários
  async print() {
    const sessionId = Date.now();
    const pdfFileName = `relatorio_${sessionId}.pdf`;
    const pdfPath = path.join(os.tmpdir(), pdfFileName);
    const viewerPath = path.join(os.tmpdir(), `print_viewer_${sessionId}.html`);
    const saveChannel = `print:save:${sessionId}`;

    await this.#gerarPdf(pdfPath);

    // Converte backslashes do Windows para forward slashes exigidos pelo protocolo file://
    const pdfUrl = 'file:///' + pdfPath.replace(/\\/g, '/');

    // Grava o viewer montado por assembleHTMLString() com a URL do PDF embutida no src
    fs.writeFileSync(viewerPath, this.assembleHTMLString(pdfUrl, pdfFileName), 'utf-8');

    const parentWin = BrowserWindow.getFocusedWindow();
    const viewerWin = new BrowserWindow({
      width: 920, height: 720, minWidth: 640, minHeight: 480,
      title: 'Visualizar PDF', show: false, autoHideMenuBar: true,
      parent: parentWin || undefined, modal: !!parentWin,
      webPreferences: {
        // Preload estático — canal IPC da sessão injetado via additionalArguments
        preload: path.join(__dirname, 'pdf-preload.js'),
        additionalArguments: [`--save-channel=${saveChannel}`],
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // handleOnce auto-remove o listener após o primeiro uso — sem vazamento de handlers
    ipcMain.handleOnce(saveChannel, async () => {
      const result = await dialog.showSaveDialog(viewerWin, {
        title: 'Salvar PDF', defaultPath: pdfFileName,
        filters: [{ name: 'Arquivo PDF', extensions: ['pdf'] }],
      });
      if (result.canceled || !result.filePath) return { status: false };
      // Copia o PDF do temporário para o destino escolhido pelo usuário
      fs.copyFileSync(pdfPath, result.filePath);
      return { status: true };
    });

    // Ao fechar: remove handler residual e deleta os arquivos temporários da sessão
    viewerWin.on('closed', () => {
      try { ipcMain.removeHandler(saveChannel); } catch { }
      for (const f of [pdfPath, viewerPath]) try { fs.unlinkSync(f); } catch { }
    });

    viewerWin.once('ready-to-show', () => viewerWin.show());
    viewerWin.loadFile(viewerPath);
  }
}