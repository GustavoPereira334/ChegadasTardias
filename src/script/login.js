const usuarios = [
    { usuario: "Pedagogico", senha: "senai", role: "admin" },
    { usuario: "Gustavo", senha: "22", role: "aluno" },
    { usuario: "Marissa", senha: "22", role: "aluno" },
    { usuario: "Willy", senha: "aati", role: "professor" },
];

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const usuarioDigitado = document.getElementById('name').value.trim();
    const senhaDigitada = document.getElementById('Senha').value;

    const usuarioEncontrado = usuarios.find(
        u => u.usuario === usuarioDigitado && u.senha === senhaDigitada
    );

    if (!usuarioEncontrado) {
        alert("Usuário ou senha incorretos! Tente novamente.");
        return;
    }

    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioEncontrado))

    if (usuarioEncontrado.role === "admin" || usuarioEncontrado.role === "professor") {
        window.location.href = "./src/pages/administrator.html";
    } else {
        window.location.href = "./src/pages/chegadastardias.html";
    }
});