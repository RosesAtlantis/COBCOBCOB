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
          chave_externa: string | null;
          importacao_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          data_acordo: string;
          operador_id?: string | null;
          equipe_id?: string | null;
          carteira_id?: string | null;
          cpf_cnpj?: string | null;
          contrato?: string | null;
          valor_acordo: number;
          valor_entrada?: number;
          quantidade_parcelas?: number;
          status?: string;
          chave_externa?: string | null;
          importacao_id?: string | null;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["acordos"]["Insert"]>;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
