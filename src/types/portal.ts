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

export type ClientStatus =
  | "em_cobranca"
  | "com_acordo"
  | "quitado"
  | "inativo";

export type AgreementStatus =
  | "ativo"
  | "aguardando_pagamento"
  | "parcial"
  | "quitado"
  | "atrasado"
  | "cancelado"
  | "quebrado"
  | "andamento"
  | "formalizado";

export type AgreementInstallmentType = "entrada" | "parcela" | "avista";
export type RevenueType = "NOVO" | "COLCHAO";
export type RevenueTypeOrigin = "automatico" | "manual";
export type RankingView = "operadores" | "equipes" | "carteiras";
export type AuditOrigin =
  | "manual"
  | "importacao"
  | "sistema"
  | "reversao"
  | "baixa"
  | "acordo";

export type AgreementInstallmentStatus =
  | "pendente"
  | "pago"
  | "atrasado"
  | "cancelado";

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
  codigo?: string | null;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  observacao?: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Wallet {
  id: string;
  nome: string;
  credor: string;
  codigo?: string | null;
  descricao?: string | null;
  documento?: string | null;
  telefone?: string | null;
  email?: string | null;
  observacao?: string | null;
  credor_id?: string | null;
  percentual_honorarios_padrao?: number | null;
  percentual_escritorio_padrao?: number | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface Client {
  id: string;
  nome: string;
  cpf_cnpj: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  observacao?: string | null;
  status: ClientStatus;
  operador_id: string | null;
  equipe_id: string | null;
  chave_externa: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ClientWalletLink {
  id: string;
  cliente_id: string;
  carteira_id: string;
  credor: string;
  credor_id?: string | null;
  ativo: boolean;
  chave_externa: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Contract {
  id: string;
  cliente_id: string;
  carteira_id: string | null;
  credor: string | null;
  credor_id?: string | null;
  numero_contrato: string;
  valor_original: number;
  valor_em_aberto: number;
  data_contrato: string | null;
  data_vencimento: string | null;
  status: string;
  operador_id: string | null;
  equipe_id: string | null;
  observacao?: string | null;
  origem_manual?: boolean | null;
  importacao_id?: string | null;
  chave_externa: string | null;
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
  credor_id?: string | null;
  valor_meta: number;
  ativo: boolean;
  chave_externa: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface Payment {
  id: string;
  baixa_id: string | null;
  acordo_id: string | null;
  cliente_id: string | null;
  data_pagamento: string;
  operador_id: string | null;
  equipe_id: string | null;
  carteira_id: string | null;
  cpf_cnpj: string | null;
  contrato: string | null;
  valor_pago: number;
  valor_honorario: number;
  percentual_honorarios?: number | null;
  valor_escritorio?: number | null;
  tipo_receita?: RevenueType | string | null;
  tipo_receita_origem?: RevenueTypeOrigin | string | null;
  registrado_por?: string | null;
  origem_arquivo: string | null;
  chave_externa: string | null;
  importacao_id: string | null;
  estornado: boolean;
  estornado_em: string | null;
  estornado_por: string | null;
  motivo_estorno: string | null;
  criado_em: string;
}

export interface Agreement {
  id: string;
  cliente_id: string | null;
  contrato_id: string | null;
  data_acordo: string;
  operador_id: string | null;
  equipe_id: string | null;
  carteira_id: string | null;
  cpf_cnpj: string | null;
  contrato: string | null;
  valor_original: number;
  valor_acordo: number;
  valor_entrada: number;
  quantidade_parcelas: number;
  valor_parcela: number;
  valor_pago: number;
  percentual_honorarios?: number | null;
  valor_honorarios_previsto?: number | null;
  valor_escritorio_previsto?: number | null;
  intervalo_meses?: number | null;
  origem_manual?: boolean | null;
  data_vencimento_entrada: string | null;
  primeiro_vencimento: string | null;
  forma_pagamento: string | null;
  status: AgreementStatus | string;
  observacao: string | null;
  criado_por: string | null;
  chave_externa: string | null;
  importacao_id: string | null;
  ultimo_pagamento_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface AgreementInstallment {
  id: string;
  acordo_id: string;
  numero_parcela: number;
  tipo: AgreementInstallmentType | string;
  data_vencimento: string;
  valor_parcela: number;
  valor_pago: number;
  data_pagamento: string | null;
  status: AgreementInstallmentStatus | string;
  observacao: string | null;
  operador_id?: string | null;
  equipe_id?: string | null;
  percentual_honorarios?: number | null;
  valor_honorarios_previsto?: number | null;
  valor_escritorio_previsto?: number | null;
  tipo_receita?: RevenueType | string | null;
  tipo_receita_origem?: RevenueTypeOrigin | string | null;
  origem_manual?: boolean | null;
  chave_externa: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface AgreementWriteOff {
  id: string;
  acordo_id: string;
  parcela_id: string;
  cliente_id: string | null;
  data_pagamento: string;
  valor_pago: number;
  forma_pagamento: string | null;
  observacao: string | null;
  operador_id?: string | null;
  equipe_id?: string | null;
  percentual_honorarios?: number | null;
  valor_honorarios?: number | null;
  valor_escritorio?: number | null;
  tipo_receita?: RevenueType | string | null;
  tipo_receita_origem?: RevenueTypeOrigin | string | null;
  registrado_por: string | null;
  chave_externa: string | null;
  importacao_id?: string | null;
  estornada: boolean;
  estornada_em: string | null;
  estornada_por: string | null;
  motivo_estorno: string | null;
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
  revertida?: boolean;
  revertida_em?: string | null;
  revertida_por?: string | null;
  motivo_reversao?: string | null;
  total_registros_criados?: number;
  total_registros_revertidos?: number;
  criado_em: string;
}

export interface ImportRecordEntry {
  id: string;
  importacao_id: string;
  tabela: string;
  registro_id: string;
  acao: string;
  revertido: boolean;
  revertido_em: string | null;
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
  query?: string;
  revenueType?: RevenueType;
  agreementStatus?: AgreementStatus;
  rankingView?: RankingView;
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

export interface RankingSummaryCards {
  totalReceived: number;
  totalOfficeFees: number;
  totalWriteOffs: number;
  totalAgreements: number;
  totalGoal: number;
  goalCompletion: number;
}

export interface RankingOperatorRow {
  position: number;
  operatorId: string;
  operator: string;
  team: string;
  mainWallet: string;
  received: number;
  officeFees: number;
  agreements: number;
  writeOffs: number;
  novo: number;
  colchao: number;
  averageTicket: number;
  goal: number;
  goalCompletion: number;
}

export interface RankingTeamRow {
  position: number;
  teamId: string;
  team: string;
  supervisor: string;
  activeOperators: number;
  received: number;
  officeFees: number;
  agreements: number;
  writeOffs: number;
  novo: number;
  colchao: number;
  goal: number;
  goalCompletion: number;
}

export interface RankingWalletRow {
  position: number;
  walletId: string;
  wallet: string;
  creditor: string;
  received: number;
  officeFees: number;
  agreements: number;
  writeOffs: number;
  novo: number;
  colchao: number;
  averageTicket: number;
}

export interface RankingCreditorRow {
  position: number;
  creditorId: string | null;
  creditor: string;
  linkedWallets: number;
  received: number;
  officeFees: number;
  agreements: number;
  writeOffs: number;
  novo: number;
  colchao: number;
  averageTicket: number;
}

export interface RankingFilterOptions extends FilterOptions {
  revenueTypes: FilterOption[];
  agreementStatuses: FilterOption[];
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

export interface RankingPageData {
  profile: PortalProfile;
  filters: DashboardFilters;
  options: RankingFilterOptions;
  summary: RankingSummaryCards;
  operatorRanking: RankingOperatorRow[];
  teamRanking: RankingTeamRow[];
  walletRanking: RankingWalletRow[];
  demoMode: boolean;
}

export interface CreditorListRow extends Creditor {
  linkedWalletCount: number;
  linkedWalletNames: string[];
}

export interface CreditorsPageData {
  profile: PortalProfile;
  creditors: CreditorListRow[];
  canManage: boolean;
  demoMode: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
    linkedWallets: number;
  };
}

export interface WalletRegistryRow extends Wallet {
  creditorName: string;
  linkedClients: number;
  linkedContracts: number;
}

export interface WalletRegistryPageData {
  profile: PortalProfile;
  wallets: WalletRegistryRow[];
  canManage: boolean;
  demoMode: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
    linkedClients: number;
  };
}

export interface OperatorRegistryRow extends Operator {
  teamName: string;
  profileId: string | null;
  userName: string | null;
  userRole: PortalRole | null;
}

export interface OperatorRegistryPageData {
  profile: PortalProfile;
  operators: OperatorRegistryRow[];
  teams: FilterOption[];
  profiles: FilterOption[];
  canManage: boolean;
  demoMode: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
    linkedTeams: number;
  };
}

export interface ProfileAuthUserOption extends FilterOption {
  email: string;
}

export interface ProfileRegistryRow extends PortalProfile {
  operatorName: string | null;
  teamName: string | null;
}

export interface ProfileRegistryPageData {
  profile: PortalProfile;
  profiles: ProfileRegistryRow[];
  operators: FilterOption[];
  teams: FilterOption[];
  authUsers: ProfileAuthUserOption[];
  canManage: boolean;
  demoMode: boolean;
  serviceRoleAvailable: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
}

export interface TeamRegistryRow extends Team {
  supervisorName: string | null;
  operatorsCount: number;
}

export interface TeamRegistryPageData {
  profile: PortalProfile;
  teams: TeamRegistryRow[];
  supervisors: FilterOption[];
  canManage: boolean;
  demoMode: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
    operators: number;
  };
}

export interface GoalRegistryRow extends Goal {
  operatorName: string | null;
  teamName: string | null;
  walletName: string | null;
  creditorName: string | null;
}

export interface GoalRegistryPageData {
  profile: PortalProfile;
  goals: GoalRegistryRow[];
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  canManage: boolean;
  demoMode: boolean;
  summary: {
    total: number;
    active: number;
    inactive: number;
    currentMonth: number;
  };
}

export interface ContractRegistryRow extends Contract {
  clientName: string;
  clientDocument: string;
  walletName: string;
  creditorName: string;
  operatorName: string;
  teamName: string;
}

export interface ContractRegistryPageData {
  profile: PortalProfile;
  contracts: ContractRegistryRow[];
  canCreateCase: boolean;
  canEditContracts: boolean;
  demoMode: boolean;
  summary: {
    total: number;
    active: number;
    withWallet: number;
    updatedToday: number;
  };
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

export interface ClientListFilters {
  query?: string;
  walletId?: string;
  creditor?: string;
  teamId?: string;
  operatorId?: string;
  status?: ClientStatus;
}

export interface ClientFilterOptions {
  wallets: FilterOption[];
  creditors: FilterOption[];
  teams: FilterOption[];
  operators: FilterOption[];
  statuses: FilterOption[];
}

export interface ClientListRow {
  id: string;
  nome: string;
  cpfCnpj: string;
  carteira: string;
  credor: string;
  equipe: string;
  operador: string;
  contratos: number;
  valorEmAberto: number;
  valorEmAcordo: number;
  valorPago: number;
  status: ClientStatus;
  ultimaAtualizacao: string;
}

export interface ClientListPageData {
  profile: PortalProfile;
  filters: ClientListFilters;
  options: ClientFilterOptions;
  clients: ClientListRow[];
  canCreateCase?: boolean;
  demoMode: boolean;
}

export interface ClientSummaryCards {
  valorEmAberto: number;
  valorEmAcordo: number;
  valorPago: number;
  quantidadeContratos: number;
  acordosAtivos: number;
  ultimoPagamento: string | null;
}

export interface ClientContractRow extends Contract {
  carteira: string;
  equipe: string;
  operador: string;
  acordosAtivos: number;
  valorPago: number;
}

export interface ClientAgreementRow extends Agreement {
  carteira: string;
  credor: string;
  equipe: string;
  operador: string;
  contratoNumero: string;
  valorRestante: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  parcelasAtrasadas: number;
  parcelas: AgreementInstallment[];
}

export interface ClientPaymentRow {
  id: string;
  acordoId: string;
  parcelaId: string;
  numeroParcela: number;
  contrato: string;
  dataPagamento: string;
  valorPago: number;
  formaPagamento: string | null;
  observacao: string | null;
  registradoPor: string;
  tipoReceita?: RevenueType | string | null;
  tipoReceitaOrigem?: RevenueTypeOrigin | string | null;
  origem: "baixa" | "pagamento";
}

export interface ClientActionRow extends ContactAction {
  operador: string;
  equipe: string;
  carteira: string;
}

export interface ClientDetailPageData {
  profile: PortalProfile;
  client: Client;
  summary: ClientSummaryCards;
  walletLinks: ClientWalletLink[];
  contracts: ClientContractRow[];
  agreements: ClientAgreementRow[];
  installments: InstallmentCenterRow[];
  payments: ClientPaymentRow[];
  actions: ClientActionRow[];
  auditTrail: AuditEvent[];
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  creditors: FilterOption[];
  canCreateAgreement: boolean;
  canCancelAgreement: boolean;
  canRegisterWriteOff: boolean;
  canEditCase: boolean;
  canEditContracts: boolean;
  canManageCreditors: boolean;
  canManageWallets: boolean;
  canEditInstallmentRevenueType: boolean;
  demoMode: boolean;
}

export interface AuditEvent {
  id: string;
  entidade: string;
  entidadeId: string;
  acao: string;
  descricao: string | null;
  acordoId: string | null;
  parcelaId: string | null;
  baixaId: string | null;
  pagamentoId: string | null;
  clienteId: string | null;
  contratoId: string | null;
  operadorId: string | null;
  equipeId: string | null;
  carteiraId: string | null;
  usuarioId: string | null;
  usuarioNome: string;
  usuarioPerfil?: PortalRole | null;
  dadosAnteriores?: Record<string, unknown>;
  dadosNovos?: Record<string, unknown>;
  payload: Record<string, unknown>;
  origem?: AuditOrigin | string | null;
  importacaoId?: string | null;
  criadoEm: string;
}

export interface AuditFilters {
  query?: string;
  entity?: string;
  action?: string;
  userId?: string;
  importId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditFilterOptions {
  entities: FilterOption[];
  actions: FilterOption[];
  users: FilterOption[];
  imports: FilterOption[];
}

export interface AuditPageData {
  profile: PortalProfile;
  filters: AuditFilters;
  options: AuditFilterOptions;
  events: AuditEvent[];
  demoMode: boolean;
}

export interface AgreementCenterFilters {
  query?: string;
  walletId?: string;
  creditor?: string;
  teamId?: string;
  operatorId?: string;
  status?: AgreementStatus;
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
}

export interface AgreementCenterFilterOptions {
  wallets: FilterOption[];
  creditors: FilterOption[];
  teams: FilterOption[];
  operators: FilterOption[];
  statuses: FilterOption[];
}

export interface AgreementCenterSummary {
  ativos: number;
  totalAcordado: number;
  pago: number;
  saldoEmAberto: number;
  parcelasVencidas: number;
  acordosQuitados: number;
  cancelados: number;
  honorariosPrevistos?: number;
  valorEscritorioPrevisto?: number;
}

export interface AgreementCenterRow {
  id: string;
  clientId: string | null;
  walletId: string | null;
  operatorId: string | null;
  teamId: string | null;
  cliente: string;
  cpfCnpj: string;
  contrato: string;
  carteira: string;
  credor: string;
  operador: string;
  equipe: string;
  dataAcordo: string;
  valorOriginal: number;
  valorAcordo: number;
  valorPago: number;
  saldo: number;
  percentualHonorarios?: number | null;
  valorHonorariosPrevisto?: number | null;
  valorEscritorioPrevisto?: number | null;
  parcelas: number;
  parcelasPagas: number;
  parcelasPendentes: number;
  parcelasAtrasadas: number;
  status: AgreementStatus | string;
  formaPagamento: string | null;
  observacao: string | null;
  ultimoPagamentoEm: string | null;
  ultimaAtualizacao: string;
  parcelasDetalhe: AgreementInstallment[];
}

export interface AgreementCenterPageData {
  profile: PortalProfile;
  filters: AgreementCenterFilters;
  options: AgreementCenterFilterOptions;
  summary: AgreementCenterSummary;
  agreements: AgreementCenterRow[];
  canCancelAgreement: boolean;
  canRegisterWriteOff: boolean;
  canReverseWriteOff: boolean;
  demoMode: boolean;
}

export interface InstallmentCenterFilters {
  query?: string;
  walletId?: string;
  creditor?: string;
  teamId?: string;
  operatorId?: string;
  status?: AgreementInstallmentStatus;
  revenueType?: RevenueType;
  startDate?: string;
  endDate?: string;
}

export interface InstallmentCenterFilterOptions {
  wallets: FilterOption[];
  creditors: FilterOption[];
  teams: FilterOption[];
  operators: FilterOption[];
  statuses: FilterOption[];
  revenueTypes?: FilterOption[];
}

export interface InstallmentCenterSummary {
  pendentes: number;
  vencidas: number;
  pagas: number;
  valorVencido: number;
  valorAVencer: number;
  recebido: number;
  novo?: number;
  colchao?: number;
}

export interface InstallmentCenterRow {
  id: string;
  agreementId: string;
  clientId: string | null;
  walletId: string | null;
  operatorId: string | null;
  teamId: string | null;
  cliente: string;
  cpfCnpj: string;
  contrato: string;
  carteira: string;
  credor: string;
  operador: string;
  equipe: string;
  numeroParcela: number;
  tipo: AgreementInstallmentType | string;
  vencimento: string;
  valorParcela: number;
  valorPago: number;
  saldo: number;
  status: AgreementInstallmentStatus | string;
  diasEmAtraso: number;
  dataPagamento: string | null;
  acordoStatus: AgreementStatus | string;
  observacao: string | null;
  percentualHonorarios?: number | null;
  valorHonorariosPrevisto?: number | null;
  valorEscritorioPrevisto?: number | null;
  tipoReceita?: RevenueType | string | null;
  tipoReceitaOrigem?: RevenueTypeOrigin | string | null;
}

export interface InstallmentCenterPageData {
  profile: PortalProfile;
  filters: InstallmentCenterFilters;
  options: InstallmentCenterFilterOptions;
  summary: InstallmentCenterSummary;
  installments: InstallmentCenterRow[];
  agreements: AgreementCenterRow[];
  canRegisterWriteOff: boolean;
  canEditInstallmentRevenueType?: boolean;
  demoMode: boolean;
}

export interface WriteOffCenterFilters {
  query?: string;
  walletId?: string;
  creditor?: string;
  teamId?: string;
  operatorId?: string;
  paymentMethod?: string;
  registeredBy?: string;
  revenueType?: RevenueType;
  reversedStatus?: "ativas" | "estornadas" | "todas";
  startDate?: string;
  endDate?: string;
}

export interface WriteOffCenterFilterOptions {
  wallets: FilterOption[];
  creditors: FilterOption[];
  teams: FilterOption[];
  operators: FilterOption[];
  paymentMethods: FilterOption[];
  registeredBy: FilterOption[];
  revenueTypes?: FilterOption[];
  reversedStatuses?: FilterOption[];
}

export interface WriteOffCenterSummary {
  recebidoNoPeriodo: number;
  quantidadeBaixas: number;
  ticketMedio: number;
  baixasEstornadas: number;
  maiorCarteira: string;
  maiorOperador: string;
  honorariosEscritorio?: number;
  valorRepassado?: number;
}

export interface WriteOffCenterRow {
  id: string;
  agreementId: string;
  parcelId: string;
  clientId: string | null;
  walletId: string | null;
  operatorId: string | null;
  teamId: string | null;
  cliente: string;
  cpfCnpj: string;
  acordo: string;
  contrato: string;
  numeroParcela: number;
  carteira: string;
  credor: string;
  operador: string;
  equipe: string;
  dataPagamento: string;
  valorPago: number;
  formaPagamento: string | null;
  registradoPor: string;
  registradoPorId: string | null;
  dataRegistro: string;
  observacao: string | null;
  percentualHonorarios?: number | null;
  valorHonorarios?: number | null;
  valorEscritorio?: number | null;
  tipoReceita?: RevenueType | string | null;
  tipoReceitaOrigem?: RevenueTypeOrigin | string | null;
  estornada: boolean;
  estornadaEm: string | null;
  estornadaPor: string | null;
  motivoEstorno: string | null;
}

export interface WriteOffCenterPageData {
  profile: PortalProfile;
  filters: WriteOffCenterFilters;
  options: WriteOffCenterFilterOptions;
  summary: WriteOffCenterSummary;
  writeOffs: WriteOffCenterRow[];
  canReverseWriteOff: boolean;
  demoMode: boolean;
}

export interface AgreementDetailData {
  id: string;
  clientId: string | null;
  cliente: string;
  cpfCnpj: string;
  contrato: string;
  carteira: string;
  credor: string;
  operador: string;
  equipe: string;
  dataAcordo: string;
  valorOriginal: number;
  valorAcordo: number;
  valorPago: number;
  saldo: number;
  percentualHonorarios?: number | null;
  valorHonorariosPrevisto?: number | null;
  valorEscritorioPrevisto?: number | null;
  status: AgreementStatus | string;
  formaPagamento: string | null;
  observacao: string | null;
  ultimoPagamentoEm: string | null;
  parcelasPagas: number;
  parcelasPendentes: number;
  parcelasAtrasadas: number;
  parcelas: AgreementInstallment[];
  writeOffs: WriteOffCenterRow[];
  auditTrail: AuditEvent[];
  canCancel: boolean;
  canRegisterWriteOff: boolean;
  canReverseWriteOff: boolean;
  demoMode: boolean;
}

export interface AgreementInstallmentDraft {
  numeroParcela: number;
  tipo: AgreementInstallmentType;
  dataVencimento: string;
  valorParcela: number;
  observacao?: string | null;
  operadorId?: string | null;
  tipoReceita?: RevenueType | string | null;
  tipoReceitaOrigem?: RevenueTypeOrigin | string | null;
}

export interface CreateAgreementInput {
  clienteId: string;
  contratoId?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
  carteiraId?: string | null;
  dataAcordo: string;
  valorOriginal: number;
  valorAcordo: number;
  valorEntrada: number;
  dataVencimentoEntrada?: string | null;
  quantidadeParcelas: number;
  valorParcela?: number | null;
  primeiroVencimento?: string | null;
  intervaloMeses?: number | null;
  percentualHonorarios?: number | null;
  formaPagamento?: string | null;
  observacao?: string | null;
  status?: AgreementStatus | null;
  parcelasCustomizadas?: AgreementInstallmentDraft[];
  criarContratoAgora?: boolean;
  novoContrato?: FlowContractInput | null;
}

export interface RegisterAgreementWriteOffInput {
  acordoId: string;
  parcelaId: string;
  dataPagamento: string;
  valorPago: number;
  operadorId?: string | null;
  percentualHonorarios?: number | null;
  confirmarAcimaSaldo?: boolean;
  formaPagamento?: string | null;
  observacao?: string | null;
  criarContratoAgora?: boolean;
  novoContrato?: FlowContractInput | null;
}

export interface CancelAgreementInput {
  acordoId: string;
  observacao?: string | null;
}

export interface ReverseAgreementWriteOffInput {
  baixaId: string;
  motivoEstorno?: string | null;
}

export interface AgreementOperationResult {
  agreementId?: string;
  writeOffId?: string;
  status: AgreementStatus | string;
  message: string;
  demoMode: boolean;
}

export interface ManualCaseInput {
  nome: string;
  cpfCnpj: string;
  credor?: string | null;
  credorId?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  observacao?: string | null;
  status?: ClientStatus | null;
  carteiraId: string;
  numeroContrato?: string | null;
  valorOriginal?: number | null;
  valorEmAberto?: number | null;
  dataContrato?: string | null;
  dataVencimento?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
}

export interface ManualCaseResult {
  clientId: string;
  contractId?: string | null;
  clientExists?: boolean;
  message: string;
  demoMode: boolean;
}

export interface UpdateClientInput {
  clientId: string;
  nome?: string;
  cpfCnpj?: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  observacao?: string | null;
  status?: ClientStatus;
  carteiraId?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
}

export interface UpsertContractInput {
  contractId?: string | null;
  clientId: string;
  carteiraId?: string | null;
  credor?: string | null;
  credorId?: string | null;
  numeroContrato: string;
  valorOriginal?: number | null;
  valorEmAberto?: number | null;
  dataContrato?: string | null;
  dataVencimento?: string | null;
  status?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
  observacao?: string | null;
}

export interface FlowContractInput {
  numeroContrato: string;
  carteiraId: string;
  credor?: string | null;
  credorId?: string | null;
  valorOriginal?: number | null;
  valorEmAberto?: number | null;
  dataContrato?: string | null;
  dataVencimento?: string | null;
  operadorId?: string | null;
  equipeId?: string | null;
  status?: string | null;
  observacao?: string | null;
}

export interface UpdateInstallmentRevenueTypeInput {
  parcelaId: string;
  tipoReceita: RevenueType;
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
