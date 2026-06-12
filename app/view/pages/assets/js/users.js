const InsertButton = document.getElementById('insert');
const Action = document.getElementById('action');
const Id = document.getElementById('id');
const form = document.getElementById('form');

const senha = document.getElementById('senha');
const toggleSenha = document.getElementById('toggleSenha');

const altura = document.getElementById('altura');
const peso = document.getElementById('peso');
const imcEl = document.getElementById('imc');

// 👁 Toggle senha
if (toggleSenha && senha) {
    toggleSenha.addEventListener('click', () => {
        senha.type = senha.type === 'password' ? 'text' : 'password';
    });
}

// 📊 cálculo IMC
function calcIMC() {
    const h = parseFloat(altura?.value);
    const p = parseFloat(peso?.value);

    if (!h || !p) {
        imcEl.textContent = '0.00';
        return;
    }

    const imc = (p / (h * h)).toFixed(2);
    imcEl.textContent = imc;
}

if (altura) altura.addEventListener('input', calcIMC);
if (peso) peso.addEventListener('input', calcIMC);

// 🔄 CARREGA DADOS DE EDIÇÃO
// Dentro do seu users.js (Script do formulário de cadastro/edição)
(async () => {
    try {
        // Busca os dados enviados pela listagem
        const editData = await api.temp.get('user:edit');
        const form = document.getElementById('form'); // Garanta que o id do form seja este

        if (editData) {
            document.getElementById('action').value = editData.action || 'e';
            document.getElementById('id').value = editData.id || '';

            // Preenche os inputs automaticamente
            for (const [key, value] of Object.entries(editData)) {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = value === true || value === 1;
                    } else {
                        field.value = value ?? '';
                    }
                }
            }
        } else {
            document.getElementById('action').value = 'c';
            document.getElementById('id').value = '';
        }
    } catch (error) {
        console.error("Erro ao inicializar formulário de usuário:", error);
    }
})();

// ⚡ validação simples
function validate(data) {
    if (!data.nome) return "Nome obrigatório";
    if (!data.email) return "Email obrigatório";
    if (!data.senha) return "Senha obrigatória";
    if (!data.sexo) return "Sexo obrigatório";
    return null;
}

// 💾 INSERT / UPDATE
InsertButton.addEventListener('click', async () => {
    let timer = 3000;

    $('#insert').prop('disabled', true);

    const data = formToJson(form);

    const error = validate(data);
    if (error) {
        toast('error', 'Erro', error, timer);
        $('#insert').prop('disabled', false);
        return;
    }

    let id = Action.value !== 'c' ? Id.value : null;

    try {

        const response = Action.value === 'c'
            ? await api.users.insert(data)
            : await api.users.update(id, data);

        if (!response.status) {
            toast('error', 'Erro', response.msg, timer);
            return;
        }

        toast('success', 'Sucesso', response.msg, timer);

        form.reset();
        if (imcEl) imcEl.textContent = "0.00";

        setTimeout(() => {
            api.window.close();
        }, timer);

    } catch (err) {
        toast('error', 'Falha', 'Erro: ' + err.message, timer);
    } finally {
        $('#insert').prop('disabled', false);
    }
});