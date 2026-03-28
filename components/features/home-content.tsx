'use client';

import Link from 'next/link';
import { MapPin, Home, Star, Wifi, Car, Coffee, Shield, Waves, TreePine, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POUSADA, ROUTES, TIPOS_ACOMODACAO } from '@/lib/constants';
import { HeroCarousel } from '@/components/features/hero-carousel';
import { PhotoGallery } from '@/components/features/photo-gallery';

const features = [
  {
    icon: MapPin,
    title: 'Localização Privilegiada',
    description: 'Situados nos Morros de São Luís, com acesso fácil e ambiente tranquilo longe da agitação da cidade.',
  },
  {
    icon: Home,
    title: 'Acomodações Variadas',
    description: 'Casas espaçosas para famílias e chalés aconchegantes para casais. Encontre o ambiente perfeito para você.',
  },
  {
    icon: Star,
    title: 'Atendimento Premium',
    description: 'Nossa equipe está disponível para garantir que sua estadia seja inesquecível do check-in ao check-out.',
  },
];

const amenities = [
  { icon: Waves, label: 'Piscina' },
  { icon: TreePine, label: 'Jardim' },
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: Car, label: 'Estacionamento' },
  { icon: Coffee, label: 'Café da Manhã' },
  { icon: Shield, label: 'Segurança' },
];

const testimonials = [
  {
    name: 'Ana Silva',
    rating: 5,
    text: 'Lugar maravilhoso! O chalé era perfeito, limpo e bem equipado. A piscina é ótima e o ambiente muito tranquilo. Voltaremos com certeza!',
    origem: 'São Paulo - SP',
  },
  {
    name: 'Carlos Mendes',
    rating: 5,
    text: 'Passamos o fim de semana na Casa Amarela com a família. Espaço incrível, cozinha completa e a churrasqueira fez sucesso com as crianças.',
    origem: 'Fortaleza - CE',
  },
  {
    name: 'Juliana Rocha',
    rating: 5,
    text: 'Viagem perfeita para lua de mel. Chalé romântico, atendimento impecável e café da manhã delicioso. Superou todas as expectativas!',
    origem: 'Brasília - DF',
  },
];

const galeriaFotos = [
  { src: '/images/galeria/piscina.svg', alt: 'Piscina', caption: 'Piscina' },
  { src: '/images/galeria/jardim.svg', alt: 'Jardim', caption: 'Jardins' },
  { src: '/images/galeria/recepcao.svg', alt: 'Recepção', caption: 'Recepção' },
  { src: '/images/galeria/cafe.svg', alt: 'Café da manhã', caption: 'Café da manhã' },
  { src: '/images/galeria/area-externa.svg', alt: 'Área externa', caption: 'Área externa' },
  { src: '/images/galeria/churrasqueira.svg', alt: 'Churrasqueira', caption: 'Churrasqueira' },
  { src: '/images/galeria/estacionamento.svg', alt: 'Estacionamento', caption: 'Estacionamento' },
  { src: '/images/galeria/noturna.svg', alt: 'Vista noturna', caption: 'Vista noturna' },
];

export function HomeContent() {
  return (
    <div className="flex flex-col">
      {/* Hero com Carrossel */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <HeroCarousel
          images={[
            { src: '/images/hero/hero-1.svg', alt: 'Fachada da Pousada Xangrilá' },
            { src: '/images/hero/hero-2.svg', alt: 'Piscina da Pousada Xangrilá' },
            { src: '/images/hero/hero-3.svg', alt: 'Área externa da Pousada Xangrilá' },
            { src: '/images/hero/hero-4.svg', alt: 'Vista panorâmica da Pousada Xangrilá' },
          ]}
          interval={5000}
        />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white">
            Bem-vindo à
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {POUSADA.nomeCompleto}
          </h1>
          <p className="text-lg text-white/80 sm:text-xl">
            {POUSADA.slogan}
          </p>
          <p className="text-white/70">{POUSADA.descricao}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href={ROUTES.reservar}>Reservar Agora</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
              <Link href={ROUTES.dayUse}>Day Use</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Por que escolher a Pousada Xangri-lá?</h2>
            <p className="mt-2 text-muted-foreground">Experiências únicas para cada tipo de hóspede</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Acomodações */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Nossas Acomodações</h2>
            <p className="mt-2 text-muted-foreground">Escolha o espaço ideal para a sua estadia</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Object.values(TIPOS_ACOMODACAO).map((tipo) => (
              <Card key={tipo.slug} className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${tipo.gradient}`} />
                <CardHeader>
                  <CardTitle className="text-lg">{tipo.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tipo.descricaoCurta}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-1.5">
                    {tipo.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs text-muted-foreground">
                    {tipo.totalUnidades} unidade{tipo.totalUnidades > 1 ? 's' : ''} disponível{tipo.totalUnidades > 1 ? 'eis' : ''}
                  </div>
                  <Button className="w-full" size="sm" asChild>
                    <Link href={ROUTES.reservar}>Reservar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="mb-2 text-3xl font-bold">Comodidades</h2>
          <p className="mb-10 text-muted-foreground">Tudo que você precisa para uma estadia perfeita</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {amenities.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 rounded-lg bg-background p-4 shadow-sm">
                <item.icon className="h-7 w-7 text-primary" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria de Fotos */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Conheça a Pousada</h2>
            <p className="mt-2 text-muted-foreground">
              Um pouco do que espera por você
            </p>
          </div>
          <PhotoGallery images={galeriaFotos} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">O que nossos hóspedes dizem</h2>
            <p className="mt-2 text-muted-foreground">Avaliações reais de quem já ficou conosco</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex gap-1" role="img" aria-label={`Avaliação ${t.rating} de 5 estrelas`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    ))}
                    <span className="sr-only">{t.rating} de 5 estrelas</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.origem}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16 px-4 text-primary-foreground">
        <div className="container mx-auto max-w-2xl text-center space-y-6">
          <h2 className="text-3xl font-bold">Pronto para sua próxima aventura?</h2>
          <p className="text-primary-foreground/80">
            Reserve agora e garanta sua estadia na Pousada Xangri-lá. Momentos inesquecíveis esperam por você!
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href={ROUTES.reservar}>Fazer Reserva</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href={POUSADA.whatsappLink} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
