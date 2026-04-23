'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react';

interface TelefoneVerificacaoProps {
  redirectTo?: string;
  userName?: string;
}

type Etapa = 'telefone' | 'codigo' | 'sucesso';

export function TelefoneVerificacao({ redirectTo = '/minhas-reservas', userName }: TelefoneVerificacaoProps) {
  const [etapa, setEtapa] = useState<Etapa>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11);
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  };

  const telefoneE164 = () => `+55${telefone.replace(/\D/g, '')}`;

  const handleEnviarOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const nums = telefone.replace(/\D/g, '');
    if (nums.length < 10 || nums.length > 11) {
      toast.error('Telefone inválido. Use o formato (DD) 99999-9999');
      return;
    }

    setLoading(true);
    try {
      // Envia SMS via Twilio Verify server-side — NÃO usa supabase.auth.signInWithOtp()
      // Isso preserva a sessão Google/Email ativa
      const response = await fetch('/api/auth/verificar-telefone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneE164() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao enviar código');
        return;
      }

      toast.success(`Código enviado para ${formatarTelefone(telefone)}`);
      setEtapa('codigo');
      setTimer(60);
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      // Verifica código via Twilio e salva em clientes_xngrl com dados da sessão Google/Email ativa
      // NÃO usa supabase.auth.verifyOtp() para não substituir a sessão
      const response = await fetch('/api/auth/completar-perfil-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneE164(), codigo }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Código inválido ou expirado. Tente novamente.');
        return;
      }

      toast.success('Telefone verificado com sucesso!');
      setEtapa('sucesso');

      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 1500);
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (etapa === 'sucesso') {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <div>
          <p className="font-semibold text-lg">Tudo certo!</p>
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Smartphone className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-semibold">
          {userName ? `Olá, ${userName.split(' ')[0]}!` : 'Quase lá!'}
        </h2>
        <p className="text-muted-foreground text-sm">
          Para finalizar, precisamos verificar seu telefone.
          Ele será usado para confirmações de reserva por WhatsApp.
        </p>
      </div>

      {etapa === 'telefone' ? (
        <form onSubmit={handleEnviarOTP} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="telefone-social">WhatsApp</Label>
            <Input
              id="telefone-social"
              type="tel"
              placeholder="(98) 99999-9999"
              value={formatarTelefone(telefone)}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 11) setTelefone(nums);
              }}
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground">
              Enviaremos um código de verificação via SMS
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || telefone.replace(/\D/g, '').length < 10}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar código
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerificarCodigo} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="codigo-social">Código recebido</Label>
            <Input
              id="codigo-social"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={codigo}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 6) setCodigo(nums);
              }}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              required
            />
            <p className="text-xs text-muted-foreground text-center">
              Código enviado para {formatarTelefone(telefone)}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || codigo.length !== 6}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar código
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setEtapa('telefone'); setCodigo(''); }}
              className="text-muted-foreground hover:text-foreground"
            >
              Trocar telefone
            </button>
            {timer > 0 ? (
              <span className="text-muted-foreground">Reenviar em {timer}s</span>
            ) : (
              <button
                type="button"
                onClick={() => handleEnviarOTP()}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Reenviar código
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
