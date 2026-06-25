alter table public.carteiras
  add column if not exists documento text,
  add column if not exists telefone text,
  add column if not exists email text,
  add column if not exists observacao text;

update public.carteiras carteira
set
  documento = coalesce(carteira.documento, credor.documento),
  telefone = coalesce(carteira.telefone, credor.telefone),
  email = coalesce(carteira.email, credor.email),
  observacao = coalesce(carteira.observacao, credor.observacao)
from public.credores credor
where carteira.credor_id = credor.id;

update public.carteiras
set ativo = true
where ativo is null;

alter table public.carteiras
  alter column ativo set default true;

alter table public.carteiras
  alter column ativo set not null;

update public.carteiras
set credor = nome
where nullif(trim(nome), '') is not null
  and credor is distinct from nome;

update public.cliente_carteiras cliente_carteira
set
  credor = carteira.nome,
  credor_id = carteira.credor_id,
  atualizado_em = now()
from public.carteiras carteira
where cliente_carteira.carteira_id = carteira.id
  and (
    cliente_carteira.credor is distinct from carteira.nome
    or cliente_carteira.credor_id is distinct from carteira.credor_id
  );

update public.contratos contrato
set
  credor = carteira.nome,
  credor_id = carteira.credor_id,
  atualizado_em = now()
from public.carteiras carteira
where contrato.carteira_id = carteira.id
  and (
    contrato.credor is distinct from carteira.nome
    or contrato.credor_id is distinct from carteira.credor_id
  );

update public.metas meta
set credor_id = carteira.credor_id
from public.carteiras carteira
where meta.carteira_id = carteira.id
  and meta.credor_id is null
  and carteira.credor_id is not null;

create index if not exists carteiras_documento_idx
  on public.carteiras (documento);

create index if not exists carteiras_email_idx
  on public.carteiras (email);

alter table public.carteiras enable row level security;

drop policy if exists wallets_write on public.carteiras;
create policy wallets_write on public.carteiras
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

select pg_notify('pgrst', 'reload schema');
