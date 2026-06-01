function carregarRegistros(filtroTurma = 'todasTurmas', termoBusca = '') {
    const registros = JSON.parse(localStorage.getItem('registrosAtraso') || '[]');

    const filtrados = registros.filter(r => {
        const turmaOk = filtroTurma === 'todasTurmas' || r.turma === filtroTurma;
        const busca = termoBusca.toLowerCase();
        const buscaOk = !busca ||
            r.aluno.toLowerCase().includes(busca) ||
            r.motivo.toLowerCase().includes(busca) ||
            r.turma.toLowerCase().includes(busca);
        return turmaOk && buscaOk;
    });

    // Atualiza os cards
    document.getElementById('totalAtrasos').textContent = filtrados.length;

    const turmasUnicas = new Set(filtrados.map(r => r.turma));
    document.getElementById('turmasAfetadas').textContent = turmasUnicas.size;

    const perdeuHora = filtrados.filter(r => r.perdeuHora).length;
    document.getElementById('perdeuHora').textContent = perdeuHora;

    // Preenche a tabela
    const tbody = document.getElementById('tabelaCorpo');
    tbody.innerHTML = '';

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum registro encontrado.</td></tr>';
        return;
    }

    filtrados.forEach((r, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.hora}</td>
            <td>${r.aluno}</td>
            <td>${r.turma}</td>
            <td>${r.motivo}${r.descricao ? `<br><small style="color:#888">${r.descricao}</small>` : ''}</td>
            <td><button onclick="excluirRegistro(${index})">🗑</button></td>
        `;
        tbody.appendChild(tr);
    });

    const areaBox = document.getElementById('areaBox');
    const turmasOptions = ['todasTurmas', ...Array.from(
        new Set(registros.map(r => r.turma))
    )];
    areaBox.innerHTML = turmasOptions.map(t =>
        `<option value="${t}" ${t === filtroTurma ? 'selected' : ''}>
            ${t === 'todasTurmas' ? 'Todas turmas' : t}
        </option>`
    ).join('');
}

function excluirRegistro(index) {
    const registros = JSON.parse(localStorage.getItem('registrosAtraso') || '[]');
    registros.splice(index, 1);
    localStorage.setItem('registrosAtraso', JSON.stringify(registros));
    carregarRegistros(
        document.getElementById('areaBox').value,
        document.querySelector('input[type="search"]').value
    );
}

// Filtros
document.getElementById('areaBox').addEventListener('change', function() {
    carregarRegistros(this.value, document.querySelector('input[type="search"]').value);
});

document.querySelector('input[type="search"]').addEventListener('input', function() {
    carregarRegistros(document.getElementById('areaBox').value, this.value);
});

// Carrega ao abrir a página
carregarRegistros();