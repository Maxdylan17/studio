
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

type Report = {
  id: string;
  name: string;
  generatedAt: string;
};

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = () => {
    setIsLoading(true);
    // Simula uma pequena espera para a geração do relatório
    setTimeout(() => {
      const newReport: Report = {
        id: `rep-${Date.now()}`,
        name: `Relatório Fiscal - ${new Date().toLocaleDateString('pt-BR')}`,
        generatedAt: new Date().toLocaleString('pt-BR'),
      };
      setReports(prevReports => [newReport, ...prevReports]);
      setIsLoading(false);
      toast({
        title: 'Relatório Gerado!',
        description: 'Seu novo relatório está pronto para download.',
      });
    }, 1000);
  };

  const handleDownload = () => {
    toast({
      title: 'Download Iniciado (Simulação)',
      description: 'Em um ambiente real, o arquivo do relatório seria baixado.',
    });
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
         <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? (
                <>
                    <FileDown className="mr-2 h-4 w-4 animate-pulse" /> Gerando...
                </>
            ) : (
                <>
                    <FileDown className="mr-2 h-4 w-4" /> Gerar Relatório
                </>
            )}
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Relatórios Fiscais Gerados</CardTitle>
            <CardDescription>
                Visualize e baixe os relatórios gerados pelo sistema.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {reports.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reports.map(report => (
                        <Card key={report.id} className="flex flex-col">
                            <CardHeader className="flex-row items-start gap-4 space-y-0">
                                <div className="flex-shrink-0">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className='flex-1'>
                                    <CardTitle className="text-base">{report.name}</CardTitle>
                                    <CardDescription>Gerado em: {report.generatedAt}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <Button className="w-full" variant="secondary" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center text-muted-foreground py-12">
                    <p className='mb-2'>Nenhum relatório gerado ainda.</p>
                    <p className='text-sm'>Clique em "Gerar Relatório" para começar.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
