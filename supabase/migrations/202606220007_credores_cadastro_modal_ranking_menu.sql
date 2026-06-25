alter table public.credores
  add column if not exists codigo text,
  add column if not exists documento text,
  add column if not exists email text,
  add column if not exists telefone text,
  add column if not exists observacao text;

alter table public.carteiras
  add column if not exists credor_id uuid;

alter table public.cliente_carteiras
  add column if not exists credor_id uuid;

alter table public.contratos
  add column if not exists credor_id uuid;

insert into public.credores (nome, ativo)
select source.nome, true
from (
  select distinct nullif(btrim(credor), '') as nome
  from public.carteiras

  union

  select distinct nullif(btrim(credor), '') as nome
  from public.cliente_carteiras

  union

  select distinct nullif(btrim(credor), '') as nome
  from public.contratos
) as source
left join public.credores credor_existente
  on lower(credor_existente.nome) = lower(source.nome)
where source.nome is not null
  and credor_existente.id is null;

update public.carteiras carteira
set credor_id = credor.id
from public.credores credor
where carteira.credor_id is null
  and nullif(btrim(carteira.credor), '') is not null
  and lower(credor.nome) = lower(nullif(btrim(carteira.credor), ''));

update public.carteiras carteira
set credor = credor.nome
from public.credores credor
where carteira.credor_id = credor.id
  and carteira.credor is distinct from credor.nome;

update public.cliente_carteiras cliente_carteira
set credor_id = carteira.credor_id
from public.carteiras carteira
where cliente_carteira.carteira_id = carteira.id
  and cliente_carteira.credor_id is null
  and carteira.credor_id is not null;

update public.cliente_carteiras cliente_carteira
set credor_id = credor.id
from public.credores credor
where cliente_carteira.credor_id is null
  and nullif(btrim(cliente_carteira.credor), '') is not null
  and lower(credor.nome) = lower(nullif(btrim(cliente_carteira.credor), ''));

update public.cliente_carteiras cliente_carteira
set credor = credor.nome
from public.credores credor
where cliente_carteira.credor_id = credor.id
  and cliente_carteira.credor is distinct from credor.nome;

update public.contratos contrato
set credor_id = carteira.credor_id
from public.carteiras carteira
where contrato.carteira_id = carteira.id
  and contrato.credor_id is null
  and carteira.credor_id is not null;

update public.contratos contrato
set credor_id = credor.id
from public.credores credor
where contrato.credor_id is null
  and nullif(btrim(contrato.credor), '') is not null
  and lower(credor.nome) = lower(nullif(btrim(contrato.credor), ''));

update public.contratos contrato
set credor = credor.nome
from public.credores credor
where contrato.credor_id = credor.id
  and contrato.credor is distinct from credor.nome;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'carteiras_credor_id_fkey'
  ) then
    alter table public.carteiras
      add constraint carteiras_credor_id_fkey
      foreign key (credor_id) references public.credores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cliente_carteiras_credor_id_fkey'
  ) then
    alter table public.cliente_carteiras
      add constraint cliente_carteiras_credor_id_fkey
      foreign key (credor_id) references public.credores (id) on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'contratos_credor_id_fkey'
  ) then
    alter table public.contratos
      add constraint contratos_credor_id_fkey
      foreign key (credor_id) references public.credores (id) on delete set null;
  end if;
end;
$$;

create index if not exists credores_codigo_idx
  on public.credores (codigo);

create index if not exists credores_documento_idx
  on public.credores (documento);

create index if not exists carteiras_credor_id_idx
  on public.carteiras (credor_id);

create index if not exists cliente_carteiras_credor_id_idx
  on public.cliente_carteiras (credor_id);

create index if not exists contratos_credor_id_idx
  on public.contratos (credor_id);

drop policy if exists creditors_select on public.credores;
create policy creditors_select on public.credores
for select to authenticated
using (
  public.current_role() in ('admin', 'gerente', 'financeiro', 'supervisor')
  or exists (
    select 1
    from public.carteiras carteira
    join public.pagamentos pagamento on pagamento.carteira_id = carteira.id
    where (
      carteira.credor_id = credores.id
      or carteira.credor = credores.nome
    )
      and public.can_access_operator(pagamento.operador_id)
  )
  or exists (
    select 1
    from public.carteiras carteira
    join public.acordos acordo on acordo.carteira_id = carteira.id
    where (
      carteira.credor_id = credores.id
      or carteira.credor = credores.nome
    )
      and public.can_access_operator(acordo.operador_id)
  )
);
