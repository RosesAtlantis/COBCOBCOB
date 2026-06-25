alter table public.carteiras
  add column if not exists codigo text,
  add column if not exists descricao text;

alter table public.metas
  add column if not exists credor_id uuid;

alter table public.metas
  add column if not exists ativo boolean default true;

update public.metas
set ativo = true
where ativo is null;

alter table public.metas
  alter column ativo set default true;

alter table public.metas
  alter column ativo set not null;

update public.metas meta
set credor_id = carteira.credor_id
from public.carteiras carteira
where meta.carteira_id = carteira.id
  and meta.credor_id is null
  and carteira.credor_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'metas_credor_id_fkey'
  ) then
    alter table public.metas
      add constraint metas_credor_id_fkey
      foreign key (credor_id) references public.credores (id) on delete set null;
  end if;
end;
$$;

create index if not exists carteiras_codigo_idx
  on public.carteiras (codigo);

create index if not exists metas_credor_id_idx
  on public.metas (credor_id);

create index if not exists metas_competencia_status_idx
  on public.metas (ano desc, mes desc, ativo);

drop policy if exists creditors_write on public.credores;
create policy creditors_write on public.credores
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

drop policy if exists wallets_write on public.carteiras;
create policy wallets_write on public.carteiras
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

drop policy if exists operators_write on public.operadores;
create policy operators_write on public.operadores
for all to authenticated
using (
  public.current_role() in ('admin', 'gerente')
  or (
    public.current_role() = 'supervisor'
    and equipe_id is not null
    and public.can_access_team(equipe_id)
  )
)
with check (
  public.current_role() in ('admin', 'gerente')
  or (
    public.current_role() = 'supervisor'
    and equipe_id is not null
    and public.can_access_team(equipe_id)
  )
);

drop policy if exists goals_write on public.metas;
create policy goals_write on public.metas
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

drop policy if exists contracts_write on public.contratos;
drop policy if exists contracts_insert on public.contratos;
drop policy if exists contracts_update on public.contratos;

create policy contracts_insert on public.contratos
for insert to authenticated
with check (
  public.current_role() in ('admin', 'gerente', 'financeiro')
  or public.can_create_agreement_for_scope(equipe_id, operador_id)
);

create policy contracts_update on public.contratos
for update to authenticated
using (
  public.current_role() in ('admin', 'gerente')
  or public.can_update_agreement_for_scope(equipe_id, operador_id)
)
with check (
  public.current_role() in ('admin', 'gerente')
  or public.can_update_agreement_for_scope(equipe_id, operador_id)
);
