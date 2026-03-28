export const POUSADA = {
  nome: 'Pousada Xangri-lá',
  nomeCompleto: 'Pousada Xangri-lá',
  slogan: 'O seu refúgio às margens do Rio Una, em Morros/MA',
  descricao: 'Conforto, natureza e tranquilidade em um só lugar.',
  telefone: '(98) 99117-8982',
  whatsapp: '5598991178982',
  whatsappLink: 'https://wa.me/5598991178982',
  email: 'contato@pousadaxangrila.com.br',
  endereco: { logradouro: 'BR-402, Km 42', cidade: 'Morros', estado: 'MA', completo: 'BR-402, Km 42 - Morros - MA' },
  googleMapsUrl: 'https://maps.google.com/?q=Pousada+Xangri-lá+Morros+São+Luís',
  googleMapsEmbed: '',
  social: {
    instagram: { url: 'https://instagram.com/pousadaxangrilademorros', handle: '@pousadaxangrilademorros' },
    facebook: { url: 'https://facebook.com/pousadaxangrilademorros', handle: 'pousadaxangrilademorros' },
  },
  horarios: {
    checkin: { inicio: '14:00', fim: '22:00', label: '14:00 - 22:00' },
    checkout: { limite: '12:00', label: 'Até 12:00' },
    recepcao: { inicio: '08:00', fim: '22:00', label: '08:00 - 22:00' },
  },
  seo: {
    titleDefault: 'Pousada Xangri-lá - Morros, São Luís - MA',
    titleTemplate: '%s | Pousada Xangri-lá',
    description: 'O seu refúgio às margens do Rio Una, em Morros/MA. Casas e chalés com conforto e tranquilidade. Reserve agora!',
    keywords: ['pousada são luís', 'hospedagem morros', 'chalé são luís', 'pousada maranhão', 'pousada xangrilá'],
  },
} as const;

export const ROUTES = {
  home: '/', sobre: '/sobre', quartos: '/quartos', acomodacoes: '/acomodacoes', contato: '/contato',
  dayUse: '/day-use', reservar: '/reservar', minhasReservas: '/minhas-reservas',
  termos: '/termos', privacidade: '/privacidade',
  admin: { dashboard: '/dashboard', reservas: '/dashboard/reservas', relatorios: '/dashboard/relatorios' },
  api: { disponibilidade: '/api/disponibilidade', reservasCriar: '/api/reservas/criar', reservasStatus: '/api/reservas/status' },
} as const;
