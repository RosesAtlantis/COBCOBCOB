# Portal BKO

Portal interno de performance para operacoes de cobranca, com dashboards financeiros, ranking operacional, importacao de arquivos e seguranca por perfil.

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

## O que ja vem pronto

- Login com Supabase Auth
- Modo demo automatico quando o Supabase nao esta configurado
- Dashboard geral com KPIs e graficos
- Ranking de operadores
- Visao por equipe
- Visao por carteira
- Painel do operador
- Importacao de pagamentos, acordos, operadores, metas, carteiras e acionamentos
- Importacao dedicada da base antiga CobWare com consolidacao de acordos e parcelas pagas
- Area administrativa com secoes para usuarios, operadores, equipes, carteiras, credores, metas, importacoes e configuracoes
- Migrations SQL com RLS
- Seed com perfis, equipes, operadores, carteiras, metas, pagamentos e acordos

## Rodando localmente

### 1. Instale dependencias

```bash
npm install
```

### 2. Ambiente

Copie `.env.example` para `.env.local`.

Se voce ainda nao configurar o Supabase, o projeto sobe em modo demonstracao usando dados ficticios locais.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=Portal BKO
```

### 3. Desenvolvimento

```bash
npm run dev
```

### 4. Verificacoes

```bash
npm run check
```

## Integrando com Supabase

### Estrutura SQL

- Migration principal: [supabase/migrations/202606220001_portal_bko_init.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/migrations/202606220001_portal_bko_init.sql)
- Seed: [supabase/seed/seed.sql](/C:/Users/Funcionario.LUCAS/OneDrive%20-%20LIMA,%20CABRAL%20ADVOGADOS%20ASSOCIADOS/02%20-%20PROGRAMAS/PROJETOS/COBCOBCOB/supabase/seed/seed.sql)

### Via Supabase CLI

```bash
npm run db:push
npm run db:reset
```

### Importacao da base antiga CobWare

Na tela de importacoes, escolha `Base antiga CobWare` para arquivos no layout legado com colunas como:

- `Credor`
- `Nome Cliente`
- `CPF/CNPJ`
- `Contratos / Fatura`
- `PARCELA`
- `QTD PARC`
- `VLR PARCELA`
- `Valor Pago`
- `HO Pago`
- `VLR ACORDO`
- `Data de Vencimento`
- `Data Pagamento`
- `PAGO`
- `Status Acordo`
- `Tipo de HO`

O importador:

- consolida um acordo por chave de negociacao
- gera pagamentos apenas para parcelas efetivamente pagas
- preserva o credor
- cria carteiras tecnicas no formato `CobWare • <Tipo de HO>`
- evita reimport duplicado por `chave_externa`

### Via SQL Editor

1. Execute a migration.
2. Execute o seed.
3. Preencha `.env.local` com as chaves do projeto.

## Usuarios seed

Senha padrao para os usuarios seed:

```text
PortalBKO123!
```

Contas principais:

- `admin@portalbko.local`
- `gerente@portalbko.local`
- `financeiro@portalbko.local`
- `supervisor.atlas@portalbko.local`
- `supervisor.bora@portalbko.local`
- `bianca.lima@portalbko.local`

## Estrutura do projeto

```text
src/
  app/
  components/
  hooks/
  lib/
  services/
  types/
supabase/
  migrations/
  seed/
```

## Observacoes

- O `SUPABASE_SERVICE_ROLE_KEY` e usado apenas na API de importacao, no servidor.
- O portal funciona em demo sem banco para acelerar validacao visual.
- Quando o Supabase estiver configurado, Auth + RLS assumem o controle do acesso.
