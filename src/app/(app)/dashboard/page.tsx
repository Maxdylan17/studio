
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatsCards from '@/components/dashboard/stats-cards';
import TrendsChart from '@/components/dashboard/trends-chart';
import AiIssuanceAnalysis from '@/components/dashboard/ai-analysis';
import FinancialAiAnalysis from '@/components/dashboard/financial-ai-analysis';
import ForecastAiAnalysis from '@/components/dashboard/forecast-ai-analysis';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Invoice, Expense } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { subMonths, startOfMonth, endOfMonth, format, isAfter, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart2, CreditCard, Landmark, ArrowRight } from 'lucide-react';
import Link from 'next/link';


type StatsData = {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  totalPaidChange: string;
  totalPendingChange: string;
  totalOverdueChange: string;
  volume: number;
  averageValue: number;
  issuanceTrends: string;
  totalExpenses: number;
  expenseTrends: string;
};

type HistoricalDataPoint = {
    year: number;
    month: string;
    revenue: number;
}

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
  issuanceTrends: 'Nenhuma tendência detectada ainda. Emita algumas notas para começar.',
  totalExpenses: 0,
  expenseTrends: 'Nenhuma tendência de despesas detectada.',
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
  const [historicalRevenue, setHistoricalRevenue] = useState<HistoricalDataPoint[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('faturamento');

  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }
  
    const qInvoices = query(collection(db, 'invoices'), where('userId', '==', user.uid));
    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', user.uid));
    
    let invoicesUnsubscribe: () => void;
    let expensesUnsubscribe: () => void;

    let invoicesData: Invoice[] = [];
    let expensesData: Expense[] = [];
    let isInitialLoad = true;

    const processAllData = () => {
        if (invoicesData.length > 0 || expensesData.length > 0) {
            processFinancialData(invoicesData, expensesData);
        } else {
            setStatsData(defaultStats);
            setChartData(defaultChartData);
            setHistoricalRevenue([]);
        }
        if (isInitialLoad) {
            setLoadingData(false);
            isInitialLoad = false;
        }
    }
  
    invoicesUnsubscribe = onSnapshot(qInvoices, (querySnapshot) => {
        invoicesData = querySnapshot.docs.map(doc => {
            const data = doc.data() as Omit<Invoice, 'id'>;
            if (data.status === 'pendente' && data.dueDate && isAfter(new Date(), new Date(data.dueDate))) {
                return { id: doc.id, ...data, status: 'vencida' };
            }
            return { id: doc.id, ...data } as Invoice;
        }) as Invoice[];
        processAllData();
    }, (error) => {
        console.error('Error fetching invoices for dashboard:', error);
        setStatsData(defaultStats);
        setChartData(defaultChartData);
        setHistoricalRevenue([]);
        if (isInitialLoad) setLoadingData(false);
    });

    expensesUnsubscribe = onSnapshot(qExpenses, (querySnapshot) => {
        expensesData = querySnapshot.docs.map(doc => doc.data() as Expense) as Expense[];
        processAllData();
    }, (error) => {
        console.error('Error fetching expenses for dashboard:', error);
        // Do not reset all data, just process what we have
        processAllData(); 
    });
  
    return () => {
      if (invoicesUnsubscribe) invoicesUnsubscribe();
      if (expensesUnsubscribe) expensesUnsubscribe();
    };
  }, [user]);

  const processFinancialData = (invoices: Invoice[], expenses: Expense[]) => {
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

        const filteredExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate >= startDate && (endDate ? expDate <= endDate : true);
        });
        
        return {
          paid: filteredInvoices.filter(i => i.status === 'paga').reduce((sum, i) => sum + i.value, 0),
          pending: filteredInvoices.filter(i => i.status === 'pendente').reduce((sum, i) => sum + i.value, 0),
          overdue: invoices.filter(i => i.status === 'vencida').reduce((sum, i) => sum + i.value, 0), // Total overdue regardless of month
          volume: filteredInvoices.length,
          totalValue: filteredInvoices.reduce((sum, i) => sum + i.value, 0),
          expenses: filteredExpenses.reduce((sum, e) => sum + e.value, 0)
        };
      };

      const currentMonthStats = getMonthStats(currentMonthStart);
      const prevMonthStats = getMonthStats(prevMonthStart, prevMonthEnd);

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? '+100.0%' : '+0.0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      };
      
      // Chart Data & Historical Revenue Processing
      const monthlyData: { [year: string]: { [month: string]: { total: number; count: number } } } = {};
      const monthLabels = Array.from({length: 12}, (_, i) => format(new Date(0, i), 'MMM'));

      invoices.forEach(inv => {
        if (inv.status === 'cancelada' || inv.status === 'rascunho') return;
        const invDate = new Date(inv.date);
        const year = getYear(invDate);
        const month = invDate.getMonth();
        
        if (!monthlyData[year]) monthlyData[year] = {};
        if (!monthlyData[year][month]) monthlyData[year][month] = { total: 0, count: 0 };
        monthlyData[year][month].total += inv.value;
        monthlyData[year][month].count += 1;
      });
      
      const newFaturamentoData: ChartDataPoint[] = [];
      const newVolumeData: ChartDataPoint[] = [];
      const newTicketMedioData: ChartDataPoint[] = [];
      const newHistoricalRevenue: HistoricalDataPoint[] = [];

      // For charts (current vs previous year)
      monthLabels.forEach((label, monthIndex) => {
        const currentYearData = monthlyData[now.getFullYear()]?.[monthIndex] || { total: 0, count: 0 };
        const previousYearData = monthlyData[now.getFullYear() - 1]?.[monthIndex] || { total: 0, count: 0 };
        
        newFaturamentoData.push({ month: label, 'Ano Atual': currentYearData.total, 'Ano Anterior': previousYearData.total });
        newVolumeData.push({ month: label, 'Ano Atual': currentYearData.count, 'Ano Anterior': previousYearData.count });
        newTicketMedioData.push({ 
            month: label, 
            'Ano Atual': currentYearData.count > 0 ? currentYearData.total / currentYearData.count : 0, 
            'Ano Anterior': previousYearData.count > 0 ? previousYearData.total / previousYearData.count : 0 
        });
      });
      
      // For forecast (all historical data)
      Object.keys(monthlyData).sort().forEach(year => {
        Object.keys(monthlyData[year]).sort((a,b) => parseInt(a) - parseInt(b)).forEach(month => {
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            newHistoricalRevenue.push({
                year: yearNum,
                month: format(new Date(yearNum, monthNum), 'MMM', { locale: ptBR }),
                revenue: monthlyData[year][month].total
            });
        });
      });

      setChartData({
        faturamento: newFaturamentoData,
        volume: newVolumeData,
        ticketMedio: newTicketMedioData
      });
      setHistoricalRevenue(newHistoricalRevenue);
      
      const totalOverdue = invoices.filter(i => i.status === 'vencida').reduce((sum, i) => sum + i.value, 0);

      setStatsData({
        totalPaid: currentMonthStats.paid,
        totalPending: currentMonthStats.pending,
        totalOverdue: totalOverdue,
        totalPaidChange: `${calculateChange(currentMonthStats.paid, prevMonthStats.paid)} do último mês`,
        totalPendingChange: `${calculateChange(currentMonthStats.pending, prevMonthStats.pending)} do último mês`,
        totalOverdueChange: ``, // No change calculation for total overdue
        volume: currentMonthStats.volume,
        averageValue: currentMonthStats.volume > 0 ? currentMonthStats.totalValue / currentMonthStats.volume : 0,
        issuanceTrends: `Volume de emissões ${calculateChange(currentMonthStats.volume, prevMonthStats.volume)} este mês.`,
        totalExpenses: currentMonthStats.expenses,
        expenseTrends: `Despesas ${calculateChange(currentMonthStats.expenses, prevMonthStats.expenses)} este mês.`
      });
  };

  const metricTitles: Record<ChartMetric, string> = {
    faturamento: 'Faturamento Mensal (R$)',
    volume: 'Volume de Notas (Unidades)',
    ticketMedio: 'Ticket Médio (R$)',
  };

  const actionCards = [
    {
      title: 'Gerenciar Faturas',
      description: 'Visualize, emita e cancele suas notas.',
      href: '/notas',
      icon: BarChart2,
    },
    {
      title: 'Controlar Despesas',
      description: 'Adicione e acompanhe seus gastos.',
      href: '/despesas',
      icon: CreditCard,
    },
    {
      title: 'Calcular Impostos',
      description: 'Estime o valor do seu imposto mensal.',
      href: '/impostos',
      icon: Landmark,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {actionCards.map((card) => (
          <Card key={card.href} className="hover:bg-muted/50 transition-colors">
            <Link href={card.href} className="block h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-bold">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
                 <div className="text-sm font-medium text-primary flex items-center mt-4">
                  Acessar <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
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
        <AiIssuanceAnalysis
          volume={statsData.volume}
          averageValue={statsData.averageValue}
          trends={statsData.issuanceTrends}
          loading={loadingData}
        />
      </div>
       <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
         <FinancialAiAnalysis 
            totalRevenue={statsData.totalPaid}
            totalExpenses={statsData.totalExpenses}
            revenueTrends={statsData.totalPaidChange}
            expenseTrends={statsData.expenseTrends}
            loading={loadingData}
          />
       </div>
       <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          <ForecastAiAnalysis
            historicalData={historicalRevenue}
            loading={loadingData}
          />
       </div>
    </div>
  );
}
