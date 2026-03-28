'use client';

import { useState, useEffect } from 'react';
import { Smartphone, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================
// TIPOS
// ============================================

interface ClienteVinculado {
  clienteId: number;
  nome: string;
  email: string | null;
  telefone: string;
  precisaCompletarPerfil: boolean;
}

interface AuthGateProps {
  onAuthenticated: (cliente: ClienteVinculado) => void;
}

type Etapa = 'telefone' | 'codigo';

// ============================================
// COMPONENTE
// ============================================

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [etapa, setEtapa] = useState<Etapa>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [tempoReenvio, setTempoReenvio] = useState(0);

  const supabase = createClient();

  // Timer regressivo para reenvio
  useEffect(() => {
    if (tempoReenvio <= 0) return;
    const timer = setTimeout(() => setTempoReenvio((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [tempoReenvio]);

  // Formata telefone com máscara (XX) XXXXX-XXXX
  function aplicarMascara(valor: string): string {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  function telefoneParaE164(tel: string): string {
    const numeros = tel.replace(/\D/g, '');
    return `+55${numeros}`;
  }

  function telefoneValido(tel: string): boolean {
    return tel.replace(/\D/g, '').length >= 10;
  }

  async function enviarCodigo() {
    if (!telefoneValido(telefone)) {
      toast.error('Digite um telefone válido com DDD.');
      return;
    }

    setCarregando(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: telefoneParaE164(telefone),
      });

      if (error) {
        toast.error(error.message || 'Erro ao enviar código. Tente novamente.');
        return;
      }

      toast.success('Código enviado por SMS!');
      setEtapa('codigo');
      setTempoReenvio(60);
    } catch {
      toast.error('Erro ao enviar código. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function verificarCodigo() {
    if (codigo.length !== 6) {
      toast.error('O código deve ter 6 dígitos.');
      return;
    }

    setCarregando(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: telefoneParaE164(telefone),
        token: codigo,
        type: 'sms',
      });

      if (error) {
        toast.error(error.message || 'Código inválido. Tente novamente.');
        return;
      }

      toast.success('Telefone verificado com sucesso!');

      // Vincular cliente e verificar se perfil precisa ser completado
      try {
        const resp = await fetch('/api/auth/vincular-cliente', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone: telefoneParaE164(telefone) }),
        });

        if (resp.ok) {
          const dados = await resp.json();
          const precisaCompletarPerfil =
            dados.novo === true ||
            !dados.nome ||
            dados.nome === telefoneParaE164(telefone) ||
            dados.nome === telefone.replace(/\D/g, '');

          onAuthenticated({
            clienteId: dados.clienteId,
            nome: dados.nome,
            email: dados.email,
            telefone: telefone,
            precisaCompletarPerfil,
          });
          return;
        }
      } catch {
        // falha silenciosa — continua sem dados do cliente
      }

      // Fallback sem dados de cliente
      onAuthenticated({
        clienteId: 0,
        nome: '',
        email: null,
        telefone: telefone,
        precisaCompletarPerfil: false,
      });
    } catch {
      toast.error('Erro ao verificar código. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {etapa === 'telefone' ? 'Verifique seu telefone' : 'Digite o código'}
          </CardTitle>
          <CardDescription>
            {etapa === 'telefone'
              ? 'Para sua segurança, enviaremos um código de verificação via SMS.'
              : `Enviamos um código de 6 dígitos para ${aplicarMascara(telefone)}.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {etapa === 'telefone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone com DDD</Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(98) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(aplicarMascara(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && enviarCodigo()}
                  disabled={carregando}
                  autoFocus
                />
              </div>

              <Button
                className="w-full"
                onClick={enviarCodigo}
                disabled={carregando || !telefoneValido(telefone)}
              >
                {carregando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar código'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="codigo">Código de verificação</Label>
                <Input
                  id="codigo"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && verificarCodigo()}
                  disabled={carregando}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                className="w-full"
                onClick={verificarCodigo}
                disabled={carregando || codigo.length !== 6}
              >
                {carregando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar código'
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {tempoReenvio > 0 ? (
                  <span>Reenviar em {tempoReenvio}s</span>
                ) : (
                  <button
                    type="button"
                    className="text-primary underline-offset-4 hover:underline"
                    onClick={enviarCodigo}
                    disabled={carregando}
                  >
                    Reenviar código
                  </button>
                )}
              </div>

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setEtapa('telefone');
                  setCodigo('');
                }}
                disabled={carregando}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Trocar telefone
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
