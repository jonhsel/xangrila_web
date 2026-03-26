'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Algo deu errado</h2>
        <p className="text-muted-foreground max-w-sm">
          {error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
        </p>
      </div>
      <Button onClick={reset}>Tentar Novamente</Button>
    </div>
  );
}
