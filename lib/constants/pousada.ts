export const POUSADA = {
  nome: 'Pousada Xangrilá',
  nomeCompleto: 'Pousada Xangrilá - Morros',
  slogan: 'Seu refúgio perfeito em São Luís',
  descricao: 'Conforto, natureza e tranquilidade em um só lugar.',
  telefone: '(98) 98167-2949',
  whatsapp: '5598981672949',
  whatsappLink: 'https://wa.me/5598981672949',
  email: 'contato@pousadaxangrila.com.br',
  endereco: { logradouro: 'Morros', cidade: 'São Luís', estado: 'MA', completo: 'Morros, São Luís - MA' },
  googleMapsUrl: 'https://maps.google.com/?q=Pousada+Xangrilá+Morros+São+Luís',
  googleMapsEmbed: '',
  social: {
    instagram: { url: 'https://instagram.com/pousadaxangrila', handle: '@pousadaxangrila' },
    facebook: { url: 'https://facebook.com/pousadaxangrila', handle: 'pousadaxangrila' },
  },
  horarios: {
    checkin: { inicio: '14:00', fim: '22:00', label: '14:00 - 22:00' },
    checkout: { limite: '12:00', label: 'Até 12:00' },
    recepcao: { inicio: '08:00', fim: '22:00', label: '08:00 - 22:00' },
  },
  seo: {
    titleDefault: 'Pousada Xangrilá - Morros, São Luís - MA',
    titleTemplate: '%s | Pousada Xangrilá',
    description: 'Seu refúgio perfeito em São Luís. Casas e chalés com conforto e tranquilidade nos Morros. Reserve agora!',
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
