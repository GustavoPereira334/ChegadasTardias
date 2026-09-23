-- Execute depois da migration 001.
-- Usa o relógio do servidor e converte a exibição para America/Sao_Paulo.

alter table public.atrasos
    add column if not exists registrado_em timestamptz;

update public.atrasos
set registrado_em = (data + hora) at time zone 'America/Sao_Paulo'
where registrado_em is null;

alter table public.atrasos
    alter column registrado_em set default now(),
    alter column registrado_em set not null,
    alter column data set default (timezone('America/Sao_Paulo', now())::date),
    alter column hora set default (timezone('America/Sao_Paulo', now())::time);

create or replace function public.sincronizar_horario_atraso()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.registrado_em is null then
        new.registrado_em := now();
    end if;

    new.data := timezone('America/Sao_Paulo', new.registrado_em)::date;
    new.hora := timezone('America/Sao_Paulo', new.registrado_em)::time;
    return new;
end;
$$;

drop trigger if exists sincronizar_horario_atraso_trigger on public.atrasos;
create trigger sincronizar_horario_atraso_trigger
    before insert or update of registrado_em on public.atrasos
    for each row execute procedure public.sincronizar_horario_atraso();

create index if not exists atrasos_registrado_em_idx
    on public.atrasos (registrado_em desc);

create table if not exists public.medidas_disciplinares (
    id uuid primary key default gen_random_uuid(),
    aluno_id uuid not null references public.profiles(id) on delete cascade,
    tipo text not null check (
        tipo in ('verbal', 'escrita_1', 'escrita_2', 'escrita_3_suspensao')
    ),
    quantidade_atrasos integer not null check (quantidade_atrasos >= 3),
    responsavel_id uuid not null references public.profiles(id),
    observacao text check (observacao is null or char_length(observacao) <= 500),
    dias_suspensao integer check (dias_suspensao is null or dias_suspensao between 1 and 30),
    aplicada_em timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (aluno_id, tipo),
    check (
        (tipo = 'escrita_3_suspensao' and dias_suspensao is not null)
        or (tipo <> 'escrita_3_suspensao' and dias_suspensao is null)
    )
);

create index if not exists medidas_disciplinares_aluno_idx
    on public.medidas_disciplinares (aluno_id);

alter table public.medidas_disciplinares enable row level security;

drop policy if exists "medidas_select_staff" on public.medidas_disciplinares;
create policy "medidas_select_staff"
on public.medidas_disciplinares for select
to authenticated
using (public.current_user_role() in ('professor', 'admin'));

drop policy if exists "medidas_insert_admin" on public.medidas_disciplinares;
create policy "medidas_insert_admin"
on public.medidas_disciplinares for insert
to authenticated
with check (
    public.current_user_role() = 'admin'
    and responsavel_id = auth.uid()
);

drop policy if exists "medidas_update_admin" on public.medidas_disciplinares;
create policy "medidas_update_admin"
on public.medidas_disciplinares for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists "medidas_delete_admin" on public.medidas_disciplinares;
create policy "medidas_delete_admin"
on public.medidas_disciplinares for delete
to authenticated
using (public.current_user_role() = 'admin');
