export const EXPEDICOES = [
  {
    id: 'quadriciclo',
    titulo: 'Expedição de Quadriciclo',
    subtitulo: 'Adrenalina e aventura nas trilhas',
    descricao: 'Explore as trilhas e caminhos de Morros a bordo de quadriciclos. Uma experiência emocionante para quem busca aventura e contato com a natureza. Percorra rios, dunas e trilhas com segurança e diversão.',
    icone: 'Bike',
    imagens: [
      '/images/expedicoes/quadriciclo-1.jpg',
      '/images/expedicoes/quadriciclo-2.jpg',
      '/images/expedicoes/quadriciclo-3.jpg',
    ],
    gradient: 'from-orange-400 to-orange-600',
    whatsappMsg: 'Olá! Gostaria de agendar uma expedição de quadriciclo na Pousada Xangrilá.',
  },
  {
    id: 'jeep',
    titulo: 'Expedição de Jeep',
    subtitulo: 'Conforto e aventura off-road',
    descricao: 'Desbrave as paisagens de Morros em veículos 4x4. Ideal para famílias e grupos que querem explorar cachoeiras, mirantes e pontos turísticos com conforto e segurança. Guias experientes acompanham todo o percurso.',
    icone: 'Truck',
    imagens: [
      '/images/expedicoes/jeep-1.jpg',
      '/images/expedicoes/jeep-2.jpg',
      '/images/expedicoes/jeep-3.jpg',
    ],
    gradient: 'from-green-400 to-green-600',
    whatsappMsg: 'Olá! Gostaria de agendar uma expedição de jeep na Pousada Xangrilá.',
  },
  {
    id: 'lancha',
    titulo: 'Expedição de Lancha',
    subtitulo: 'Navegue pelas águas de Morros',
    descricao: 'Navegue pelos rios e igarapés da região em lanchas confortáveis. Conheça praias fluviais, manguezais e pontos de parada exclusivos. Uma experiência única para curtir a natureza pela água.',
    icone: 'Ship',
    imagens: [
      '/images/expedicoes/lancha-1.jpg',
      '/images/expedicoes/lancha-2.jpg',
      '/images/expedicoes/lancha-3.jpg',
    ],
    gradient: 'from-blue-400 to-blue-600',
    whatsappMsg: 'Olá! Gostaria de agendar uma expedição de lancha na Pousada Xangrilá.',
  },
] as const;

export type ExpedicaoId = (typeof EXPEDICOES)[number]['id'];
