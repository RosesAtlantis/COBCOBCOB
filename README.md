# Portal BKO / COBCOBCOB

Portal interno de performance para operacoes de cobranca, com autenticacao via Supabase, dashboards por perfil, importacoes de arquivos e deploy na Vercel.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- PostgreSQL / Supabase
- Row Level Security
- Recharts
- CSV / XLSX import

## Estrutura principal

- App Router e telas: [src/app](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/app)
- Supabase browser client: [src/lib/supabase/client.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/lib/supabase/client.ts)
- Supabase server client: [src/lib/supabase/server.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/lib/supabase/server.ts)
- Supabase admin client: [src/lib/supabase/admin.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/lib/supabase/admin.ts)
- Proxy de protecao: [src/proxy.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/proxy.ts)
- Auth helpers: [src/lib/auth.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/lib/auth.ts) e [src/lib/auth-client.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/lib/auth-client.ts)
- Servicos de dashboard: [src/services/portal-service.ts](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/src/services/portal-service.ts)
- Migrations: [supabase/migrations](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations)
- Guia Supabase: [supabase/README.md](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/README.md)

## Variaveis de ambiente

Crie `.env.local` a partir de `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-opcional
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-apenas-servidor
NEXT_PUBLIC_APP_NAME=Portal BKO
```

Regras:

- `NEXT_PUBLIC_SUPABASE_URL` e obrigatoria.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` e a chave publica principal.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` funciona como fallback se algum ambiente estiver usando esse nome.
- `SUPABASE_SERVICE_ROLE_KEY` e opcional e deve ficar apenas no servidor.
- Nenhuma chave deve ser fixa no codigo.
- `.env.local` nao deve ser versionado.

## Setup local

### 1. Instale dependencias

```bash
npm install
```

### 2. Crie `.env.local`

Copie `.env.example` para `.env.local` e preencha com as variaveis reais do Supabase.

### 3. Rode em desenvolvimento

```bash
npm run dev
```

### 4. Valide antes do deploy

```bash
npm run typecheck
npm run lint
npm run build
```

## Fluxo de autenticacao e rotas

Regras implementadas:

- `/login` e publica.
- `/dashboard`, `/ranking`, `/equipes`, `/carteiras`, `/operador`, `/importacoes` e `/admin` exigem sessao.
- Usuario autenticado acessando `/login` e redirecionado para a home do papel.
- Usuario autenticado sem `profile` ou com `ativo = false` vai para `/acesso-negado`.
- `/admin` exige `admin` ou `gerente`.
- `/operador` exige `operador`.

Perfis aceitos:

- `admin`
- `gerente`
- `supervisor`
- `operador`
- `financeiro`

Depois do login via Supabase Auth, o projeto consulta a tabela `profiles` e so libera acesso quando o cadastro esta valido e ativo.

## Dashboard e dados reais

O dashboard e o ranking usam dados reais do Supabase quando as variaveis publicas estao configuradas.

Tabelas usadas:

- `pagamentos`
- `acordos`
- `metas`
- `operadores`
- `equipes`
- `carteiras`
- `profiles`

Cards principais:

- Arrecadacao total do mes
- Meta mensal
- Percentual da meta
- Quantidade de acordos
- Ticket medio
- Melhor operador
- Melhor equipe
- Melhor carteira

Se o Supabase nao estiver configurado, o portal entra em modo demonstracao local de forma claramente identificada.

## Importacoes

A tela de importacoes aceita CSV e XLSX.

Tipos suportados:

- `pagamentos`
- `acordos`
- `operadores`
- `metas`
- `carteiras`
- `acionamentos`
- `cobware`

O fluxo:

- valida colunas obrigatorias
- grava dados nas tabelas corretas
- registra historico em `importacoes`
- informa linhas importadas e linhas com erro
- gera relatorio de erro quando houver falha

Para operacoes server-side que precisem ignorar RLS, a aplicacao usa apenas `SUPABASE_SERVICE_ROLE_KEY` no servidor.

## Base antiga CobWare

Existe um importador dedicado para a base antiga CobWare.

Ele:

- consolida um acordo por chave de negociacao
- gera pagamentos apenas para parcelas efetivamente pagas
- preserva o credor
- cria carteiras tecnicas no formato `CobWare • <Tipo de HO>`
- evita duplicacao com `chave_externa`

## SQLs / migrations

Arquivos prontos:

- [supabase/migrations/202606220001_portal_bko_init.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220001_portal_bko_init.sql)
- [supabase/migrations/202606220002_cobware_import_support.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220002_cobware_import_support.sql)
- [supabase/seed/seed.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/seed/seed.sql)

Guia detalhado:

- [supabase/README.md](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/README.md)

## Como configurar o Supabase

### 1. Rodar os SQLs

No `Supabase > SQL Editor`, rode nesta ordem:

1. `202606220001_portal_bko_init.sql`
2. `202606220002_cobware_import_support.sql`
3. `seed.sql` apenas se quiser dados de exemplo

### 2. Criar o usuario admin

1. Va em `Supabase > Authentication > Users`.
2. Crie seu usuario manualmente.
3. Copie o `User ID`.
4. Va em `Supabase > Table Editor > profiles`.
5. Crie uma linha com:

```text
user_id = ID do usuario criado
nome = seu nome
email = seu e-mail
perfil = admin
ativo = true
```

SQL exemplo:

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

### 3. Configurar Auth no Supabase

Va em:

```text
Supabase
Authentication
URL Configuration
```

Configure:

```text
Site URL = URL da Vercel
Redirect URLs:
https://URL-DA-VERCEL.vercel.app/*
http://localhost:3000/*
```

## Como configurar a Vercel

Va em:

```text
Vercel
Settings
Environment Variables
```

Cadastre:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wdsicyculbswqqbczmwc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RsDdoC7xjpA2SGozBvXnMg_Wzxoc7Yr
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_RsDdoC7xjpA2SGozBvXnMg_Wzxoc7Yr
SUPABASE_SERVICE_ROLE_KEY=COLOCAR_MANUALMENTE_SE_NECESSARIO
```

Depois de salvar:

```text
Deployments > Redeploy
```

## Scripts disponiveis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run check
```

## Observacoes finais

- O projeto usa `src/proxy.ts` porque no Next.js 16 essa e a forma atual de proteger rotas no lugar do antigo `middleware.ts`.
- O client do navegador nunca usa `SUPABASE_SERVICE_ROLE_KEY`.
- O admin client fica isolado em codigo server-side.
- O acesso tambem e filtrado pelo banco com RLS, nao apenas pela interface.
