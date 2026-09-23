# Sistema de Chegadas Tardias

Sistema web desenvolvido para registrar e acompanhar chegadas tardias de alunos do SENAI. O projeto utiliza HTML, CSS e JavaScript no frontend e Supabase para autenticação e persistência dos dados.

## Funcionalidades

- Login com perfis de aluno, professor e administrador.
- Cadastro de chegadas tardias (CREATE).
- Consulta, pesquisa e filtro dos registros (READ).
- Edição de registros pelo administrador (UPDATE).
- Exclusão com confirmação pelo administrador (DELETE).
- Histórico individual do aluno.
- Indicadores de total de atrasos, turmas afetadas e ocorrências de “Perdeu a hora”.
- Alertas disciplinares calculados exclusivamente pelos atrasos reais de cada aluno.
- Progressão: 3 atrasos = verbal; 4 = 1ª escrita; 5 = 2ª escrita; 6 = 3ª escrita com suspensão.
- Registro do horário exato pelo servidor, exibido no fuso `America/Sao_Paulo`.
- Interface responsiva para computador e celular.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Supabase Auth e PostgreSQL
- GitHub Pages

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. Abra o **SQL Editor**.
3. Execute, nesta ordem, os arquivos:
   - [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   - [`supabase/migrations/002_alertas_e_horario.sql`](supabase/migrations/002_alertas_e_horario.sql)
4. Em **Authentication → Users**, crie os usuários de teste.
5. Preencha ou atualize os registros correspondentes na tabela `profiles`, definindo `nome`, `turma` e `role`.
6. Em `src/script/config.js`, informe a URL do projeto e a chave pública `anon`.

Papéis aceitos:

- `aluno`: cadastra atrasos e consulta somente os próprios registros.
- `professor`: consulta todos os registros.
- `admin`: consulta, edita e exclui registros.

> A chave `anon` é pública e pode ser usada no navegador. Nunca coloque a chave `service_role`, senha do banco ou credenciais administrativas no repositório.

## Execução local

Como o sistema é estático, pode ser servido por qualquer servidor HTTP local. Uma opção, caso o Python esteja instalado, é executar na raiz do projeto:

```bash
python -m http.server 5500
```

Depois, acesse `http://localhost:5500`.

## Publicação no GitHub Pages

1. Envie o projeto para um repositório do GitHub.
2. Abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch `main`, pasta `/ (root)` e clique em **Save**.
5. Aguarde o endereço público ser disponibilizado e teste novamente login, cadastro, consulta, edição e exclusão.

O arquivo de entrada já está na raiz com o nome `index.html`, conforme exigido pelo GitHub Pages.

## Estrutura

```text
ChegadasTardias/
├── index.html
├── src/
│   ├── pages/
│   ├── script/
│   ├── style/
│   └── utils/images/
└── supabase/
    └── migrations/
```

## Entrega

- Repositório: <https://github.com/GustavoPereira334/ChegadasTardias>
- Site: <https://gustavopereira334.github.io/ChegadasTardias/>
