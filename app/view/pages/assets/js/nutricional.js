const form = document.getElementById('form');
const Action = document.getElementById('action');
const Id = document.getElementById('id');

(async () => {
    const editData = await api.temp.get('nutricional:edit');

    if (editData) {
        Action.value = editData.action || 'e';
        Id.value = editData.id || '';

        for (const [key, value] of Object.entries(editData)) {
            const field = form.querySelector(`[name="${key}"]`);

            if (!field) continue;

            if (field.type === 'checkbox') {
                field.checked = Boolean(value);
            } else {
                field.value = value ?? '';
            }
        }
    } else {
        Action.value = 'c';
        Id.value = '';
    }
})();

document.getElementById('insert').addEventListener('click', async () => {
    try {
        const data = Object.fromEntries(
            new FormData(form).entries()
        );
        console.log(data);

        data.ativo = document.getElementById('ativo').checked;

        let response;

        if (Action.value === 'e') {
            response = await api.nutricional.update(data);
        } else {
            response = await api.nutricional.insert(data);
        }

        if (response.status) {
            toast(
                'success',
                'Sucesso',
                response.msg || 'Registro salvo com sucesso!'
            );

            api.nutricional.reload();

            api.window.close();
        } else {
            toast(
                'error',
                'Erro',
                response.msg || 'Não foi possível salvar.'
            );
        }
    } catch (err) {
        toast(
            'error',
            'Erro',
            err.message
        );
    }
});