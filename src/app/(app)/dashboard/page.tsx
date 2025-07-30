
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

// Define the structure for our processed stats
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

// Define the structure for chart data points
type ChartData = {
  month: string;
  total: number;
};

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

const FAKE_USER_ID = "local-user";

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<StatsData>(defaultStats);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const processInvoiceData = (invoices: Invoice[]) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(currentMonth - 1);
      const lastMonth = oneMonthAgo.getMonth();
      const lastMonthYear = oneMonthAgo.getFullYear();

      // Filter invoices for the current and previous month
      const currentMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      });
      const lastMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
      });

      // Calculate stats
      const volume = currentMonthInvoices.length;
      const totalValue = invoices.reduce((acc, inv) => acc + parseFloat(inv.value.replace(',', '.')), 0);
      const averageValue = invoices.length > 0 ? totalValue / invoices.length : 0;
      const authorized = invoices.filter(inv => inv.status === 'autorizada').length;
      const canceled = invoices.filter(inv => inv.status === 'cancelada').length;
      
      // Calculate percentages
      const volumeChange = lastMonthInvoices.length > 0 ? ((volume - lastMonthInvoices.length) / lastMonthInvoices.length) * 100 : volume > 0 ? 100 : 0;
      const lastMonthTotalValue = lastMonthInvoices.reduce((acc, inv) => acc + parseFloat(inv.value.replace(',', '.')), 0);
      const lastMonthAverageValue = lastMonthInvoices.length > 0 ? lastMonthTotalValue / lastMonthInvoices.length : 0;
      const averageValueChange = lastMonthAverageValue > 0 ? ((averageValue - lastMonthAverageValue) / lastMonthAverageValue) * 100 : averageValue > 0 ? 100 : 0;
      
      const totalInvoices = invoices.length;
      const authorizedPercentage = totalInvoices > 0 ? (authorized / totalInvoices) * 100 : 0;
      const canceledPercentage = totalInvoices > 0 ? (canceled / totalInvoices) * 100 : 0;

      // Prepare data for the chart (last 12 months)
      const monthlyTotals: { [key: string]: number } = {};
      const monthLabels = [];
      for(let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const label = d.toLocaleString('default', { month: 'short' });
        monthLabels.push(label);
        monthlyTotals[`${year}-${month}`] = 0;
      }
      invoices.forEach(inv => {
        const invDate = new Date(inv.date);
        const year = invDate.getFullYear();
        const month = invDate.getMonth();
        const key = `${year}-${month}`;
        if(key in monthlyTotals) {
          monthlyTotals[key] += parseFloat(inv.value.replace(',', '.'));
        }
      });
      const newChartData = monthLabels.map((label, i) => {
         const d = new Date(currentYear, currentMonth - (11-i), 1);
         const year = d.getFullYear();
         const month = d.getMonth();
         return { month: label, total: monthlyTotals[`${year}-${month}`] || 0 };
      });
      
      setChartData(newChartData);

      // Set all stats
      setStatsData({
        volume,
        averageValue,
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
          const q = query(collection(db, 'invoices'), where('userId', '==', FAKE_USER_ID));
          const querySnapshot = await getDocs(q);
          const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[];
          if (invoicesData.length > 0) {
            processInvoiceData(invoicesData);
          } else {
             setStatsData(defaultStats);
             setChartData([]);
          }
        } catch (error) {
          console.error('Error fetching invoices for dashboard:', error);
          setStatsData(defaultStats);
          setChartData([]);
        } finally {
          setLoadingData(false);
        }
    };

    fetchInvoices();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <StatsCards data={statsData} loading={loadingData} />
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral de Emissões</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             {loadingData ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-[95%]" />
                </div>
             ) : (
                <TrendsChart data={chartData} />
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
