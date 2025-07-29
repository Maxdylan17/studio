
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart, CheckCircle, XCircle } from 'lucide-react';

interface StatsCardsProps {
    data: {
        volume: number;
        averageValue: number;
        authorized: number;
        canceled: number;
        volumeChange: string;
        averageValueChange: string;
        authorizedPercentage: string;
        canceledPercentage: string;
    }
}

export default function StatsCards({ data }: StatsCardsProps) {
  const stats = [
    {
      title: 'Volume Total (Mês)',
      value: data.volume.toLocaleString('pt-BR'),
      icon: BarChart,
      description: data.volumeChange,
    },
    {
      title: 'Valor Médio por Nota',
      value: data.averageValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: DollarSign,
      description: data.averageValueChange,
    },
    {
      title: 'Notas Autorizadas',
      value: data.authorized.toLocaleString('pt-BR'),
      icon: CheckCircle,
      description: data.authorizedPercentage,
    },
    {
      title: 'Notas Canceladas',
      value: data.canceled.toLocaleString('pt-BR'),
      icon: XCircle,
      description: data.canceledPercentage,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
