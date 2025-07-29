
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileDown, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Report = {
  id: string;
  name: string;
  generatedAt: string;
  userId: string;
};

const FAKE_USER_ID = "local-user";

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchReports = async () => {
        setLoadingData(true);
        try {
          const q = query(collection(db, 'reports'), where('userId', '==', FAKE_USER_ID), orderBy('generatedAt', 'desc'));
          const querySnapshot = await getDocs(q);
          const reportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
          setReports(reportsData);
        } catch (error) {
           console.error("Error fetching reports: ", error);
           toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os relatórios.' });
        } finally {
          setLoadingData(false);
        }
    };
    fetchReports();
  }, [toast]);


  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    // Simulating report generation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newReportData = {
      name: `Relatório Fiscal - ${new Date().toLocaleDateString('pt-BR')}`,
      generatedAt: new Date().toISOString(),
      userId: FAKE_USER_ID
    };

    try {
      const docRef = await addDoc(collection(db, 'reports'), newReportData);
      const newReport = {id: docRef.id, ...newReportData, generatedAt: new Date(newReportData.generatedAt).toLocaleString('pt-BR')};

      // Firestore returns ISO string, format it for display
      const displayReport = {...newReport, generatedAt: new Date(newReport.generatedAt).toLocaleString('pt-BR')}
      
      setReports(prev => [displayReport as Report, ...prev]);

      toast({
        title: 'Relatório Gerado!',
        description: 'Seu novo relatório está pronto para download.',
      });
    } catch (error) {
       console.error("Error generating report: ", error);
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o relatório.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    toast({
      title: 'Download Iniciado (Simulação)',
      description: 'Em um ambiente real, o arquivo do relatório seria baixado.',
    });
  }

  const isLoading = loadingData;

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
         <Button onClick={handleGenerateReport} disabled={isGenerating || isLoading}>
            {isGenerating ? (
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
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({length: 3}).map((_, i) => (
                        <Card key={i} className="flex flex-col">
                             <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
                                <Skeleton className='h-8 w-8' />
                                <div className='flex-1 space-y-2'>
                                    <Skeleton className="h-5 w-4/5" />
                                    <Skeleton className="h-4 w-3/5" />
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Skeleton className="h-9 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : reports.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reports.map(report => (
                        <Card key={report.id} className="flex flex-col">
                            <CardHeader className="flex-row items-start gap-4 space-y-0 pb-4">
                                <div className="flex-shrink-0">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className='flex-1'>
                                    <CardTitle className="text-base">{report.name}</CardTitle>
                                    <CardDescription>Gerado em: {new Date(report.generatedAt).toLocaleString('pt-BR')}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardFooter>
                                <Button className="w-full" variant="secondary" onClick={handleDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center text-muted-foreground py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className='mb-2 font-medium'>Nenhum relatório gerado ainda.</p>
                    <p className='text-sm'>Clique em "Gerar Relatório" para começar.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
