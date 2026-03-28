'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Mail, Loader2 } from 'lucide-react';

interface ClientProfileFormProps {
  clienteId: number;
  telefone: string;
  nomeAtual: string | null;
  onCompleted: () => void;
}

export function ClientProfileForm({
  clienteId,
  telefone,
  nomeAtual,
  onCompleted,
}: ClientProfileFormProps) {
  const [nome, setNome] = useState(
    nomeAtual && nomeAtual !== telefone ? nomeAtual : ''
  );
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || nome.trim().length < 3) {
      toast.error('Informe seu nome completo');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/atualizar-perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId,
          nome: nome.trim(),
          email: email.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('Dados salvos com sucesso!');
      onCompleted();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Complete seu cadastro</h2>
        <p className="text-sm text-muted-foreground">
          Precisamos de algumas informações para prosseguir com a reserva
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome completo *</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="pl-10"
              required
              minLength={3}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Usado para envio da confirmação da reserva
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Continuar para reserva'
          )}
        </Button>
      </form>
    </Card>
  );
}
