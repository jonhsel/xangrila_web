'use client';

import { Calendar, BedDouble, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================

interface StepIndicatorProps {
  stepAtual: number;
}

const STEPS = [
  { numero: 1, label: 'Datas', Icon: Calendar },
  { numero: 2, label: 'Quarto', Icon: BedDouble },
  { numero: 3, label: 'Resumo', Icon: CheckCircle },
];

// ============================================
// COMPONENTE
// ============================================

export function StepIndicator({ stepAtual }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {STEPS.map((step, index) => {
        const concluido = stepAtual > step.numero;
        const ativo = stepAtual === step.numero;
        const { Icon } = step;

        return (
          <div key={step.numero} className="flex items-center">
            {/* Bolinha do step */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  concluido && 'border-primary bg-primary text-primary-foreground',
                  ativo && 'border-primary bg-primary/10 text-primary',
                  !concluido && !ativo && 'border-muted-foreground/30 text-muted-foreground/50'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  (concluido || ativo) ? 'text-primary' : 'text-muted-foreground/50'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Linha conectora */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mb-5 h-0.5 w-16 transition-colors sm:w-24',
                  stepAtual > step.numero ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
