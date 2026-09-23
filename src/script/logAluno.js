const tabelaCorpo = document.getElementById('tabelaCorpo');
const searchInput = document.getElementById('searchInput');
const areaBox = document.getElementById('areaBox');

const totalAtrasos = document.getElementById('totalAtrasos');
const turmasAfetadas = document.getElementById('turmasAfetadas');
const perdeuHora = document.getElementById('perdeuHora');

const welcomeMessage = document.getElementById('welcomeMessage');
const pageMessage = document.getElementById('pageMessage');
const btnLogout = document.getElementById('btnLogout');

let usuarioAtual = null;
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
        .select('nome, turma, role')
        .eq('id', user.id)
        .single();

    if (perfilError || !perfil) {

        mostrarMensagem(
            'Não foi possível carregar seu perfil.',
            'error'
        );

        return false;
    }

    if (perfil.role !== 'aluno') {

        window.location.href = './administrator.html';

        return false;
    }

    welcomeMessage.textContent =
        `Olá, ${perfil.nome}. Seus registros de chegada tardia.`;

    return true;
}

async function carregarRegistros() {

    if (!usuarioAtual) {
        return;
    }

    const { data, error } = await supabaseClient
        .from('atrasos')
        .select(`
            id,
            turma,
            professor,
            motivo,
            descricao,
            data,
            hora,
            registrado_em
        `)
        .eq('aluno_id', usuarioAtual.id)
        .order('registrado_em', { ascending: false });

    if (error) {

        console.error(error);

        mostrarMensagem(
            'Erro ao carregar seus registros.',
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
            registros.map(registro => registro.turma)
        )
    ];

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

        const texto = [
            registro.turma,
            registro.professor,
            registro.motivo,
            registro.descricao || '',
            registro.data
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
                <td colspan="4" class="empty">
                    Nenhum registro encontrado.
                </td>
            </tr>
        `;

        return;
    }

    registrosFiltrados.forEach(registro => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>
                ${formatarDataHora(registro.registrado_em, registro.data, 'data')}
                <br>
                <small>${formatarDataHora(registro.registrado_em, registro.hora, 'hora')}</small>
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
        `;

        tabelaCorpo.appendChild(tr);

    });

}

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

async function iniciar() {

    const autorizado = await carregarUsuario();

    if (!autorizado) {
        return;
    }

    await carregarRegistros();

}

iniciar();
