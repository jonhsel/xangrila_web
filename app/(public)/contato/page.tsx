'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Phone, Mail, MapPin, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { POUSADA } from '@/lib/constants';

const contactCards = [
  {
    icon: Phone,
    title: 'Telefone',
    value: POUSADA.telefone,
    href: `tel:${POUSADA.telefone.replace(/\D/g, '')}`,
  },
  {
    icon: Mail,
    title: 'E-mail',
    value: POUSADA.email,
    href: `mailto:${POUSADA.email}`,
  },
  {
    icon: MapPin,
    title: 'Endereço',
    value: POUSADA.endereco.completo,
    href: POUSADA.googleMapsUrl,
  },
];

export default function ContatoPage() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', mensagem: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome || !form.mensagem) {
      toast.error('Preencha nome e mensagem.');
      return;
    }

    const text = encodeURIComponent(
      `Olá! Me chamo *${form.nome}*.\n\n${form.mensagem}${form.email ? `\n\nE-mail: ${form.email}` : ''}${form.telefone ? `\nTelefone: ${form.telefone}` : ''}`
    );
    window.open(`https://wa.me/${POUSADA.whatsapp}?text=${text}`, '_blank');
    toast.success('Redirecionando para o WhatsApp!');
  }

  return (
    <div className="py-12 px-4">
      <div className="container mx-auto max-w-5xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Entre em Contato</h1>
          <p className="text-muted-foreground">Estamos prontos para ajudar você a planejar sua estadia perfeita.</p>
        </div>

        {/* Banner WhatsApp */}
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Resposta mais rápida pelo WhatsApp! Nossa equipe responde em minutos.</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Envie sua mensagem</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    placeholder="Seu nome completo"
                    value={form.nome}
                    onChange={handleChange}
                    aria-required="true"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    placeholder="(98) 99999-9999"
                    value={form.telefone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mensagem">Mensagem *</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    placeholder="Como podemos ajudar?"
                    rows={4}
                    value={form.mensagem}
                    onChange={handleChange}
                    aria-required="true"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar pelo WhatsApp
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cards de contato + horários */}
          <div className="space-y-4">
            {contactCards.map((card) => (
              <Card key={card.title}>
                <CardContent className="flex items-start gap-3 pt-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <card.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <a
                      href={card.href}
                      target={card.title === 'Endereço' ? '_blank' : undefined}
                      rel={card.title === 'Endereço' ? 'noopener noreferrer' : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {card.value}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Horários */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Horários de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{POUSADA.horarios.checkin.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{POUSADA.horarios.checkout.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recepção</span>
                  <span className="font-medium">{POUSADA.horarios.recepcao.label}</span>
                </div>
              </CardContent>
            </Card>

            {/* Mapa placeholder */}
            <div className="rounded-lg bg-muted h-36 flex items-center justify-center text-muted-foreground text-sm border">
              <a
                href={POUSADA.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Ver no Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
