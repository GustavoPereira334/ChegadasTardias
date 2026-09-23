const form = document.getElementById('loginForm');
const btnEntrar = document.getElementById('btnEntrar');
const message = document.getElementById('loginMessage');

function mostrarMensagem(texto, tipo = '') {
    message.textContent = texto;
    message.className = `message ${tipo}`;
}

async function verificarUsuarioLogado() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {
        return;
    }

    await redirecionarUsuario(session.user.id);
}

async function redirecionarUsuario(userId) {

    const { data: perfil, error } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !perfil) {
        console.error(error);

        mostrarMensagem(
            'Não foi possível carregar seu perfil.',
            'error'
        );

        return;
    }

    if (
        perfil.role === 'admin' ||
        perfil.role === 'professor'
    ) {
        window.location.href = './src/pages/administrator.html';
        return;
    }

    if (perfil.role === 'aluno') {
        window.location.href = './src/pages/chegadastardias.html';
    }
}

form.addEventListener('submit', async (event) => {

    event.preventDefault();

    const email = document
        .getElementById('email')
        .value
        .trim();

    const senha = document
        .getElementById('senha')
        .value;

    if (!email || !senha) {
        mostrarMensagem(
            'Preencha e-mail e senha.',
            'error'
        );

        return;
    }

    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Entrando...';

    mostrarMensagem('');

    let data;
    let error;

    try {
        const resposta = await supabaseClient.auth.signInWithPassword({
            email,
            password: senha
        });

        data = resposta.data;
        error = resposta.error;
    } catch (networkError) {
        console.error(networkError);
        mostrarMensagem(
            'Falha de conexão. Verifique sua internet e tente novamente.',
            'error'
        );
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';
        return;
    }

    if (error) {

        console.error(error);

        mostrarMensagem(
            'E-mail ou senha incorretos.',
            'error'
        );

        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar';

        return;
    }

    await redirecionarUsuario(data.user.id);

});

verificarUsuarioLogado();
