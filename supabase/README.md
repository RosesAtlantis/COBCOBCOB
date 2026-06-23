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
8. Se quiser dados de exemplo para desenvolvimento, rode [seed/seed.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/seed/seed.sql).
9. Va em `Authentication > URL Configuration`.
10. Preencha `Site URL` com a URL publicada na Vercel.
11. Adicione estas `Redirect URLs`:

```text
https://URL-DA-VERCEL.vercel.app/*
http://localhost:3000/*
```

12. Va em `Authentication > Users`.
13. Crie o seu usuario manualmente.
14. Copie o `User ID` criado.
15. Va em `Table Editor > profiles`.
16. Crie uma linha manual com:

```text
user_id = ID do usuario criado
nome = seu nome
email = seu e-mail
perfil = admin
ativo = true
```

17. Depois configure as variaveis do projeto na Vercel e faca `Redeploy`.

## SQLs que precisam ser rodados

Obrigatorios:

1. [migrations/202606220001_portal_bko_init.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220001_portal_bko_init.sql)
2. [migrations/202606220002_cobware_import_support.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220002_cobware_import_support.sql)
3. [migrations/202606220003_clientes_acordos_baixas.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220003_clientes_acordos_baixas.sql)
4. [migrations/202606220004_acordos_baixas_auditoria.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220004_acordos_baixas_auditoria.sql)
5. [migrations/202606220005_manual_cases_audit_import_reversal_honorarios.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220005_manual_cases_audit_import_reversal_honorarios.sql)

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
- cadastro manual de casos, contratos, acordos, honorarios e classificacao NOVO/COLCHAO

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
