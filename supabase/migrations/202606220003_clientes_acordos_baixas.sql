create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf_cnpj text not null,
  email text,
  telefone text,
  endereco text,
  cidade text,
  uf text,
  cep text,
  status text not null default 'em_cobranca' check (status in ('em_cobranca', 'com_acordo', 'quitado', 'inativo')),
  operador_id uuid,
  equipe_id uuid,
  chave_externa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.clientes
  add column if not exists nome text,
  add column if not exists cpf_cnpj text,
  add column if not exists email text,
  add column if not exists telefone text,
  add column if not exists endereco text,
  add column if not exists cidade text,
  add column if not exists uf text,
  add column if not exists cep text,
  add column if not exists status text not null default 'em_cobranca',
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists chave_externa text,
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now();

create table if not exists public.cliente_carteiras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null,
  carteira_id uuid not null,
  credor text not null,
  ativo boolean not null default true,
  chave_externa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.cliente_carteiras
  add column if not exists cliente_id uuid,
  add column if not exists carteira_id uuid,
  add column if not exists credor text,
  add column if not exists ativo boolean not null default true,
  add column if not exists chave_externa text,
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now();

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null,
  carteira_id uuid,
  credor text,
  numero_contrato text not null,
  valor_original numeric(14,2) not null default 0,
  valor_em_aberto numeric(14,2) not null default 0,
  data_contrato date,
  data_vencimento date,
  status text not null default 'aberto' check (status in ('aberto', 'em_acordo', 'quitado', 'cancelado', 'inativo')),
  operador_id uuid,
  equipe_id uuid,
  chave_externa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.contratos
  add column if not exists cliente_id uuid,
  add column if not exists carteira_id uuid,
  add column if not exists credor text,
  add column if not exists numero_contrato text,
  add column if not exists valor_original numeric(14,2) not null default 0,
  add column if not exists valor_em_aberto numeric(14,2) not null default 0,
  add column if not exists data_contrato date,
  add column if not exists data_vencimento date,
  add column if not exists status text not null default 'aberto',
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists chave_externa text,
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now();

alter table public.acordos
  add column if not exists cliente_id uuid,
  add column if not exists contrato_id uuid,
  add column if not exists valor_original numeric(14,2) not null default 0,
  add column if not exists valor_parcela numeric(14,2) not null default 0,
  add column if not exists valor_pago numeric(14,2) not null default 0,
  add column if not exists data_vencimento_entrada date,
  add column if not exists primeiro_vencimento date,
  add column if not exists forma_pagamento text,
  add column if not exists observacao text,
  add column if not exists criado_por uuid,
  add column if not exists ultimo_pagamento_em date,
  add column if not exists atualizado_em timestamptz not null default now();

create table if not exists public.acordo_parcelas (
  id uuid primary key default gen_random_uuid(),
  acordo_id uuid not null,
  numero_parcela integer not null check (numero_parcela >= 1),
  tipo text not null default 'parcela' check (tipo in ('entrada', 'parcela', 'avista')),
  data_vencimento date not null,
  valor_parcela numeric(14,2) not null default 0,
  valor_pago numeric(14,2) not null default 0,
  data_pagamento date,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),
  observacao text,
  chave_externa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.acordo_parcelas
  add column if not exists acordo_id uuid,
  add column if not exists numero_parcela integer,
  add column if not exists tipo text not null default 'parcela',
  add column if not exists data_vencimento date,
  add column if not exists valor_parcela numeric(14,2) not null default 0,
  add column if not exists valor_pago numeric(14,2) not null default 0,
  add column if not exists data_pagamento date,
  add column if not exists status text not null default 'pendente',
  add column if not exists observacao text,
  add column if not exists chave_externa text,
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now();

create table if not exists public.acordo_baixas (
  id uuid primary key default gen_random_uuid(),
  acordo_id uuid not null,
  parcela_id uuid not null,
  cliente_id uuid,
  data_pagamento date not null,
  valor_pago numeric(14,2) not null default 0,
  forma_pagamento text,
  observacao text,
  registrado_por uuid,
  chave_externa text,
  criado_em timestamptz not null default now()
);

alter table public.acordo_baixas
  add column if not exists acordo_id uuid,
  add column if not exists parcela_id uuid,
  add column if not exists cliente_id uuid,
  add column if not exists data_pagamento date,
  add column if not exists valor_pago numeric(14,2) not null default 0,
  add column if not exists forma_pagamento text,
  add column if not exists observacao text,
  add column if not exists registrado_por uuid,
  add column if not exists chave_externa text,
  add column if not exists criado_em timestamptz not null default now();

alter table public.pagamentos
  add column if not exists baixa_id uuid,
  add column if not exists acordo_id uuid,
  add column if not exists cliente_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_operador_id_fkey'
  ) then
    alter table public.clientes
      add constraint clientes_operador_id_fkey
      foreign key (operador_id) references public.operadores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_equipe_id_fkey'
  ) then
    alter table public.clientes
      add constraint clientes_equipe_id_fkey
      foreign key (equipe_id) references public.equipes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cliente_carteiras_cliente_id_fkey'
  ) then
    alter table public.cliente_carteiras
      add constraint cliente_carteiras_cliente_id_fkey
      foreign key (cliente_id) references public.clientes (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cliente_carteiras_carteira_id_fkey'
  ) then
    alter table public.cliente_carteiras
      add constraint cliente_carteiras_carteira_id_fkey
      foreign key (carteira_id) references public.carteiras (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_cliente_id_fkey'
  ) then
    alter table public.contratos
      add constraint contratos_cliente_id_fkey
      foreign key (cliente_id) references public.clientes (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_carteira_id_fkey'
  ) then
    alter table public.contratos
      add constraint contratos_carteira_id_fkey
      foreign key (carteira_id) references public.carteiras (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_operador_id_fkey'
  ) then
    alter table public.contratos
      add constraint contratos_operador_id_fkey
      foreign key (operador_id) references public.operadores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_equipe_id_fkey'
  ) then
    alter table public.contratos
      add constraint contratos_equipe_id_fkey
      foreign key (equipe_id) references public.equipes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordos_cliente_id_fkey'
  ) then
    alter table public.acordos
      add constraint acordos_cliente_id_fkey
      foreign key (cliente_id) references public.clientes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordos_contrato_id_fkey'
  ) then
    alter table public.acordos
      add constraint acordos_contrato_id_fkey
      foreign key (contrato_id) references public.contratos (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordos_criado_por_fkey'
  ) then
    alter table public.acordos
      add constraint acordos_criado_por_fkey
      foreign key (criado_por) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_acordo_id_fkey'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_acordo_id_fkey
      foreign key (acordo_id) references public.acordos (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_acordo_id_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_acordo_id_fkey
      foreign key (acordo_id) references public.acordos (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_parcela_id_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_parcela_id_fkey
      foreign key (parcela_id) references public.acordo_parcelas (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_cliente_id_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_cliente_id_fkey
      foreign key (cliente_id) references public.clientes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_registrado_por_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_registrado_por_fkey
      foreign key (registrado_por) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_baixa_id_fkey'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_baixa_id_fkey
      foreign key (baixa_id) references public.acordo_baixas (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_acordo_id_fkey'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_acordo_id_fkey
      foreign key (acordo_id) references public.acordos (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_cliente_id_fkey'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_cliente_id_fkey
      foreign key (cliente_id) references public.clientes (id) on delete set null;
  end if;
end;
$$;

create unique index if not exists clientes_cpf_cnpj_uidx
  on public.clientes (cpf_cnpj);

create unique index if not exists clientes_chave_externa_uidx
  on public.clientes (chave_externa)
  where chave_externa is not null;

create index if not exists clientes_status_idx
  on public.clientes (status);

create index if not exists clientes_scope_idx
  on public.clientes (equipe_id, operador_id);

create unique index if not exists cliente_carteiras_cliente_carteira_uidx
  on public.cliente_carteiras (cliente_id, carteira_id);

create unique index if not exists cliente_carteiras_chave_externa_uidx
  on public.cliente_carteiras (chave_externa)
  where chave_externa is not null;

create index if not exists cliente_carteiras_carteira_idx
  on public.cliente_carteiras (carteira_id);

create unique index if not exists contratos_cliente_numero_uidx
  on public.contratos (cliente_id, numero_contrato);

create unique index if not exists contratos_chave_externa_uidx
  on public.contratos (chave_externa)
  where chave_externa is not null;

create index if not exists contratos_scope_idx
  on public.contratos (equipe_id, operador_id);

create index if not exists contratos_cliente_status_idx
  on public.contratos (cliente_id, status);

create index if not exists acordos_cliente_idx
  on public.acordos (cliente_id);

create index if not exists acordos_contrato_idx
  on public.acordos (contrato_id);

create index if not exists acordos_status_idx
  on public.acordos (status);

create index if not exists acordos_pagamento_idx
  on public.acordos (ultimo_pagamento_em);

create unique index if not exists acordo_parcelas_acordo_numero_uidx
  on public.acordo_parcelas (acordo_id, numero_parcela);

create unique index if not exists acordo_parcelas_chave_externa_uidx
  on public.acordo_parcelas (chave_externa)
  where chave_externa is not null;

create index if not exists acordo_parcelas_status_vencimento_idx
  on public.acordo_parcelas (status, data_vencimento);

create unique index if not exists acordo_baixas_chave_externa_uidx
  on public.acordo_baixas (chave_externa)
  where chave_externa is not null;

create index if not exists acordo_baixas_cliente_data_idx
  on public.acordo_baixas (cliente_id, data_pagamento desc);

create unique index if not exists pagamentos_baixa_id_uidx
  on public.pagamentos (baixa_id);

create index if not exists pagamentos_acordo_id_idx
  on public.pagamentos (acordo_id);

create index if not exists pagamentos_cliente_id_idx
  on public.pagamentos (cliente_id);

drop trigger if exists touch_clientes_updated_at on public.clientes;
create trigger touch_clientes_updated_at
before update on public.clientes
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_cliente_carteiras_updated_at on public.cliente_carteiras;
create trigger touch_cliente_carteiras_updated_at
before update on public.cliente_carteiras
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_contratos_updated_at on public.contratos;
create trigger touch_contratos_updated_at
before update on public.contratos
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_acordos_updated_at on public.acordos;
create trigger touch_acordos_updated_at
before update on public.acordos
for each row
execute function public.touch_updated_at();

drop trigger if exists touch_acordo_parcelas_updated_at on public.acordo_parcelas;
create trigger touch_acordo_parcelas_updated_at
before update on public.acordo_parcelas
for each row
execute function public.touch_updated_at();

create or replace function public.can_access_scope(
  target_team_id uuid,
  target_operator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_global_access()
    or (
      public.current_role() = 'supervisor'
      and target_team_id is not null
      and public.can_access_team(target_team_id)
    )
    or (
      public.current_role() = 'operador'
      and target_operator_id is not null
      and public.current_operator_id() = target_operator_id
    ),
    false
  );
$$;

create or replace function public.can_access_client(target_cliente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.has_global_access()
    or exists (
      select 1
      from public.clientes c
      where c.id = target_cliente_id
        and public.can_access_scope(c.equipe_id, c.operador_id)
    )
    or exists (
      select 1
      from public.contratos ct
      where ct.cliente_id = target_cliente_id
        and public.can_access_scope(ct.equipe_id, ct.operador_id)
    )
    or exists (
      select 1
      from public.acordos a
      where a.cliente_id = target_cliente_id
        and public.can_access_scope(a.equipe_id, a.operador_id)
    ),
    false
  );
$$;

create or replace function public.can_create_agreement_for_scope(
  target_team_id uuid,
  target_operator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_role() in ('admin', 'gerente')
    or (
      public.current_role() = 'supervisor'
      and target_team_id is not null
      and public.can_access_team(target_team_id)
    )
    or (
      public.current_role() = 'operador'
      and target_operator_id is not null
      and public.current_operator_id() = target_operator_id
    ),
    false
  );
$$;

create or replace function public.can_update_agreement_for_scope(
  target_team_id uuid,
  target_operator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_role() in ('admin', 'gerente')
    or (
      public.current_role() = 'supervisor'
      and target_team_id is not null
      and public.can_access_team(target_team_id)
    ),
    false
  );
$$;

create or replace function public.can_register_baixa_for_scope(
  target_team_id uuid,
  target_operator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.current_role() in ('admin', 'gerente', 'financeiro')
    or (
      public.current_role() = 'supervisor'
      and target_team_id is not null
      and public.can_access_team(target_team_id)
    ),
    false
  );
$$;

create or replace function public.can_access_agreement(target_acordo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.acordos a
      left join public.clientes c on c.id = a.cliente_id
      where a.id = target_acordo_id
        and (
          public.has_global_access()
          or public.can_access_scope(
            coalesce(a.equipe_id, c.equipe_id),
            coalesce(a.operador_id, c.operador_id)
          )
        )
    ),
    false
  );
$$;

create or replace function public.can_manage_agreement(target_acordo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.acordos a
      left join public.clientes c on c.id = a.cliente_id
      where a.id = target_acordo_id
        and public.can_update_agreement_for_scope(
          coalesce(a.equipe_id, c.equipe_id),
          coalesce(a.operador_id, c.operador_id)
        )
    ),
    false
  );
$$;

create or replace function public.can_manage_baixa(target_acordo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.acordos a
      left join public.clientes c on c.id = a.cliente_id
      where a.id = target_acordo_id
        and public.can_register_baixa_for_scope(
          coalesce(a.equipe_id, c.equipe_id),
          coalesce(a.operador_id, c.operador_id)
        )
    ),
    false
  );
$$;

create or replace function public.refresh_cliente_status(target_cliente_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_status text := 'em_cobranca';
begin
  select
    case
      when c.status = 'inativo' then 'inativo'
      when exists (
        select 1
        from public.acordos a
        where a.cliente_id = c.id
          and a.status in ('ativo', 'aguardando_pagamento', 'parcial', 'atrasado', 'quebrado')
      ) then 'com_acordo'
      when exists (
        select 1
        from public.contratos ct
        where ct.cliente_id = c.id
      ) and coalesce((
        select sum(greatest(ct.valor_em_aberto, 0))
        from public.contratos ct
        where ct.cliente_id = c.id
      ), 0) <= 0 then 'quitado'
      else 'em_cobranca'
    end
  into next_status
  from public.clientes c
  where c.id = target_cliente_id;

  update public.clientes
  set status = next_status
  where id = target_cliente_id;

  return next_status;
end;
$$;

create or replace function public.refresh_acordo_status(target_acordo_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text := 'ativo';
  next_status text := 'ativo';
  total_count integer := 0;
  paid_count integer := 0;
  overdue_count integer := 0;
  paid_total numeric(14,2) := 0;
  last_paid_at date;
  linked_contract_id uuid;
  linked_client_id uuid;
begin
  select
    status,
    contrato_id,
    cliente_id
  into
    current_status,
    linked_contract_id,
    linked_client_id
  from public.acordos
  where id = target_acordo_id;

  if not found then
    raise exception 'Acordo nao encontrado.';
  end if;

  update public.acordo_parcelas
  set status =
    case
      when status = 'cancelado' then 'cancelado'
      when round(coalesce(valor_pago, 0), 2) >= round(coalesce(valor_parcela, 0), 2) then 'pago'
      when data_vencimento < current_date then 'atrasado'
      else 'pendente'
    end
  where acordo_id = target_acordo_id;

  select
    count(*),
    count(*) filter (where status = 'pago'),
    count(*) filter (where status = 'atrasado'),
    coalesce(sum(valor_pago), 0),
    max(data_pagamento)
  into
    total_count,
    paid_count,
    overdue_count,
    paid_total,
    last_paid_at
  from public.acordo_parcelas
  where acordo_id = target_acordo_id;

  next_status :=
    case
      when current_status = 'cancelado' then 'cancelado'
      when current_status = 'quebrado' then 'quebrado'
      when total_count > 0 and paid_count = total_count then 'quitado'
      when overdue_count > 0 then 'atrasado'
      when paid_count > 0 then 'parcial'
      when current_status = 'aguardando_pagamento' then 'aguardando_pagamento'
      else 'ativo'
    end;

  update public.acordos
  set
    status = next_status,
    valor_pago = paid_total,
    ultimo_pagamento_em = last_paid_at
  where id = target_acordo_id;

  if linked_contract_id is not null then
    update public.contratos
    set
      status =
        case
          when next_status = 'quitado' then 'quitado'
          when next_status = 'cancelado' and coalesce(valor_em_aberto, 0) > 0 then 'aberto'
          when next_status in ('ativo', 'aguardando_pagamento', 'parcial', 'atrasado', 'quebrado') then 'em_acordo'
          else status
        end,
      valor_em_aberto =
        case
          when next_status = 'quitado' then 0
          else valor_em_aberto
        end
    where id = linked_contract_id;
  end if;

  if linked_client_id is not null then
    perform public.refresh_cliente_status(linked_client_id);
  end if;

  return next_status;
end;
$$;

create or replace function public.portal_criar_acordo(
  p_cliente_id uuid,
  p_contrato_id uuid default null,
  p_operador_id uuid default null,
  p_equipe_id uuid default null,
  p_carteira_id uuid default null,
  p_data_acordo date default current_date,
  p_valor_original numeric default 0,
  p_valor_acordo numeric default 0,
  p_valor_entrada numeric default 0,
  p_data_vencimento_entrada date default null,
  p_quantidade_parcelas integer default 1,
  p_valor_parcela numeric default null,
  p_primeiro_vencimento date default null,
  p_forma_pagamento text default null,
  p_observacao text default null,
  p_status text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_client public.clientes%rowtype;
  selected_contract public.contratos%rowtype;
  resolved_operator_id uuid;
  resolved_team_id uuid;
  resolved_wallet_id uuid;
  resolved_creditor text;
  resolved_status text;
  agreement_id uuid;
  negotiated_balance numeric(14,2);
  base_installment_value numeric(14,2);
  generated_value numeric(14,2);
  generated_number integer := 0;
  parcel_index integer;
begin
  if p_cliente_id is null then
    raise exception 'Cliente obrigatorio.';
  end if;

  select *
  into selected_client
  from public.clientes
  where id = p_cliente_id;

  if not found then
    raise exception 'Cliente nao encontrado.';
  end if;

  if p_contrato_id is not null then
    select *
    into selected_contract
    from public.contratos
    where id = p_contrato_id
      and cliente_id = p_cliente_id;

    if not found then
      raise exception 'Contrato nao encontrado para este cliente.';
    end if;
  end if;

  resolved_operator_id := coalesce(
    p_operador_id,
    selected_contract.operador_id,
    selected_client.operador_id,
    public.current_operator_id()
  );

  resolved_team_id := coalesce(
    p_equipe_id,
    selected_contract.equipe_id,
    selected_client.equipe_id
  );

  if resolved_team_id is null and resolved_operator_id is not null then
    select equipe_id
    into resolved_team_id
    from public.operadores
    where id = resolved_operator_id;
  end if;

  resolved_wallet_id := coalesce(
    p_carteira_id,
    selected_contract.carteira_id
  );

  if resolved_wallet_id is null then
    select carteira_id
    into resolved_wallet_id
    from public.cliente_carteiras
    where cliente_id = p_cliente_id
      and ativo is true
    order by atualizado_em desc nulls last, criado_em desc
    limit 1;
  end if;

  if not public.can_create_agreement_for_scope(resolved_team_id, resolved_operator_id) then
    raise exception 'Seu perfil nao pode criar acordo para este cliente.';
  end if;

  if p_data_acordo is null then
    raise exception 'Data do acordo obrigatoria.';
  end if;

  if coalesce(p_valor_acordo, 0) <= 0 then
    raise exception 'Valor do acordo obrigatorio.';
  end if;

  if coalesce(p_quantidade_parcelas, 0) < 1 then
    raise exception 'Quantidade de parcelas deve ser maior ou igual a 1.';
  end if;

  if coalesce(p_valor_entrada, 0) < 0 then
    raise exception 'Valor de entrada invalido.';
  end if;

  if coalesce(p_valor_entrada, 0) > coalesce(p_valor_acordo, 0) then
    raise exception 'Valor de entrada nao pode ser maior que o valor do acordo.';
  end if;

  if resolved_wallet_id is null then
    raise exception 'Carteira obrigatoria para cadastrar o acordo.';
  end if;

  negotiated_balance := round((coalesce(p_valor_acordo, 0) - coalesce(p_valor_entrada, 0))::numeric, 2);

  if coalesce(p_valor_entrada, 0) > 0 and p_data_vencimento_entrada is null then
    raise exception 'Data de vencimento da entrada obrigatoria.';
  end if;

  if negotiated_balance > 0 and p_primeiro_vencimento is null then
    raise exception 'Primeiro vencimento obrigatorio para gerar parcelas.';
  end if;

  if negotiated_balance <= 0 and coalesce(p_valor_entrada, 0) <= 0 then
    raise exception 'Configure entrada ou parcelas para o acordo.';
  end if;

  if negotiated_balance > 0 then
    base_installment_value := round(
      coalesce(p_valor_parcela, negotiated_balance / greatest(p_quantidade_parcelas, 1)),
      2
    );
  else
    base_installment_value := 0;
  end if;

  if negotiated_balance > 0 and base_installment_value <= 0 then
    raise exception 'Valor da parcela obrigatorio.';
  end if;

  select credor
  into resolved_creditor
  from public.carteiras
  where id = resolved_wallet_id;

  resolved_status := coalesce(
    nullif(btrim(p_status), ''),
    case
      when coalesce(p_valor_entrada, 0) > 0 or p_quantidade_parcelas = 1 then 'aguardando_pagamento'
      else 'ativo'
    end
  );

  update public.clientes
  set
    operador_id = coalesce(resolved_operator_id, operador_id),
    equipe_id = coalesce(resolved_team_id, equipe_id)
  where id = selected_client.id;

  insert into public.cliente_carteiras (
    cliente_id,
    carteira_id,
    credor,
    ativo
  )
  values (
    selected_client.id,
    resolved_wallet_id,
    coalesce(resolved_creditor, selected_contract.credor, 'Credor nao informado'),
    true
  )
  on conflict (cliente_id, carteira_id)
  do update set
    credor = excluded.credor,
    ativo = true,
    atualizado_em = now();

  if selected_contract.id is not null then
    update public.contratos
    set
      carteira_id = coalesce(carteira_id, resolved_wallet_id),
      credor = coalesce(credor, resolved_creditor),
      operador_id = coalesce(operador_id, resolved_operator_id),
      equipe_id = coalesce(equipe_id, resolved_team_id),
      status = 'em_acordo'
    where id = selected_contract.id;
  end if;

  insert into public.acordos (
    cliente_id,
    contrato_id,
    operador_id,
    equipe_id,
    carteira_id,
    cpf_cnpj,
    contrato,
    data_acordo,
    valor_original,
    valor_acordo,
    valor_entrada,
    quantidade_parcelas,
    valor_parcela,
    data_vencimento_entrada,
    primeiro_vencimento,
    forma_pagamento,
    observacao,
    status,
    criado_por
  )
  values (
    selected_client.id,
    selected_contract.id,
    resolved_operator_id,
    resolved_team_id,
    resolved_wallet_id,
    selected_client.cpf_cnpj,
    nullif(selected_contract.numero_contrato, ''),
    p_data_acordo,
    greatest(coalesce(p_valor_original, 0), coalesce(selected_contract.valor_original, 0), coalesce(p_valor_acordo, 0)),
    round(coalesce(p_valor_acordo, 0), 2),
    round(coalesce(p_valor_entrada, 0), 2),
    p_quantidade_parcelas,
    round(coalesce(base_installment_value, 0), 2),
    p_data_vencimento_entrada,
    p_primeiro_vencimento,
    nullif(btrim(coalesce(p_forma_pagamento, '')), ''),
    nullif(btrim(coalesce(p_observacao, '')), ''),
    resolved_status,
    public.current_profile_id()
  )
  returning id
  into agreement_id;

  if coalesce(p_valor_entrada, 0) > 0 then
    generated_number := generated_number + 1;

    insert into public.acordo_parcelas (
      acordo_id,
      numero_parcela,
      tipo,
      data_vencimento,
      valor_parcela,
      status
    )
    values (
      agreement_id,
      generated_number,
      case
        when negotiated_balance = 0 and p_quantidade_parcelas = 1 then 'avista'
        else 'entrada'
      end,
      p_data_vencimento_entrada,
      round(coalesce(p_valor_entrada, 0), 2),
      case
        when p_data_vencimento_entrada < current_date then 'atrasado'
        else 'pendente'
      end
    );
  end if;

  if negotiated_balance > 0 then
    for parcel_index in 1..p_quantidade_parcelas loop
      generated_number := generated_number + 1;
      generated_value :=
        case
          when parcel_index = p_quantidade_parcelas then
            round(
              negotiated_balance - (base_installment_value * (p_quantidade_parcelas - 1)),
              2
            )
          else round(base_installment_value, 2)
        end;

      insert into public.acordo_parcelas (
        acordo_id,
        numero_parcela,
        tipo,
        data_vencimento,
        valor_parcela,
        status
      )
      values (
        agreement_id,
        generated_number,
        case
          when p_quantidade_parcelas = 1 and coalesce(p_valor_entrada, 0) = 0 then 'avista'
          else 'parcela'
        end,
        (p_primeiro_vencimento + make_interval(months => parcel_index - 1))::date,
        generated_value,
        case
          when (p_primeiro_vencimento + make_interval(months => parcel_index - 1))::date < current_date then 'atrasado'
          else 'pendente'
        end
      );
    end loop;
  end if;

  perform public.refresh_acordo_status(agreement_id);

  return agreement_id;
end;
$$;

create or replace function public.portal_registrar_baixa(
  p_acordo_id uuid,
  p_parcela_id uuid,
  p_data_pagamento date,
  p_valor_pago numeric,
  p_forma_pagamento text default null,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_agreement public.acordos%rowtype;
  selected_parcel public.acordo_parcelas%rowtype;
  write_off_id uuid;
  remaining_balance numeric(14,2);
  payment_contract_label text;
begin
  if p_acordo_id is null or p_parcela_id is null then
    raise exception 'Acordo e parcela sao obrigatorios.';
  end if;

  if p_data_pagamento is null then
    raise exception 'Data de pagamento obrigatoria.';
  end if;

  if coalesce(p_valor_pago, 0) <= 0 then
    raise exception 'Valor pago deve ser maior que zero.';
  end if;

  select *
  into selected_agreement
  from public.acordos
  where id = p_acordo_id;

  if not found then
    raise exception 'Acordo nao encontrado.';
  end if;

  if not public.can_manage_baixa(p_acordo_id) then
    raise exception 'Seu perfil nao pode registrar baixa neste acordo.';
  end if;

  select *
  into selected_parcel
  from public.acordo_parcelas
  where id = p_parcela_id
    and acordo_id = p_acordo_id
  for update;

  if not found then
    raise exception 'Parcela nao encontrada para o acordo informado.';
  end if;

  if selected_parcel.status = 'cancelado' then
    raise exception 'Parcela cancelada nao pode receber baixa.';
  end if;

  remaining_balance := round(selected_parcel.valor_parcela - coalesce(selected_parcel.valor_pago, 0), 2);

  if round(coalesce(p_valor_pago, 0), 2) > remaining_balance then
    raise exception 'Valor pago nao pode ser maior que o saldo da parcela.';
  end if;

  insert into public.acordo_baixas (
    acordo_id,
    parcela_id,
    cliente_id,
    data_pagamento,
    valor_pago,
    forma_pagamento,
    observacao,
    registrado_por
  )
  values (
    selected_agreement.id,
    selected_parcel.id,
    selected_agreement.cliente_id,
    p_data_pagamento,
    round(coalesce(p_valor_pago, 0), 2),
    nullif(btrim(coalesce(p_forma_pagamento, '')), ''),
    nullif(btrim(coalesce(p_observacao, '')), ''),
    public.current_profile_id()
  )
  returning id
  into write_off_id;

  update public.acordo_parcelas
  set
    valor_pago = round(coalesce(valor_pago, 0) + round(coalesce(p_valor_pago, 0), 2), 2),
    data_pagamento =
      case
        when round(coalesce(valor_pago, 0) + round(coalesce(p_valor_pago, 0), 2), 2) >= valor_parcela
          then p_data_pagamento
        else data_pagamento
      end,
    status =
      case
        when round(coalesce(valor_pago, 0) + round(coalesce(p_valor_pago, 0), 2), 2) >= valor_parcela then 'pago'
        when data_vencimento < current_date then 'atrasado'
        else 'pendente'
      end,
    observacao = coalesce(nullif(btrim(coalesce(observacao, '')), ''), nullif(btrim(coalesce(p_observacao, '')), ''))
  where id = selected_parcel.id;

  payment_contract_label := coalesce(
    selected_agreement.contrato,
    (
      select numero_contrato
      from public.contratos
      where id = selected_agreement.contrato_id
    )
  );

  if payment_contract_label is not null then
    payment_contract_label := format(
      '%s :: parcela %s',
      payment_contract_label,
      selected_parcel.numero_parcela
    );
  end if;

  insert into public.pagamentos (
    baixa_id,
    acordo_id,
    cliente_id,
    data_pagamento,
    operador_id,
    equipe_id,
    carteira_id,
    cpf_cnpj,
    contrato,
    valor_pago,
    valor_honorario,
    origem_arquivo
  )
  values (
    write_off_id,
    selected_agreement.id,
    selected_agreement.cliente_id,
    p_data_pagamento,
    selected_agreement.operador_id,
    selected_agreement.equipe_id,
    selected_agreement.carteira_id,
    selected_agreement.cpf_cnpj,
    payment_contract_label,
    round(coalesce(p_valor_pago, 0), 2),
    0,
    'baixa_manual'
  )
  on conflict (baixa_id)
  do update set
    acordo_id = excluded.acordo_id,
    cliente_id = excluded.cliente_id,
    data_pagamento = excluded.data_pagamento,
    operador_id = excluded.operador_id,
    equipe_id = excluded.equipe_id,
    carteira_id = excluded.carteira_id,
    cpf_cnpj = excluded.cpf_cnpj,
    contrato = excluded.contrato,
    valor_pago = excluded.valor_pago,
    valor_honorario = excluded.valor_honorario,
    origem_arquivo = excluded.origem_arquivo;

  if selected_agreement.contrato_id is not null then
    update public.contratos
    set
      valor_em_aberto = greatest(coalesce(valor_em_aberto, valor_original, 0) - round(coalesce(p_valor_pago, 0), 2), 0),
      status =
        case
          when greatest(coalesce(valor_em_aberto, valor_original, 0) - round(coalesce(p_valor_pago, 0), 2), 0) = 0 then 'quitado'
          else 'em_acordo'
        end
    where id = selected_agreement.contrato_id;
  end if;

  perform public.refresh_acordo_status(selected_agreement.id);

  if selected_agreement.cliente_id is not null then
    perform public.refresh_cliente_status(selected_agreement.cliente_id);
  end if;

  return write_off_id;
end;
$$;

create or replace function public.portal_cancelar_acordo(
  p_acordo_id uuid,
  p_observacao text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_agreement public.acordos%rowtype;
begin
  select *
  into selected_agreement
  from public.acordos
  where id = p_acordo_id;

  if not found then
    raise exception 'Acordo nao encontrado.';
  end if;

  if not public.can_manage_agreement(p_acordo_id) then
    raise exception 'Seu perfil nao pode cancelar este acordo.';
  end if;

  update public.acordo_parcelas
  set status = case when status = 'pago' then status else 'cancelado' end
  where acordo_id = p_acordo_id;

  update public.acordos
  set
    status = 'cancelado',
    observacao = concat_ws(
      E'\n',
      nullif(btrim(coalesce(observacao, '')), ''),
      case
        when nullif(btrim(coalesce(p_observacao, '')), '') is null then 'Acordo cancelado manualmente.'
        else format('Acordo cancelado manualmente: %s', nullif(btrim(coalesce(p_observacao, '')), ''))
      end
    )
  where id = p_acordo_id;

  if selected_agreement.contrato_id is not null then
    update public.contratos
    set status =
      case
        when coalesce(valor_em_aberto, 0) <= 0 then 'quitado'
        else 'aberto'
      end
    where id = selected_agreement.contrato_id;
  end if;

  if selected_agreement.cliente_id is not null then
    perform public.refresh_cliente_status(selected_agreement.cliente_id);
  end if;

  return p_acordo_id;
end;
$$;

grant execute on function public.can_access_scope(uuid, uuid) to authenticated;
grant execute on function public.can_access_client(uuid) to authenticated;
grant execute on function public.can_create_agreement_for_scope(uuid, uuid) to authenticated;
grant execute on function public.can_update_agreement_for_scope(uuid, uuid) to authenticated;
grant execute on function public.can_register_baixa_for_scope(uuid, uuid) to authenticated;
grant execute on function public.can_access_agreement(uuid) to authenticated;
grant execute on function public.can_manage_agreement(uuid) to authenticated;
grant execute on function public.can_manage_baixa(uuid) to authenticated;
grant execute on function public.refresh_cliente_status(uuid) to authenticated;
grant execute on function public.refresh_acordo_status(uuid) to authenticated;
grant execute on function public.portal_criar_acordo(uuid, uuid, uuid, uuid, uuid, date, numeric, numeric, numeric, date, integer, numeric, date, text, text, text) to authenticated;
grant execute on function public.portal_registrar_baixa(uuid, uuid, date, numeric, text, text) to authenticated;
grant execute on function public.portal_cancelar_acordo(uuid, text) to authenticated;

alter table public.clientes enable row level security;
alter table public.cliente_carteiras enable row level security;
alter table public.contratos enable row level security;
alter table public.acordo_parcelas enable row level security;
alter table public.acordo_baixas enable row level security;

drop policy if exists clients_select on public.clientes;
create policy clients_select on public.clientes
for select to authenticated
using (public.can_access_client(id));

drop policy if exists clients_write on public.clientes;
create policy clients_write on public.clientes
for all to authenticated
using (
  public.current_role() in ('admin', 'gerente')
  or public.can_create_agreement_for_scope(equipe_id, operador_id)
)
with check (
  public.current_role() in ('admin', 'gerente')
  or public.can_create_agreement_for_scope(equipe_id, operador_id)
);

drop policy if exists client_wallets_select on public.cliente_carteiras;
create policy client_wallets_select on public.cliente_carteiras
for select to authenticated
using (public.can_access_client(cliente_id));

drop policy if exists client_wallets_write on public.cliente_carteiras;
create policy client_wallets_write on public.cliente_carteiras
for all to authenticated
using (
  exists (
    select 1
    from public.clientes c
    where c.id = cliente_carteiras.cliente_id
      and (
        public.current_role() in ('admin', 'gerente')
        or public.can_update_agreement_for_scope(c.equipe_id, c.operador_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.clientes c
    where c.id = cliente_carteiras.cliente_id
      and (
        public.current_role() in ('admin', 'gerente')
        or public.can_update_agreement_for_scope(c.equipe_id, c.operador_id)
      )
  )
);

drop policy if exists contracts_select on public.contratos;
create policy contracts_select on public.contratos
for select to authenticated
using (
  public.can_access_client(cliente_id)
  or public.can_access_scope(equipe_id, operador_id)
);

drop policy if exists contracts_write on public.contratos;
create policy contracts_write on public.contratos
for all to authenticated
using (
  public.current_role() in ('admin', 'gerente')
  or public.can_update_agreement_for_scope(equipe_id, operador_id)
)
with check (
  public.current_role() in ('admin', 'gerente')
  or public.can_update_agreement_for_scope(equipe_id, operador_id)
);

drop policy if exists agreement_installments_select on public.acordo_parcelas;
create policy agreement_installments_select on public.acordo_parcelas
for select to authenticated
using (public.can_access_agreement(acordo_id));

drop policy if exists agreement_installments_write on public.acordo_parcelas;
create policy agreement_installments_write on public.acordo_parcelas
for all to authenticated
using (public.can_manage_agreement(acordo_id))
with check (public.can_manage_agreement(acordo_id));

drop policy if exists agreement_writeoffs_select on public.acordo_baixas;
create policy agreement_writeoffs_select on public.acordo_baixas
for select to authenticated
using (public.can_access_agreement(acordo_id));

drop policy if exists agreement_writeoffs_write on public.acordo_baixas;
create policy agreement_writeoffs_write on public.acordo_baixas
for all to authenticated
using (public.can_manage_baixa(acordo_id))
with check (public.can_manage_baixa(acordo_id));
