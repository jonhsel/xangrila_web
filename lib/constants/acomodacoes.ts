export const TIPOS_ACOMODACAO = {
  casa: {
    label: 'Casa',
    dbTipoQuarto: 'Casa',
    dbTipo: 'Casa',
    dbCategoria: null as string | null,
    dbTipoAcomodacao: 'casa',
    slug: 'casa',
    capacidadeMinima: 1,
    capacidadeMaxima: 6,
    descricaoCurta: 'Espaçosas e completas. Ideais para famílias.',
    features: ['Até 6 pessoas', 'Cozinha completa', 'Área externa', 'Churrasqueira'],
    unidades: ['Amarela', 'Vermelha'],
    totalUnidades: 2,
    gradient: 'from-green-400 to-green-600',
  },
  chale_com_cozinha: {
    label: 'Chalé com Cozinha',
    dbTipoQuarto: 'Chalé - Com Cozinha',
    dbTipo: 'Chalé',
    dbCategoria: 'com_cozinha',
    dbTipoAcomodacao: 'chale_com_cozinha',
    slug: 'chale-com-cozinha',
    capacidadeMinima: 1,
    capacidadeMaxima: 3,
    descricaoCurta: 'Aconchegantes e equipados. Perfeitos para casais ou pequenos grupos.',
    features: ['Até 3 pessoas', 'Cozinha equipada', 'Varanda privativa', 'Ar condicionado'],
    unidades: ['01', '03', '06', '09'],
    totalUnidades: 4,
    gradient: 'from-blue-400 to-blue-600',
  },
  chale_sem_cozinha: {
    label: 'Chalé sem Cozinha',
    dbTipoQuarto: 'Chalé - Sem Cozinha',
    dbTipo: 'Chalé',
    dbCategoria: 'sem_cozinha',
    dbTipoAcomodacao: 'chale_sem_cozinha',
    slug: 'chale-sem-cozinha',
    capacidadeMinima: 1,
    capacidadeMaxima: 3,
    descricaoCurta: 'Confortáveis e econômicos. Ótimos para estadias rápidas.',
    features: ['Até 3 pessoas', 'Mini-geladeira', 'Ar condicionado', 'Banheiro privativo'],
    unidades: ['02', '04', '05', '07', '08'],
    totalUnidades: 5,
    gradient: 'from-purple-400 to-purple-600',
  },
} as const;

export type TipoAcomodacaoKey = keyof typeof TIPOS_ACOMODACAO;

export function getTipoAcomodacao(valor: string) {
  const norm = valor.toLowerCase().trim();
  for (const [key, config] of Object.entries(TIPOS_ACOMODACAO)) {
    if (norm === key || norm === config.dbTipoQuarto.toLowerCase() || norm === config.dbTipoAcomodacao || norm === config.slug || norm === config.label.toLowerCase()) {
      return { key: key as TipoAcomodacaoKey, ...config };
    }
  }
  if (norm.includes('com') && norm.includes('cozinha')) return { key: 'chale_com_cozinha' as const, ...TIPOS_ACOMODACAO.chale_com_cozinha };
  if (norm.includes('sem') && norm.includes('cozinha')) return { key: 'chale_sem_cozinha' as const, ...TIPOS_ACOMODACAO.chale_sem_cozinha };
  if (norm.includes('casa')) return { key: 'casa' as const, ...TIPOS_ACOMODACAO.casa };
  if (norm.includes('chal')) return { key: 'chale_sem_cozinha' as const, ...TIPOS_ACOMODACAO.chale_sem_cozinha };
  return null;
}

export function listarTiposAcomodacao() {
  return Object.entries(TIPOS_ACOMODACAO).map(([key, config]) => ({
    value: key as TipoAcomodacaoKey, label: config.label, dbTipoQuarto: config.dbTipoQuarto, dbTipoAcomodacao: config.dbTipoAcomodacao,
  }));
}

export const TIPOS_QUARTO_ENUM = ['Casa', 'Chalé - Com Cozinha', 'Chalé - Sem Cozinha'] as const;
export type TipoQuarto = (typeof TIPOS_QUARTO_ENUM)[number];
