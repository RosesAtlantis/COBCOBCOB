export type PortalRole =
  | "admin"
  | "gerente"
  | "supervisor"
  | "operador"
  | "financeiro";

export type ImportType =
  | "cobware"
  | "pagamentos"
  | "acordos"
  | "operadores"
  | "metas"
  | "carteiras"
  | "acionamentos";

export type AdminSectionKey =
  | "usuarios"
  | "operadores"
  | "equipes"
  | "carteiras"
  | "credores"
  | "metas"
  | "importacoes"
  | "configuracoes";

export interface PortalProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  perfil: PortalRole;
  operador_id: string | null;
  equipe_id: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Operator {
  id: string;
  nome: string;
  email: string | null;
  equipe_id: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Team {
  id: string;
  nome: string;
  supervisor_id: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Creditor {
  id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Wallet {
  id: string;
  nome: string;
  credor: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Goal {
  id: string;
  mes: number;
  ano: number;
  operador_id: string | null;
  equipe_id: string | null;
  carteira_id: string | null;
  valor_meta: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Payment {
  id: string;
  data_pagamento: string;
  operador_id: string | null;
  equipe_id: string | null;
  carteira_id: string | null;
  cpf_cnpj: string | null;
  contrato: string | null;
  valor_pago: number;
  valor_honorario: number;
  origem_arquivo: string | null;
  importacao_id: string | null;
  criado_em: string;
}

export interface Agreement {
  id: string;
  data_acordo: string;
  operador_id: string | null;
  equipe_id: string | null;
  carteira_id: string | null;
  cpf_cnpj: string | null;
  contrato: string | null;
  valor_acordo: number;
  valor_entrada: number;
  quantidade_parcelas: number;
  status: string;
  importacao_id: string | null;
  criado_em: string;
}

export interface ContactAction {
  id: string;
  data_acionamento: string;
  operador_id: string | null;
  equipe_id: string | null;
  carteira_id: string | null;
  cpf_cnpj: string | null;
  contrato: string | null;
  evento: string;
  descricao: string | null;
  canal: string | null;
  importacao_id: string | null;
  criado_em: string;
}

export interface ImportRecord {
  id: string;
  tipo: ImportType;
  nome_arquivo: string;
  usuario_id: string | null;
  total_linhas: number;
  linhas_importadas: number;
  linhas_erro: number;
  status: string;
  mensagem_erro: string | null;
  criado_em: string;
}

export interface PortalDataset {
  profiles: PortalProfile[];
  operators: Operator[];
  teams: Team[];
  creditors: Creditor[];
  wallets: Wallet[];
  goals: Goal[];
  payments: Payment[];
  agreements: Agreement[];
  actions: ContactAction[];
  imports: ImportRecord[];
}

export interface FilterOption {
  value: string;
  label: string;
  description?: string;
}

export interface FilterOptions {
  teams: FilterOption[];
  operators: FilterOption[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  years: number[];
}

export interface DashboardFilters {
  month: number;
  year: number;
  startDate?: string;
  endDate?: string;
  teamId?: string;
  operatorId?: string;
  walletId?: string;
  creditor?: string;
}

export interface MetricHighlight {
  label: string;
  value: number;
  subtitle?: string;
}

export interface RevenuePoint {
  label: string;
  arrecadacao: number;
  acordos: number;
  meta?: number;
}

export interface DashboardSummary {
  totalCollected: number;
  totalGoal: number;
  goalCompletion: number;
  agreementCount: number;
  averageTicket: number;
  monthlyDelta: number;
  bestOperator?: MetricHighlight;
  bestTeam?: MetricHighlight;
  bestWallet?: MetricHighlight;
}

export interface OperatorRankingRow {
  position: number;
  operatorId: string;
  operator: string;
  team: string;
  wallet: string;
  creditor: string;
  collected: number;
  agreements: number;
  goal: number;
  goalCompletion: number;
  averageTicket: number;
}

export interface TeamPerformanceRow {
  teamId: string;
  team: string;
  supervisor: string;
  operators: number;
  collected: number;
  goal: number;
  goalCompletion: number;
  bestOperator: string;
  evolution: number;
}

export interface WalletPerformanceRow {
  walletId: string;
  wallet: string;
  creditor: string;
  collected: number;
  agreements: number;
  averageTicket: number;
  recoveryRate: number;
  topOperator: string;
  operatorRanking: OperatorRankingRow[];
}

export interface OperatorOverview {
  collected: number;
  goal: number;
  goalCompletion: number;
  rankingOverall: number;
  rankingTeam: number;
  agreements: number;
  averageTicket: number;
  dailyEvolution: RevenuePoint[];
  teamAverage: number;
  teamAverageGap: number;
}

export interface DashboardPageData {
  profile: PortalProfile;
  filters: DashboardFilters;
  options: FilterOptions;
  summary: DashboardSummary;
  dailyEvolution: RevenuePoint[];
  monthlyEvolution: RevenuePoint[];
  operatorRanking: OperatorRankingRow[];
  teamPerformance: TeamPerformanceRow[];
  walletPerformance: WalletPerformanceRow[];
  demoMode: boolean;
}

export interface TeamPageData {
  profile: PortalProfile;
  filters: DashboardFilters;
  options: FilterOptions;
  teams: TeamPerformanceRow[];
  evolution: RevenuePoint[];
  demoMode: boolean;
}

export interface WalletPageData {
  profile: PortalProfile;
  filters: DashboardFilters;
  options: FilterOptions;
  wallets: WalletPerformanceRow[];
  evolution: RevenuePoint[];
  demoMode: boolean;
}

export interface OperatorPageData {
  profile: PortalProfile;
  filters: DashboardFilters;
  options: FilterOptions;
  overview: OperatorOverview;
  teamRanking: OperatorRankingRow[];
  overallRanking: OperatorRankingRow[];
  demoMode: boolean;
}

export interface ImportLineError {
  line: number;
  message: string;
  row: Record<string, unknown>;
}

export interface ImportProcessResult {
  type: ImportType;
  fileName: string;
  totalRows: number;
  importedRows: number;
  errorRows: number;
  status: "success" | "partial" | "error";
  errors: ImportLineError[];
  errorReport?: string;
  warning?: string;
  importId?: string;
}

export interface AdminSectionData {
  key: AdminSectionKey;
  title: string;
  description: string;
  columns: Array<{
    key: string;
    header: string;
    align?: "left" | "right" | "center";
  }>;
  rows: Array<Record<string, string | number | boolean | null>>;
}
