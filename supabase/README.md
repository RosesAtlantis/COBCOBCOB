# Supabase - Portal BKO

Este projeto ja possui os SQLs prontos em `supabase/migrations`.

## Ordem exata para configurar no Supabase

1. Abra o projeto no Supabase.
2. Va em `SQL Editor`.
3. Rode o arquivo [migrations/202606220001_portal_bko_init.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220001_portal_bko_init.sql).
4. Rode o arquivo [migrations/202606220002_cobware_import_support.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220002_cobware_import_support.sql).
5. Rode o arquivo [migrations/202606220003_clientes_acordos_baixas.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220003_clientes_acordos_baixas.sql).
6. Rode o arquivo [migrations/202606220004_acordos_baixas_auditoria.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220004_acordos_baixas_auditoria.sql).
7. Rode o arquivo [migrations/202606220005_manual_cases_audit_import_reversal_honorarios.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220005_manual_cases_audit_import_reversal_honorarios.sql).
8. Rode o arquivo [migrations/202606220006_cadastro_manual_simplificado_parcelas_classificacao.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220006_cadastro_manual_simplificado_parcelas_classificacao.sql).
9. Rode o arquivo [migrations/202606220007_credores_cadastro_modal_ranking_menu.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220007_credores_cadastro_modal_ranking_menu.sql).
10. Rode o arquivo [migrations/202606220008_cadastros_manuais_completos.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220008_cadastros_manuais_completos.sql).
11. Rode o arquivo [migrations/202606220009_fix_admin_crud_permissions.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220009_fix_admin_crud_permissions.sql).
12. Rode o arquivo [migrations/202606220011_unifica_credor_carteira_e_filtros.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220011_unifica_credor_carteira_e_filtros.sql).
13. Se quiser dados de exemplo para desenvolvimento, rode [seed/seed.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/seed/seed.sql).
14. Va em `Authentication > URL Configuration`.
15. Preencha `Site URL` com a URL publicada na Vercel.
16. Adicione estas `Redirect URLs`:

```text
https://URL-DA-VERCEL.vercel.app/*
http://localhost:3000/*
```

17. Va em `Authentication > Users`.
18. Crie o seu usuario manualmente.
19. Copie o `User ID` criado.
20. Va em `Table Editor > profiles`.
21. Crie uma linha manual com:

```text
user_id = ID do usuario criado
nome = seu nome
email = seu e-mail
perfil = admin
ativo = true
```

22. Depois configure as variaveis do projeto na Vercel e faca `Redeploy`.

## SQLs que precisam ser rodados

Obrigatorios:

1. [migrations/202606220001_portal_bko_init.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220001_portal_bko_init.sql)
2. [migrations/202606220002_cobware_import_support.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220002_cobware_import_support.sql)
3. [migrations/202606220003_clientes_acordos_baixas.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220003_clientes_acordos_baixas.sql)
4. [migrations/202606220004_acordos_baixas_auditoria.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220004_acordos_baixas_auditoria.sql)
5. [migrations/202606220005_manual_cases_audit_import_reversal_honorarios.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220005_manual_cases_audit_import_reversal_honorarios.sql)
6. [migrations/202606220006_cadastro_manual_simplificado_parcelas_classificacao.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220006_cadastro_manual_simplificado_parcelas_classificacao.sql)
7. [migrations/202606220007_credores_cadastro_modal_ranking_menu.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220007_credores_cadastro_modal_ranking_menu.sql)
8. [migrations/202606220008_cadastros_manuais_completos.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220008_cadastros_manuais_completos.sql)
9. [migrations/202606220009_fix_admin_crud_permissions.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220009_fix_admin_crud_permissions.sql)
10. [migrations/202606220011_unifica_credor_carteira_e_filtros.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220011_unifica_credor_carteira_e_filtros.sql)

Opcional:

1. [seed/seed.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/seed/seed.sql)

## Estrutura coberta pelas migrations

As migrations criam e configuram:

- `profiles`
- `operadores`
- `equipes`
- `credores`
- `carteiras`
- `metas`
- `pagamentos`
- `acordos`
- `clientes`
- `cliente_carteiras`
- `contratos`
- `acordo_parcelas`
- `acordo_baixas`
- `auditoria_eventos`
- `acionamentos`
- `importacoes`
- `importacao_registros`

Incluem:

- tabelas
- chaves primarias
- relacionamentos
- indices
- timestamps
- RLS
- policies basicas
- funcoes auxiliares de papel, equipe e operador
- funcoes transacionais para criar acordo, gerar parcelas, registrar baixa e estornar recebimentos
- trilha de auditoria para criacao, cancelamento, baixa, estorno, reversao de importacao e mudanca de status do acordo
- cadastro manual simplificado de casos, contratos em fluxo, honorarios e classificacao NOVO/COLCHAO
- vinculo seguro de credores com carteiras, contratos e cliente_carteiras via `credor_id`
- campos extras de cadastro de credor: `codigo`, `documento`, `email`, `telefone` e `observacao`
- campos manuais de carteira: `codigo`, `descricao`, `documento`, `telefone`, `email` e `observacao`
- metas com `credor_id`, `ativo` e indices para a central de cadastros
- policies atualizadas para permitir cadastro manual por Financeiro e Supervisor dentro do escopo correto

## O que a migration 202606220007 faz

- adiciona os novos campos do cadastro mestre de credores
- cria `credor_id` em `carteiras`, `cliente_carteiras` e `contratos`
- faz backfill do relacionamento usando o nome textual ja existente
- preserva o campo `credor` em texto para compatibilidade com relatorios, imports e policies antigas
- recria a policy `creditors_select` com fallback por `credor_id` e por nome

## O que a migration 202606220008 faz

- adiciona `codigo` e `descricao` em `carteiras`
- adiciona `credor_id` e `ativo` em `metas`
- faz backfill de `metas.credor_id` a partir da carteira quando existir
- cria indices para buscas e filtros da central de cadastros
- libera Financeiro para gravar `credores`, `carteiras` e `metas`
- libera Supervisor para gravar `operadores` apenas dentro da propria equipe
- libera criacao de `contratos` nos fluxos manuais de acordo/baixa sem quebrar o escopo do portal

## O que a migration 202606220009 faz

- reforca as policies de CRUD para `admin` e `gerente` nas tabelas de cadastros
- mantem `profiles` como cadastro administrativo, com `insert` e `update` centralizados em `admin`
- preserva leitura de `gerente` e escopo de `supervisor` sem quebrar a navegacao atual
- reativa explicitamente o RLS nas tabelas principais de administracao

## O que a migration 202606220011 faz

- transforma `carteiras` no cadastro operacional principal, mantendo o campo legado `credor` para compatibilidade
- adiciona em `carteiras` os campos `documento`, `telefone`, `email` e `observacao`
- faz backfill seguro desses campos a partir de `credores` quando existir relacionamento por `credor_id`
- sincroniza `cliente_carteiras.credor` e `contratos.credor` com o nome atual da carteira
- atualiza `metas.credor_id` quando a carteira ja possui esse relacionamento legado
- recria a policy `wallets_write`, reforca RLS da tabela e dispara `pg_notify('pgrst', 'reload schema')`

## SQL exemplo para criar o admin manualmente

Use o SQL abaixo no `SQL Editor` depois de criar seu usuario em `Authentication > Users`:

```sql
insert into public.profiles (
  user_id,
  nome,
  email,
  perfil,
  ativo
)
values (
  'COLE_AQUI_O_USER_ID',
  'Administrador',
  'seu-email@empresa.com',
  'admin',
  true
);
```

## Observacoes importantes

- Nao coloque `SUPABASE_SERVICE_ROLE_KEY` em componentes com `"use client"`.
- O navegador deve usar apenas `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, se necessario, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- O Portal BKO possui fallback de demonstracao local quando o Supabase nao esta configurado.
