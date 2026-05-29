document.getElementById('loginForm').addEventListener('submit', function(event) {
    // 1. Evita que a página recarregue
    event.preventDefault(); 
    
    const usuarioDigitado = document.getElementById('name').value.trim();
    const senhaDigitada = document.getElementById('Senha').value.trim();

    // 3. Credenciais 
    const usuarioCorreto = "admin";
    const senhaCorreta = "22";

    // 4. Validação 
    if (usuarioDigitado === usuarioCorreto && senhaDigitada === senhaCorreta) {
        window.location.href = "./src/pages/chegadastardias.html";
    } else {
        // Mensagem de erro
        alert("Usuário ou senha incorretos! Tente novamente.");
    }
});
