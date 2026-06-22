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
  numero_contrato: string;
  valor_original: number;
  valor_em_aberto: number;
  data_contrato: string | null;
  data_vencimento: string | null;
  status: string;
  operador_id: string | null;
  equipe_id: string | null;
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
  valor_meta: number;
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
  registrado_por: string | null;
  chave_externa: string | null;
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
  payments: ClientPaymentRow[];
  actions: ClientActionRow[];
  operators: FilterOption[];
  teams: FilterOption[];
  wallets: FilterOption[];
  canCreateAgreement: boolean;
  canCancelAgreement: boolean;
  canRegisterWriteOff: boolean;
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
  payload: Record<string, unknown>;
  criadoEm: string;
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
  startDate?: string;
  endDate?: string;
}

export interface InstallmentCenterFilterOptions {
  wallets: FilterOption[];
  creditors: FilterOption[];
  teams: FilterOption[];
  operators: FilterOption[];
  statuses: FilterOption[];
}

export interface InstallmentCenterSummary {
  pendentes: number;
  vencidas: number;
  pagas: number;
  valorVencido: number;
  valorAVencer: number;
  recebido: number;
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
}

export interface InstallmentCenterPageData {
  profile: PortalProfile;
  filters: InstallmentCenterFilters;
  options: InstallmentCenterFilterOptions;
  summary: InstallmentCenterSummary;
  installments: InstallmentCenterRow[];
  agreements: AgreementCenterRow[];
  canRegisterWriteOff: boolean;
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
}

export interface WriteOffCenterSummary {
  recebidoNoPeriodo: number;
  quantidadeBaixas: number;
  ticketMedio: number;
  baixasEstornadas: number;
  maiorCarteira: string;
  maiorOperador: string;
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
  formaPagamento?: string | null;
  observacao?: string | null;
  status?: AgreementStatus | null;
}

export interface RegisterAgreementWriteOffInput {
  acordoId: string;
  parcelaId: string;
  dataPagamento: string;
  valorPago: number;
  formaPagamento?: string | null;
  observacao?: string | null;
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
