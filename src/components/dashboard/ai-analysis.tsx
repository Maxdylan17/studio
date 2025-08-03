
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
import type { AnalyzeIssuanceTrendsOutput } from '@/ai/flows/schemas/analyze-issuance-trends-schemas';

interface AiIssuanceAnalysisProps {
    volume: number;
    averageValue: number;
    trends: string;
    loading: boolean;
}

export default function AiIssuanceAnalysis({ volume, averageValue, trends, loading: loadingData }: AiIssuanceAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeIssuanceTrendsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const input = {
      volume,
      averageValue,
      trends,
    };

    try {
      const result = await handleAnalyzeIssuanceTrends(input);
      setAnalysis(result);
    } catch (e) {
      setError('Ocorreu um erro ao gerar a análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="lg:col-span-3 md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Análise de Emissões
        </CardTitle>
        <CardDescription>
          Receba insights sobre seus padrões de emissão de notas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(loading || loadingData) && (
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
        {analysis && !loading && !loadingData && (
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
        {!analysis && !loading && !loadingData && !error && (
            <div className="text-center text-sm text-muted-foreground p-8">
                Clique no botão abaixo para gerar uma análise com IA.
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={getAnalysis} disabled={loading || loadingData} className="w-full">
          {loading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Analisando...' : 'Analisar Emissões'}
        </Button>
      </CardFooter>
    </Card>
  );
}
