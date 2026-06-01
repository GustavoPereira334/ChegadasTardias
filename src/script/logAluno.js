const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

// Se não há usuário logado, manda de volta pro login
if (!usuarioLogado) {
    window.location.href = '../../index.html';
}

function carregarRegistros(filtroTurma = 'todasTurmas', termoBusca = '') {
    const todos = JSON.parse(localStorage.getItem('registrosAtraso') || '[]');

    // Filtra apenas os registros do aluno logado
    const meus = todos.filter(r => r.aluno === usuarioLogado.usuario);

    const filtrados = meus.filter(r => {
        const turmaOk  = filtroTurma === 'todasTurmas' || r.turma === filtroTurma;
        const busca    = termoBusca.toLowerCase();
        const buscaOk  = !busca ||
            r.motivo.toLowerCase().includes(busca) ||
            r.turma.toLowerCase().includes(busca) ||
            r.data?.includes(busca);
        return turmaOk && buscaOk;
    });

    // Cards
    document.getElementById('totalAtrasos').textContent  = filtrados.length;
    document.getElementById('turmasAfetadas').textContent = new Set(filtrados.map(r => r.turma)).size;
    document.getElementById('perdeuHora').textContent    = filtrados.filter(r => r.perdeuHora).length;

    // Tabela
    const tbody = document.getElementById('tabelaCorpo');
    tbody.innerHTML = '';

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum registro encontrado.</td></tr>';
        return;
    }

    filtrados.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.data} ${r.hora}</td>
            <td>${r.aluno}</td>
            <td>${r.turma}</td>
            <td>${r.motivo}${r.descricao ? `<br><small style="color:#888">${r.descricao}</small>` : ''}</td>
            <td></td>
        `;
        tbody.appendChild(tr);
    });

    // Popula select de turmas com as turmas do aluno
    const areaBox = document.getElementById('areaBox');
    const turmas  = ['todasTurmas', ...new Set(meus.map(r => r.turma))];
    areaBox.innerHTML = turmas.map(t =>
        `<option value="${t}" ${t === filtroTurma ? 'selected' : ''}>
            ${t === 'todasTurmas' ? 'Todas turmas' : t}
        </option>`
    ).join('');
}

document.getElementById('areaBox').addEventListener('change', function() {
    carregarRegistros(this.value, document.querySelector('input[type="search"]').value);
});

document.querySelector('input[type="search"]').addEventListener('input', function() {
    carregarRegistros(document.getElementById('areaBox').value, this.value);
});

carregarRegistros();