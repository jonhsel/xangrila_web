'use client';

import Link from 'next/link';
import {
  Home,
  Waves,
  Utensils,
  Wifi,
  TreePine,
  Star,
  Clock,
  CreditCard,
  Users,
  Shield,
  ChevronRight,
  MapPin,
  Baby,
  AlertCircle,
  CheckCircle2,
  Sailboat,
} from 'lucide-react';

// ── Sub-componentes internos ──────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 transition-colors group-hover:bg-green-700 group-hover:text-white">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-center text-sm text-gray-500">{label}</p>
    </div>
  );
}

function AcomodacaoCard({
  nome,
  preco,
  capacidade,
  temCozinha,
  destaque,
}: {
  nome: string;
  preco: string;
  capacidade: string;
  temCozinha: boolean | null;
  destaque?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-lg ${
        destaque
          ? 'border-green-300 bg-green-50 shadow-md'
          : 'border-gray-200 bg-white'
      }`}
    >
      {destaque && (
        <span className="absolute -top-3 left-4 rounded-full bg-green-700 px-3 py-0.5 text-xs font-semibold text-white">
          Destaque
        </span>
      )}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h4 className="font-semibold text-gray-900">{nome}</h4>
        <span className="shrink-0 rounded-full bg-green-700 px-3 py-1 text-sm font-bold text-white">
          {preco}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          {capacidade}
        </span>
        {temCozinha === true && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            Com cozinha
          </span>
        )}
        {temCozinha === false && (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            Sem cozinha
          </span>
        )}
      </div>
    </div>
  );
}

function ComodidadeItem({
  icon: Icon,
  titulo,
  descricao,
}: {
  icon: React.ElementType;
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-gray-900">{titulo}</p>
        <p className="mt-1 text-sm text-gray-500">{descricao}</p>
      </div>
    </div>
  );
}

function PoliticaItem({
  icon: Icon,
  titulo,
  itens,
  corIcone = 'text-green-700',
  bgIcone = 'bg-green-50',
}: {
  icon: React.ElementType;
  titulo: string;
  itens: string[];
  corIcone?: string;
  bgIcone?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bgIcone} ${corIcone}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="font-semibold text-gray-900">{titulo}</h3>
      </div>
      <ul className="space-y-2">
        {itens.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Seções ────────────────────────────────────────────────────────────────────

function HeroSobre() {
  return (
    <section className="relative overflow-hidden bg-[#1a3a2a] py-24 md:py-36">
      {/* Blobs decorativos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#74c69d]/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-[#2d6a4f]/40 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#74c69d]/30 to-transparent [transform:rotate(-12deg)_scaleX(2)]" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        {/* Badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#74c69d]/40 bg-[#74c69d]/10 px-4 py-1.5 text-sm text-[#74c69d]">
          <MapPin className="h-4 w-4" />
          Morros, Maranhão — Brasil
        </span>

        {/* Título */}
        <h1 className="font-serif text-4xl font-bold text-white md:text-6xl">
          Sobre a{' '}
          <span className="text-[#74c69d]">Pousada Xangri‑lá</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          Um refúgio de tranquilidade e natureza às margens do rio, em Morros,
          Maranhão. Conheça nossa história, acomodações e tudo que preparamos
          para tornar sua estadia inesquecível.
        </p>

        {/* Linha decorativa */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#74c69d]/60" />
          <Waves className="h-6 w-6 text-[#74c69d]/60" />
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#74c69d]/60" />
        </div>
      </div>
    </section>
  );
}

function QuemSomos() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
            Quem somos
          </span>
        </div>
        <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 md:text-4xl">
          Natureza, conforto e hospitalidade
        </h2>

        {/* Stats */}
        <div className="mb-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={Home} value="2" label="Casas de Alvenaria" />
          <StatCard icon={TreePine} value="9" label="Chalés de Madeira" />
          <StatCard icon={Users} value="~40" label="Hóspedes (capacidade)" />
          <StatCard icon={Sailboat} value="7" label="Caiaques Gratuitos" />
        </div>

        {/* Parágrafos */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4 text-gray-600">
            <p>
              A Pousada Xangri-lá oferece duas{' '}
              <strong className="text-gray-800">casas de alvenaria</strong> que
              comportam até <strong className="text-gray-800">6 pessoas</strong>{' '}
              cada, além de{' '}
              <strong className="text-gray-800">9 chalés de madeira</strong> que
              acomodam de duas a três pessoas.
            </p>
            <p>
              Para descansar, há{' '}
              <strong className="text-gray-800">
                redes por toda a área da varanda
              </strong>{' '}
              dos chalés e um{' '}
              <strong className="text-gray-800">
                quiosque às margens do rio
              </strong>{' '}
              com churrasqueira e cozinha gourmet.
            </p>
          </div>
          <div className="space-y-4 text-gray-600">
            <p>
              A estrutura conta com{' '}
              <strong className="text-gray-800">
                churrasqueira e forno à lenha
              </strong>{' '}
              próximos às casas de alvenaria.
            </p>
            <p>
              Oferecemos{' '}
              <strong className="text-gray-800">Wi-Fi gratuito</strong> em toda
              a propriedade e{' '}
              <strong className="text-gray-800">
                7 caiaques disponíveis sem custo adicional
              </strong>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AcomodacoesPrecos() {
  const casas = [
    { nome: 'Casa Amarela', preco: 'R$ 1.000/diária', capacidade: 'até 6 pessoas', temCozinha: null as null, destaque: true },
    { nome: 'Casa Vermelha', preco: 'R$ 1.000/diária', capacidade: 'até 6 pessoas', temCozinha: null as null, destaque: true },
  ];

  const chales = [
    { nome: 'Chalé 01', preco: 'R$ 500/diária', capacidade: '2 pessoas', temCozinha: true },
    { nome: 'Chalé 02', preco: 'R$ 350/diária', capacidade: '2 pessoas', temCozinha: false },
    { nome: 'Chalé 03', preco: 'R$ 500/diária', capacidade: '2 pessoas', temCozinha: true },
    { nome: 'Chalé 04', preco: 'R$ 500/diária', capacidade: '3 pessoas', temCozinha: false },
    { nome: 'Chalé 05', preco: 'R$ 500/diária', capacidade: '3 pessoas', temCozinha: false },
    { nome: 'Chalé 06', preco: 'R$ 600/diária', capacidade: '3 pessoas', temCozinha: true },
    { nome: 'Chalé 07', preco: 'R$ 350/diária', capacidade: '2 pessoas', temCozinha: false },
    { nome: 'Chalé 08', preco: 'R$ 500/diária', capacidade: '3 pessoas', temCozinha: false },
    { nome: 'Chalé 09', preco: 'R$ 500/diária', capacidade: '2 pessoas', temCozinha: true },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
            Acomodações & Preços
          </span>
        </div>
        <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 md:text-4xl">
          Escolha sua hospedagem
        </h2>

        {/* Casas */}
        <div className="mb-10">
          <h3 className="mb-5 flex items-center gap-2 text-xl font-semibold text-gray-800">
            <Home className="h-5 w-5 text-green-700" />
            Casas de Alvenaria
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {casas.map((c) => (
              <AcomodacaoCard key={c.nome} {...c} />
            ))}
          </div>
        </div>

        {/* Chalés */}
        <div>
          <h3 className="mb-5 flex items-center gap-2 text-xl font-semibold text-gray-800">
            <TreePine className="h-5 w-5 text-green-700" />
            Chalés de Madeira
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {chales.map((c) => (
              <AcomodacaoCard key={c.nome} {...c} />
            ))}
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          * Todos os chalés e casas possuem ar-condicionado, banheiro com
          chuveiro elétrico, amenidades de banho gratuitas e TV de tela plana
          com canais a cabo.
        </p>
      </div>
    </section>
  );
}

function ComodidadesServicos() {
  const itens = [
    {
      icon: Wifi,
      titulo: 'Wi-Fi Gratuito',
      descricao: 'Disponível em todos os quartos e nas principais áreas comuns da pousada.',
    },
    {
      icon: Utensils,
      titulo: 'Café da Manhã Incluso',
      descricao: 'Servido das 8h30 às 10h. Restaurante disponível para almoço e jantar.',
    },
    {
      icon: Sailboat,
      titulo: '7 Caiaques Gratuitos',
      descricao: 'Explore o rio à vontade com os caiaques disponibilizados sem custo adicional.',
    },
    {
      icon: Star,
      titulo: 'Passeio de Quadriciclo',
      descricao: 'Tour guiado das 9h às 17h. Reserva antecipada necessária. Valor: R$ 400,00.',
    },
    {
      icon: Waves,
      titulo: 'Quiosque às Margens do Rio',
      descricao: 'Churrasqueira, cozinha gourmet e redes para relaxar com vista para o rio.',
    },
    {
      icon: Shield,
      titulo: 'Segurança & Limpeza',
      descricao:
        'Extintor de incêndio, kit de primeiros socorros. Limpeza reforçada com desinfetantes certificados.',
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
            Comodidades & Serviços
          </span>
        </div>
        <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 md:text-4xl">
          Tudo para sua estadia perfeita
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {itens.map((item) => (
            <ComodidadeItem key={item.titulo} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Politicas() {
  const cards = [
    {
      icon: Clock,
      titulo: 'Check-in & Check-out',
      corIcone: 'text-green-700',
      bgIcone: 'bg-green-50',
      itens: [
        'Check-in a partir das 14h00 (funcionário recepciona na chegada).',
        'Idade mínima para check-in: 18 anos.',
        'Check-out até as 12h00.',
        'Check-in tardio sujeito à disponibilidade.',
        'Camas e redes extras mediante solicitação.',
      ],
    },
    {
      icon: CreditCard,
      titulo: 'Formas de Pagamento',
      corIcone: 'text-green-700',
      bgIcone: 'bg-green-50',
      itens: [
        'Pagamento 100% via PIX ou transferência bancária.',
        'Dados bancários informados no ato da reserva.',
        'Documento de identidade com foto pode ser solicitado no check-in.',
        'Objetos quebrados ou extraviados serão cobrados pelo valor de mercado.',
      ],
    },
    {
      icon: AlertCircle,
      titulo: 'Cancelamentos',
      corIcone: 'text-amber-600',
      bgIcone: 'bg-amber-50',
      itens: [
        'Alteração de data com mínimo 7 dias de antecedência: valor fica como crédito por 180 dias.',
        'Cancelamento com menos de 3 dias antes da hospedagem: perda do valor total pago.',
        'Reagendamento: valor da diária conforme o período remarcado.',
      ],
    },
    {
      icon: CheckCircle2,
      titulo: 'Regras Gerais',
      corIcone: 'text-green-700',
      bgIcone: 'bg-green-50',
      itens: [
        'Café da manhã incluso: 8h30 às 10h.',
        'Proibido trazer bebidas externas para as áreas de convivência.',
        'Pets não permitidos na hospedagem e no restaurante (permitidos no Day Use e áreas comuns).',
        'Finais de semana e feriados: reserva mínima de 2 diárias.',
      ],
    },
    {
      icon: Baby,
      titulo: 'Viagens com Crianças',
      corIcone: 'text-blue-600',
      bgIcone: 'bg-blue-50',
      itens: [
        'Crianças de até 18 anos: apresentar certidão de nascimento e documento com foto no check-in.',
        'Viagem com apenas um dos pais: carta de autorização com firma reconhecida em cartório, além dos documentos da criança.',
        'Caso os responsáveis não possam assinar, será necessária autorização judicial.',
      ],
    },
    {
      icon: Shield,
      titulo: 'Limpeza & Higiene',
      corIcone: 'text-green-700',
      bgIcone: 'bg-green-50',
      itens: [
        'Limpeza reforçada com desinfetantes certificados.',
        'Roupas de cama e toalhas lavadas a no mínimo 60°C.',
        'Superfícies de alto contato higienizadas diariamente.',
        'Arrumação do chalé/casa somente a pedido do hóspede.',
        'Troca de toalhas a partir da terceira diária.',
      ],
    },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
            Políticas
          </span>
        </div>
        <h2 className="mb-12 text-center font-serif text-3xl font-bold text-gray-900 md:text-4xl">
          Informações importantes
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <PoliticaItem key={card.titulo} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTAFinal() {
  return (
    <section className="bg-[#1a3a2a] py-20">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <Waves className="mx-auto mb-6 h-10 w-10 text-[#74c69d]/60" />
        <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">
          Pronto para conhecer o Xangri‑lá?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
          Reserve agora mesmo e venha viver dias de paz, natureza e
          tranquilidade às margens do rio em Morros, Maranhão.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/reservar"
            className="inline-flex items-center justify-center rounded-xl bg-[#74c69d] px-8 py-3 font-semibold text-[#1a3a2a] transition hover:bg-[#52b788]"
          >
            Fazer Reserva
          </Link>
          <Link
            href="/contato"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Fale Conosco
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-white/60">
          <a
            href="https://instagram.com/pousadaxangrilademorros"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition hover:text-[#74c69d]"
          >
            {/* Instagram SVG inline */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
            @pousadaxangrilademorros
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SobreContent() {
  return (
    <main>
      <HeroSobre />
      <QuemSomos />
      <AcomodacoesPrecos />
      <ComodidadesServicos />
      <Politicas />
      <CTAFinal />
    </main>
  );
}
