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
            <TrendsChart />
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
