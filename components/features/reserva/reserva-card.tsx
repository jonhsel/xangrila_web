import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatarMoeda, formatarData } from '@/lib/utils';
import {
  Calendar,
  Users,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface ReservaCardProps {
  reserva: any;
  tipo: 'confirmada' | 'pendente' | 'concluida';
}

export function ReservaCard({ reserva, tipo }: ReservaCardProps) {
  const getStatusBadge = () => {
    switch (tipo) {
      case 'pendente':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700">
            <Clock className="mr-1 h-3 w-3" />
            Aguardando Pagamento
          </Badge>
        );
      case 'confirmada':
        return (
          <Badge variant="outline" className="border-green-500 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Confirmada
          </Badge>
        );
      case 'concluida':
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700">
            Concluída
          </Badge>
        );
    }
  };

  const getExpirationWarning = () => {
    if (tipo !== 'pendente' || !reserva.expira_em) return null;

    const expiraEm = new Date(reserva.expira_em);
    const agora = new Date();
    const minutosRestantes = Math.floor(
      (expiraEm.getTime() - agora.getTime()) / (1000 * 60)
    );
    const horasRestantes = Math.floor(minutosRestantes / 60);

    if (minutosRestantes <= 0) return null;

    const tempoTexto = horasRestantes > 0
      ? `${horasRestantes}h${minutosRestantes % 60}min`
      : `${minutosRestantes}min`;

    if (horasRestantes < 2) {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Expira em {tempoTexto}! Complete o pagamento.</span>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              Reserva #{reserva.reserva_id}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tipo === 'pendente' ? 'Criada' : 'Confirmada'} em{' '}
              {formatarData(reserva.created_at)}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Warning de expiração */}
        {getExpirationWarning()}

        {/* Detalhes */}
        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            bgColor="bg-blue-100"
            label="Check-in"
            value={formatarData(reserva.data_checkin)}
          />
          <InfoItem
            icon={<Calendar className="h-5 w-5 text-orange-600" />}
            bgColor="bg-orange-100"
            label="Check-out"
            value={formatarData(reserva.data_checkout)}
          />
          <InfoItem
            icon={<Home className="h-5 w-5 text-green-600" />}
            bgColor="bg-green-100"
            label="Acomodação"
            value={reserva.tipo_quarto || reserva.acomodacao_tipo || '—'}
          />
          <InfoItem
            icon={<Users className="h-5 w-5 text-purple-600" />}
            bgColor="bg-purple-100"
            label="Pessoas"
            value={`${reserva.pessoas || reserva.num_pessoas || '—'} ${
              (reserva.pessoas || reserva.num_pessoas) === 1 ? 'pessoa' : 'pessoas'
            }`}
          />
        </div>

        {/* Valores */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-semibold">
              {formatarMoeda(reserva.valor_total)}
            </span>
          </div>

          {tipo === 'pendente' && reserva.valor_sinal && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sinal (50%):</span>
              <span className="font-semibold text-orange-600">
                {formatarMoeda(reserva.valor_sinal)}
              </span>
            </div>
          )}

          {tipo === 'confirmada' && reserva.valor_restante > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Restante:</span>
              <span className="font-semibold text-orange-600">
                {formatarMoeda(reserva.valor_restante)}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          {tipo === 'pendente' && (
            <Button asChild className="flex-1">
              <a href={`/reservar/pagamento?id=${reserva.reserva_id}`}>
                Completar Pagamento
              </a>
            </Button>
          )}

          {tipo === 'confirmada' && (
            <Button variant="outline" className="flex-1" asChild>
              <a
                href={`https://wa.me/5598981672949?text=${encodeURIComponent(
                  `Olá! Tenho a reserva #${reserva.reserva_id} e gostaria de informações.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar com a Pousada
              </a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function InfoItem({
  icon,
  bgColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
