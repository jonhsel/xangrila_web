'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Smartphone } from 'lucide-react';

interface OtpLoginFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

type Etapa = 'telefone' | 'codigo';

export function OtpLoginForm({ onSuccess }: OtpLoginFormProps) {
  const [etapa, setEtapa] = useState<Etapa>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const supabase = createClient();

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '');
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    if (nums.length <= 11) return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
  };

  const paraE164 = (tel: string) => `+55${tel.replace(/\D/g, '')}`;

  const iniciarTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleEnviarOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const nums = telefone.replace(/\D/g, '');
    if (nums.length < 10) { toast.error('Telefone inválido'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: paraE164(telefone) });
      if (error) { toast.error('Erro ao enviar código'); return; }
      setEtapa('codigo');
      iniciarTimer();
      toast.success('Código enviado!');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length !== 6) { toast.error('Digite os 6 dígitos'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: paraE164(telefone),
        token: codigo,
        type: 'sms',
      });

      if (error) { toast.error('Código inválido ou expirado'); return; }

      // Vincular cliente (comportamento existente mantido)
      await fetch('/api/auth/vincular-cliente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: paraE164(telefone) }),
      });

      toast.success('Login realizado!');
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Smartphone className="h-4 w-4" />
        <span>Receba um código no seu WhatsApp</span>
      </div>

      {etapa === 'telefone' ? (
        <form onSubmit={handleEnviarOTP} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="otp-telefone">Número de WhatsApp</Label>
            <Input
              id="otp-telefone"
              type="tel"
              placeholder="(98) 99999-9999"
              value={formatarTelefone(telefone)}
              onChange={(e) => {
                const nums = e.target.value.replace(/\D/g, '');
                if (nums.length <= 11) setTelefone(nums);
              }}
              autoFocus
            />
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
        <form onSubmit={handleVerificarCodigo} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="otp-codigo">Código recebido</Label>
            <Input
              id="otp-codigo"
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
            />
            <p className="text-xs text-muted-foreground text-center">
              Código enviado para {formatarTelefone(telefone)}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || codigo.length !== 6}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => { setEtapa('telefone'); setCodigo(''); }}
              className="text-muted-foreground hover:text-foreground">
              Trocar número
            </button>
            {timer > 0 ? (
              <span className="text-muted-foreground">Reenviar em {timer}s</span>
            ) : (
              <button type="button" onClick={() => handleEnviarOTP()}
                className="text-primary hover:underline">
                Reenviar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
