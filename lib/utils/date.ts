import {
  format,
  parseISO,
  isValid,
  isBefore,
  isAfter,
  addDays,
  differenceInDays,
  startOfDay,
  endOfDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date
  if (!isValid(d)) return ""
  return format(d, pattern, { locale: ptBR })
}

export function formatDateTime(date: Date | string) {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatDateLong(date: Date | string) {
  return formatDate(date, "EEEE, dd 'de' MMMM 'de' yyyy")
}

export function isDateBefore(date: Date, reference: Date) {
  return isBefore(startOfDay(date), startOfDay(reference))
}

export function isDateAfter(date: Date, reference: Date) {
  return isAfter(startOfDay(date), startOfDay(reference))
}

export function isPastDate(date: Date) {
  return isBefore(startOfDay(date), startOfDay(new Date()))
}

export function addDaysToDate(date: Date, days: number) {
  return addDays(date, days)
}

export function daysBetween(start: Date, end: Date) {
  return differenceInDays(endOfDay(end), startOfDay(start))
}

export function toStartOfDay(date: Date) {
  return startOfDay(date)
}
