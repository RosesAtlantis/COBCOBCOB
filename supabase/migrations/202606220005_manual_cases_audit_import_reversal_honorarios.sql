alter table public.carteiras
  add column if not exists percentual_honorarios_padrao numeric(7,2),
  add column if not exists percentual_escritorio_padrao numeric(7,2);

alter table public.clientes
  add column if not exists observacao text;

alter table public.contratos
  add column if not exists observacao text,
  add column if not exists origem_manual boolean not null default false,
  add column if not exists importacao_id uuid;

alter table public.acordos
  add column if not exists percentual_honorarios numeric(7,2),
  add column if not exists valor_honorarios_previsto numeric(14,2),
  add column if not exists valor_escritorio_previsto numeric(14,2),
  add column if not exists intervalo_meses integer not null default 1,
  add column if not exists origem_manual boolean not null default false;

alter table public.acordo_parcelas
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists percentual_honorarios numeric(7,2),
  add column if not exists valor_honorarios_previsto numeric(14,2),
  add column if not exists valor_escritorio_previsto numeric(14,2),
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico',
  add column if not exists origem_manual boolean not null default false;

alter table public.acordo_baixas
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists percentual_honorarios numeric(7,2),
  add column if not exists valor_honorarios numeric(14,2),
  add column if not exists valor_escritorio numeric(14,2),
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico',
  add column if not exists importacao_id uuid;

alter table public.pagamentos
  add column if not exists percentual_honorarios numeric(7,2),
  add column if not exists valor_escritorio numeric(14,2),
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico',
  add column if not exists registrado_por uuid;

alter table public.importacoes
  add column if not exists revertida boolean not null default false,
  add column if not exists revertida_em timestamptz,
  add column if not exists revertida_por uuid,
  add column if not exists motivo_reversao text,
  add column if not exists total_registros_criados integer not null default 0,
  add column if not exists total_registros_revertidos integer not null default 0;

create table if not exists public.importacao_registros (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid not null,
  tabela text not null,
  registro_id text not null,
  acao text not null default 'upsert',
  revertido boolean not null default false,
  revertido_em timestamptz,
  criado_em timestamptz not null default now()
);

alter table public.importacao_registros
  add column if not exists importacao_id uuid,
  add column if not exists tabela text,
  add column if not exists registro_id text,
  add column if not exists acao text not null default 'upsert',
  add column if not exists revertido boolean not null default false,
  add column if not exists revertido_em timestamptz,
  add column if not exists criado_em timestamptz not null default now();

alter table public.auditoria_eventos
  add column if not exists usuario_nome text,
  add column if not exists dados_anteriores jsonb not null default '{}'::jsonb,
  add column if not exists dados_novos jsonb not null default '{}'::jsonb,
  add column if not exists origem text,
  add column if not exists importacao_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carteiras_percentual_honorarios_padrao_chk'
  ) then
    alter table public.carteiras
      add constraint carteiras_percentual_honorarios_padrao_chk
      check (
        percentual_honorarios_padrao is null
        or percentual_honorarios_padrao between 0 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'carteiras_percentual_escritorio_padrao_chk'
  ) then
    alter table public.carteiras
      add constraint carteiras_percentual_escritorio_padrao_chk
      check (
        percentual_escritorio_padrao is null
        or percentual_escritorio_padrao between 0 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordos_percentual_honorarios_chk'
  ) then
    alter table public.acordos
      add constraint acordos_percentual_honorarios_chk
      check (
        percentual_honorarios is null
        or percentual_honorarios between 0 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_percentual_honorarios_chk'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_percentual_honorarios_chk
      check (
        percentual_honorarios is null
        or percentual_honorarios between 0 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_percentual_honorarios_chk'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_percentual_honorarios_chk
      check (
        percentual_honorarios is null
        or percentual_honorarios between 0 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_percentual_honorarios_chk'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_percentual_honorarios_chk
      check (
        percentual_honorarios is null
        or percentual_honorarios between 0 and 100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_tipo_receita_chk'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_tipo_receita_chk
      check (
        tipo_receita is null
        or tipo_receita in ('NOVO', 'COLCHAO')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_tipo_receita_origem_chk'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_tipo_receita_origem_chk
      check (
        tipo_receita_origem is null
        or tipo_receita_origem in ('automatico', 'manual')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_tipo_receita_chk'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_tipo_receita_chk
      check (
        tipo_receita is null
        or tipo_receita in ('NOVO', 'COLCHAO')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_tipo_receita_origem_chk'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_tipo_receita_origem_chk
      check (
        tipo_receita_origem is null
        or tipo_receita_origem in ('automatico', 'manual')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_tipo_receita_chk'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_tipo_receita_chk
      check (
        tipo_receita is null
        or tipo_receita in ('NOVO', 'COLCHAO')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_tipo_receita_origem_chk'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_tipo_receita_origem_chk
      check (
        tipo_receita_origem is null
        or tipo_receita_origem in ('automatico', 'manual')
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_importacao_id_fkey'
  ) then
    alter table public.contratos
      add constraint contratos_importacao_id_fkey
      foreign key (importacao_id) references public.importacoes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_operador_id_fkey'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_operador_id_fkey
      foreign key (operador_id) references public.operadores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_equipe_id_fkey'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_equipe_id_fkey
      foreign key (equipe_id) references public.equipes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_operador_id_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_operador_id_fkey
      foreign key (operador_id) references public.operadores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_equipe_id_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_equipe_id_fkey
      foreign key (equipe_id) references public.equipes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_importacao_id_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_importacao_id_fkey
      foreign key (importacao_id) references public.importacoes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_registrado_por_fkey'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_registrado_por_fkey
      foreign key (registrado_por) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'importacoes_revertida_por_fkey'
  ) then
    alter table public.importacoes
      add constraint importacoes_revertida_por_fkey
      foreign key (revertida_por) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'importacao_registros_importacao_id_fkey'
  ) then
    alter table public.importacao_registros
      add constraint importacao_registros_importacao_id_fkey
      foreign key (importacao_id) references public.importacoes (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_importacao_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_importacao_id_fkey
      foreign key (importacao_id) references public.importacoes (id) on delete set null;
  end if;
end;
$$;

create index if not exists carteiras_honorarios_idx
  on public.carteiras (percentual_honorarios_padrao, percentual_escritorio_padrao);

create index if not exists contratos_importacao_idx
  on public.contratos (importacao_id);

create index if not exists acordos_honorarios_idx
  on public.acordos (percentual_honorarios, criado_em desc);

create index if not exists acordo_parcelas_receita_idx
  on public.acordo_parcelas (tipo_receita, status, data_vencimento);

create index if not exists acordo_baixas_importacao_idx
  on public.acordo_baixas (importacao_id, data_pagamento desc);

create index if not exists pagamentos_receita_idx
  on public.pagamentos (tipo_receita, data_pagamento desc);

create index if not exists importacoes_revertida_idx
  on public.importacoes (revertida, criado_em desc);

create unique index if not exists importacao_registros_unique_idx
  on public.importacao_registros (importacao_id, tabela, registro_id, acao);

create index if not exists importacao_registros_importacao_idx
  on public.importacao_registros (importacao_id, criado_em desc);

create index if not exists importacao_registros_tabela_idx
  on public.importacao_registros (tabela, revertido, criado_em desc);

create index if not exists auditoria_eventos_importacao_idx
  on public.auditoria_eventos (importacao_id, criado_em desc);

create index if not exists auditoria_eventos_usuario_idx
  on public.auditoria_eventos (usuario_id, criado_em desc);

alter table public.importacao_registros enable row level security;

drop policy if exists import_registry_select on public.importacao_registros;
create policy import_registry_select on public.importacao_registros
for select to authenticated
using (
  exists (
    select 1
    from public.importacoes i
    where i.id = importacao_registros.importacao_id
      and (
        i.usuario_id = auth.uid()
        or public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor')
      )
  )
);

drop policy if exists import_registry_write on public.importacao_registros;
create policy import_registry_write on public.importacao_registros
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor'));
