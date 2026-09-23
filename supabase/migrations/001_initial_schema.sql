-- Execute este arquivo no SQL Editor do Supabase.
-- Ele cria a estrutura mínima e as políticas de segurança do sistema.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nome text not null,
    email text,
    turma text,
    role text not null default 'aluno'
        check (role in ('aluno', 'professor', 'admin')),
    created_at timestamptz not null default now()
);

create table if not exists public.atrasos (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid not null references public.profiles(id) on delete cascade,
    turma text not null check (char_length(turma) between 1 and 50),
    professor text not null check (char_length(professor) between 1 and 100),
    motivo text not null check (
        motivo in (
            'Questões escolares',
            'Atraso ônibus',
            'Perdeu a hora',
            'Saúde / bem-estar'
        )
    ),
    descricao text check (descricao is null or char_length(descricao) <= 300),
    data date not null default current_date,
    hora time not null default localtime,
    created_at timestamptz not null default now()
);

create index if not exists atrasos_aluno_id_idx
    on public.atrasos (aluno_id);

create index if not exists atrasos_data_hora_idx
    on public.atrasos (data desc, hora desc);

alter table public.profiles enable row level security;
alter table public.atrasos enable row level security;

-- SECURITY DEFINER evita recursão ao consultar profiles dentro das policies.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
on public.profiles for select
to authenticated
using (
    id = auth.uid()
    or public.current_user_role() in ('professor', 'admin')
);

drop policy if exists "atrasos_select_own_or_staff" on public.atrasos;
create policy "atrasos_select_own_or_staff"
on public.atrasos for select
to authenticated
using (
    aluno_id = auth.uid()
    or public.current_user_role() in ('professor', 'admin')
);

drop policy if exists "atrasos_insert_own" on public.atrasos;
create policy "atrasos_insert_own"
on public.atrasos for insert
to authenticated
with check (
    aluno_id = auth.uid()
    and public.current_user_role() = 'aluno'
    and turma = (
        select p.turma from public.profiles p where p.id = auth.uid()
    )
);

drop policy if exists "atrasos_update_admin" on public.atrasos;
create policy "atrasos_update_admin"
on public.atrasos for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "atrasos_delete_admin" on public.atrasos;
create policy "atrasos_delete_admin"
on public.atrasos for delete
to authenticated
using (public.current_user_role() = 'admin');

-- Cria automaticamente um perfil básico para novos usuários do Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, nome, email, turma, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data ->> 'turma',
        'aluno'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
