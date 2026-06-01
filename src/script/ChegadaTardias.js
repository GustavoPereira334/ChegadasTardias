const textarea = document.getElementById('descreva');
const counter  = document.querySelector('.char-counter');
const maxLength = 300;

textarea.setAttribute('maxlength', maxLength);
textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length} / ${maxLength}`;
});

document.getElementById('formAtraso').addEventListener('submit', function(event) {
    event.preventDefault();

    const estudante = document.getElementById('iEstudante').value.trim();
    const turma     = document.getElementById('turmas').value;
    const professor = document.getElementById('Professores').value;
    const motivo    = document.querySelector('input[name="motivo_atraso"]:checked')?.value;
    const descricao = document.getElementById('descreva').value.trim();

    if (!motivo) {
        alert('Selecione um motivo para o atraso.');
        return;
    }

    const motivoLabels = {
        escola: 'Questões escolares',
        onibus: 'Atraso ônibus',
        hora:   'Perdeu a hora',
        saude:  'Saúde / bem-estar'
    };

    const turmaLabels = {
        TI:         'AATI M1',
        PCP:        'AAPCP V3',
        WEG:        'AAWEG V1',
        MANUTENCAO: 'AAMNT'
    };

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    const registro = {
        hora:      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        data:      new Date().toLocaleDateString('pt-BR'),
        aluno:     usuarioLogado?.usuario || estudante,
        turma:     turmaLabels[turma] || turma,
        professor: professor,
        motivo:    motivoLabels[motivo],
        descricao: descricao,
        perdeuHora: motivo === 'hora'
    };

    const registros = JSON.parse(localStorage.getItem('registrosAtraso') || '[]');
    registros.push(registro);
    localStorage.setItem('registrosAtraso', JSON.stringify(registros));

    alert('Atraso registrado com sucesso!');
    this.reset();
    counter.textContent = '0 / 300';
});