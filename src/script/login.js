document.getElementById('loginForm').addEventListener('submit', function(event) {
    // 1. Evita que a página recarregue ou dê erro 405/404 no GitHub
    event.preventDefault(); 
    
    // 2. Captura o que o usuário digitou nos campos
    const usuarioDigitado = document.getElementById('name').value;
    const senhaDigitada = document.getElementById('Senha').value;

    // 3. Define qual é o usuário e senha corretos (mude aqui se quiser)
    const usuarioCorreto = "senai";
    const senhaCorreta = "123";

    // 4. Faz a validação
    if (usuarioDigitado === usuarioCorreto && senhaDigitada === senhaCorreta) {
        // Se estiver certo, redireciona usando o caminho relativo correto para o GitHub Pages
        window.location.href = "./src/pages/chegadastardias.html";
    } else {
        // Se estiver errado, exibe um alerta e não muda de página
        alert("Usuário ou senha incorretos! Tente novamente.");
    }
});
