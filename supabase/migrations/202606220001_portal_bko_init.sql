create extension if not exists pgcrypto;

create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  supervisor_id uuid,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.operadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  email text unique,
  equipe_id uuid,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.credores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.carteiras (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  credor text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil text not null check (perfil in ('admin', 'gerente', 'supervisor', 'operador', 'financeiro')),
  operador_id uuid,
  equipe_id uuid,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  mes integer not null check (mes between 1 and 12),
  ano integer not null check (ano between 2020 and 2100),
  operador_id uuid,
  equipe_id uuid,
  carteira_id uuid,
  valor_meta numeric(14,2) not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.importacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('pagamentos', 'acordos', 'operadores', 'metas', 'carteiras', 'acionamentos')),
  nome_arquivo text not null,
  usuario_id uuid references auth.users (id) on delete set null,
  total_linhas integer not null default 0,
  linhas_importadas integer not null default 0,
  linhas_erro integer not null default 0,
  status text not null default 'processando' check (status in ('processando', 'concluido', 'concluido_com_ressalvas', 'erro')),
  mensagem_erro text,
  criado_em timestamptz not null default now()
);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  data_pagamento date not null,
  operador_id uuid,
  equipe_id uuid,
  carteira_id uuid,
  cpf_cnpj text,
  contrato text,
  valor_pago numeric(14,2) not null default 0,
  valor_honorario numeric(14,2) not null default 0,
  origem_arquivo text,
  importacao_id uuid references public.importacoes (id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists public.acordos (
  id uuid primary key default gen_random_uuid(),
  data_acordo date not null,
  operador_id uuid,
  equipe_id uuid,
  carteira_id uuid,
  cpf_cnpj text,
  contrato text,
  valor_acordo numeric(14,2) not null default 0,
  valor_entrada numeric(14,2) not null default 0,
  quantidade_parcelas integer not null default 1,
  status text not null default 'ativo',
  importacao_id uuid references public.importacoes (id) on delete set null,
  criado_em timestamptz not null default now()
);

create table if not exists public.acionamentos (
  id uuid primary key default gen_random_uuid(),
  data_acionamento date not null,
  operador_id uuid,
  equipe_id uuid,
  carteira_id uuid,
  cpf_cnpj text,
  contrato text,
  evento text not null,
  descricao text,
  canal text,
  importacao_id uuid references public.importacoes (id) on delete set null,
  criado_em timestamptz not null default now()
);

alter table public.operadores
  add constraint operadores_equipe_id_fkey
  foreign key (equipe_id) references public.equipes (id) on delete set null;

alter table public.profiles
  add constraint profiles_operador_id_fkey
  foreign key (operador_id) references public.operadores (id) on delete set null;

alter table public.profiles
  add constraint profiles_equipe_id_fkey
  foreign key (equipe_id) references public.equipes (id) on delete set null;

alter table public.equipes
  add constraint equipes_supervisor_id_fkey
  foreign key (supervisor_id) references public.profiles (id) on delete set null;

alter table public.metas
  add constraint metas_operador_id_fkey
  foreign key (operador_id) references public.operadores (id) on delete cascade,
  add constraint metas_equipe_id_fkey
  foreign key (equipe_id) references public.equipes (id) on delete cascade,
  add constraint metas_carteira_id_fkey
  foreign key (carteira_id) references public.carteiras (id) on delete cascade;

alter table public.pagamentos
  add constraint pagamentos_operador_id_fkey
  foreign key (operador_id) references public.operadores (id) on delete cascade,
  add constraint pagamentos_equipe_id_fkey
  foreign key (equipe_id) references public.equipes (id) on delete cascade,
  add constraint pagamentos_carteira_id_fkey
  foreign key (carteira_id) references public.carteiras (id) on delete cascade;

alter table public.acordos
  add constraint acordos_operador_id_fkey
  foreign key (operador_id) references public.operadores (id) on delete cascade,
  add constraint acordos_equipe_id_fkey
  foreign key (equipe_id) references public.equipes (id) on delete cascade,
  add constraint acordos_carteira_id_fkey
  foreign key (carteira_id) references public.carteiras (id) on delete cascade;

alter table public.acionamentos
  add constraint acionamentos_operador_id_fkey
  foreign key (operador_id) references public.operadores (id) on delete cascade,
  add constraint acionamentos_equipe_id_fkey
  foreign key (equipe_id) references public.equipes (id) on delete cascade,
  add constraint acionamentos_carteira_id_fkey
  foreign key (carteira_id) references public.carteiras (id) on delete cascade;

create unique index if not exists metas_dedup_idx
  on public.metas (mes, ano, operador_id, equipe_id, carteira_id);

create unique index if not exists pagamentos_dedup_idx
  on public.pagamentos (data_pagamento, operador_id, contrato, valor_pago);

create unique index if not exists acordos_dedup_idx
  on public.acordos (data_acordo, operador_id, contrato, valor_acordo);

create unique index if not exists acionamentos_dedup_idx
  on public.acionamentos (data_acionamento, operador_id, contrato, evento);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_operadores_updated_at on public.operadores;
create trigger touch_operadores_updated_at
before update on public.operadores
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_equipes_updated_at on public.equipes;
create trigger touch_equipes_updated_at
before update on public.equipes
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_credores_updated_at on public.credores;
create trigger touch_credores_updated_at
before update on public.credores
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_carteiras_updated_at on public.carteiras;
create trigger touch_carteiras_updated_at
before update on public.carteiras
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_metas_updated_at on public.metas;
create trigger touch_metas_updated_at
before update on public.metas
for each row
execute function public.touch_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where user_id = auth.uid()
    and ativo is true
  limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select perfil
  from public.profiles
  where user_id = auth.uid()
    and ativo is true
  limit 1;
$$;

create or replace function public.current_operator_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select operador_id
  from public.profiles
  where user_id = auth.uid()
    and ativo is true
  limit 1;
$$;

create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select equipe_id
  from public.profiles
  where user_id = auth.uid()
    and ativo is true
  limit 1;
$$;

create or replace function public.has_global_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin', 'gerente', 'financeiro'), false);
$$;

create or replace function public.can_access_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_global_access()
    or (
      public.current_role() = 'supervisor'
      and exists (
        select 1
        from public.equipes
        where id = target_team_id
          and supervisor_id = public.current_profile_id()
      )
    )
    or (
      public.current_role() = 'operador'
      and public.current_team_id() = target_team_id
    );
$$;

create or replace function public.can_access_operator(target_operator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.has_global_access()
    or (
      public.current_role() = 'operador'
      and public.current_operator_id() = target_operator_id
    )
    or (
      public.current_role() = 'supervisor'
      and exists (
        select 1
        from public.operadores
        where id = target_operator_id
          and public.can_access_team(equipe_id)
      )
    );
$$;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.current_operator_id() to authenticated;
grant execute on function public.current_team_id() to authenticated;
grant execute on function public.has_global_access() to authenticated;
grant execute on function public.can_access_team(uuid) to authenticated;
grant execute on function public.can_access_operator(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.operadores enable row level security;
alter table public.equipes enable row level security;
alter table public.credores enable row level security;
alter table public.carteiras enable row level security;
alter table public.metas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.acordos enable row level security;
alter table public.acionamentos enable row level security;
alter table public.importacoes enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  user_id = auth.uid()
  or public.current_role() in ('admin', 'gerente')
  or (
    public.current_role() = 'supervisor'
    and public.can_access_team(equipe_id)
  )
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update to authenticated
using (
  user_id = auth.uid()
  or public.current_role() = 'admin'
)
with check (
  user_id = auth.uid()
  or public.current_role() = 'admin'
);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
for insert to authenticated
with check (public.current_role() = 'admin');

drop policy if exists operators_select on public.operadores;
create policy operators_select on public.operadores
for select to authenticated
using (
  public.has_global_access()
  or public.can_access_team(equipe_id)
  or public.current_operator_id() = id
);

drop policy if exists operators_write on public.operadores;
create policy operators_write on public.operadores
for all to authenticated
using (public.current_role() in ('admin', 'gerente'))
with check (public.current_role() in ('admin', 'gerente'));

drop policy if exists teams_select on public.equipes;
create policy teams_select on public.equipes
for select to authenticated
using (
  public.has_global_access()
  or supervisor_id = public.current_profile_id()
  or id = public.current_team_id()
);

drop policy if exists teams_write on public.equipes;
create policy teams_write on public.equipes
for all to authenticated
using (public.current_role() in ('admin', 'gerente'))
with check (public.current_role() in ('admin', 'gerente'));

drop policy if exists creditors_select on public.credores;
create policy creditors_select on public.credores
for select to authenticated
using (
  public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor')
  or exists (
    select 1
    from public.carteiras c
    join public.pagamentos p on p.carteira_id = c.id
    where c.credor = credores.nome
      and public.can_access_operator(p.operador_id)
  )
);

drop policy if exists creditors_write on public.credores;
create policy creditors_write on public.credores
for all to authenticated
using (public.current_role() in ('admin', 'gerente'))
with check (public.current_role() in ('admin', 'gerente'));

drop policy if exists wallets_select on public.carteiras;
create policy wallets_select on public.carteiras
for select to authenticated
using (
  public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor')
  or exists (
    select 1
    from public.pagamentos p
    where p.carteira_id = carteiras.id
      and public.can_access_operator(p.operador_id)
  )
  or exists (
    select 1
    from public.acordos a
    where a.carteira_id = carteiras.id
      and public.can_access_operator(a.operador_id)
  )
);

drop policy if exists wallets_write on public.carteiras;
create policy wallets_write on public.carteiras
for all to authenticated
using (public.current_role() in ('admin', 'gerente'))
with check (public.current_role() in ('admin', 'gerente'));

drop policy if exists goals_select on public.metas;
create policy goals_select on public.metas
for select to authenticated
using (
  public.has_global_access()
  or public.can_access_team(equipe_id)
  or public.can_access_operator(operador_id)
);

drop policy if exists goals_write on public.metas;
create policy goals_write on public.metas
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

drop policy if exists payments_select on public.pagamentos;
create policy payments_select on public.pagamentos
for select to authenticated
using (
  public.has_global_access()
  or public.can_access_team(equipe_id)
  or public.can_access_operator(operador_id)
);

drop policy if exists payments_write on public.pagamentos;
create policy payments_write on public.pagamentos
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

drop policy if exists agreements_select on public.acordos;
create policy agreements_select on public.acordos
for select to authenticated
using (
  public.has_global_access()
  or public.can_access_team(equipe_id)
  or public.can_access_operator(operador_id)
);

drop policy if exists agreements_write on public.acordos;
create policy agreements_write on public.acordos
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

drop policy if exists actions_select on public.acionamentos;
create policy actions_select on public.acionamentos
for select to authenticated
using (
  public.has_global_access()
  or public.can_access_team(equipe_id)
  or public.can_access_operator(operador_id)
);

drop policy if exists actions_write on public.acionamentos;
create policy actions_write on public.acionamentos
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor'));

drop policy if exists imports_select on public.importacoes;
create policy imports_select on public.importacoes
for select to authenticated
using (
  usuario_id = auth.uid()
  or public.current_role() in ('admin', 'gerente', 'financeiro')
);

drop policy if exists imports_write on public.importacoes;
create policy imports_write on public.importacoes
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor'));
