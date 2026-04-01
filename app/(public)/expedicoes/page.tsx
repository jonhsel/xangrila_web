'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bike, Truck, Ship, ChevronLeft, ChevronRight, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EXPEDICOES } from '@/lib/constants/expedicoes';
import { POUSADA, ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// ============================================
// ÍCONES POR EXPEDIÇÃO
// ============================================

const ICONES: Record<string, React.ComponentType<{ className?: string }>> = {
  Bike,
  Truck,
  Ship,
};

// ============================================
// CARD DE EXPEDIÇÃO
// ============================================

function ExpedicaoCard({ expedicao }: { expedicao: (typeof EXPEDICOES)[number] }) {
  const [imagemAtual, setImagemAtual] = useState(0);
  const Icone = ICONES[expedicao.icone] ?? Ship;

  const whatsappHref = `${POUSADA.whatsappLink}?text=${encodeURIComponent(expedicao.whatsappMsg)}`;

  function anterior() {
    setImagemAtual((i) => (i - 1 + expedicao.imagens.length) % expedicao.imagens.length);
  }

  function proximo() {
    setImagemAtual((i) => (i + 1) % expedicao.imagens.length);
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      {/* Galeria com placeholder por gradient */}
      <div className={cn('relative h-64 bg-gradient-to-br', expedicao.gradient)}>
        {/* Placeholder visual com gradiente + ícone */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <Icone className="h-16 w-16 opacity-80" />
          <p className="mt-2 text-sm font-medium opacity-70">Imagem em breve</p>
        </div>

        {/* Navegação do carrossel */}
        <button
          type="button"
          onClick={anterior}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50"
          aria-label="Imagem anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={proximo}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50"
          aria-label="Próxima imagem"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {expedicao.imagens.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setImagemAtual(idx)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                idx === imagemAtual ? 'bg-white w-4' : 'bg-white/50'
              )}
              aria-label={`Ir para imagem ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-xl font-bold">{expedicao.titulo}</h3>
          <p className="text-sm text-muted-foreground mt-1">{expedicao.subtitulo}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{expedicao.descricao}</p>
        <Button
          className="w-full bg-green-500 hover:bg-green-600 text-white"
          asChild
        >
          <Link href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" />
            Agendar pelo WhatsApp
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default function ExpedicoesPage() {
  const whatsappHref = `${POUSADA.whatsappLink}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre as expedições da Pousada Xangrilá.')}`;

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-16">

        {/* ── Seção 1: Hero ── */}
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Bike className="h-7 w-7 text-primary" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Truck className="h-7 w-7 text-primary" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Ship className="h-7 w-7 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl font-bold">Expedições</h1>
          <p className="text-xl text-muted-foreground max-w-xl">
            Aventuras inesquecíveis em Morros
          </p>

          <div className="max-w-2xl space-y-3 text-muted-foreground text-base">
            <p>
              A Pousada Xangrilá oferece experiências exclusivas para quem busca aventura
              e contato com a natureza. Nossas expedições são guiadas por profissionais
              experientes que conhecem cada trilha, rio e mirante da região.
            </p>
            <p>
              Escolha entre três modalidades de expedição e viva momentos inesquecíveis
              durante sua estadia em Morros. Todas as expedições incluem acompanhamento
              de guia, equipamentos de segurança e seguro.
            </p>
            <p>
              Para agendar sua expedição, entre em contato pelo WhatsApp ou fale
              diretamente na recepção da pousada.
            </p>
          </div>
        </div>

        {/* ── Seção 2: Cards ── */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {EXPEDICOES.map((expedicao) => (
            <ExpedicaoCard key={expedicao.id} expedicao={expedicao} />
          ))}
        </div>

        {/* ── Seção 3: CTA Final ── */}
        <div className="text-center space-y-4 rounded-2xl bg-muted/50 py-12 px-6">
          <h2 className="text-2xl font-bold">Quer saber mais sobre nossas expedições?</h2>
          <p className="text-muted-foreground">
            Entre em contato pelo WhatsApp ou venha até a recepção da pousada.
            Temos pacotes para todos os gostos!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button className="bg-green-500 hover:bg-green-600 text-white" size="lg" asChild>
              <Link href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Falar pelo WhatsApp
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={ROUTES.contato}>
                <Phone className="mr-2 h-5 w-5" />
                Entrar em Contato
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
