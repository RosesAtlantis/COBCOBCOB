export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          email: string;
          perfil: string;
          operador_id: string | null;
          equipe_id: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          email: string;
          perfil: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      operadores: {
        Row: {
          id: string;
          nome: string;
          email: string | null;
          equipe_id: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email?: string | null;
          equipe_id?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operadores"]["Insert"]>;
        Relationships: [];
      };
      equipes: {
        Row: {
          id: string;
          nome: string;
          supervisor_id: string | null;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          supervisor_id?: string | null;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["equipes"]["Insert"]>;
        Relationships: [];
      };
      credores: {
        Row: {
          id: string;
          nome: string;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credores"]["Insert"]>;
        Relationships: [];
      };
      carteiras: {
        Row: {
          id: string;
          nome: string;
          credor: string;
          ativo: boolean;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          credor: string;
          ativo?: boolean;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["carteiras"]["Insert"]>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          nome: string;
          cpf_cnpj: string;
          email: string | null;
          telefone: string | null;
          endereco: string | null;
          cidade: string | null;
          uf: string | null;
          cep: string | null;
          status: string;
          operador_id: string | null;
          equipe_id: string | null;
          chave_externa: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cpf_cnpj: string;
          email?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          cidade?: string | null;
          uf?: string | null;
          cep?: string | null;
          status?: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          chave_externa?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [];
      };
      cliente_carteiras: {
        Row: {
          id: string;
          cliente_id: string;
          carteira_id: string;
          credor: string;
          ativo: boolean;
          chave_externa: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          carteira_id: string;
          credor: string;
          ativo?: boolean;
          chave_externa?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cliente_carteiras"]["Insert"]>;
        Relationships: [];
      };
      contratos: {
        Row: {
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
        };
        Insert: {
          id?: string;
          cliente_id: string;
          carteira_id?: string | null;
          credor?: string | null;
          numero_contrato: string;
          valor_original?: number;
          valor_em_aberto?: number;
          data_contrato?: string | null;
          data_vencimento?: string | null;
          status?: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          chave_externa?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contratos"]["Insert"]>;
        Relationships: [];
      };
      metas: {
        Row: {
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
        };
        Insert: {
          id?: string;
          mes: number;
          ano: number;
          operador_id?: string | null;
          equipe_id?: string | null;
          carteira_id?: string | null;
          valor_meta: number;
          chave_externa?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["metas"]["Insert"]>;
        Relationships: [];
      };
      pagamentos: {
        Row: {
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
          chave_externa: string | null;
          origem_arquivo: string | null;
          importacao_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          baixa_id?: string | null;
          acordo_id?: string | null;
          cliente_id?: string | null;
          data_pagamento: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          carteira_id?: string | null;
          cpf_cnpj?: string | null;
          contrato?: string | null;
          valor_pago: number;
          valor_honorario?: number;
          chave_externa?: string | null;
          origem_arquivo?: string | null;
          importacao_id?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pagamentos"]["Insert"]>;
        Relationships: [];
      };
      acordos: {
        Row: {
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
          status: string;
          observacao: string | null;
          criado_por: string | null;
          chave_externa: string | null;
          importacao_id: string | null;
          ultimo_pagamento_em: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          contrato_id?: string | null;
          data_acordo: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          carteira_id?: string | null;
          cpf_cnpj?: string | null;
          contrato?: string | null;
          valor_original?: number;
          valor_acordo: number;
          valor_entrada?: number;
          quantidade_parcelas?: number;
          valor_parcela?: number;
          valor_pago?: number;
          data_vencimento_entrada?: string | null;
          primeiro_vencimento?: string | null;
          forma_pagamento?: string | null;
          status?: string;
          observacao?: string | null;
          criado_por?: string | null;
          chave_externa?: string | null;
          importacao_id?: string | null;
          ultimo_pagamento_em?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["acordos"]["Insert"]>;
        Relationships: [];
      };
      acordo_parcelas: {
        Row: {
          id: string;
          acordo_id: string;
          numero_parcela: number;
          tipo: string;
          data_vencimento: string;
          valor_parcela: number;
          valor_pago: number;
          data_pagamento: string | null;
          status: string;
          observacao: string | null;
          chave_externa: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          acordo_id: string;
          numero_parcela: number;
          tipo?: string;
          data_vencimento: string;
          valor_parcela?: number;
          valor_pago?: number;
          data_pagamento?: string | null;
          status?: string;
          observacao?: string | null;
          chave_externa?: string | null;
          criado_em?: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["acordo_parcelas"]["Insert"]>;
        Relationships: [];
      };
      acordo_baixas: {
        Row: {
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
          criado_em: string;
        };
        Insert: {
          id?: string;
          acordo_id: string;
          parcela_id: string;
          cliente_id?: string | null;
          data_pagamento: string;
          valor_pago?: number;
          forma_pagamento?: string | null;
          observacao?: string | null;
          registrado_por?: string | null;
          chave_externa?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["acordo_baixas"]["Insert"]>;
        Relationships: [];
      };
      acionamentos: {
        Row: {
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
          chave_externa: string | null;
          importacao_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          data_acionamento: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          carteira_id?: string | null;
          cpf_cnpj?: string | null;
          contrato?: string | null;
          evento: string;
          descricao?: string | null;
          canal?: string | null;
          chave_externa?: string | null;
          importacao_id?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["acionamentos"]["Insert"]>;
        Relationships: [];
      };
      importacoes: {
        Row: {
          id: string;
          tipo: string;
          nome_arquivo: string;
          usuario_id: string | null;
          total_linhas: number;
          linhas_importadas: number;
          linhas_erro: number;
          status: string;
          mensagem_erro: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          nome_arquivo: string;
          usuario_id?: string | null;
          total_linhas?: number;
          linhas_importadas?: number;
          linhas_erro?: number;
          status?: string;
          mensagem_erro?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["importacoes"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      refresh_acordo_status: {
        Args: { target_acordo_id: string };
        Returns: string;
      };
      refresh_cliente_status: {
        Args: { target_cliente_id: string };
        Returns: string;
      };
      portal_criar_acordo: {
        Args: {
          p_cliente_id: string;
          p_contrato_id?: string | null;
          p_operador_id?: string | null;
          p_equipe_id?: string | null;
          p_carteira_id?: string | null;
          p_data_acordo?: string;
          p_valor_original?: number;
          p_valor_acordo?: number;
          p_valor_entrada?: number;
          p_data_vencimento_entrada?: string | null;
          p_quantidade_parcelas?: number;
          p_valor_parcela?: number | null;
          p_primeiro_vencimento?: string | null;
          p_forma_pagamento?: string | null;
          p_observacao?: string | null;
          p_status?: string | null;
        };
        Returns: string;
      };
      portal_registrar_baixa: {
        Args: {
          p_acordo_id: string;
          p_parcela_id: string;
          p_data_pagamento: string;
          p_valor_pago: number;
          p_forma_pagamento?: string | null;
          p_observacao?: string | null;
        };
        Returns: string;
      };
      portal_cancelar_acordo: {
        Args: {
          p_acordo_id: string;
          p_observacao?: string | null;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
