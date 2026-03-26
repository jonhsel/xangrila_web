/**
 * Utils — Arquivo principal (exigido pelo shadcn/ui)
 * 
 * O shadcn/ui configura o alias "@/lib/utils" apontando para ESTE arquivo.
 * Por isso, todas as importações devem passar por aqui:
 * 
 *   import { cn, formatarMoeda, formatarData } from '@/lib/utils';
 * 
 * Este arquivo re-exporta tudo de date.ts e format.ts que ficam na pasta
 * lib/utils/ (ao lado deste arquivo NÃO funciona — precisam estar em subpasta
 * ou no mesmo arquivo). Para evitar conflito de resolução entre arquivo e pasta,
 * as funções de date e format são importadas diretamente aqui.
 * 
 * ⚠️ NÃO RENOMEIE E NÃO MOVA este arquivo — o shadcn/ui depende dele.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// CN (class names merge — usado pelo shadcn/ui)
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// RE-EXPORTAR FUNÇÕES DE DATA E FORMATAÇÃO
// ============================================

export {
  formatarData,
  formatarDataHora,
  formatarDataExtenso,
  formatarDataCurta,
  formatarIntervalo,
  calcularDiarias,
  adicionarDias,
  dataParaISO,
  isoParaData,
  ehHoje,
  ehPassado,
  ehFuturo,
  ehFimDeSemana,
  obterDiaDaSemana,
} from './utils/date';

export {
  formatarMoeda,
  formatarNumero,
  formatarPorcentagem,
  formatarTelefone,
  formatarCPF,
  truncarTexto,
  capitalizarPalavras,
  removerAcentos,
  criarSlug,
  extrairIniciais,
  mascarEmail,
  mascarTelefone,
  gerarCodigoReserva,
  formatarPessoas,
  formatarDiarias,
  formatarTamanhoArquivo,
} from './utils/format';
