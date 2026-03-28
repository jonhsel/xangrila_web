'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIPOS_ACOMODACAO } from '@/lib/constants/acomodacoes';
import { POUSADA, ROUTES } from '@/lib/constants/pousada';
import {
  CheckCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  ScrollText,
  Clock,
  AlertTriangle,
  Bed,
} from 'lucide-react';

// Imagens por tipo de acomodação (substituir por fotos reais)
const imagensAcomodacoes: Record<string, { src: string; alt: string }[]> = {
  casa: [
    { src: '/images/acomodacoes/casa-1.svg', alt: 'Casa Amarela - Exterior' },
    { src: '/images/acomodacoes/casa-2.svg', alt: 'Casa Amarela - Interior' },
    { src: '/images/acomodacoes/casa-3.svg', alt: 'Casa Vermelha - Exterior' },
    { src: '/images/acomodacoes/casa-4.svg', alt: 'Casa - Cozinha' },
  ],
  chale_com_cozinha: [
    { src: '/images/acomodacoes/chale-cc-1.svg', alt: 'Chalé com cozinha - Exterior' },
    { src: '/images/acomodacoes/chale-cc-2.svg', alt: 'Chalé com cozinha - Interior' },
    { src: '/images/acomodacoes/chale-cc-3.svg', alt: 'Chalé com cozinha - Cozinha' },
  ],
  chale_sem_cozinha: [
    { src: '/images/acomodacoes/chale-sc-1.svg', alt: 'Chalé sem cozinha - Exterior' },
    { src: '/images/acomodacoes/chale-sc-2.svg', alt: 'Chalé sem cozinha - Interior' },
    { src: '/images/acomodacoes/chale-sc-3.svg', alt: 'Chalé sem cozinha - Banheiro' },
  ],
};

// Regras da pousada
const regrasPousada = [
  {
    icon: Clock,
    titulo: 'Horários',
    regras: [
      `Check-in: ${POUSADA.horarios.checkin.label}`,
      `Check-out: ${POUSADA.horarios.checkout.label}`,
      `Recepção: ${POUSADA.horarios.recepcao.label}`,
    ],
  },
  {
    icon: Users,
    titulo: 'Hóspedes',
    regras: [
      'Respeitar a capacidade máxima de cada acomodação',
      'Visitas devem ser comunicadas na recepção',
      'Menores de 18 anos devem estar acompanhados de responsável',
    ],
  },
  {
    icon: AlertTriangle,
    titulo: 'Convivência',
    regras: [
      'Silêncio após as 22h',
      'Não é permitido fumar dentro das acomodações',
      'Animais de estimação: consulte a disponibilidade',
      'Mantenha a acomodação organizada',
    ],
  },
  {
    icon: Bed,
    titulo: 'Acomodações',
    regras: [
      'As chaves devem ser devolvidas no check-out',
      'Qualquer dano deve ser reportado à recepção',
      'Objetos esquecidos serão guardados por até 30 dias',
      'Troca de roupa de cama sob consulta',
    ],
  },
];

export function AcomodacoesContent() {
  const [lightbox, setLightbox] = useState<{
    images: { src: string; alt: string }[];
    index: number;
  } | null>(null);

  return (
    <div className="flex flex-col">
      {/* Hero da página */}
      <section className="bg-muted/30 py-16 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold mb-4">Nossas Acomodações</h1>
          <p className="text-muted-foreground text-lg">
            Espaços pensados para o seu conforto. Escolha a opção ideal para a sua estadia.
          </p>
        </div>
      </section>

      {/* Cards de acomodação com galeria */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl space-y-16">
          {Object.entries(TIPOS_ACOMODACAO).map(([key, tipo]) => {
            const imagens = imagensAcomodacoes[key] || [];

            return (
              <div key={key} className="space-y-6">
                {/* Header do tipo */}
                <div className="flex items-center gap-4">
                  <div className={`h-1 w-12 rounded bg-gradient-to-r ${tipo.gradient}`} />
                  <div>
                    <h2 className="text-2xl font-bold">{tipo.label}</h2>
                    <p className="text-muted-foreground">{tipo.descricaoCurta}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Galeria de imagens */}
                  <div className="grid grid-cols-2 gap-2">
                    {imagens.slice(0, 4).map((img, i) => (
                      <button
                        key={img.src}
                        onClick={() => setLightbox({ images: imagens, index: i })}
                        className="group relative aspect-[4/3] overflow-hidden rounded-lg"
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                      </button>
                    ))}
                  </div>

                  {/* Detalhes */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">{tipo.label}</CardTitle>
                        <Badge variant="outline">
                          <Users className="mr-1 h-3 w-3" />
                          Até {tipo.capacidadeMaxima} pessoa{tipo.capacidadeMaxima > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {tipo.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="text-sm text-muted-foreground">
                        {tipo.totalUnidades} unidade{tipo.totalUnidades > 1 ? 's' : ''} disponível{tipo.totalUnidades > 1 ? 'eis' : ''}
                        {tipo.unidades.length > 0 && (
                          <span className="ml-1">
                            ({tipo.unidades.join(', ')})
                          </span>
                        )}
                      </div>

                      <Button className="w-full" asChild>
                        <Link href={ROUTES.reservar}>Reservar {tipo.label}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Regras da Pousada */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <ScrollText className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Regras da Pousada</h2>
            </div>
            <p className="text-muted-foreground">
              Para garantir uma estadia agradável para todos os nossos hóspedes
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {regrasPousada.map((grupo) => (
              <Card key={grupo.titulo}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <grupo.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{grupo.titulo}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {grupo.regras.map((regra) => (
                      <li key={regra} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                        {regra}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold">Encontrou a acomodação ideal?</h2>
          <p className="text-muted-foreground">
            Reserve agora e garanta sua estadia na Pousada Xangrilá
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href={ROUTES.reservar}>Reservar Agora</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href={POUSADA.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar pelo WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Fechar"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox({
                ...lightbox,
                index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length,
              });
            }}
            className="absolute left-4 text-white hover:text-gray-300 z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-10 w-10" />
          </button>
          <div
            className="relative max-w-4xl max-h-[80vh] w-full mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.images[lightbox.index].src}
              alt={lightbox.images[lightbox.index].alt}
              width={1200}
              height={800}
              className="object-contain w-full h-full max-h-[80vh]"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox({
                ...lightbox,
                index: (lightbox.index + 1) % lightbox.images.length,
              });
            }}
            className="absolute right-4 text-white hover:text-gray-300 z-10"
            aria-label="Próxima"
          >
            <ChevronRight className="h-10 w-10" />
          </button>
        </div>
      )}
    </div>
  );
}
