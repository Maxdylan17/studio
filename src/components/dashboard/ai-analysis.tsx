
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
import { Wand2, RefreshCw } from 'lucide-react';
import { handleAnalyzeIssuanceTrends } from '@/lib/actions';
import { Skeleton } from '../ui/skeleton';
import type { AnalyzeIssuanceTrendsOutput } from '@/ai/flows/analyze-issuance-trends';

export default function AiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeIssuanceTrendsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const mockInput = {
      volume: 1234,
      averageValue: 456.78,
      trends: 'Aumento consistente nas emissões nos últimos 3 meses, com pico em Julho. Queda de 15% em notas de alto valor no último mês.',
    };

    try {
      const result = await handleAnalyzeIssuanceTrends(mockInput);
      setAnalysis(result);
    } catch (e) {
      setError('Ocorreu um erro ao gerar a análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Análise Inteligente
        </CardTitle>
        <CardDescription>
          Receba insights e sugestões com base nos seus dados de emissão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="space-y-4">
            <h4 className="font-semibold">Insights</h4>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <h4 className="font-semibold pt-2">Sugestões</h4>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {analysis && !loading && (
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Insights</h4>
              <p className="text-muted-foreground">{analysis.insights}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Sugestões</h4>
              <p className="text-muted-foreground">{analysis.suggestions}</p>
            </div>
          </div>
        )}
        {!analysis && !loading && !error && (
            <div className="text-center text-sm text-muted-foreground p-8">
                Clique no botão abaixo para gerar uma análise com IA.
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={getAnalysis} disabled={loading} className="w-full">
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Analisando...' : 'Gerar Análise'}
        </Button>
      </CardFooter>
    </Card>
  );
}
