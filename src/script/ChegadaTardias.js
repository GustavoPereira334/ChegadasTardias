const form = document.getElementById('formAtraso');

const btnRegistrar =
    document.getElementById('btnRegistrar');

const btnLogout =
    document.getElementById('btnLogout');

const descricaoInput =
    document.getElementById('descricao');

const charCounter =
    document.getElementById('charCounter');

const formMessage =
    document.getElementById('formMessage');

const turmaSelect =
    document.getElementById('turmas');

const professorSelect =
    document.getElementById('professor');


let usuarioAtual = null;
let perfilAtual = null;


/* =========================================
   MENSAGEM
========================================= */

function mostrarMensagem(texto, tipo = '') {

    formMessage.textContent = texto;

    formMessage.className = 'message';

    if (tipo) {
        formMessage.classList.add(tipo);
    }

}


/* =========================================
   CARREGAR USUÁRIO
========================================= */

async function carregarUsuario() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();


    /* Usuário não está logado */

    if (error || !user) {

        console.error(
            'Erro ao buscar usuário:',
            error
        );

        window.location.href = '../../index.html';

        return false;
    }


    usuarioAtual = user;


    /* =========================================
       BUSCAR PERFIL
    ========================================= */

    const {
        data: perfil,
        error: perfilError
    } = await supabaseClient
        .from('profiles')
        .select(`
            id,
            nome,
            email,
            turma,
            role
        `)
        .eq('id', user.id)
        .single();


    if (perfilError) {

        console.error(
            'Erro ao buscar perfil:',
            perfilError
        );

        mostrarMensagem(
            `Erro ao carregar perfil: ${perfilError.message}`,
            'error'
        );

        return false;
    }


    if (!perfil) {

        mostrarMensagem(
            'Perfil do usuário não encontrado.',
            'error'
        );

        return false;
    }


    perfilAtual = perfil;


    console.log(
        'Usuário:',
        usuarioAtual
    );

    console.log(
        'Perfil:',
        perfilAtual
    );


    /* =========================================
       VERIFICAR ROLE
    ========================================= */

    if (perfil.role !== 'aluno') {

        window.location.href =
            './administrator.html';

        return false;
    }


    /* =========================================
       PREENCHER TURMA
    ========================================= */

    if (perfil.turma) {

        const existe = [
            ...turmaSelect.options
        ].some(
            option =>
                option.value === perfil.turma
        );


        if (existe) {

            turmaSelect.value =
                perfil.turma;

            turmaSelect.disabled = true;

        }

    }


    return true;
}


/* =========================================
   CONTADOR DE CARACTERES
========================================= */

descricaoInput.addEventListener(
    'input',
    () => {

        charCounter.textContent =
            descricaoInput.value.length;

    }
);


/* =========================================
   REGISTRAR ATRASO
========================================= */

form.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();


        /* =====================================
           VERIFICAR USUÁRIO
        ===================================== */

        if (
            !usuarioAtual ||
            !perfilAtual
        ) {

            mostrarMensagem(
                'Usuário ainda não foi carregado.',
                'error'
            );

            return;
        }


        /* =====================================
           PEGAR VALORES
        ===================================== */

        const turma = perfilAtual.turma
            ? perfilAtual.turma.trim()
            : turmaSelect.value.trim();

        const professor =
            professorSelect.value.trim();

        const motivoSelecionado =
            document.querySelector(
                'input[name="motivo_atraso"]:checked'
            );

        const motivo =
            motivoSelecionado
                ? motivoSelecionado.value
                : '';

        const descricao =
            descricaoInput.value.trim();


        /* =====================================
           VALIDAÇÕES
        ===================================== */

        if (!turma) {

            mostrarMensagem(
                'Selecione sua turma.',
                'error'
            );

            return;
        }


        if (!professor) {

            mostrarMensagem(
                'Selecione o professor.',
                'error'
            );

            return;
        }


        if (!motivo) {

            mostrarMensagem(
                'Selecione o motivo do atraso.',
                'error'
            );

            return;
        }


        /* =====================================
           BOTÃO
        ===================================== */

        btnRegistrar.disabled = true;

        btnRegistrar.innerHTML = `
            <i class="bi bi-arrow-repeat"></i>
            Registrando...
        `;

        mostrarMensagem('');


        /* =====================================
           DADOS
        ===================================== */

        const novoRegistro = {

            aluno_id: usuarioAtual.id,

            turma: turma,

            professor: professor,

            motivo: motivo,

            descricao:
                descricao || null

        };


        console.log(
            'Enviando para Supabase:',
            novoRegistro
        );


        /* =====================================
           INSERT
        ===================================== */

        let data;
        let error;

        try {
            const resposta = await supabaseClient
                .from('atrasos')
                .insert(novoRegistro)
                .select()
                .single();

            data = resposta.data;
            error = resposta.error;
        } catch (networkError) {
            console.error('Erro de conexão:', networkError);
            mostrarMensagem(
                'Falha de conexão. Verifique sua internet e tente novamente.',
                'error'
            );
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = `
                <i class="bi bi-check2-circle"></i>
                Registrar atraso
            `;
            return;
        }


        /* =====================================
           ERRO
        ===================================== */

        if (error) {

            console.error(
                'ERRO SUPABASE:',
                error
            );

            console.error(
                'Mensagem:',
                error.message
            );

            console.error(
                'Detalhes:',
                error.details
            );

            console.error(
                'Hint:',
                error.hint
            );

            mostrarMensagem(
                'Não foi possível salvar o registro. Tente novamente.',
                'error'
            );


            btnRegistrar.disabled = false;

            btnRegistrar.innerHTML = `
                <i class="bi bi-check2-circle"></i>
                Registrar atraso
            `;

            return;
        }


        /* =====================================
           SUCESSO
        ===================================== */

        console.log(
            'Registro salvo:',
            data
        );


        mostrarMensagem(
            'Atraso registrado com sucesso!',
            'success'
        );


        /* =====================================
           LIMPAR FORM
        ===================================== */

        form.reset();

        charCounter.textContent = '0';


        /* Restaurar turma do perfil */

        if (perfilAtual.turma) {

            turmaSelect.value =
                perfilAtual.turma;

            turmaSelect.disabled = true;

        }


        /* =====================================
           BOTÃO NORMAL
        ===================================== */

        btnRegistrar.disabled = false;

        btnRegistrar.innerHTML = `
            <i class="bi bi-check2-circle"></i>
            Registrar atraso
        `;

    }
);


/* =========================================
   LOGOUT
========================================= */

btnLogout.addEventListener(
    'click',
    async () => {

        btnLogout.disabled = true;

        const {
            error
        } = await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                'Erro ao sair:',
                error
            );

            btnLogout.disabled = false;

            return;
        }


        window.location.href =
            '../../index.html';

    }
);


/* =========================================
   INICIAR
========================================= */

async function iniciarPagina() {

    console.log(
        'Iniciando página de registro...'
    );


    if (
        typeof supabaseClient ===
        'undefined'
    ) {

        console.error(
            'supabaseClient não existe.'
        );

        mostrarMensagem(
            'Erro na configuração do Supabase.',
            'error'
        );

        return;
    }


    const autorizado =
        await carregarUsuario();


    if (!autorizado) {
        return;
    }


    console.log(
        'Página carregada corretamente.'
    );

}


iniciarPagina();
