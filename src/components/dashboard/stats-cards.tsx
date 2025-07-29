
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart, CheckCircle, XCircle } from 'lucide-react';

export default function StatsCards() {
  // Mock data
  const stats = [
    {
      title: 'Volume Total (Mês)',
      value: '1.234',
      icon: BarChart,
      description: '+20.1% do último mês',
    },
    {
      title: 'Valor Médio por Nota',
      value: 'R$ 456,78',
      icon: DollarSign,
      description: '+180.1% do último mês',
    },
    {
      title: 'Notas Autorizadas',
      value: '1.150',
      icon: CheckCircle,
      description: '93% de sucesso',
    },
    {
      title: 'Notas Canceladas',
      value: '84',
      icon: XCircle,
      description: '7% do total',
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
