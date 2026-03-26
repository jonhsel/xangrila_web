import type { Metadata } from 'next';
import Link from 'next/link';
import { Sun, Clock, Users, Utensils, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POUSADA } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Day Use',
  description: `Aproveite o Day Use na ${POUSADA.nome}. Piscina, churrasqueira e muito lazer em ${POUSADA.endereco.completo}.`,
};

const cards = [
  {
    icon: Clock,
    title: 'Horário',
    description: '8h às 18h',
    detail: 'Todos os dias, sujeito à disponibilidade',
  },
  {
    icon: Users,
    title: 'Capacidade',
    description: 'Até 20 pessoas',
    detail: 'Ideal para grupos, famílias e eventos',
  },
  {
    icon: Utensils,
    title: 'Inclui',
    description: 'Piscina & Churrasqueira',
    detail: 'Área de lazer completa à sua disposição',
  },
];

export default function DayUsePage() {
  const whatsappMsg = encodeURIComponent(`Olá! Gostaria de reservar o Day Use na ${POUSADA.nome}.`);
  const whatsappHref = `https://wa.me/${POUSADA.whatsapp}?text=${whatsappMsg}`;

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-4xl space-y-10">
        {/* Hero */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
            <Sun className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold">Day Use</h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Aproveite um dia de lazer completo na {POUSADA.nome} sem precisar se hospedar. Piscina, natureza e tranquilidade esperando por você!
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.title} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-semibold">{card.description}</p>
                <p className="text-sm text-muted-foreground">{card.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 rounded-lg bg-muted/50 py-10 px-4">
          <h2 className="text-2xl font-bold">Interessado no Day Use?</h2>
          <p className="text-muted-foreground">Entre em contato pelo WhatsApp para verificar disponibilidade e valores.</p>
          <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white" asChild>
            <Link href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Reservar pelo WhatsApp
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
