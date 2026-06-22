create extension if not exists pgcrypto;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gerente@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'financeiro@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supervisor.atlas@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supervisor.bora@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000000', 'authenticated', 'authenticated', 'bianca.lima@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos.prado@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'daniele.rocha@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'eduardo.salles@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fernanda.paz@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'guilherme.viana@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'helena.nobre@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'igor.faria@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juliana.costa@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('10000000-0000-4000-8000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leandro.vieira@portalbko.local', crypt('PortalBKO123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.credores (id, nome)
values
  ('20000000-0000-4000-8000-000000000001', 'Banco Aurora'),
  ('20000000-0000-4000-8000-000000000002', 'Financeira Horizonte'),
  ('20000000-0000-4000-8000-000000000003', 'Varejo Prisma')
on conflict (id) do nothing;

insert into public.carteiras (id, nome, credor)
values
  ('30000000-0000-4000-8000-000000000001', 'Carteira Premium', 'Banco Aurora'),
  ('30000000-0000-4000-8000-000000000002', 'Carteira PJ', 'Banco Aurora'),
  ('30000000-0000-4000-8000-000000000003', 'Carteira Varejo Sul', 'Financeira Horizonte'),
  ('30000000-0000-4000-8000-000000000004', 'Carteira Varejo Norte', 'Varejo Prisma'),
  ('30000000-0000-4000-8000-000000000005', 'Carteira Recuperacao', 'Varejo Prisma')
on conflict (id) do nothing;

insert into public.equipes (id, nome)
values
  ('40000000-0000-4000-8000-000000000001', 'Time Atlas'),
  ('40000000-0000-4000-8000-000000000002', 'Time Bora'),
  ('40000000-0000-4000-8000-000000000003', 'Time Cobalto')
on conflict (id) do nothing;

insert into public.operadores (id, nome, email, equipe_id)
values
  ('50000000-0000-4000-8000-000000000001', 'Bianca Lima', 'bianca.lima@portalbko.local', '40000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', 'Carlos Prado', 'carlos.prado@portalbko.local', '40000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000003', 'Daniele Rocha', 'daniele.rocha@portalbko.local', '40000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000004', 'Eduardo Salles', 'eduardo.salles@portalbko.local', '40000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000005', 'Fernanda Paz', 'fernanda.paz@portalbko.local', '40000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000006', 'Guilherme Viana', 'guilherme.viana@portalbko.local', '40000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000007', 'Helena Nobre', 'helena.nobre@portalbko.local', '40000000-0000-4000-8000-000000000003'),
  ('50000000-0000-4000-8000-000000000008', 'Igor Faria', 'igor.faria@portalbko.local', '40000000-0000-4000-8000-000000000003'),
  ('50000000-0000-4000-8000-000000000009', 'Juliana Costa', 'juliana.costa@portalbko.local', '40000000-0000-4000-8000-000000000003'),
  ('50000000-0000-4000-8000-000000000010', 'Leandro Vieira', 'leandro.vieira@portalbko.local', '40000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

insert into public.profiles (id, user_id, nome, email, perfil, operador_id, equipe_id)
values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Ana Borges', 'admin@portalbko.local', 'admin', null, null),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Mateus Ramires', 'gerente@portalbko.local', 'gerente', null, null),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Paula Medeiros', 'financeiro@portalbko.local', 'financeiro', null, null),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Rafaela Teles', 'supervisor.atlas@portalbko.local', 'supervisor', null, '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'Thiago Benevides', 'supervisor.bora@portalbko.local', 'supervisor', null, '40000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', 'Bianca Lima', 'bianca.lima@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', 'Carlos Prado', 'carlos.prado@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000008', 'Daniele Rocha', 'daniele.rocha@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000009', 'Eduardo Salles', 'eduardo.salles@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'Fernanda Paz', 'fernanda.paz@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000011', 'Guilherme Viana', 'guilherme.viana@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000012', 'Helena Nobre', 'helena.nobre@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', 'Igor Faria', 'igor.faria@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000014', 'Juliana Costa', 'juliana.costa@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000015', 'Leandro Vieira', 'leandro.vieira@portalbko.local', 'operador', '50000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000003')
on conflict (id) do nothing;

update public.equipes
set supervisor_id = case id
  when '40000000-0000-4000-8000-000000000001' then '60000000-0000-4000-8000-000000000004'
  when '40000000-0000-4000-8000-000000000002' then '60000000-0000-4000-8000-000000000005'
  when '40000000-0000-4000-8000-000000000003' then '60000000-0000-4000-8000-000000000005'
end
where id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003'
);

insert into public.metas (id, mes, ano, operador_id, equipe_id, carteira_id, valor_meta)
select
  gen_random_uuid(),
  extract(month from current_date)::int,
  extract(year from current_date)::int,
  o.id,
  o.equipe_id,
  c.id,
  (32000 + rn * 2200)::numeric(14,2)
from (
  select id, equipe_id, row_number() over (order by nome) as rn
  from public.operadores
) o
join lateral (
  select id
  from public.carteiras
  order by nome
  offset ((o.rn - 1) % 5)
  limit 1
) c on true
on conflict do nothing;

insert into public.importacoes (id, tipo, nome_arquivo, usuario_id, total_linhas, linhas_importadas, linhas_erro, status, mensagem_erro)
values
  ('70000000-0000-4000-8000-000000000001', 'pagamentos', 'pagamentos_semana_01.csv', '10000000-0000-4000-8000-000000000001', 120, 118, 2, 'concluido_com_ressalvas', '2 linhas com carteira nao localizada.'),
  ('70000000-0000-4000-8000-000000000002', 'pagamentos', 'pagamentos_semana_02.csv', '10000000-0000-4000-8000-000000000002', 136, 136, 0, 'concluido', null),
  ('70000000-0000-4000-8000-000000000003', 'acordos', 'acordos_semana_02.xlsx', '10000000-0000-4000-8000-000000000003', 84, 84, 0, 'concluido', null)
on conflict (id) do nothing;

with operadores_base as (
  select
    o.id as operador_id,
    o.equipe_id,
    row_number() over (order by o.nome) as ordem
  from public.operadores o
),
dias as (
  select generate_series(current_date - interval '24 day', current_date, interval '1 day')::date as dia
),
carteiras_ordenadas as (
  select id, row_number() over (order by nome) as ordem
  from public.carteiras
)
insert into public.pagamentos (
  id,
  data_pagamento,
  operador_id,
  equipe_id,
  carteira_id,
  cpf_cnpj,
  contrato,
  valor_pago,
  valor_honorario,
  origem_arquivo,
  importacao_id
)
select
  gen_random_uuid(),
  d.dia,
  ob.operador_id,
  ob.equipe_id,
  co.id,
  lpad((10000000000 + ob.ordem * 100 + extract(day from d.dia)::int)::text, 11, '0'),
  format('CTR-%s-%s', ob.ordem, to_char(d.dia, 'DD')),
  round((900 + ob.ordem * 110 + (extract(day from d.dia)::int % 6) * 95)::numeric, 2),
  round((900 + ob.ordem * 110 + (extract(day from d.dia)::int % 6) * 95)::numeric * 0.18, 2),
  format('pagamentos_%s.csv', to_char(d.dia, 'YYYY_MM')),
  case
    when extract(day from d.dia)::int <= 8 then '70000000-0000-4000-8000-000000000001'
    else '70000000-0000-4000-8000-000000000002'
  end
from dias d
join operadores_base ob on (extract(doy from d.dia)::int + ob.ordem) % 3 = 0
join carteiras_ordenadas co on co.ordem = ((ob.ordem + extract(day from d.dia)::int) % 5) + 1
on conflict do nothing;

with operadores_base as (
  select
    o.id as operador_id,
    o.equipe_id,
    row_number() over (order by o.nome) as ordem
  from public.operadores o
),
dias as (
  select generate_series(current_date - interval '24 day', current_date, interval '1 day')::date as dia
),
carteiras_ordenadas as (
  select id, row_number() over (order by nome) as ordem
  from public.carteiras
)
insert into public.acordos (
  id,
  data_acordo,
  operador_id,
  equipe_id,
  carteira_id,
  cpf_cnpj,
  contrato,
  valor_acordo,
  valor_entrada,
  quantidade_parcelas,
  status,
  importacao_id
)
select
  gen_random_uuid(),
  d.dia,
  ob.operador_id,
  ob.equipe_id,
  co.id,
  lpad((20000000000 + ob.ordem * 100 + extract(day from d.dia)::int)::text, 11, '0'),
  format('AGR-%s-%s', ob.ordem, to_char(d.dia, 'DD')),
  round((1650 + ob.ordem * 180 + (extract(day from d.dia)::int % 5) * 120)::numeric, 2),
  round((1650 + ob.ordem * 180 + (extract(day from d.dia)::int % 5) * 120)::numeric * 0.35, 2),
  4 + (ob.ordem % 6),
  case when extract(day from d.dia)::int % 2 = 0 then 'ativo' else 'formalizado' end,
  '70000000-0000-4000-8000-000000000003'
from dias d
join operadores_base ob on (extract(doy from d.dia)::int + ob.ordem) % 4 = 0
join carteiras_ordenadas co on co.ordem = ((ob.ordem + extract(day from d.dia)::int) % 5) + 1
on conflict do nothing;

with operadores_base as (
  select
    o.id as operador_id,
    o.equipe_id,
    row_number() over (order by o.nome) as ordem
  from public.operadores o
),
dias as (
  select generate_series(current_date - interval '18 day', current_date, interval '1 day')::date as dia
),
carteiras_ordenadas as (
  select id, row_number() over (order by nome) as ordem
  from public.carteiras
)
insert into public.acionamentos (
  id,
  data_acionamento,
  operador_id,
  equipe_id,
  carteira_id,
  contrato,
  evento,
  descricao,
  canal
)
select
  gen_random_uuid(),
  d.dia,
  ob.operador_id,
  ob.equipe_id,
  co.id,
  format('ACT-%s-%s', ob.ordem, to_char(d.dia, 'DD')),
  case when extract(day from d.dia)::int % 2 = 0 then 'Ligacao' else 'WhatsApp' end,
  'Contato realizado com proposta ativa.',
  case when extract(day from d.dia)::int % 2 = 0 then 'voz' else 'mensageria' end
from dias d
join operadores_base ob on (extract(doy from d.dia)::int + ob.ordem) % 5 = 0
join carteiras_ordenadas co on co.ordem = ((ob.ordem + extract(day from d.dia)::int) % 5) + 1
on conflict do nothing;
