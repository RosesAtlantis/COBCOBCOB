alter table public.profiles enable row level security;
alter table public.operadores enable row level security;
alter table public.equipes enable row level security;
alter table public.credores enable row level security;
alter table public.carteiras enable row level security;
alter table public.clientes enable row level security;
alter table public.cliente_carteiras enable row level security;
alter table public.contratos enable row level security;
alter table public.metas enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  user_id = auth.uid()
  or public.current_role() in ('admin', 'gerente')
  or (
    public.current_role() = 'supervisor'
    and public.can_access_team(equipe_id)
  )
);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
for update to authenticated
using (
  user_id = auth.uid()
  or public.current_role() = 'admin'
)
with check (
  user_id = auth.uid()
  or public.current_role() = 'admin'
);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
for insert to authenticated
with check (public.current_role() = 'admin');

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

drop policy if exists teams_write on public.equipes;
create policy teams_write on public.equipes
for all to authenticated
using (public.current_role() in ('admin', 'gerente'))
with check (public.current_role() in ('admin', 'gerente'));

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

drop policy if exists goals_write on public.metas;
create policy goals_write on public.metas
for all to authenticated
using (public.current_role() in ('admin', 'gerente', 'financeiro'))
with check (public.current_role() in ('admin', 'gerente', 'financeiro'));

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
