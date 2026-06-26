alter table public.acordos
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists cliente_id uuid,
  add column if not exists contrato_id uuid,
  add column if not exists carteira_id uuid,
  add column if not exists credor_id uuid,
  add column if not exists credor text,
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists cpf_cnpj text,
  add column if not exists contrato text,
  add column if not exists data_acordo date,
  add column if not exists valor_original numeric(14,2) not null default 0,
  add column if not exists valor_acordo numeric(14,2) not null default 0,
  add column if not exists valor_entrada numeric(14,2) not null default 0,
  add column if not exists data_vencimento_entrada date,
  add column if not exists quantidade_parcelas integer not null default 1,
  add column if not exists valor_parcela numeric(14,2) not null default 0,
  add column if not exists primeiro_vencimento date,
  add column if not exists dia_vencimento integer,
  add column if not exists forma_pagamento text,
  add column if not exists modelo_acordo text,
  add column if not exists tipo_acordo text,
  add column if not exists percentual_honorarios numeric(10,2),
  add column if not exists valor_honorarios_previsto numeric(14,2),
  add column if not exists valor_escritorio_previsto numeric(14,2),
  add column if not exists status text not null default 'ativo',
  add column if not exists observacao text,
  add column if not exists origem text,
  add column if not exists criado_por uuid,
  add column if not exists atualizado_por uuid,
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now(),
  add column if not exists valor_pago numeric(14,2) not null default 0,
  add column if not exists intervalo_meses integer not null default 1,
  add column if not exists origem_manual boolean not null default false,
  add column if not exists ultimo_pagamento_em date,
  add column if not exists chave_externa text,
  add column if not exists importacao_id uuid;

create index if not exists acordos_cliente_id_idx
  on public.acordos (cliente_id);

create index if not exists acordos_contrato_id_idx
  on public.acordos (contrato_id);

create index if not exists acordos_carteira_id_idx
  on public.acordos (carteira_id);

create index if not exists acordos_credor_id_idx
  on public.acordos (credor_id);

create index if not exists acordos_operador_id_idx
  on public.acordos (operador_id);

create index if not exists acordos_equipe_id_idx
  on public.acordos (equipe_id);

create index if not exists acordos_data_acordo_idx
  on public.acordos (data_acordo);

create index if not exists acordos_primeiro_vencimento_idx
  on public.acordos (primeiro_vencimento);

create index if not exists acordos_dia_vencimento_idx
  on public.acordos (dia_vencimento);

create index if not exists acordos_status_idx
  on public.acordos (status);

create index if not exists acordos_tipo_acordo_idx
  on public.acordos (tipo_acordo);

create index if not exists acordos_origem_idx
  on public.acordos (origem);

select pg_notify('pgrst', 'reload schema');
