import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import TrendsChart from '@/components/dashboard/trends-chart';
import AiAnalysis from '@/components/dashboard/ai-analysis';

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <StatsCards />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral de Emissões</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <TrendsChart />
          </CardContent>
        </Card>
        <AiAnalysis />
      </div>
    </div>
  );
}
