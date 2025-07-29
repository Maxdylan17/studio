import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import TrendsChart from '@/components/dashboard/trends-chart';
import AiAnalysis from '@/components/dashboard/ai-analysis';

// Mock data for stats, now centralized here.
const statsData = {
  volume: 1234,
  averageValue: 456.78,
  authorized: 1150,
  canceled: 84,
  trends: 'Aumento consistente nas emissões nos últimos 3 meses, com pico em Julho. Queda de 15% em notas de alto valor no último mês.',
  volumeChange: '+20.1% do último mês',
  averageValueChange: '+180.1% do último mês',
  authorizedPercentage: '93% de sucesso',
  canceledPercentage: '7% do total',
};

// Mock data for the trends chart.
const chartData = [
  { month: 'Jan', total: 4230 },
  { month: 'Fev', total: 3120 },
  { month: 'Mar', total: 3580 },
  { month: 'Abr', total: 5780 },
  { month: 'Mai', total: 4890 },
  { month: 'Jun', total: 6290 },
  { month: 'Jul', total: 7340 },
  { month: 'Ago', total: 6980 },
  { month: 'Set', total: 6450 },
  { month: 'Out', total: 7120 },
  { month: 'Nov', total: 8200 },
  { month: 'Dez', total: 9500 },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <StatsCards data={statsData} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral de Emissões</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <TrendsChart data={chartData} />
          </CardContent>
        </Card>
        <AiAnalysis 
          volume={statsData.volume}
          averageValue={statsData.averageValue}
          trends={statsData.trends}
        />
      </div>
    </div>
  );
}
