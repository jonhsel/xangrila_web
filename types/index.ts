/**
 * Tipos da Aplicação — Pousada Xangrilá
 * 
 * Types customizados para uso no frontend.
 * Os nomes de campos seguem EXATAMENTE o que o PostgreSQL retorna
 * (tudo lowercase, sem camelCase parcial).
 */

import type { Database } from './database';

// ============================================
// ALIASES DE TABELAS (atalhos para Row types)
// ============================================

/** Row type da tabela acomodacoes */
export type AcomodacaoRow = Database['public']['Tables']['acomodacoes']['Row'];

/** Row type da tabela clientes_xngrl */
export type ClienteRow = Database['public']['Tables']['clientes_xngrl']['Row'];

/** Row type da tabela reservas_confirmadas */
export type ReservaRow = Database['public']['Tables']['reservas_confirmadas']['Row'];

/** Row type da tabela pre_reservas */
export type PreReservaRow = Database['public']['Tables']['pre_reservas']['Row'];

/** Row type da tabela disponibilidade_quartos */
export type DisponibilidadeRow = Database['public']['Tables']['disponibilidade_quartos']['Row'];

/** Row type da tabela usuarios_admin */
export type AdminRow = Database['public']['Tables']['usuarios_admin']['Row'];

/** Row type da tabela notificacoes_pendentes */
export type NotificacaoRow = Database['public']['Tables']['notificacoes_pendentes']['Row'];

/** Row type da tabela pacotes_especiais */
export type PacoteRow = Database['public']['Tables']['pacotes_especiais']['Row'];

/** Row type da tabela precos_pacotes */
export type PrecoPacoteRow = Database['public']['Tables']['precos_pacotes']['Row'];

/** Row type da tabela precos_acomodacoes */
export type PrecoAcomodacaoRow = Database['public']['Tables']['precos_acomodacoes']['Row'];

/** Row type da tabela periodos_reserva */
export type PeriodoReservaRow = Database['public']['Tables']['periodos_reserva']['Row'];

/** Row type da tabela avaliacoes_quarto */
export type AvaliacaoQuartoRow = Database['public']['Tables']['avaliacoes_quarto']['Row'];

/** Row type da tabela metricas_diarias */
export type MetricaDiariaRow = Database['public']['Tables']['metricas_diarias']['Row'];

/** Row type da tabela historico_status_reserva */
export type HistoricoStatusRow = Database['public']['Tables']['historico_status_reserva']['Row'];

/** Row type da tabela day_use_reservations */
export type DayUseReservationRow = Database['public']['Tables']['day_use_reservations']['Row'];

/** Row type da tabela day_use_config */
export type DayUseConfigRow = Database['public']['Tables']['day_use_config']['Row'];

// ============================================
// TIPOS DE DOMÍNIO
// ============================================

/**
 * Tipo de acomodação como registrado na tabela `acomodacoes`.
 * O banco armazena apenas 'Casa' ou 'Chalé' no campo `tipo`.
 */
export type TipoAcomodacao = 'Casa' | 'Chalé';

/**
 * Categoria da acomodação (campo `categoria` da tabela `acomodacoes`).
 * Só se aplica a Chalés. Casas não têm categoria (null).
 */
export type CategoriaAcomodacao = 'com_cozinha' | 'sem_cozinha' | null;

/**
 * Tipo de quarto como é usado nas tabelas de RESERVA
 * (pre_reservas, reservas_confirmadas, disponibilidade_quartos).
 * Essas tabelas aceitam texto livre — a normalização é feita nas functions SQL.
 */
export type TipoQuartoReserva =
  | 'Casa'
  | 'Chalé - Com Cozinha'
  | 'Chalé - Sem Cozinha';

/**
 * Alias para retrocompatibilidade.
 * Use `TipoQuartoReserva` em código novo.
 */
export type TipoQuarto = TipoQuartoReserva;

/**
 * Tipo de acomodação como usado na tabela `precos_pacotes`.
 */
export type TipoAcomodacaoPacote = 'chale_com_cozinha' | 'chale_sem_cozinha' | 'casa';

/** Status possíveis de uma reserva confirmada */
export type StatusReserva =
  | 'pendente'
  | 'confirmada'
  | 'cancelada'
  | 'concluida';

/** Status de uma pré-reserva */
export type StatusPreReserva =
  | 'aguardando_pagamento'
  | 'expirada'
  | 'cancelada';

/** Status do checkin */
export type StatusCheckin =
  | 'pendente'
  | 'em_andamento'
  | 'concluido'
  | 'atrasado';

/** Nível de acesso de admin */
export type NivelAcessoAdmin =
  | 'admin'
  | 'gerente'
  | 'recepcionista'
  | 'visualizador';

/** Tipo de notificação */
export type TipoNotificacao = 'email' | 'sms' | 'push' | 'whatsapp';

/** Tipo de pacote */
export type TipoPacote = 'fechado' | 'minimo';

// ============================================
// INTERFACES COMPOSTAS (com relações)
// ============================================

/**
 * Reserva confirmada com dados do cliente (JOIN).
 * Usa-se em listagens e detalhes de reserva.
 */
export interface ReservaComCliente extends ReservaRow {
  clientes_xngrl: ClienteRow | null;
}

/**
 * Pré-reserva com dados do cliente (JOIN).
 */
export interface PreReservaComCliente extends PreReservaRow {
  clientes_xngrl: ClienteRow | null;
}

/**
 * Acomodação com seus preços (JOIN).
 */
export interface AcomodacaoComPrecos extends AcomodacaoRow {
  precos_acomodacoes: PrecoAcomodacaoRow[];
}

/**
 * Pacote especial com seus preços (JOIN).
 */
export interface PacoteComPrecos extends PacoteRow {
  precos_pacotes: PrecoPacoteRow[];
}

// ============================================
// CAPACIDADES REAIS DA POUSADA
// ============================================

/**
 * Mapa de capacidade máxima por tipo de quarto (para validação no frontend).
 * 
 * Configuração real:
 * - Casa (Amarela e Vermelha): até 6 pessoas, 2 unidades
 * - Chalé Com Cozinha: 2 pessoas (01, 03, 09) ou 3 pessoas (06), 4 unidades
 * - Chalé Sem Cozinha: 2 pessoas (02, 07) ou 3 pessoas (04, 05, 08), 5 unidades
 */
export const CAPACIDADE_POR_TIPO: Record<TipoQuartoReserva, number> = {
  'Casa': 6,
  'Chalé - Com Cozinha': 3,
  'Chalé - Sem Cozinha': 3,
};

/**
 * Estoque total (nº de unidades) por tipo de quarto.
 */
export const ESTOQUE_POR_TIPO: Record<TipoQuartoReserva, number> = {
  'Casa': 2,
  'Chalé - Com Cozinha': 4,
  'Chalé - Sem Cozinha': 5,
};

// ============================================
// TYPES PARA API RESPONSES
// ============================================

/** Resposta da function SQL verificar_e_criar_reserva */
export interface VerificarReservaResponse {
  sucesso: boolean;
  reserva_id?: string;
  erro?: string;
  mensagem?: string;
  disponiveis?: number;
  estoque_total?: number;
  ocupados?: number;
  status?: string;
  bloqueios_criados?: number;
  expira_em?: string;
  diarias?: number;
  valor_total?: number;
  preco_diaria?: number;
}

/** Resposta da function SQL validar_reserva_completa */
export interface ValidarReservaResponse {
  sucesso: boolean;
  tipo?: 'normal' | 'pacote';
  erro?: string;
  mensagem?: string;
  diarias?: number;
  periodo_info?: {
    aberto: boolean;
    periodo_nome?: string;
    data_inicio?: string;
    data_fim?: string;
  };
  pacote_info?: {
    id?: number;
    nome?: string;
    data_inicio?: string;
    data_fim?: string;
    diarias?: number;
  };
  valor_pacote?: number;
  precos?: Array<{
    id: number;
    tipo_acomodacao: string;
    tipo_acomodacao_display: string;
    pessoas: number;
    valor: number;
    valor_formatado: string;
  }>;
}

/** Resposta da function SQL verificar_periodo_reserva_aberto */
export interface VerificarPeriodoResponse {
  aberto: boolean;
  periodo_nome?: string;
  data_inicio?: string;
  data_fim?: string;
  mensagem: string;
}
