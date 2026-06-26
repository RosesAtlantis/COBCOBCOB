alter table public.pagamentos
  add column if not exists cliente_id uuid,
  add column if not exists contrato_id uuid,
  add column if not exists acordo_id uuid,
  add column if not exists parcela_id uuid,
  add column if not exists baixa_id uuid,
  add column if not exists carteira_id uuid,
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists cpf_cnpj text,
  add column if not exists contrato text,
  add column if not exists valor_pago numeric(14,2) not null default 0,
  add column if not exists valor_honorario numeric(14,2) not null default 0,
  add column if not exists valor_escritorio numeric(14,2),
  add column if not exists percentual_honorarios numeric(7,2),
  add column if not exists forma_pagamento text,
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text default 'automatico',
  add column if not exists origem_arquivo text,
  add column if not exists origem_manual boolean not null default false,
  add column if not exists origem text,
  add column if not exists importacao_id uuid,
  add column if not exists registrado_por uuid,
  add column if not exists atualizado_por uuid,
  add column if not exists estornado boolean not null default false,
  add column if not exists estornado_em timestamptz,
  add column if not exists estornado_por uuid,
  add column if not exists motivo_estorno text,
  add column if not exists criado_em timestamptz not null default now(),
  add column if not exists atualizado_em timestamptz not null default now();

create unique index if not exists pagamentos_baixa_id_uidx
  on public.pagamentos (baixa_id);

create index if not exists pagamentos_acordo_id_idx
  on public.pagamentos (acordo_id);

create index if not exists pagamentos_cliente_id_idx
  on public.pagamentos (cliente_id);

create index if not exists pagamentos_contrato_id_idx
  on public.pagamentos (contrato_id);

create index if not exists pagamentos_parcela_id_idx
  on public.pagamentos (parcela_id);

create index if not exists pagamentos_data_pagamento_idx
  on public.pagamentos (data_pagamento desc);

create index if not exists pagamentos_scope_idx
  on public.pagamentos (carteira_id, equipe_id, operador_id, data_pagamento desc);

create index if not exists pagamentos_origem_idx
  on public.pagamentos (origem_manual, origem, data_pagamento desc);

create index if not exists pagamentos_estornado_idx
  on public.pagamentos (estornado, data_pagamento desc);

select pg_notify('pgrst', 'reload schema');
