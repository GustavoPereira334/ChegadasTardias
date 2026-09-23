const tabelaCorpo = document.getElementById('tabelaCorpo');
const searchInput = document.getElementById('searchInput');
const areaBox = document.getElementById('areaBox');

const totalAtrasos = document.getElementById('totalAtrasos');
const turmasAfetadas = document.getElementById('turmasAfetadas');
const perdeuHora = document.getElementById('perdeuHora');

const welcomeMessage = document.getElementById('welcomeMessage');
const pageMessage = document.getElementById('pageMessage');
const btnLogout = document.getElementById('btnLogout');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editId = document.getElementById('editId');
const editTurma = document.getElementById('editTurma');
const editProfessor = document.getElementById('editProfessor');
const editMotivo = document.getElementById('editMotivo');
const editDescricao = document.getElementById('editDescricao');
const editCharCounter = document.getElementById('editCharCounter');
const editMessage = document.getElementById('editMessage');
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');

let usuarioAtual = null;
let perfilAtual = null;
let registros = [];

function mostrarMensagem(texto, tipo = '') {

    pageMessage.textContent = texto;
    pageMessage.className = `message ${tipo}`;

}

async function carregarUsuario() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        window.location.href = '../../index.html';

        return false;
    }

    usuarioAtual = user;

    const { data: perfil, error: perfilError } = await supabaseClient
        .from('profiles')
        .select('nome, role')
        .eq('id', user.id)
        .single();

    if (perfilError || !perfil) {

        console.error(perfilError);

        mostrarMensagem(
            'Não foi possível carregar seu perfil.',
            'error'
        );

        return false;
    }

    if (
        perfil.role !== 'admin' &&
        perfil.role !== 'professor'
    ) {

        window.location.href = './chegadastardias.html';

        return false;
    }

    perfilAtual = perfil;

    welcomeMessage.textContent =
        `Olá, ${perfil.nome} • ${perfil.role}`;

    return true;
}

async function carregarRegistros() {

    const { data, error } = await supabaseClient
        .from('atrasos')
        .select(`
            id,
            aluno_id,
            turma,
            professor,
            motivo,
            descricao,
            data,
            hora,
            profiles (
                nome
            )
        `)
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

    if (error) {

        console.error(error);

        mostrarMensagem(
            'Erro ao carregar os registros.',
            'error'
        );

        return;
    }

    registros = data || [];

    preencherTurmas();
    renderizarRegistros();

}

function preencherTurmas() {

    const turmas = [
        ...new Set(
            registros.map(
                registro => registro.turma
            )
        )
    ].sort();

    areaBox.innerHTML = `
        <option value="todasTurmas">
            Todas as turmas
        </option>
    `;

    turmas.forEach(turma => {

        const option = document.createElement('option');

        option.value = turma;
        option.textContent = turma;

        areaBox.appendChild(option);

    });

}

function renderizarRegistros() {

    const turmaSelecionada = areaBox.value;

    const busca = searchInput.value
        .trim()
        .toLowerCase();

    const filtrados = registros.filter(registro => {

        const turmaOk =
            turmaSelecionada === 'todasTurmas' ||
            registro.turma === turmaSelecionada;

        const aluno =
            registro.profiles?.nome || '';

        const texto = [
            aluno,
            registro.turma,
            registro.professor,
            registro.motivo,
            registro.descricao || ''
        ]
            .join(' ')
            .toLowerCase();

        const buscaOk =
            !busca ||
            texto.includes(busca);

        return turmaOk && buscaOk;

    });

    atualizarCards(filtrados);
    renderizarTabela(filtrados);

}

function atualizarCards(registrosFiltrados) {

    totalAtrasos.textContent =
        registrosFiltrados.length;

    turmasAfetadas.textContent =
        new Set(
            registrosFiltrados.map(
                registro => registro.turma
            )
        ).size;

    perdeuHora.textContent =
        registrosFiltrados.filter(
            registro => registro.motivo === 'Perdeu a hora'
        ).length;

}

function renderizarTabela(registrosFiltrados) {

    tabelaCorpo.innerHTML = '';

    if (registrosFiltrados.length === 0) {

        tabelaCorpo.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    Nenhum registro encontrado.
                </td>
            </tr>
        `;

        return;
    }

    registrosFiltrados.forEach(registro => {

        const tr = document.createElement('tr');

        const aluno =
            registro.profiles?.nome || 'Aluno';

        tr.innerHTML = `

            <td>
                ${formatarData(registro.data)}
                <br>
                <small>
                    ${formatarHora(registro.hora)}
                </small>
            </td>

            <td>
                ${escaparHTML(aluno)}
            </td>

            <td>
                <span class="badge">
                    ${escaparHTML(registro.turma)}
                </span>
            </td>

            <td>
                ${escaparHTML(registro.professor)}
            </td>

            <td>

                <strong>
                    ${escaparHTML(registro.motivo)}
                </strong>

                ${
                    registro.descricao
                        ? `
                            <br>
                            <small>
                                ${escaparHTML(registro.descricao)}
                            </small>
                        `
                        : ''
                }

            </td>

            <td>

                ${
                    perfilAtual.role === 'admin'
                        ? `
                            <div class="action-buttons">
                                <button
                                    type="button"
                                    class="edit-button"
                                    data-id="${registro.id}"
                                    title="Editar registro"
                                    aria-label="Editar registro"
                                >
                                    ✏️
                                </button>
                                <button
                                    type="button"
                                    class="delete-button"
                                    data-id="${registro.id}"
                                    title="Excluir registro"
                                    aria-label="Excluir registro"
                                >
                                    🗑️
                                </button>
                            </div>
                        `
                        : `
                            <span class="no-action">
                                —
                            </span>
                        `
                }

            </td>

        `;

        tabelaCorpo.appendChild(tr);

    });

}

async function excluirRegistro(id) {

    if (perfilAtual.role !== 'admin') {

        mostrarMensagem(
            'Apenas administradores podem excluir registros.',
            'error'
        );

        return;
    }

    const confirmar = confirm(
        'Tem certeza que deseja excluir este registro?'
    );

    if (!confirmar) {
        return;
    }

    const { error } = await supabaseClient
        .from('atrasos')
        .delete()
        .eq('id', id);

    if (error) {

        console.error(error);

        mostrarMensagem(
            'Não foi possível excluir o registro.',
            'error'
        );

        return;
    }

    mostrarMensagem(
        'Registro excluído com sucesso.',
        'success'
    );

    await carregarRegistros();

}

function abrirModalEdicao(id) {

    if (perfilAtual.role !== 'admin') {
        mostrarMensagem(
            'Apenas administradores podem editar registros.',
            'error'
        );
        return;
    }

    const registro = registros.find(item => String(item.id) === String(id));

    if (!registro) {
        mostrarMensagem('Registro não encontrado.', 'error');
        return;
    }

    editId.value = registro.id;
    editTurma.value = registro.turma || '';
    editProfessor.value = registro.professor || '';
    editMotivo.value = registro.motivo || '';
    editDescricao.value = registro.descricao || '';
    editCharCounter.textContent = editDescricao.value.length;
    editMessage.textContent = '';
    editMessage.className = 'message';

    editModal.hidden = false;
    document.body.classList.add('modal-open');
    editTurma.focus();
}

function fecharModalEdicao() {
    editModal.hidden = true;
    document.body.classList.remove('modal-open');
    editForm.reset();
    editMessage.textContent = '';
}

editDescricao.addEventListener('input', () => {
    editCharCounter.textContent = editDescricao.value.length;
});

editModal.addEventListener('click', event => {
    if (event.target.closest('[data-close-modal]')) {
        fecharModalEdicao();
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !editModal.hidden) {
        fecharModalEdicao();
    }
});

editForm.addEventListener('submit', async event => {
    event.preventDefault();

    const id = editId.value;
    const turma = editTurma.value.trim();
    const professor = editProfessor.value.trim();
    const motivo = editMotivo.value;
    const descricao = editDescricao.value.trim();

    if (!id || !turma || !professor || !motivo) {
        editMessage.textContent = 'Preencha todos os campos obrigatórios.';
        editMessage.className = 'message error';
        return;
    }

    btnSalvarEdicao.disabled = true;
    btnSalvarEdicao.textContent = 'Salvando...';
    editMessage.textContent = '';

    try {
        const { error } = await supabaseClient
            .from('atrasos')
            .update({
                turma,
                professor,
                motivo,
                descricao: descricao || null
            })
            .eq('id', id);

        if (error) throw error;

        fecharModalEdicao();
        mostrarMensagem('Registro atualizado com sucesso.', 'success');
        await carregarRegistros();
    } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        editMessage.textContent = 'Não foi possível atualizar o registro.';
        editMessage.className = 'message error';
    } finally {
        btnSalvarEdicao.disabled = false;
        btnSalvarEdicao.textContent = 'Salvar alterações';
    }
});

tabelaCorpo.addEventListener('click', event => {

    const editButton =
        event.target.closest('.edit-button');

    if (editButton) {
        abrirModalEdicao(editButton.dataset.id);
        return;
    }

    const button =
        event.target.closest('.delete-button');

    if (!button) {
        return;
    }

    const id = button.dataset.id;

    excluirRegistro(id);

});

searchInput.addEventListener(
    'input',
    renderizarRegistros
);

areaBox.addEventListener(
    'change',
    renderizarRegistros
);

btnLogout.addEventListener('click', async () => {

    await supabaseClient.auth.signOut();

    window.location.href = '../../index.html';

});

function formatarData(data) {

    if (!data) return '-';

    const [ano, mes, dia] = data.split('-');

    return `${dia}/${mes}/${ano}`;

}

function formatarHora(hora) {

    if (!hora) return '-';

    return hora.substring(0, 5);

}

function escaparHTML(texto) {

    const div = document.createElement('div');

    div.textContent = texto ?? '';

    return div.innerHTML;

}

async function iniciar() {

    const autorizado = await carregarUsuario();

    if (!autorizado) {
        return;
    }

    await carregarRegistros();

}

iniciar();
