
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw, BarChart } from 'lucide-react';
import { handleForecastRevenue } from '@/lib/actions';
import { Skeleton } from '../ui/skeleton';
import type { ForecastRevenueInput, ForecastRevenueOutput } from '@/ai/flows/schemas/forecast-revenue-schemas';

interface ForecastAiAnalysisProps {
    historicalData: ForecastRevenueInput['historicalData'];
    loading: boolean;
}

export default function ForecastAiAnalysis({ historicalData, loading: loadingData }: ForecastAiAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ForecastRevenueOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    if (historicalData.length < 3) {
        setError('É necessário ter um histórico de pelo menos 3 meses de faturamento para gerar uma previsão.');
        setLoading(false);
        return;
    }

    try {
      const result = await handleForecastRevenue({ historicalData });
      setAnalysis(result);
    } catch (e) {
      setError('Ocorreu um erro ao gerar a previsão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="lg:col-span-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Previsão de Faturamento com IA
        </CardTitle>
        <CardDescription>
          Use seu histórico de faturamento para prever os resultados dos próximos meses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(loading || loadingData) && (
          <div className="space-y-4">
            <h4 className="font-semibold">Previsão</h4>
            <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <h4 className="font-semibold pt-2">Análise</h4>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {analysis && !loading && !loadingData && (
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Previsão para os Próximos Meses</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {analysis.forecast.map((item) => (
                    <div key={item.period} className="rounded-lg border bg-card p-3">
                        <p className="text-xs text-muted-foreground">{item.period}</p>
                        <p className="font-bold text-lg text-primary">{item.revenue}</p>
                    </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-1 mt-4">Análise da IA</h4>
              <p className="text-muted-foreground">{analysis.analysis}</p>
            </div>
          </div>
        )}
        {!analysis && !loading && !loadingData && !error && (
            <div className="text-center text-sm text-muted-foreground p-8">
                Clique no botão abaixo para gerar uma previsão com IA.
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={getAnalysis} disabled={loading || loadingData} className="w-full">
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BarChart className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Gerando Previsão...' : 'Gerar Previsão de Faturamento'}
        </Button>
      </CardFooter>
    </Card>
  );
}
