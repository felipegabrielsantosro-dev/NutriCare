# 🥦 NutriCare

> Uma solução desktop completa e moderna para a gestão de clínicas de nutrição, acompanhamento de pacientes e planejamento dietético automatizado.

---

## 📌 Sobre o Projeto

O **NutriCare** é um aplicativo desktop desenvolvido para otimizar o fluxo de trabalho de profissionais da saúde e nutrição. Ele combina o poder e o desempenho do **Node.js** e **Electron** no ecossistema desktop, integrando de forma híbrida uma camada de backend ágil, suporte a banco de dados relacional com **Knex.js**, além de componentes auxiliares e legados em **PHP** para relatórios ou integrações específicas.

### ✨ Principais Funcionalidades
- **Gestão de Pacientes:** Cadastro completo, histórico clínico, anamnese e evolução.
- **Avaliação Antropométrica:** Registro de dobras cutâneas, bioimpedância e cálculo automático de IMC, TDEE, e BF%.
- **Plano Alimentar Inteligente:** Criação de dietas personalizadas com base em tabelas de composição de alimentos (TACO/TUCAN).
- **Emissão de Relatórios:** Geração de gráficos de evolução e relatórios prontos em PDF para o paciente.
- **Alertas e Notificações:** Sistema local para lembrar horários de consultas e retornos.

---

## 🛠️ Tecnologias e Ferramentas

O projeto utiliza um ecossistema robusto e diversificado para garantir performance, portabilidade e segurança:

| Tecnologia | Ícone | Função no Projeto |
| :--- | :---: | :--- |
| **Node.js** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="nodejs" width="30"/> | Ambiente de execução principal e API Core |
| **Electron** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/electron/electron-original.svg" alt="electron" width="30"/> | Estrutura para aplicação desktop cross-platform |
| **JavaScript** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="30"/> | Lógica de programação (Frontend e Backend) |
| **HTML5** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" alt="html5" width="30"/> | Estruturação das interfaces da aplicação |
| **CSS3** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" alt="css3" width="30"/> | Estilização avançada e design responsivo |
| **PHP** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/php/php-original.svg" alt="php" width="30"/> | Serviços auxiliares, processamento de dados legados ou relatórios |
| **Knex.js** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/knexjs/knexjs-original.svg" alt="knex" width="30"/> | Query Builder SQL para comunicação com o banco de dados |
| **Testes** | <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/jest/jest-plain.svg" alt="test" width="30"/> | Arquitetura de testes automatizados (Unitários e Integração) |

---

## 📂 Estrutura do Projeto

Abaixo está a disposição das principais pastas do sistema:

```bash
nutricare/
├── .github/             # Workflows e automações do GitHub
├── src/                 # Código-fonte principal da aplicação
│   ├── main/            # Processo principal do Electron (Main Process)
│   ├── renderer/        # Interface do usuário (HTML, CSS, JS do Frontend)
│   │   ├── css/
│   │   ├── js/
│   │   └── views/
│   ├── backend/         # Integrações auxiliares e scripts PHP
│   └── database/        # Migrations, seeds e configurações do Knex
├── tests/               # Suíte de testes automatizados
├── knexfile.js          # Arquivo de configuração do Knex
├── package.json         # Dependências e scripts do Node.js
└── README.md            # Documentação do projeto