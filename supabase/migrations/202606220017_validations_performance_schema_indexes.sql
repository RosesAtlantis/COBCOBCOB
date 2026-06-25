alter table public.clientes
  add column if not exists observacao text;

alter table public.cliente_carteiras
  add column if not exists credor_id uuid;

alter table public.contratos
  add column if not exists observacao text,
  add column if not exists origem_manual boolean default true;

alter table public.acordos
  add column if not exists observacao text,
  add column if not exists forma_pagamento text,
  add column if not exists percentual_honorarios numeric(10,2),
  add column if not exists valor_honorarios_previsto numeric(12,2),
  add column if not exists valor_escritorio_previsto numeric(12,2),
  add column if not exists intervalo_meses integer;

alter table public.acordo_parcelas
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists percentual_honorarios numeric(10,2),
  add column if not exists valor_honorarios_previsto numeric(12,2),
  add column if not exists valor_escritorio_previsto numeric(12,2),
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text;

alter table public.acordo_baixas
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists percentual_honorarios numeric(10,2),
  add column if not exists valor_honorarios numeric(12,2),
  add column if not exists valor_escritorio numeric(12,2),
  add column if not exists tipo_receita text,
  add column if not exists tipo_receita_origem text;

create index if not exists clientes_nome_idx
  on public.clientes (nome);

create index if not exists cliente_carteiras_cliente_id_idx
  on public.cliente_carteiras (cliente_id);

create index if not exists contratos_numero_contrato_idx
  on public.contratos (numero_contrato);

create index if not exists pagamentos_data_pagamento_idx
  on public.pagamentos (data_pagamento desc);

create index if not exists carteiras_nome_idx
  on public.carteiras (nome);

select pg_notify('pgrst', 'reload schema');
