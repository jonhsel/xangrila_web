/**
 * Utilitários de Datas — Pousada Xangrilá
 * 
 * Todas as funções de formatação e manipulação de datas
 * usando date-fns com locale pt-BR.
 */

import {
  format,
  differenceInDays,
  addDays,
  isToday,
  isPast,
  isFuture,
  isWeekend,
  getDay,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// FORMATAÇÃO
// ============================================

/**
 * Formata data como "DD/MM/YYYY"
 * @example formatarData('2025-01-15') → "15/01/2025"
 */
export function formatarData(data: string | Date): string {
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Formata data com hora como "DD/MM/YYYY às HH:mm"
 * @example formatarDataHora('2025-01-15T14:30:00') → "15/01/2025 às 14:30"
 */
export function formatarDataHora(data: string | Date): string {
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/**
 * Formata data por extenso como "15 de janeiro de 2025"
 * @example formatarDataExtenso('2025-01-15') → "15 de janeiro de 2025"
 */
export function formatarDataExtenso(data: string | Date): string {
  return format(new Date(data), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Formata data curta como "15 jan"
 * @example formatarDataCurta('2025-01-15') → "15 jan"
 */
export function formatarDataCurta(data: string | Date): string {
  return format(new Date(data), 'd MMM', { locale: ptBR });
}

/**
 * Formata intervalo de datas como "15 jan - 20 jan"
 * @example formatarIntervalo('2025-01-15', '2025-01-20') → "15 jan - 20 jan"
 */
export function formatarIntervalo(
  dataInicio: string | Date,
  dataFim: string | Date
): string {
  return `${formatarDataCurta(dataInicio)} - ${formatarDataCurta(dataFim)}`;
}

// ============================================
// CÁLCULOS
// ============================================

/**
 * Calcula número de diárias entre duas datas.
 * @example calcularDiarias(new Date('2025-01-15'), new Date('2025-01-20')) → 5
 */
export function calcularDiarias(checkin: Date | string, checkout: Date | string): number {
  return differenceInDays(new Date(checkout), new Date(checkin));
}

/**
 * Adiciona dias a uma data.
 * @example adicionarDias(new Date('2025-01-15'), 3) → Date 2025-01-18
 */
export function adicionarDias(data: Date | string, dias: number): Date {
  return addDays(new Date(data), dias);
}

// ============================================
// CONVERSÃO
// ============================================

/**
 * Converte Date para string ISO "YYYY-MM-DD" (sem timezone).
 * @example dataParaISO(new Date(2025, 0, 15)) → "2025-01-15"
 */
export function dataParaISO(data: Date): string {
  return format(data, 'yyyy-MM-dd');
}

/**
 * Converte string ISO "YYYY-MM-DD" para Date.
 * @example isoParaData('2025-01-15') → Date
 */
export function isoParaData(iso: string): Date {
  return parseISO(iso);
}

// ============================================
// VERIFICAÇÃO
// ============================================

/**
 * Verifica se a data é hoje.
 */
export function ehHoje(data: Date | string): boolean {
  return isToday(new Date(data));
}

/**
 * Verifica se a data já passou.
 */
export function ehPassado(data: Date | string): boolean {
  return isPast(new Date(data));
}

/**
 * Verifica se a data é futura.
 */
export function ehFuturo(data: Date | string): boolean {
  return isFuture(new Date(data));
}

/**
 * Verifica se a data cai em fim de semana (sábado ou domingo).
 */
export function ehFimDeSemana(data: Date | string): boolean {
  return isWeekend(new Date(data));
}

/**
 * Retorna o dia da semana em português.
 * @example obterDiaDaSemana(new Date('2025-01-15')) → "quarta-feira"
 */
export function obterDiaDaSemana(data: Date | string): string {
  return format(new Date(data), 'EEEE', { locale: ptBR });
}
