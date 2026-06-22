alter table public.importacoes
  drop constraint if exists importacoes_tipo_check;

alter table public.importacoes
  add constraint importacoes_tipo_check
  check (tipo in ('cobware', 'pagamentos', 'acordos', 'operadores', 'metas', 'carteiras', 'acionamentos'));

alter table public.metas
  add column if not exists chave_externa text;

alter table public.pagamentos
  add column if not exists chave_externa text;

alter table public.acordos
  add column if not exists chave_externa text;

alter table public.acionamentos
  add column if not exists chave_externa text;

create unique index if not exists metas_chave_externa_uidx
  on public.metas (chave_externa)
  where chave_externa is not null;

create unique index if not exists pagamentos_chave_externa_uidx
  on public.pagamentos (chave_externa)
  where chave_externa is not null;

create unique index if not exists acordos_chave_externa_uidx
  on public.acordos (chave_externa)
  where chave_externa is not null;

create unique index if not exists acionamentos_chave_externa_uidx
  on public.acionamentos (chave_externa)
  where chave_externa is not null;
