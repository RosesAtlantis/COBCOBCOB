-- Cadastro manual simplificado, contrato em fluxo e classificacao de parcelas/baixas.
-- Esta migration e aditiva: nao recria tabelas e nao remove dados existentes.

alter table public.cliente_carteiras
  add column if not exists credor text,
  add column if not exists ativo boolean not null default true;

alter table public.contratos
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists observacao text;

alter table public.acordo_parcelas
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico';

alter table public.acordo_baixas
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico';

alter table public.pagamentos
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico';

update public.acordo_parcelas
set
  tipo_receita = coalesce(
    tipo_receita,
    case
      when tipo in ('avista', 'entrada') or numero_parcela <= 1 then 'NOVO'
      else 'COLCHAO'
    end
  ),
  tipo_receita_origem = coalesce(
    tipo_receita_origem,
    case
      when tipo_receita is not null then 'manual'
      else 'automatico'
    end
  )
where tipo_receita is null
   or tipo_receita_origem is null;

update public.acordo_baixas baixa
set
  tipo_receita = coalesce(
    baixa.tipo_receita,
    parcela.tipo_receita,
    case
      when parcela.tipo in ('avista', 'entrada') or parcela.numero_parcela <= 1 then 'NOVO'
      else 'COLCHAO'
    end
  ),
  tipo_receita_origem = case
    when baixa.tipo_receita_origem is not null then baixa.tipo_receita_origem
    when baixa.tipo_receita is not null then 'manual'
    when parcela.tipo_receita_origem is not null then parcela.tipo_receita_origem
    else 'automatico'
  end
from public.acordo_parcelas parcela
where parcela.id = baixa.parcela_id
  and (
    baixa.tipo_receita is null
    or baixa.tipo_receita_origem is null
  );

update public.pagamentos pagamento
set
  tipo_receita = coalesce(pagamento.tipo_receita, baixa.tipo_receita, parcela.tipo_receita),
  tipo_receita_origem = case
    when pagamento.tipo_receita_origem is not null then pagamento.tipo_receita_origem
    when pagamento.tipo_receita is not null then 'manual'
    when baixa.tipo_receita_origem is not null then baixa.tipo_receita_origem
    when baixa.tipo_receita is not null then 'manual'
    when parcela.tipo_receita_origem is not null then parcela.tipo_receita_origem
    else 'automatico'
  end
from public.acordo_baixas baixa
left join public.acordo_parcelas parcela
  on parcela.id = baixa.parcela_id
where pagamento.baixa_id = baixa.id
  and (
    pagamento.tipo_receita is null
    or pagamento.tipo_receita_origem is null
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_parcelas_tipo_receita_chk'
  ) then
    alter table public.acordo_parcelas
      add constraint acordo_parcelas_tipo_receita_chk
      check (tipo_receita is null or tipo_receita in ('NOVO', 'COLCHAO'));
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
      check (tipo_receita is null or tipo_receita in ('NOVO', 'COLCHAO'));
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
      check (tipo_receita is null or tipo_receita in ('NOVO', 'COLCHAO'));
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

create index if not exists cliente_carteiras_cliente_ativo_idx
  on public.cliente_carteiras (cliente_id, ativo, carteira_id);

create index if not exists contratos_cliente_carteira_status_idx
  on public.contratos (cliente_id, carteira_id, status);

create index if not exists contratos_scope_created_idx
  on public.contratos (equipe_id, operador_id, criado_em desc);

create index if not exists acordo_parcelas_acordo_receita_vencimento_idx
  on public.acordo_parcelas (acordo_id, tipo_receita, data_vencimento);

create index if not exists acordo_baixas_parcela_receita_data_idx
  on public.acordo_baixas (parcela_id, tipo_receita, data_pagamento desc);

create index if not exists pagamentos_baixa_receita_data_idx
  on public.pagamentos (baixa_id, tipo_receita, data_pagamento desc);

alter table public.cliente_carteiras enable row level security;
alter table public.contratos enable row level security;
alter table public.acordo_parcelas enable row level security;
alter table public.acordo_baixas enable row level security;
