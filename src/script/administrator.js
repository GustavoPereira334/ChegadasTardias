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
const btnOpenAlerts = document.getElementById('btnOpenAlerts');
const alertsCount = document.getElementById('alertsCount');
const alertsModal = document.getElementById('alertsModal');
const alertsSearch = document.getElementById('alertsSearch');
const alertsClassFilter = document.getElementById('alertsClassFilter');
const alertsStatusFilter = document.getElementById('alertsStatusFilter');
const alertsTableBody = document.getElementById('alertsTableBody');
const alertsMessage = document.getElementById('alertsMessage');
const pendingMeasures = document.getElementById('pendingMeasures');
const verbalMeasures = document.getElementById('verbalMeasures');
const writtenMeasures = document.getElementById('writtenMeasures');
const suspensionMeasures = document.getElementById('suspensionMeasures');
const measureModal = document.getElementById('measureModal');
const measureForm = document.getElementById('measureForm');
const measureStudentId = document.getElementById('measureStudentId');
const measureType = document.getElementById('measureType');
const measureStudent = document.getElementById('measureStudent');
const measureLabel = document.getElementById('measureLabel');
const measureNotes = document.getElementById('measureNotes');
const suspensionFields = document.getElementById('suspensionFields');
const suspensionDays = document.getElementById('suspensionDays');
const measureMessage = document.getElementById('measureMessage');
const btnSaveMeasure = document.getElementById('btnSaveMeasure');

let usuarioAtual = null;
let perfilAtual = null;
let registros = [];
let medidasRegistradas = [];
let alertasAlunos = [];

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
            registrado_em,
            profiles (
                nome
            )
        `)
        .order('registrado_em', { ascending: false });

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
    await carregarMedidasDisciplinares();

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
                ${formatarDataHora(registro.registrado_em, registro.data, 'data')}
                <br>
                <small>
                    ${formatarDataHora(registro.registrado_em, registro.hora, 'hora')}
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

async function carregarMedidasDisciplinares() {

    const { data, error } = await supabaseClient
        .from('medidas_disciplinares')
        .select('id, aluno_id, tipo, quantidade_atrasos, aplicada_em, observacao, dias_suspensao');

    if (error) {
        console.error(error);
        alertsMessage.textContent =
            'Execute a migration 002 no Supabase para habilitar as advertências.';
        alertsMessage.className = 'message error';
        medidasRegistradas = [];
    } else {
        medidasRegistradas = data || [];
        alertsMessage.textContent = '';
    }

    calcularAlertasReais();
}

function obterMedidasDevidas(quantidade) {
    const limites = [
        { minimo: 3, tipo: 'verbal', label: 'Advertência verbal', classe: 'measure-verbal' },
        { minimo: 4, tipo: 'escrita_1', label: '1ª advertência escrita', classe: 'measure-written-1' },
        { minimo: 5, tipo: 'escrita_2', label: '2ª advertência escrita', classe: 'measure-written-2' },
        { minimo: 6, tipo: 'escrita_3_suspensao', label: '3ª escrita + suspensão', classe: 'measure-suspension' }
    ];

    return limites.filter(item => quantidade >= item.minimo);
}

function calcularAlertasReais() {

    const alunos = new Map();

    registros.forEach(registro => {
        const alunoId = String(registro.aluno_id);
        const atual = alunos.get(alunoId) || {
            alunoId,
            nome: registro.profiles?.nome || 'Aluno',
            turma: registro.turma || '-',
            quantidade: 0
        };

        atual.quantidade += 1;
        alunos.set(alunoId, atual);
    });

    alertasAlunos = [...alunos.values()]
        .map(aluno => {
            const medidasDevidas = obterMedidasDevidas(aluno.quantidade);
            if (!medidasDevidas.length) return null;

            const pendente = medidasDevidas.find(medida =>
                !medidasRegistradas.some(item =>
                    String(item.aluno_id) === aluno.alunoId && item.tipo === medida.tipo
                )
            );

            const medida = pendente || medidasDevidas[medidasDevidas.length - 1];
            const registroMedida = medidasRegistradas.find(item =>
                String(item.aluno_id) === aluno.alunoId && item.tipo === medida.tipo
            );

            return {
                ...aluno,
                ...medida,
                status: registroMedida ? 'aplicada' : 'pendente',
                registroMedida
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome));

    preencherFiltroTurmasAlertas();
    atualizarResumoAlertas();
    renderizarAlertas();
}

function preencherFiltroTurmasAlertas() {

    const valorAtual = alertsClassFilter.value;
    const turmas = [...new Set(alertasAlunos.map(item => item.turma))].sort();

    alertsClassFilter.innerHTML = '<option value="todas">Todas as turmas</option>';

    turmas.forEach(turma => {
        const option = document.createElement('option');
        option.value = turma;
        option.textContent = turma;
        alertsClassFilter.appendChild(option);
    });

    if (turmas.includes(valorAtual)) alertsClassFilter.value = valorAtual;
}

function atualizarResumoAlertas() {

    const pendentes = alertasAlunos.filter(item => item.status === 'pendente');

    alertsCount.textContent = pendentes.length;
    pendingMeasures.textContent = pendentes.length;
    verbalMeasures.textContent = alertasAlunos.filter(item => item.tipo === 'verbal').length;
    writtenMeasures.textContent = alertasAlunos.filter(item =>
        item.tipo === 'escrita_1' || item.tipo === 'escrita_2'
    ).length;
    suspensionMeasures.textContent = alertasAlunos.filter(item =>
        item.tipo === 'escrita_3_suspensao'
    ).length;
}

function renderizarAlertas() {

    const busca = alertsSearch.value.trim().toLowerCase();
    const turma = alertsClassFilter.value;
    const status = alertsStatusFilter.value;

    const filtrados = alertasAlunos.filter(item => {
        const correspondeBusca = !busca || item.nome.toLowerCase().includes(busca);
        const correspondeTurma = turma === 'todas' || item.turma === turma;
        const correspondeStatus = status === 'todos' || item.status === status;
        return correspondeBusca && correspondeTurma && correspondeStatus;
    });

    alertsTableBody.innerHTML = '';

    if (!filtrados.length) {
        alertsTableBody.innerHTML = `
            <tr><td colspan="6" class="empty">Nenhum aluno encontrado.</td></tr>
        `;
        return;
    }

    filtrados.forEach(item => {
        const tr = document.createElement('tr');
        const podeRegistrar = perfilAtual.role === 'admin' && item.status === 'pendente';

        tr.innerHTML = `
            <td><strong>${escaparHTML(item.nome)}</strong></td>
            <td><span class="badge">${escaparHTML(item.turma)}</span></td>
            <td>${item.quantidade}</td>
            <td><span class="measure-badge ${item.classe}">${item.label}</span></td>
            <td>
                <span class="status-badge ${item.status === 'aplicada' ? 'status-applied' : 'status-pending'}">
                    ${item.status === 'aplicada' ? 'Aplicada' : 'Pendente'}
                </span>
            </td>
            <td>
                ${podeRegistrar ? `
                    <button type="button" class="register-measure-button" data-student-id="${item.alunoId}">
                        Registrar
                    </button>
                ` : '—'}
            </td>
        `;

        alertsTableBody.appendChild(tr);
    });
}

function abrirAlertas() {
    alertsModal.hidden = false;
    document.body.classList.add('modal-open');
    renderizarAlertas();
}

function fecharAlertas() {
    alertsModal.hidden = true;
    if (measureModal.hidden && editModal.hidden) {
        document.body.classList.remove('modal-open');
    }
}

function abrirRegistroMedida(alunoId) {

    const alerta = alertasAlunos.find(item => item.alunoId === String(alunoId));
    if (!alerta || alerta.status === 'aplicada') return;

    measureStudentId.value = alerta.alunoId;
    measureType.value = alerta.tipo;
    measureStudent.textContent = `${alerta.nome} • ${alerta.turma} • ${alerta.quantidade} atrasos`;
    measureLabel.textContent = alerta.label;
    suspensionFields.hidden = alerta.tipo !== 'escrita_3_suspensao';
    suspensionDays.required = alerta.tipo === 'escrita_3_suspensao';
    measureMessage.textContent = '';
    measureModal.hidden = false;
}

function fecharRegistroMedida() {
    measureModal.hidden = true;
    measureForm.reset();
    measureMessage.textContent = '';
}

btnOpenAlerts.addEventListener('click', abrirAlertas);
alertsSearch.addEventListener('input', renderizarAlertas);
alertsClassFilter.addEventListener('change', renderizarAlertas);
alertsStatusFilter.addEventListener('change', renderizarAlertas);

alertsModal.addEventListener('click', event => {
    if (event.target.closest('[data-close-alerts]')) fecharAlertas();

    const button = event.target.closest('.register-measure-button');
    if (button) abrirRegistroMedida(button.dataset.studentId);
});

measureModal.addEventListener('click', event => {
    if (event.target.closest('[data-close-measure]')) fecharRegistroMedida();
});

measureForm.addEventListener('submit', async event => {
    event.preventDefault();

    const alerta = alertasAlunos.find(item => item.alunoId === measureStudentId.value);
    if (!alerta || perfilAtual.role !== 'admin') return;

    btnSaveMeasure.disabled = true;
    btnSaveMeasure.textContent = 'Registrando...';

    const { error } = await supabaseClient
        .from('medidas_disciplinares')
        .insert({
            aluno_id: alerta.alunoId,
            tipo: alerta.tipo,
            quantidade_atrasos: alerta.quantidade,
            responsavel_id: usuarioAtual.id,
            observacao: measureNotes.value.trim() || null,
            dias_suspensao: alerta.tipo === 'escrita_3_suspensao'
                ? Number(suspensionDays.value)
                : null
        });

    if (error) {
        console.error(error);
        measureMessage.textContent = 'Não foi possível registrar a medida.';
        measureMessage.className = 'message error';
    } else {
        fecharRegistroMedida();
        await carregarMedidasDisciplinares();
        alertsMessage.textContent = 'Medida registrada com sucesso.';
        alertsMessage.className = 'message success';
    }

    btnSaveMeasure.disabled = false;
    btnSaveMeasure.textContent = 'Confirmar aplicação';
});

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

function formatarDataHora(registradoEm, valorAntigo, parte) {

    if (!registradoEm) {
        return parte === 'data'
            ? formatarData(valorAntigo)
            : formatarHora(valorAntigo);
    }

    const data = new Date(registradoEm);

    if (Number.isNaN(data.getTime())) return '-';

    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        ...(parte === 'data'
            ? { day: '2-digit', month: '2-digit', year: 'numeric' }
            : { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }).format(data);
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
