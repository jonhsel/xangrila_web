export function formatCurrency(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value)
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
  }
  return phone
}

export function formatCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "")
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatCEP(cep: string) {
  const digits = cep.replace(/\D/g, "")
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2")
}

export function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}
