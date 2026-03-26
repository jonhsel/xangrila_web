/**
 * Validações Zod — Reservas
 * 
 * Schemas de validação para formulários de reserva.
 * A capacidade máxima é validada dinamicamente por tipo de quarto.
 */

import { z } from 'zod';

// ============================================
// CONSTANTES
// ============================================

/** Tipos de quarto disponíveis para reserva (como texto nas tabelas de reserva) */
export const TIPOS_QUARTO = [
  'Casa',
  'Chalé - Com Cozinha',
  'Chalé - Sem Cozinha',
] as const;

/** Capacidade máxima por tipo de quarto */
export const CAPACIDADE_MAXIMA: Record<string, number> = {
  'Casa': 6,
  'Chalé - Com Cozinha': 3,
  'Chalé - Sem Cozinha': 3,
};

// ============================================
// SCHEMA DE RESERVA
// ============================================

export const reservaSchema = z.object({
  // --- Datas ---
  dataCheckin: z.date().refine((date) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return date >= hoje;
  }, {
    message: 'Data de check-in não pode ser no passado',
  }),

  dataCheckout: z.date(),

  // --- Pessoas ---
  pessoas: z.number().min(1, 'Mínimo de 1 pessoa').max(6, 'Máximo de 6 pessoas'),

  // --- Tipo de quarto ---
  tipoQuarto: z.enum(TIPOS_QUARTO),

  // --- Dados do cliente ---
  nomeCliente: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),

  telefone: z.string()
    .min(10, 'Telefone inválido')
    .max(15, 'Telefone inválido')
    .regex(/^\+?[0-9]{10,15}$/, 'Telefone deve conter apenas números'),

  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),

  observacoes: z.string().max(500, 'Observações muito longas').optional(),
})
  // Checkout deve ser depois do checkin
  .refine((data) => data.dataCheckout > data.dataCheckin, {
    message: 'Check-out deve ser após check-in',
    path: ['dataCheckout'],
  })
  // Validar capacidade por tipo de quarto
  .refine((data) => {
    const maxCapacidade = CAPACIDADE_MAXIMA[data.tipoQuarto];
    if (!maxCapacidade) return true; // tipo não reconhecido, deixa o backend validar
    return data.pessoas <= maxCapacidade;
  }, {
    message: 'Número de pessoas excede a capacidade deste tipo de quarto',
    path: ['pessoas'],
  });

/** Type inferido do schema de reserva */
export type ReservaFormData = z.infer<typeof reservaSchema>;

// ============================================
// SCHEMA DE CONSULTA DE DISPONIBILIDADE
// ============================================

export const consultaDisponibilidadeSchema = z.object({
  dataCheckin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  dataCheckout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  pessoas: z.number().min(1).max(6),
  tipoQuarto: z.enum(TIPOS_QUARTO).optional(),
});

export type ConsultaDisponibilidadeData = z.infer<typeof consultaDisponibilidadeSchema>;

// ============================================
// SCHEMA DE DADOS DO CLIENTE
// ============================================

export const clienteSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  telefone: z.string()
    .min(10, 'Telefone inválido')
    .max(15, 'Telefone inválido')
    .regex(/^\+?[0-9]{10,15}$/, 'Telefone deve conter apenas números'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
