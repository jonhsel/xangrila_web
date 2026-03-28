import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CalendarDays, Users, Building2 } from 'lucide-react';

const opcoes = [
  {
    icon: DollarSign,
    titulo: 'Gerenciar Preços',
    descricao: 'Configure tarifas por período, temporadas e acomodações.',
  },
  {
    icon: CalendarDays,
    titulo: 'Períodos de Reserva',
    descricao: 'Defina os intervalos de datas disponíveis para reservas.',
  },
  {
    icon: Users,
    titulo: 'Usuários Admin',
    descricao: 'Gerencie os usuários com acesso ao painel administrativo.',
  },
  {
    icon: Building2,
    titulo: 'Dados da Pousada',
    descricao: 'Atualize informações gerais, contato e descrição.',
  },
];

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Funcionalidades adicionais em desenvolvimento.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {opcoes.map((opcao) => (
          <Card key={opcao.titulo} className="p-6 opacity-75">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <opcao.icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{opcao.titulo}</h3>
                  <Badge variant="secondary" className="text-xs">Em breve</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{opcao.descricao}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
