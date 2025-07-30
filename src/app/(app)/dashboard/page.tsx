
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import TrendsChart from '@/components/dashboard/trends-chart';
import AiAnalysis from '@/components/dashboard/ai-analysis';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Invoice } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

type StatsData = {
  volume: number;
  averageValue: number;
  authorized: number;
  canceled: number;
  trends: string;
  volumeChange: string;
  averageValueChange: string;
  authorizedPercentage: string;
  canceledPercentage: string;
};

type ChartDataPoint = {
  month: string;
  'Ano Atual': number;
  'Ano Anterior': number;
};

type ChartData = {
  faturamento: ChartDataPoint[];
  volume: ChartDataPoint[];
  ticketMedio: ChartDataPoint[];
};

type ChartMetric = keyof ChartData;

const defaultStats: StatsData = {
  volume: 0,
  averageValue: 0,
  authorized: 0,
  canceled: 0,
  trends: 'Nenhuma tendência detectada ainda. Emita algumas notas para começar.',
  volumeChange: '+0.0% do último mês',
  averageValueChange: '+0.0% do último mês',
  authorizedPercentage: '0% de sucesso',
  canceledPercentage: '0% do total',
};

const defaultChartData: ChartData = {
    faturamento: [],
    volume: [],
    ticketMedio: []
};


export default function DashboardPage() {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState<StatsData>(defaultStats);
  const [chartData, setChartData] = useState<ChartData>(defaultChartData);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('faturamento');


  useEffect(() => {
    if (!user) return;
    
    const processInvoiceData = (invoices: Invoice[]) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(currentMonth - 1);
      const lastMonth = oneMonthAgo.getMonth();
      const lastMonthYear = oneMonthAgo.getFullYear();

      const currentMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });
      const lastMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
      });

      const volume = currentMonthInvoices.length;
      const totalValueCurrentMonth = currentMonthInvoices.reduce((acc, inv) => acc + parseFloat(inv.value.replace(',', '.')), 0);
      const averageValueCurrentMonth = volume > 0 ? totalValueCurrentMonth / volume : 0;
      const authorized = invoices.filter(inv => inv.status === 'autorizada').length;
      const canceled = invoices.filter(inv => inv.status === 'cancelada').length;
      
      const volumeChange = lastMonthInvoices.length > 0 ? ((volume - lastMonthInvoices.length) / lastMonthInvoices.length) * 100 : volume > 0 ? 100 : 0;
      const lastMonthTotalValue = lastMonthInvoices.reduce((acc, inv) => acc + parseFloat(inv.value.replace(',', '.')), 0);
      const lastMonthAverageValue = lastMonthInvoices.length > 0 ? lastMonthTotalValue / lastMonthInvoices.length : 0;
      const averageValueChange = lastMonthAverageValue > 0 ? ((averageValueCurrentMonth - lastMonthAverageValue) / lastMonthAverageValue) * 100 : averageValueCurrentMonth > 0 ? 100 : 0;
      
      const totalInvoices = invoices.length;
      const authorizedPercentage = totalInvoices > 0 ? (authorized / totalInvoices) * 100 : 0;
      const canceledPercentage = totalInvoices > 0 ? (canceled / totalInvoices) * 100 : 0;

      const monthlyData: { [year: string]: { [month: string]: { total: number; count: number } } } = {};
      const monthLabels = Array.from({length: 12}, (_, i) => {
          const d = new Date(0);
          d.setMonth(i);
          return d.toLocaleString('default', { month: 'short' });
      });

      invoices.forEach(inv => {
        const invDate = new Date(inv.date);
        const year = invDate.getFullYear();
        const month = invDate.getMonth();
        if(year >= currentYear - 1) {
            if (!monthlyData[year]) monthlyData[year] = {};
            if (!monthlyData[year][month]) monthlyData[year][month] = { total: 0, count: 0 };
            monthlyData[year][month].total += parseFloat(inv.value.replace(',', '.'));
            monthlyData[year][month].count += 1;
        }
      });
      
      const newFaturamentoData: ChartDataPoint[] = [];
      const newVolumeData: ChartDataPoint[] = [];
      const newTicketMedioData: ChartDataPoint[] = [];

      monthLabels.forEach((label, monthIndex) => {
        const currentYearData = monthlyData[currentYear]?.[monthIndex] || { total: 0, count: 0 };
        const previousYearData = monthlyData[currentYear - 1]?.[monthIndex] || { total: 0, count: 0 };
        
        newFaturamentoData.push({ month: label, 'Ano Atual': currentYearData.total, 'Ano Anterior': previousYearData.total });
        newVolumeData.push({ month: label, 'Ano Atual': currentYearData.count, 'Ano Anterior': previousYearData.count });
        newTicketMedioData.push({ 
            month: label, 
            'Ano Atual': currentYearData.count > 0 ? currentYearData.total / currentYearData.count : 0, 
            'Ano Anterior': previousYearData.count > 0 ? previousYearData.total / previousYearData.count : 0 
        });
      });
      
      setChartData({
        faturamento: newFaturamentoData,
        volume: newVolumeData,
        ticketMedio: newTicketMedioData
      });

      setStatsData({
        volume,
        averageValue: averageValueCurrentMonth,
        authorized,
        canceled,
        trends: `Volume de emissões ${volumeChange >= 0 ? 'cresceu' : 'diminuiu'} em ${Math.abs(volumeChange).toFixed(1)}% este mês.`,
        volumeChange: `${volumeChange >= 0 ? '+' : ''}${volumeChange.toFixed(1)}% do último mês`,
        averageValueChange: `${averageValueChange >= 0 ? '+' : ''}${averageValueChange.toFixed(1)}% do último mês`,
        authorizedPercentage: `${authorizedPercentage.toFixed(0)}% de sucesso`,
        canceledPercentage: `${canceledPercentage.toFixed(0)}% do total`,
      });
    };

    const fetchInvoices = async () => {
        setLoadingData(true);
        try {
          const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[];
          if (invoicesData.length > 0) {
            processInvoiceData(invoicesData);
          } else {
             setStatsData(defaultStats);
             setChartData(defaultChartData);
          }
        } catch (error) {
          console.error('Error fetching invoices for dashboard:', error);
          setStatsData(defaultStats);
          setChartData(defaultChartData);
        } finally {
          setLoadingData(false);
        }
    };

    fetchInvoices();
  }, [user]);

  const metricTitles: Record<ChartMetric, string> = {
    faturamento: 'Faturamento Mensal (R$)',
    volume: 'Volume de Notas (Unidades)',
    ticketMedio: 'Ticket Médio (R$)',
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <StatsCards data={statsData} loading={loadingData} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 md:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                 <CardTitle>{metricTitles[selectedMetric]}</CardTitle>
                 <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={selectedMetric === 'faturamento' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedMetric('faturamento')}>Faturamento</Button>
                    <Button variant={selectedMetric === 'volume' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedMetric('volume')}>Volume</Button>
                    <Button variant={selectedMetric === 'ticketMedio' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedMetric('ticketMedio')}>Ticket Médio</Button>
                 </div>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
             {loadingData ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-[95%]" />
                </div>
             ) : (
                <TrendsChart 
                    data={chartData[selectedMetric]} 
                    metric={selectedMetric}
                />
             )}
          </CardContent>
        </Card>
        <AiAnalysis
          volume={statsData.volume}
          averageValue={statsData.averageValue}
          trends={statsData.trends}
          loading={loadingData}
        />
      </div>
    </div>
  );
}

