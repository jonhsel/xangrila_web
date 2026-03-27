// ============================================
// TYPES — PAGAMENTOS PIX (Fase 6)
// ============================================

// Dados para gerar PIX
export interface GerarPixRequest {
  reservaId: string;
  email?: string; // opcional — gera temp se não fornecido
}

// Resposta da API de geração de PIX
export interface PixResponse {
  success: boolean;
  payment_id?: number;
  qr_code?: string;         // string copiável do PIX
  qr_code_base64?: string;  // imagem QR em base64
  ticket_url?: string;      // link do Mercado Pago
  valor?: number;
  expira_em?: string;
  error?: string;
}

// Webhook do Mercado Pago
export interface WebhookMercadoPago {
  action: string;
  api_version: string;
  data: {
    id: string; // ID do pagamento
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice' | 'point_integration_wh';
  user_id: string;
}

// Status do pagamento/reserva (retornado pelo polling)
export interface PaymentStatus {
  reserva_id: string;
  status: 'aguardando_pagamento' | 'confirmada' | 'expirada' | 'cancelada';
  tipo: 'pre_reserva' | 'reserva';
  payment_id?: number;
  valor_pago?: number;
  data_pagamento?: string;
}
