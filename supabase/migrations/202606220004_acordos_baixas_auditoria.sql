alter table public.acordo_baixas
  add column if not exists estornada boolean not null default false,
  add column if not exists estornada_em timestamptz,
  add column if not exists estornada_por uuid,
  add column if not exists motivo_estorno text;

alter table public.pagamentos
  add column if not exists estornado boolean not null default false,
  add column if not exists estornado_em timestamptz,
  add column if not exists estornado_por uuid,
  add column if not exists motivo_estorno text;

create table if not exists public.auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  entidade text not null,
  entidade_id uuid not null,
  acao text not null,
  descricao text,
  acordo_id uuid,
  parcela_id uuid,
  baixa_id uuid,
  pagamento_id uuid,
  cliente_id uuid,
  contrato_id uuid,
  operador_id uuid,
  equipe_id uuid,
  carteira_id uuid,
  usuario_id uuid,
  payload jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

alter table public.auditoria_eventos
  add column if not exists entidade text,
  add column if not exists entidade_id uuid,
  add column if not exists acao text,
  add column if not exists descricao text,
  add column if not exists acordo_id uuid,
  add column if not exists parcela_id uuid,
  add column if not exists baixa_id uuid,
  add column if not exists pagamento_id uuid,
  add column if not exists cliente_id uuid,
  add column if not exists contrato_id uuid,
  add column if not exists operador_id uuid,
  add column if not exists equipe_id uuid,
  add column if not exists carteira_id uuid,
  add column if not exists usuario_id uuid,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists criado_em timestamptz not null default now();

alter table public.auditoria_eventos
  alter column entidade set not null,
  alter column entidade_id set not null,
  alter column acao set not null,
  alter column payload set default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'acordo_baixas_estornada_por_fkey'
  ) then
    alter table public.acordo_baixas
      add constraint acordo_baixas_estornada_por_fkey
      foreign key (estornada_por) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'pagamentos_estornado_por_fkey'
  ) then
    alter table public.pagamentos
      add constraint pagamentos_estornado_por_fkey
      foreign key (estornado_por) references public.profiles (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_acordo_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_acordo_id_fkey
      foreign key (acordo_id) references public.acordos (id) on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_parcela_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_parcela_id_fkey
      foreign key (parcela_id) references public.acordo_parcelas (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_baixa_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_baixa_id_fkey
      foreign key (baixa_id) references public.acordo_baixas (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_pagamento_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_pagamento_id_fkey
      foreign key (pagamento_id) references public.pagamentos (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_cliente_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_cliente_id_fkey
      foreign key (cliente_id) references public.clientes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_contrato_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_contrato_id_fkey
      foreign key (contrato_id) references public.contratos (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_operador_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_operador_id_fkey
      foreign key (operador_id) references public.operadores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_equipe_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_equipe_id_fkey
      foreign key (equipe_id) references public.equipes (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_carteira_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_carteira_id_fkey
      foreign key (carteira_id) references public.carteiras (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'auditoria_eventos_usuario_id_fkey'
  ) then
    alter table public.auditoria_eventos
      add constraint auditoria_eventos_usuario_id_fkey
      foreign key (usuario_id) references public.profiles (id) on delete set null;
  end if;
end;
$$;

create index if not exists acordo_baixas_estornada_idx
  on public.acordo_baixas (estornada, data_pagamento desc);

create index if not exists pagamentos_estornado_idx
  on public.pagamentos (estornado, data_pagamento desc);

create index if not exists auditoria_eventos_entidade_idx
  on public.auditoria_eventos (entidade, entidade_id, criado_em desc);

create index if not exists auditoria_eventos_acordo_idx
  on public.auditoria_eventos (acordo_id, criado_em desc);

create index if not exists auditoria_eventos_scope_idx
  on public.auditoria_eventos (equipe_id, operador_id, criado_em desc);

create or replace function public.create_auditoria_evento(
  p_entidade text,
  p_entidade_id uuid,
  p_acao text,
  p_descricao text default null,
  p_acordo_id uuid default null,
  p_parcela_id uuid default null,
  p_baixa_id uuid default null,
  p_pagamento_id uuid default null,
  p_cliente_id uuid default null,
  p_contrato_id uuid default null,
  p_operador_id uuid default null,
  p_equipe_id uuid default null,
  p_carteira_id uuid default null,
  p_usuario_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  agreement_scope public.acordos%rowtype;
begin
  if nullif(btrim(coalesce(p_entidade, '')), '') is null then
    raise exception 'Entidade obrigatoria para auditoria.';
  end if;

  if p_entidade_id is null then
    raise exception 'Entidade_id obrigatorio para auditoria.';
  end if;

  if nullif(btrim(coalesce(p_acao, '')), '') is null then
    raise exception 'Acao obrigatoria para auditoria.';
  end if;

  if p_acordo_id is not null then
    select *
    into agreement_scope
    from public.acordos
    where id = p_acordo_id;
  end if;

  insert into public.auditoria_eventos (
    entidade,
    entidade_id,
    acao,
    descricao,
    acordo_id,
    parcela_id,
    baixa_id,
    pagamento_id,
    cliente_id,
    contrato_id,
    operador_id,
    equipe_id,
    carteira_id,
    usuario_id,
    payload
  )
  values (
    nullif(btrim(coalesce(p_entidade, '')), ''),
    p_entidade_id,
    nullif(btrim(coalesce(p_acao, '')), ''),
    nullif(btrim(coalesce(p_descricao, '')), ''),
    p_acordo_id,
    p_parcela_id,
    p_baixa_id,
    p_pagamento_id,
    coalesce(p_cliente_id, agreement_scope.cliente_id),
    coalesce(p_contrato_id, agreement_scope.contrato_id),
    coalesce(p_operador_id, agreement_scope.operador_id),
    coalesce(p_equipe_id, agreement_scope.equipe_id),
    coalesce(p_carteira_id, agreement_scope.carteira_id),
    coalesce(p_usuario_id, public.current_profile_id()),
    coalesce(p_payload, '{}'::jsonb)
  )
  returning id
  into event_id;

  return event_id;
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
  linked_operator_id uuid;
  linked_team_id uuid;
  linked_wallet_id uuid;
begin
  select
    status,
    contrato_id,
    cliente_id,
    operador_id,
    equipe_id,
    carteira_id
  into
    current_status,
    linked_contract_id,
    linked_client_id,
    linked_operator_id,
    linked_team_id,
    linked_wallet_id
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

  if coalesce(current_status, '') <> coalesce(next_status, '') then
    perform public.create_auditoria_evento(
      'acordo',
      target_acordo_id,
      'acordo_status_alterado',
      format(
        'Status alterado de %s para %s.',
        coalesce(current_status, 'nao informado'),
        coalesce(next_status, 'nao informado')
      ),
      target_acordo_id,
      null,
      null,
      null,
      linked_client_id,
      linked_contract_id,
      linked_operator_id,
      linked_team_id,
      linked_wallet_id,
      public.current_profile_id(),
      jsonb_build_object(
        'statusAnterior', current_status,
        'statusNovo', next_status,
        'valorPago', paid_total,
        'ultimoPagamentoEm', last_paid_at
      )
    );
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

  perform public.create_auditoria_evento(
    'acordo',
    agreement_id,
    'acordo_criado',
    coalesce(nullif(btrim(coalesce(p_observacao, '')), ''), 'Acordo criado no Portal BKO.'),
    agreement_id,
    null,
    null,
    null,
    selected_client.id,
    selected_contract.id,
    resolved_operator_id,
    resolved_team_id,
    resolved_wallet_id,
    public.current_profile_id(),
    jsonb_build_object(
      'valorOriginal', greatest(coalesce(p_valor_original, 0), coalesce(selected_contract.valor_original, 0), coalesce(p_valor_acordo, 0)),
      'valorAcordo', round(coalesce(p_valor_acordo, 0), 2),
      'valorEntrada', round(coalesce(p_valor_entrada, 0), 2),
      'quantidadeParcelas', p_quantidade_parcelas
    )
  );

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
  payment_id uuid;
  remaining_balance numeric(14,2);
  payment_contract_label text;
  previous_parcel_status text;
  next_parcel_status text;
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

  previous_parcel_status := selected_parcel.status;
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
  where id = selected_parcel.id
  returning status
  into next_parcel_status;

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
    origem_arquivo = excluded.origem_arquivo,
    estornado = false,
    estornado_em = null,
    estornado_por = null,
    motivo_estorno = null
  returning id
  into payment_id;

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

  perform public.create_auditoria_evento(
    'baixa',
    write_off_id,
    'baixa_registrada',
    coalesce(
      nullif(btrim(coalesce(p_observacao, '')), ''),
      format('Baixa registrada para a parcela %s.', selected_parcel.numero_parcela)
    ),
    selected_agreement.id,
    selected_parcel.id,
    write_off_id,
    payment_id,
    selected_agreement.cliente_id,
    selected_agreement.contrato_id,
    selected_agreement.operador_id,
    selected_agreement.equipe_id,
    selected_agreement.carteira_id,
    public.current_profile_id(),
    jsonb_build_object(
      'valorPago', round(coalesce(p_valor_pago, 0), 2),
      'formaPagamento', nullif(btrim(coalesce(p_forma_pagamento, '')), ''),
      'statusParcelaAnterior', previous_parcel_status,
      'statusParcelaAtual', next_parcel_status
    )
  );

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
  description_text text;
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

  description_text :=
    case
      when nullif(btrim(coalesce(p_observacao, '')), '') is null then 'Acordo cancelado manualmente.'
      else format('Acordo cancelado manualmente: %s', nullif(btrim(coalesce(p_observacao, '')), ''))
    end;

  update public.acordos
  set
    status = 'cancelado',
    observacao = concat_ws(
      E'\n',
      nullif(btrim(coalesce(observacao, '')), ''),
      description_text
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

  perform public.create_auditoria_evento(
    'acordo',
    p_acordo_id,
    'acordo_cancelado',
    description_text,
    p_acordo_id,
    null,
    null,
    null,
    selected_agreement.cliente_id,
    selected_agreement.contrato_id,
    selected_agreement.operador_id,
    selected_agreement.equipe_id,
    selected_agreement.carteira_id,
    public.current_profile_id(),
    jsonb_build_object(
      'statusAnterior', selected_agreement.status,
      'statusNovo', 'cancelado'
    )
  );

  return p_acordo_id;
end;
$$;

create or replace function public.portal_estornar_baixa(
  p_baixa_id uuid,
  p_motivo_estorno text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_write_off public.acordo_baixas%rowtype;
  selected_agreement public.acordos%rowtype;
  selected_parcel public.acordo_parcelas%rowtype;
  active_paid_total numeric(14,2) := 0;
  latest_payment_date date;
begin
  if p_baixa_id is null then
    raise exception 'Baixa obrigatoria.';
  end if;

  select *
  into selected_write_off
  from public.acordo_baixas
  where id = p_baixa_id
  for update;

  if not found then
    raise exception 'Baixa nao encontrada.';
  end if;

  if selected_write_off.estornada is true then
    raise exception 'Esta baixa ja foi estornada.';
  end if;

  select *
  into selected_agreement
  from public.acordos
  where id = selected_write_off.acordo_id;

  if not found then
    raise exception 'Acordo vinculado a baixa nao encontrado.';
  end if;

  if not public.can_manage_baixa(selected_agreement.id) then
    raise exception 'Seu perfil nao pode estornar esta baixa.';
  end if;

  select *
  into selected_parcel
  from public.acordo_parcelas
  where id = selected_write_off.parcela_id
    and acordo_id = selected_agreement.id
  for update;

  if not found then
    raise exception 'Parcela vinculada a baixa nao encontrada.';
  end if;

  update public.acordo_baixas
  set
    estornada = true,
    estornada_em = now(),
    estornada_por = public.current_profile_id(),
    motivo_estorno = nullif(btrim(coalesce(p_motivo_estorno, '')), '')
  where id = selected_write_off.id;

  update public.pagamentos
  set
    estornado = true,
    estornado_em = now(),
    estornado_por = public.current_profile_id(),
    motivo_estorno = nullif(btrim(coalesce(p_motivo_estorno, '')), '')
  where baixa_id = selected_write_off.id;

  select
    coalesce(sum(valor_pago), 0),
    max(data_pagamento)
  into
    active_paid_total,
    latest_payment_date
  from public.acordo_baixas
  where parcela_id = selected_parcel.id
    and coalesce(estornada, false) is false;

  update public.acordo_parcelas
  set
    valor_pago = round(active_paid_total, 2),
    data_pagamento =
      case
        when round(active_paid_total, 2) >= round(coalesce(valor_parcela, 0), 2) then latest_payment_date
        else null
      end,
    status =
      case
        when status = 'cancelado' then status
        when round(active_paid_total, 2) >= round(coalesce(valor_parcela, 0), 2) then 'pago'
        when data_vencimento < current_date then 'atrasado'
        else 'pendente'
      end
  where id = selected_parcel.id;

  if selected_agreement.contrato_id is not null then
    update public.contratos
    set
      valor_em_aberto = least(
        round(coalesce(valor_em_aberto, 0) + round(coalesce(selected_write_off.valor_pago, 0), 2), 2),
        coalesce(valor_original, round(coalesce(valor_em_aberto, 0) + round(coalesce(selected_write_off.valor_pago, 0), 2), 2))
      )
    where id = selected_agreement.contrato_id;
  end if;

  perform public.refresh_acordo_status(selected_agreement.id);

  perform public.create_auditoria_evento(
    'baixa',
    selected_write_off.id,
    'baixa_estornada',
    coalesce(
      nullif(btrim(coalesce(p_motivo_estorno, '')), ''),
      format('Baixa da parcela %s estornada manualmente.', selected_parcel.numero_parcela)
    ),
    selected_agreement.id,
    selected_parcel.id,
    selected_write_off.id,
    null,
    selected_agreement.cliente_id,
    selected_agreement.contrato_id,
    selected_agreement.operador_id,
    selected_agreement.equipe_id,
    selected_agreement.carteira_id,
    public.current_profile_id(),
    jsonb_build_object(
      'valorPago', selected_write_off.valor_pago,
      'motivoEstorno', nullif(btrim(coalesce(p_motivo_estorno, '')), ''),
      'dataPagamentoOriginal', selected_write_off.data_pagamento
    )
  );

  return selected_write_off.id;
end;
$$;

grant execute on function public.create_auditoria_evento(text, uuid, text, text, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.portal_estornar_baixa(uuid, text) to authenticated;
grant execute on function public.refresh_acordo_status(uuid) to authenticated;
grant execute on function public.portal_criar_acordo(uuid, uuid, uuid, uuid, uuid, date, numeric, numeric, numeric, date, integer, numeric, date, text, text, text) to authenticated;
grant execute on function public.portal_registrar_baixa(uuid, uuid, date, numeric, text, text) to authenticated;
grant execute on function public.portal_cancelar_acordo(uuid, text) to authenticated;

alter table public.auditoria_eventos enable row level security;

drop policy if exists audit_events_select on public.auditoria_eventos;
create policy audit_events_select on public.auditoria_eventos
for select to authenticated
using (
  public.has_global_access()
  or (acordo_id is not null and public.can_access_agreement(acordo_id))
  or (cliente_id is not null and public.can_access_client(cliente_id))
  or public.can_access_scope(equipe_id, operador_id)
);

drop policy if exists audit_events_write on public.auditoria_eventos;
create policy audit_events_write on public.auditoria_eventos
for insert to authenticated
with check (
  public.current_role() in ('admin', 'gerente', 'financeiro')
  or public.can_create_agreement_for_scope(equipe_id, operador_id)
  or (acordo_id is not null and public.can_manage_agreement(acordo_id))
  or (acordo_id is not null and public.can_manage_baixa(acordo_id))
);
