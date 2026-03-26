/**
 * Utils — Exportações centralizadas
 * 
 * Import tudo de um lugar só:
 *   import { cn, formatarMoeda, formatarData } from '@/lib/utils';
 * 
 * ⚠️ IMPORTANTE: Cada export aqui corresponde a uma função REAL
 * nos arquivos cn.ts, date.ts e format.ts. Não adicione exports
 * sem antes criar a função correspondente.
 */

// --- Class Names ---
export { cn } from './cn';

// --- Datas ---
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
} from './date';

// --- Formatação ---
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
} from './format';
