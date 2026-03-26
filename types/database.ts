/**
 * Types do Database Supabase — Pousada Xangrilá
 * 
 * ⚠️ GERADO MANUALMENTE A PARTIR DO SCHEMA SQL REAL (squema.sql)
 * 
 * RECOMENDAÇÃO: Sempre que alterar o banco, regenere com:
 *   npx supabase gen types typescript --project-id SEU_PROJECT_ID > types/database.ts
 * 
 * Última atualização: baseado no squema.sql do repositório
 */

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
      // ============================================
      // ACOMODAÇÕES
      // ============================================
      acomodacoes: {
        Row: {
          id: number;
          numero_unidade: string;
          nome_exibicao: string;
          tipo: 'Casa' | 'Chalé';
          categoria: 'com_cozinha' | 'sem_cozinha' | null;
          capacidade_minima: number;
          capacidade_maxima: number;
          ativo: boolean;
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          numero_unidade: string;
          nome_exibicao: string;
          tipo: 'Casa' | 'Chalé';
          categoria?: 'com_cozinha' | 'sem_cozinha' | null;
          capacidade_minima?: number;
          capacidade_maxima: number;
          ativo?: boolean;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          numero_unidade?: string;
          nome_exibicao?: string;
          tipo?: 'Casa' | 'Chalé';
          categoria?: 'com_cozinha' | 'sem_cozinha' | null;
          capacidade_minima?: number;
          capacidade_maxima?: number;
          ativo?: boolean;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // AVALIAÇÕES DE QUARTO
      // ============================================
      avaliacoes_quarto: {
        Row: {
          id: number;
          reserva_id: string;
          avaliador: string;
          data_avaliacao: string;
          estado_geral: 'perfeito' | 'bom' | 'regular' | 'ruim' | null;
          nota_limpeza: number | null;
          nota_conservacao: number | null;
          tem_danos: boolean;
          danos_descricao: string[] | null;
          valor_estimado_danos: number;
          observacoes: string | null;
          necessita_manutencao: boolean;
          urgente: boolean;
        };
        Insert: {
          id?: never;
          reserva_id: string;
          avaliador: string;
          data_avaliacao?: string;
          estado_geral?: 'perfeito' | 'bom' | 'regular' | 'ruim' | null;
          nota_limpeza?: number | null;
          nota_conservacao?: number | null;
          tem_danos?: boolean;
          danos_descricao?: string[] | null;
          valor_estimado_danos?: number;
          observacoes?: string | null;
          necessita_manutencao?: boolean;
          urgente?: boolean;
        };
        Update: {
          id?: never;
          reserva_id?: string;
          avaliador?: string;
          data_avaliacao?: string;
          estado_geral?: 'perfeito' | 'bom' | 'regular' | 'ruim' | null;
          nota_limpeza?: number | null;
          nota_conservacao?: number | null;
          tem_danos?: boolean;
          danos_descricao?: string[] | null;
          valor_estimado_danos?: number;
          observacoes?: string | null;
          necessita_manutencao?: boolean;
          urgente?: boolean;
        };
      };

      // ============================================
      // CLIENTES
      // ============================================
      clientes_xngrl: {
        Row: {
          id_cliente: number;
          created_at: string;
          nome_cliente: string | null;
          telefonewhatsapp_cliente: string | null;
          botativo: string | null;
          conversationid: string | null;
          idempresa: number | null;
          total_reservas: number;
          valor_total_gasto: number;
          ultima_reserva: string | null;
          observacoes: string | null;
          score_cliente: number;
        };
        Insert: {
          id_cliente?: never;
          created_at?: string;
          nome_cliente?: string | null;
          telefonewhatsapp_cliente?: string | null;
          botativo?: string | null;
          conversationid?: string | null;
          idempresa?: number | null;
          total_reservas?: number;
          valor_total_gasto?: number;
          ultima_reserva?: string | null;
          observacoes?: string | null;
          score_cliente?: number;
        };
        Update: {
          id_cliente?: never;
          created_at?: string;
          nome_cliente?: string | null;
          telefonewhatsapp_cliente?: string | null;
          botativo?: string | null;
          conversationid?: string | null;
          idempresa?: number | null;
          total_reservas?: number;
          valor_total_gasto?: number;
          ultima_reserva?: string | null;
          observacoes?: string | null;
          score_cliente?: number;
        };
      };

      // ============================================
      // CONVERSAS (chatbot)
      // ============================================
      conversas: {
        Row: {
          id: number;
          cliente_id: number | null;
          instance_id: string | null;
          etapa_atual: string;
          dados_reserva: Json;
          historico_mensagens: Json;
          ultima_atividade: string;
          ativa: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          cliente_id?: number | null;
          instance_id?: string | null;
          etapa_atual?: string;
          dados_reserva?: Json;
          historico_mensagens?: Json;
          ultima_atividade?: string;
          ativa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          cliente_id?: number | null;
          instance_id?: string | null;
          etapa_atual?: string;
          dados_reserva?: Json;
          historico_mensagens?: Json;
          ultima_atividade?: string;
          ativa?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // DAY USE — CONFIGURAÇÃO
      // ============================================
      day_use_config: {
        Row: {
          id: string;
          max_capacity: number;
          price_weekday: number;
          price_weekend: number;
          price_holiday: number | null;
          opening_time: string;
          closing_time: string;
          min_people: number;
          max_people_per_reservation: number;
          advance_booking_days: number;
          cancellation_hours: number;
          description: string | null;
          included_items: string | null;
          terms_and_conditions: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          max_capacity?: number;
          price_weekday: number;
          price_weekend: number;
          price_holiday?: number | null;
          opening_time?: string;
          closing_time?: string;
          min_people?: number;
          max_people_per_reservation?: number;
          advance_booking_days?: number;
          cancellation_hours?: number;
          description?: string | null;
          included_items?: string | null;
          terms_and_conditions?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          max_capacity?: number;
          price_weekday?: number;
          price_weekend?: number;
          price_holiday?: number | null;
          opening_time?: string;
          closing_time?: string;
          min_people?: number;
          max_people_per_reservation?: number;
          advance_booking_days?: number;
          cancellation_hours?: number;
          description?: string | null;
          included_items?: string | null;
          terms_and_conditions?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // DAY USE — RESERVAS
      // ============================================
      day_use_reservations: {
        Row: {
          id: string;
          phone_number: string;
          customer_name: string;
          reservation_date: string;
          number_of_people: number;
          price_per_person: number;
          total_amount: number;
          payment_status: 'pending' | 'confirmed' | 'cancelled';
          payment_method: string | null;
          payment_confirmation_date: string | null;
          pix_code: string | null;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes: string | null;
          special_requests: string | null;
          created_at: string;
          updated_at: string;
          confirmed_by: string | null;
          cancelled_reason: string | null;
          cancelled_at: string | null;
          conversation_id: string | null;
          instance_id: string | null;
          expires_at: string | null;
          total_people: number | null;
          paying_people: number | null;
          non_paying_people: number;
          reservation_code: string | null;
        };
        Insert: {
          id?: string;
          phone_number: string;
          customer_name: string;
          reservation_date: string;
          number_of_people: number;
          price_per_person: number;
          total_amount: number;
          payment_status?: 'pending' | 'confirmed' | 'cancelled';
          payment_method?: string | null;
          payment_confirmation_date?: string | null;
          pix_code?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          special_requests?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_by?: string | null;
          cancelled_reason?: string | null;
          cancelled_at?: string | null;
          conversation_id?: string | null;
          instance_id?: string | null;
          expires_at?: string | null;
          total_people?: number | null;
          paying_people?: number | null;
          non_paying_people?: number;
          reservation_code?: string | null;
        };
        Update: {
          id?: string;
          phone_number?: string;
          customer_name?: string;
          reservation_date?: string;
          number_of_people?: number;
          price_per_person?: number;
          total_amount?: number;
          payment_status?: 'pending' | 'confirmed' | 'cancelled';
          payment_method?: string | null;
          payment_confirmation_date?: string | null;
          pix_code?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          notes?: string | null;
          special_requests?: string | null;
          created_at?: string;
          updated_at?: string;
          confirmed_by?: string | null;
          cancelled_reason?: string | null;
          cancelled_at?: string | null;
          conversation_id?: string | null;
          instance_id?: string | null;
          expires_at?: string | null;
          total_people?: number | null;
          paying_people?: number | null;
          non_paying_people?: number;
          reservation_code?: string | null;
        };
      };

      // ============================================
      // DESTINATÁRIOS DE RELATÓRIOS
      // ============================================
      destinatarios_relatorios: {
        Row: {
          id: number;
          nome: string;
          telefone: string;
          cargo: string | null;
          recebe_diario: boolean;
          recebe_semanal: boolean;
          recebe_mensal: boolean;
          horario_preferencial: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          nome: string;
          telefone: string;
          cargo?: string | null;
          recebe_diario?: boolean;
          recebe_semanal?: boolean;
          recebe_mensal?: boolean;
          horario_preferencial?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          nome?: string;
          telefone?: string;
          cargo?: string | null;
          recebe_diario?: boolean;
          recebe_semanal?: boolean;
          recebe_mensal?: boolean;
          horario_preferencial?: string | null;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // DISPONIBILIDADE DE QUARTOS
      // ============================================
      disponibilidade_quartos: {
        Row: {
          id: number;
          data: string;
          tipo_quarto: string;
          capacidade: number;
          preco: number;
          disponivel: boolean;
          reservado_temporario: boolean;
          reservado_temp_ate: string | null;
          created_at: string;
          reserva_referencia: string | null;
          observacoes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: never;
          data: string;
          tipo_quarto: string;
          capacidade: number;
          preco: number;
          disponivel?: boolean;
          reservado_temporario?: boolean;
          reservado_temp_ate?: string | null;
          created_at?: string;
          reserva_referencia?: string | null;
          observacoes?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: never;
          data?: string;
          tipo_quarto?: string;
          capacidade?: number;
          preco?: number;
          disponivel?: boolean;
          reservado_temporario?: boolean;
          reservado_temp_ate?: string | null;
          created_at?: string;
          reserva_referencia?: string | null;
          observacoes?: string | null;
          updated_at?: string;
        };
      };

      // ============================================
      // EMPRESA
      // ============================================
      empresa: {
        Row: {
          id: number;
          created_at: string;
          nome: string | null;
          telefonewhatsapp: string | null;
          apidifybot: string | null;
          tokeninstance: string | null;
          status: string | null;
          telefone_gerencia: string;
          horario_funcionamento: Json;
        };
        Insert: {
          id?: never;
          created_at?: string;
          nome?: string | null;
          telefonewhatsapp?: string | null;
          apidifybot?: string | null;
          tokeninstance?: string | null;
          status?: string | null;
          telefone_gerencia?: string;
          horario_funcionamento?: Json;
        };
        Update: {
          id?: never;
          created_at?: string;
          nome?: string | null;
          telefonewhatsapp?: string | null;
          apidifybot?: string | null;
          tokeninstance?: string | null;
          status?: string | null;
          telefone_gerencia?: string;
          horario_funcionamento?: Json;
        };
      };

      // ============================================
      // HISTÓRICO DE RELATÓRIOS
      // ============================================
      historico_relatorios: {
        Row: {
          id: number;
          tipo_relatorio: string;
          periodo_inicio: string;
          periodo_fim: string;
          destinatarios: string[];
          conteudo: Json | null;
          enviado_em: string;
          sucesso: boolean;
          erro_detalhes: string | null;
        };
        Insert: {
          id?: never;
          tipo_relatorio: string;
          periodo_inicio: string;
          periodo_fim: string;
          destinatarios: string[];
          conteudo?: Json | null;
          enviado_em?: string;
          sucesso?: boolean;
          erro_detalhes?: string | null;
        };
        Update: {
          id?: never;
          tipo_relatorio?: string;
          periodo_inicio?: string;
          periodo_fim?: string;
          destinatarios?: string[];
          conteudo?: Json | null;
          enviado_em?: string;
          sucesso?: boolean;
          erro_detalhes?: string | null;
        };
      };

      // ============================================
      // HISTÓRICO DE STATUS DE RESERVA
      // ============================================
      historico_status_reserva: {
        Row: {
          id: number;
          reserva_id: string;
          status_anterior: string | null;
          status_novo: string;
          alterado_por: string | null;
          motivo: string | null;
          detalhes: Json | null;
          data_alteracao: string;
        };
        Insert: {
          id?: never;
          reserva_id: string;
          status_anterior?: string | null;
          status_novo: string;
          alterado_por?: string | null;
          motivo?: string | null;
          detalhes?: Json | null;
          data_alteracao?: string;
        };
        Update: {
          id?: never;
          reserva_id?: string;
          status_anterior?: string | null;
          status_novo?: string;
          alterado_por?: string | null;
          motivo?: string | null;
          detalhes?: Json | null;
          data_alteracao?: string;
        };
      };

      // ============================================
      // HOLIDAYS (Feriados)
      // ============================================
      holidays: {
        Row: {
          id: string;
          holiday_date: string;
          holiday_name: string;
          holiday_type: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          holiday_date: string;
          holiday_name: string;
          holiday_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          holiday_date?: string;
          holiday_name?: string;
          holiday_type?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // JOB LOGS
      // ============================================
      job_logs: {
        Row: {
          id: number;
          job_name: string;
          status: 'success' | 'error' | 'running';
          detalhes: Json;
          duracao_ms: number | null;
          executed_at: string;
        };
        Insert: {
          id?: number;
          job_name: string;
          status: 'success' | 'error' | 'running';
          detalhes?: Json;
          duracao_ms?: number | null;
          executed_at?: string;
        };
        Update: {
          id?: number;
          job_name?: string;
          status?: 'success' | 'error' | 'running';
          detalhes?: Json;
          duracao_ms?: number | null;
          executed_at?: string;
        };
      };

      // ============================================
      // LOGS DE BLOQUEIOS INTERNOS
      // ============================================
      logs_bloqueios_internos: {
        Row: {
          id: string;
          tipo_evento: string;
          data_checkin: string;
          data_checkout: string;
          dia_semana: number | null;
          diarias_solicitadas: number | null;
          diarias_minimas_exigidas: number | null;
          telefone_cliente: string | null;
          motivo_interno: string | null;
          dados_completos: Json | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          tipo_evento: string;
          data_checkin: string;
          data_checkout: string;
          dia_semana?: number | null;
          diarias_solicitadas?: number | null;
          diarias_minimas_exigidas?: number | null;
          telefone_cliente?: string | null;
          motivo_interno?: string | null;
          dados_completos?: Json | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          tipo_evento?: string;
          data_checkin?: string;
          data_checkout?: string;
          dia_semana?: number | null;
          diarias_solicitadas?: number | null;
          diarias_minimas_exigidas?: number | null;
          telefone_cliente?: string | null;
          motivo_interno?: string | null;
          dados_completos?: Json | null;
          timestamp?: string;
        };
      };

      // ============================================
      // MÉTRICAS DIÁRIAS
      // ============================================
      metricas_diarias: {
        Row: {
          id: number;
          data: string;
          conversas_iniciadas: number;
          interesse_reserva: number;
          pre_reservas_criadas: number;
          reservas_confirmadas: number;
          cardapios_enviados: number;
          fotos_enviadas: number;
          valor_total_dia: number;
          taxa_conversao: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          data: string;
          conversas_iniciadas?: number;
          interesse_reserva?: number;
          pre_reservas_criadas?: number;
          reservas_confirmadas?: number;
          cardapios_enviados?: number;
          fotos_enviadas?: number;
          valor_total_dia?: number;
          taxa_conversao?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          data?: string;
          conversas_iniciadas?: number;
          interesse_reserva?: number;
          pre_reservas_criadas?: number;
          reservas_confirmadas?: number;
          cardapios_enviados?: number;
          fotos_enviadas?: number;
          valor_total_dia?: number;
          taxa_conversao?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // NOTIFICAÇÕES PENDENTES
      // ============================================
      notificacoes_pendentes: {
        Row: {
          id: number;
          tipo: 'email' | 'sms' | 'push' | 'whatsapp';
          destinatario: string;
          assunto: string | null;
          mensagem: string;
          dados: Json;
          agendado_para: string;
          enviado: boolean;
          enviado_em: string | null;
          tentativas: number;
          max_tentativas: number;
          erro: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          tipo: 'email' | 'sms' | 'push' | 'whatsapp';
          destinatario: string;
          assunto?: string | null;
          mensagem: string;
          dados?: Json;
          agendado_para?: string;
          enviado?: boolean;
          enviado_em?: string | null;
          tentativas?: number;
          max_tentativas?: number;
          erro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tipo?: 'email' | 'sms' | 'push' | 'whatsapp';
          destinatario?: string;
          assunto?: string | null;
          mensagem?: string;
          dados?: Json;
          agendado_para?: string;
          enviado?: boolean;
          enviado_em?: string | null;
          tentativas?: number;
          max_tentativas?: number;
          erro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // PACOTES ESPECIAIS
      // ============================================
      pacotes_especiais: {
        Row: {
          id: number;
          nome: string;
          descricao: string | null;
          data_inicio: string;
          data_fim: string;
          diarias_pacote: number;
          tipo_pacote: 'fechado' | 'minimo';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          nome: string;
          descricao?: string | null;
          data_inicio: string;
          data_fim: string;
          diarias_pacote: number;
          tipo_pacote?: 'fechado' | 'minimo';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          nome?: string;
          descricao?: string | null;
          data_inicio?: string;
          data_fim?: string;
          diarias_pacote?: number;
          tipo_pacote?: 'fechado' | 'minimo';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // PERÍODOS DE RESERVA
      // ============================================
      periodos_reserva: {
        Row: {
          id: number;
          nome: string;
          data_inicio: string;
          data_fim: string;
          reservas_abertas: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          nome: string;
          data_inicio: string;
          data_fim: string;
          reservas_abertas?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          nome?: string;
          data_inicio?: string;
          data_fim?: string;
          reservas_abertas?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // PRÉ-RESERVAS
      // ============================================
      pre_reservas: {
        Row: {
          id: number;
          reserva_id: string;
          conversa_id: string | null;
          cliente_id: number | null;
          data_checkin: string;
          data_checkout: string;
          pessoas: number;
          tipo_quarto: string;
          total_diarias: number;
          valor_total: number;
          valor_sinal: number;
          chave_pix: string | null;
          pix_payload: string | null;
          qr_code_url: string | null;
          status: string;
          expira_em: string | null;
          notificado_2h: boolean;
          notificado_20h: boolean;
          comprovante_pix: string | null;
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          reserva_id: string;
          conversa_id?: string | null;
          cliente_id?: number | null;
          data_checkin: string;
          data_checkout: string;
          pessoas: number;
          tipo_quarto: string;
          total_diarias: number;
          valor_total: number;
          valor_sinal: number;
          chave_pix?: string | null;
          pix_payload?: string | null;
          qr_code_url?: string | null;
          status?: string;
          expira_em?: string | null;
          notificado_2h?: boolean;
          notificado_20h?: boolean;
          comprovante_pix?: string | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          reserva_id?: string;
          conversa_id?: string | null;
          cliente_id?: number | null;
          data_checkin?: string;
          data_checkout?: string;
          pessoas?: number;
          tipo_quarto?: string;
          total_diarias?: number;
          valor_total?: number;
          valor_sinal?: number;
          chave_pix?: string | null;
          pix_payload?: string | null;
          qr_code_url?: string | null;
          status?: string;
          expira_em?: string | null;
          notificado_2h?: boolean;
          notificado_20h?: boolean;
          comprovante_pix?: string | null;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // PREÇOS DE ACOMODAÇÕES
      // ============================================
      precos_acomodacoes: {
        Row: {
          id: number;
          acomodacao_id: number;
          quantidade_pessoas: number;
          preco_diaria: number;
          ativo: boolean;
          observacao: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          acomodacao_id: number;
          quantidade_pessoas: number;
          preco_diaria: number;
          ativo?: boolean;
          observacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          acomodacao_id?: number;
          quantidade_pessoas?: number;
          preco_diaria?: number;
          ativo?: boolean;
          observacao?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // PREÇOS DE PACOTES
      // ============================================
      precos_pacotes: {
        Row: {
          id: number;
          pacote_id: number;
          tipo_acomodacao: 'chale_com_cozinha' | 'chale_sem_cozinha' | 'casa';
          pessoas: number;
          valor: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: never;
          pacote_id: number;
          tipo_acomodacao: 'chale_com_cozinha' | 'chale_sem_cozinha' | 'casa';
          pessoas: number;
          valor: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: never;
          pacote_id?: number;
          tipo_acomodacao?: 'chale_com_cozinha' | 'chale_sem_cozinha' | 'casa';
          pessoas?: number;
          valor?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };

      // ============================================
      // RESERVAS CONFIRMADAS
      // ============================================
      reservas_confirmadas: {
        Row: {
          id: number;
          reserva_id: string;
          cliente_id: number;
          data_checkin: string;
          data_checkout: string;
          pessoas: number;
          tipo_quarto: string;
          valor_total: number;
          valor_pago: number;
          valor_restante: number;
          comprovante_pix: string | null;
          status: string;
          // --- Checkin ---
          checkin_realizado: boolean;
          status_checkin: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
          data_checkin_real: string | null;
          hora_checkin_real: string | null;
          responsavel_checkin: string | null;
          observacoes_checkin: string | null;
          checkin_realizado_por: string | null;
          checkin_antecipado: boolean;
          checkin_atrasado: boolean;
          minutos_atraso_checkin: number;
          // --- Checkout ---
          checkout_realizado: boolean;
          data_checkout_real: string | null;
          hora_checkout_real: string | null;
          checkout_realizado_por: string | null;
          checkout_observacoes: string | null;
          checkout_antecipado: boolean;
          checkout_atrasado: boolean;
          minutos_atraso_checkout: number;
          // --- Avaliação ---
          avaliacao_cliente: number | null;
          avaliacao_quarto: Json | null;
          danos_identificados: boolean;
          valor_danos: number;
          // --- Gerais ---
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          reserva_id: string;
          cliente_id: number;
          data_checkin: string;
          data_checkout: string;
          pessoas: number;
          tipo_quarto: string;
          valor_total: number;
          valor_pago: number;
          valor_restante?: number;
          comprovante_pix?: string | null;
          status?: string;
          checkin_realizado?: boolean;
          status_checkin?: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
          data_checkin_real?: string | null;
          hora_checkin_real?: string | null;
          responsavel_checkin?: string | null;
          observacoes_checkin?: string | null;
          checkin_realizado_por?: string | null;
          checkin_antecipado?: boolean;
          checkin_atrasado?: boolean;
          minutos_atraso_checkin?: number;
          checkout_realizado?: boolean;
          data_checkout_real?: string | null;
          hora_checkout_real?: string | null;
          checkout_realizado_por?: string | null;
          checkout_observacoes?: string | null;
          checkout_antecipado?: boolean;
          checkout_atrasado?: boolean;
          minutos_atraso_checkout?: number;
          avaliacao_cliente?: number | null;
          avaliacao_quarto?: Json | null;
          danos_identificados?: boolean;
          valor_danos?: number;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          reserva_id?: string;
          cliente_id?: number;
          data_checkin?: string;
          data_checkout?: string;
          pessoas?: number;
          tipo_quarto?: string;
          valor_total?: number;
          valor_pago?: number;
          valor_restante?: number;
          comprovante_pix?: string | null;
          status?: string;
          checkin_realizado?: boolean;
          status_checkin?: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
          data_checkin_real?: string | null;
          hora_checkin_real?: string | null;
          responsavel_checkin?: string | null;
          observacoes_checkin?: string | null;
          checkin_realizado_por?: string | null;
          checkin_antecipado?: boolean;
          checkin_atrasado?: boolean;
          minutos_atraso_checkin?: number;
          checkout_realizado?: boolean;
          data_checkout_real?: string | null;
          hora_checkout_real?: string | null;
          checkout_realizado_por?: string | null;
          checkout_observacoes?: string | null;
          checkout_antecipado?: boolean;
          checkout_atrasado?: boolean;
          minutos_atraso_checkout?: number;
          avaliacao_cliente?: number | null;
          avaliacao_quarto?: Json | null;
          danos_identificados?: boolean;
          valor_danos?: number;
          observacoes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      // ============================================
      // USUÁRIOS ADMIN
      // ============================================
      usuarios_admin: {
        Row: {
          id: number;
          telefone_whatsapp: string;
          nome: string;
          nivel_acesso: 'admin' | 'gerente' | 'recepcionista' | 'visualizador';
          ativo: boolean;
          pode_confirmar_reservas: boolean;
          pode_cancelar_reservas: boolean;
          pode_modificar_reservas: boolean;
          pode_fazer_checkin: boolean;
          pode_ver_relatorios: boolean;
          pode_cadastrar_reservas: boolean;
          empresa_id: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          telefone_whatsapp: string;
          nome: string;
          nivel_acesso?: 'admin' | 'gerente' | 'recepcionista' | 'visualizador';
          ativo?: boolean;
          pode_confirmar_reservas?: boolean;
          pode_cancelar_reservas?: boolean;
          pode_modificar_reservas?: boolean;
          pode_fazer_checkin?: boolean;
          pode_ver_relatorios?: boolean;
          pode_cadastrar_reservas?: boolean;
          empresa_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          telefone_whatsapp?: string;
          nome?: string;
          nivel_acesso?: 'admin' | 'gerente' | 'recepcionista' | 'visualizador';
          ativo?: boolean;
          pode_confirmar_reservas?: boolean;
          pode_cancelar_reservas?: boolean;
          pode_modificar_reservas?: boolean;
          pode_fazer_checkin?: boolean;
          pode_ver_relatorios?: boolean;
          pode_cadastrar_reservas?: boolean;
          empresa_id?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      verificar_e_criar_reserva: {
        Args: {
          p_data_checkin: string;
          p_data_checkout: string;
          p_pessoas: number;
          p_tipo_quarto: string;
          p_cliente_id: number;
          p_reserva_id: string;
          p_valor_total: number;
        };
        Returns: Json;
      };
      validar_reserva_completa: {
        Args: {
          p_data_checkin: string;
          p_data_checkout: string;
          p_pessoas: number;
          p_tipo_acomodacao: string;
        };
        Returns: Json;
      };
      verificar_periodo_reserva_aberto: {
        Args: {
          p_data_checkin: string;
          p_data_checkout: string;
        };
        Returns: Json;
      };
      verificar_periodo_pacote: {
        Args: {
          p_data_checkin: string;
          p_data_checkout: string;
        };
        Returns: Json;
      };
      buscar_precos_pacote: {
        Args: {
          p_pacote_id: number;
        };
        Returns: Json;
      };
      listar_pacotes_ativos: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      criar_notificacao: {
        Args: {
          p_tipo: string;
          p_destinatario: string;
          p_assunto: string | null;
          p_mensagem: string;
          p_dados?: Json;
          p_agendado_para?: string;
        };
        Returns: number;
      };
      marcar_notificacao_enviada: {
        Args: {
          p_notificacao_id: number;
        };
        Returns: void;
      };
    };

    Enums: {
      [_ in never]: never;
    };
  };
}
