
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface StatsCardsProps {
    data: {
        totalPaid: number;
        totalPending: number;
        totalOverdue: number;
        totalPaidChange: string;
        totalPendingChange: string;
        totalOverdueChange: string;
    },
    loading: boolean
}

export default function StatsCards({ data, loading }: StatsCardsProps) {
  const stats = [
    {
      title: 'Total Recebido (Mês)',
      value: data.totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: CheckCircle,
      description: data.totalPaidChange,
      color: 'text-green-500'
    },
    {
      title: 'Pendente de Recebimento',
      value: data.totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: Clock,
      description: data.totalPendingChange,
      color: 'text-yellow-500'
    },
    {
      title: 'Total em Atraso',
      value: data.totalOverdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      icon: AlertTriangle,
      description: data.totalOverdueChange,
      color: 'text-red-500'
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                 <Skeleton className="h-8 w-3/4" />
                 <Skeleton className="h-3 w-1/2" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
