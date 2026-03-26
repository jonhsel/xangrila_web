/**
 * Utilitários de Formatação — Pousada Xangrilá
 * 
 * Funções para formatar moeda, telefone, CPF, textos e outros valores.
 */

// ============================================
// MOEDA E NÚMEROS
// ============================================

/**
 * Formata número como moeda brasileira.
 * @example formatarMoeda(1500) → "R$ 1.500,00"
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata número com separador de milhar.
 * @example formatarNumero(1500.5) → "1.500,5"
 */
export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

/**
 * Formata número como porcentagem.
 * @example formatarPorcentagem(0.75) → "75%"
 * @example formatarPorcentagem(85, false) → "85%"
 */
export function formatarPorcentagem(valor: number, ehDecimal = true): string {
  const porcentagem = ehDecimal ? valor * 100 : valor;
  return `${porcentagem.toFixed(0)}%`;
}

// ============================================
// TELEFONE E DOCUMENTOS
// ============================================

/**
 * Formata telefone brasileiro.
 * @example formatarTelefone('98981672949') → "(98) 98167-2949"
 * @example formatarTelefone('5598981672949') → "+55 (98) 98167-2949"
 */
export function formatarTelefone(telefone: string): string {
  const cleaned = telefone.replace(/\D/g, '');

  // Com código do país (55)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const sem55 = cleaned.slice(2);
    return `+55 (${sem55.slice(0, 2)}) ${sem55.slice(2, 7)}-${sem55.slice(7)}`;
  }

  // Celular com DDD (11 dígitos)
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  // Fixo com DDD (10 dígitos)
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return telefone;
}

/**
 * Formata CPF.
 * @example formatarCPF('12345678901') → "123.456.789-01"
 */
export function formatarCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ============================================
// TEXTO
// ============================================

/**
 * Trunca texto com reticências.
 * @example truncarTexto('Texto muito longo', 10) → "Texto mu..."
 */
export function truncarTexto(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength - 3) + '...';
}

/**
 * Capitaliza primeira letra de cada palavra.
 * @example capitalizarPalavras('joão da silva') → "João Da Silva"
 */
export function capitalizarPalavras(texto: string): string {
  return texto.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Remove acentos de uma string.
 * @example removerAcentos('Chalé São João') → "Chale Sao Joao"
 */
export function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Cria slug a partir de texto (para URLs).
 * @example criarSlug('Chalé Com Cozinha') → "chale-com-cozinha"
 */
export function criarSlug(texto: string): string {
  return removerAcentos(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extrai iniciais de um nome (máx 2 letras).
 * @example extrairIniciais('João Silva') → "JS"
 * @example extrairIniciais('Maria') → "MA"
 */
export function extrairIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return nome.slice(0, 2).toUpperCase();
}

// ============================================
// MÁSCARAS (para exibição segura)
// ============================================

/**
 * Mascara email para exibição segura.
 * @example mascarEmail('joao@gmail.com') → "jo***@gmail.com"
 */
export function mascarEmail(email: string): string {
  const [local, dominio] = email.split('@');
  if (!dominio) return email;
  const visivel = local.slice(0, 2);
  return `${visivel}***@${dominio}`;
}

/**
 * Mascara telefone para exibição segura.
 * @example mascarTelefone('98981672949') → "(98) *****-2949"
 */
export function mascarTelefone(telefone: string): string {
  const cleaned = telefone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) *****-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ****-${cleaned.slice(6)}`;
  }
  return telefone;
}

// ============================================
// FORMATAÇÃO CONTEXTUAL (pousada)
// ============================================

/**
 * Gera código único de reserva.
 * @example gerarCodigoReserva() → "PXL-M1A2B3-C4D5"
 */
export function gerarCodigoReserva(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PXL-${timestamp}-${random}`;
}

/**
 * Formata quantidade de pessoas.
 * @example formatarPessoas(1) → "1 pessoa"
 * @example formatarPessoas(3) → "3 pessoas"
 */
export function formatarPessoas(quantidade: number): string {
  return quantidade === 1 ? '1 pessoa' : `${quantidade} pessoas`;
}

/**
 * Formata quantidade de diárias.
 * @example formatarDiarias(1) → "1 diária"
 * @example formatarDiarias(5) → "5 diárias"
 */
export function formatarDiarias(quantidade: number): string {
  return quantidade === 1 ? '1 diária' : `${quantidade} diárias`;
}

/**
 * Formata tamanho de arquivo.
 * @example formatarTamanhoArquivo(1536) → "1.5 KB"
 * @example formatarTamanhoArquivo(1048576) → "1.0 MB"
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const valor = bytes / Math.pow(1024, i);
  return `${valor.toFixed(i === 0 ? 0 : 1)} ${unidades[i]}`;
}
