
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import TrendsChart from '@/components/dashboard/trends-chart';
import AiAnalysis from '@/components/dashboard/ai-analysis';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import type { Invoice } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { subMonths, startOfMonth, endOfMonth, format, isAfter } from 'date-fns';


type StatsData = {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalPaidChange: string;
  totalPendingChange: string;
  totalOverdueChange: string;
  volume: number;
  averageValue: number;
  trends: string;
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
  totalPaid: 0,
  totalPending: 0,
  totalOverdue: 0,
  totalPaidChange: '+0.0%',
  totalPendingChange: '+0.0%',
  totalOverdueChange: '+0.0%',
  volume: 0,
  averageValue: 0,
  trends: 'Nenhuma tendência detectada ainda. Emita algumas notas para começar.',
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
    if (!user) {
      setLoadingData(false);
      return;
    }
  
    const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const invoicesData = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Invoice, 'id'>;
        if (data.status === 'pendente' && data.dueDate && isAfter(new Date(), new Date(data.dueDate))) {
            // This is a view-logic update, not saving to DB to avoid extra writes.
            // A background job would be better for this in a real app.
            return { id: doc.id, ...data, status: 'vencida' };
        }
        return { id: doc.id, ...data } as Invoice;
      }) as Invoice[];

      if (invoicesData.length > 0) {
        processInvoiceData(invoicesData);
      } else {
        setStatsData(defaultStats);
        setChartData(defaultChartData);
      }
       setLoadingData(false);
    }, (error) => {
      console.error('Error fetching invoices for dashboard:', error);
      setStatsData(defaultStats);
      setChartData(defaultChartData);
      setLoadingData(false);
    });
  
    return () => unsubscribe();
  }, [user]);

  const processInvoiceData = (invoices: Invoice[]) => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const prevMonthStart = startOfMonth(subMonths(now, 1));
      const prevMonthEnd = endOfMonth(subMonths(now, 1));
      
      const getMonthStats = (startDate: Date, endDate?: Date) => {
        const filteredInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.date);
          const isInDateRange = invDate >= startDate && (endDate ? invDate <= endDate : true);
          return isInDateRange && inv.status !== 'cancelada' && inv.status !== 'rascunho';
        });
        
        return {
          paid: filteredInvoices.filter(i => i.status === 'paga').reduce((sum, i) => sum + parseFloat(i.value), 0),
          pending: filteredInvoices.filter(i => i.status === 'pendente').reduce((sum, i) => sum + parseFloat(i.value), 0),
          overdue: filteredInvoices.filter(i => i.status === 'vencida').reduce((sum, i) => sum + parseFloat(i.value), 0),
          volume: filteredInvoices.length,
          totalValue: filteredInvoices.reduce((sum, i) => sum + parseFloat(i.value), 0),
        };
      };

      const currentMonthStats = getMonthStats(currentMonthStart);
      const prevMonthStats = getMonthStats(prevMonthStart, prevMonthEnd);

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? '+100.0%' : '+0.0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      };
      
      // Chart Data Processing
      const monthlyChartData: { [year: string]: { [month: string]: { total: number; count: number } } } = {};
      const monthLabels = Array.from({length: 12}, (_, i) => format(new Date(0, i), 'MMM'));

      invoices.forEach(inv => {
        if (inv.status === 'cancelada' || inv.status === 'rascunho') return;
        const invDate = new Date(inv.date);
        const year = invDate.getFullYear();
        const month = invDate.getMonth();
        if(year >= now.getFullYear() - 1) {
            if (!monthlyChartData[year]) monthlyChartData[year] = {};
            if (!monthlyChartData[year][month]) monthlyChartData[year][month] = { total: 0, count: 0 };
            monthlyChartData[year][month].total += parseFloat(inv.value.replace(',', '.'));
            monthlyChartData[year][month].count += 1;
        }
      });
      
      const newFaturamentoData: ChartDataPoint[] = [];
      const newVolumeData: ChartDataPoint[] = [];
      const newTicketMedioData: ChartDataPoint[] = [];

      monthLabels.forEach((label, monthIndex) => {
        const currentYearData = monthlyChartData[now.getFullYear()]?.[monthIndex] || { total: 0, count: 0 };
        const previousYearData = monthlyChartData[now.getFullYear() - 1]?.[monthIndex] || { total: 0, count: 0 };
        
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
        totalPaid: currentMonthStats.paid,
        totalPending: currentMonthStats.pending,
        totalOverdue: currentMonthStats.overdue,
        totalPaidChange: `${calculateChange(currentMonthStats.paid, prevMonthStats.paid)} do último mês`,
        totalPendingChange: `${calculateChange(currentMonthStats.pending, prevMonthStats.pending)} do último mês`,
        totalOverdueChange: `${calculateChange(currentMonthStats.overdue, prevMonthStats.overdue)} do último mês`,
        volume: currentMonthStats.volume,
        averageValue: currentMonthStats.volume > 0 ? currentMonthStats.totalValue / currentMonthStats.volume : 0,
        trends: `Volume de emissões ${calculateChange(currentMonthStats.volume, prevMonthStats.volume)} este mês.`,
      });
  };

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
