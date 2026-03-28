'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Phone, Key, Loader2, ArrowLeft } from 'lucide-react';
import { POUSADA } from '@/lib/constants/pousada';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [telefone, setTelefone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace('/minhas-reservas');
      }
    };
    checkAuth();
  }, []);

  // Timer de reenvio
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const formatarTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handleEnviarOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = telefone.replace(/\D/g, '');

    if (cleaned.length < 10 || cleaned.length > 11) {
      toast.error('Informe um telefone válido com DDD');
      return;
    }

    setLoading(true);

    try {
      const telefoneInternacional = '+55' + cleaned;

      const { error } = await supabase.auth.signInWithOtp({
        phone: telefoneInternacional,
        options: { channel: 'sms' },
      });

      if (error) throw error;

      toast.success('Código enviado via SMS!');
      setStep('otp');
      setTimer(60);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      const telefoneInternacional = '+55' + telefone.replace(/\D/g, '');

      const { data, error } = await supabase.auth.verifyOtp({
        phone: telefoneInternacional,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      // Vincular/criar cliente em clientes_xngrl
      await fetch('/api/auth/vincular-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: telefoneInternacional }),
      });

      toast.success('Login realizado com sucesso!');
      router.push('/minhas-reservas');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    if (timer > 0) return;
    setLoading(true);

    try {
      const telefoneInternacional = '+55' + telefone.replace(/\D/g, '');

      const { error } = await supabase.auth.signInWithOtp({
        phone: telefoneInternacional,
        options: { channel: 'sms' },
      });

      if (error) throw error;

      toast.success('Novo código enviado!');
      setTimer(60);
      setOtp('');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reenviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{POUSADA.nome}</h1>
          <p className="text-muted-foreground">
            Acesse suas reservas
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleEnviarOTP} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="telefone">Número de WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(98) 99999-9999"
                  value={formatarTelefone(telefone)}
                  onChange={(e) => setTelefone(e.target.value.replace(/\D/g, ''))}
                  className="pl-10"
                  required
                  maxLength={15}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use o mesmo número da sua reserva
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Código'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao site
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerificarOTP} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">Código de Verificação</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="pl-10 text-center text-2xl tracking-widest"
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Enviamos um código de 6 dígitos para{' '}
                <strong>{formatarTelefone(telefone)}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Código'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleReenviar}
                disabled={timer > 0 || loading}
              >
                {timer > 0 ? `Reenviar em ${timer}s` : 'Reenviar código'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
              >
                Trocar número
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
