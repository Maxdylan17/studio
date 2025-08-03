'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Invoice } from '@/lib/definitions';
import { format, startOfMonth, endOfMonth, subMonths, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DatePickerWithPresets } from '@/components/impostos/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Percent, Banknote } from 'lucide-react';

type ReportData = {
    totalRevenue: number;
    taxRate: number;
    estimatedTax: number;
    invoiceCount: number;
} | null;

export default function ImpostosPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [date, setDate] = useState<Date>(new Date());
    const [reportData, setReportData] = useState<ReportData>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && date) {
            generateReport();
        }
    }, [user, date]);
    
    const generateReport = async () => {
        if (!user || !date) return;
        setLoading(true);
        setReportData(null);

        try {
            // 1. Fetch Tax Rate from settings
            const settingsRef = doc(db, "settings", user.uid);
            const settingsSnap = await getDoc(settingsRef);
            const taxRate = settingsSnap.exists() ? parseFloat(settingsSnap.data().aliquota) : 0;
            
            if (taxRate === 0) {
                 toast({
                    variant: "destructive",
                    title: "Alíquota não configurada",
                    description: "Por favor, configure sua alíquota do Simples Nacional na página de Configurações.",
                });
            }

            // 2. Fetch paid invoices for the selected month
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const invoicesQuery = query(collection(db, 'invoices'), 
                where('userId', '==', user.uid),
                where('status', '==', 'paga'),
                where('date', '>=', format(monthStart, 'yyyy-MM-dd')),
                where('date', '<=', format(monthEnd, 'yyyy-MM-dd')),
            );

            const querySnapshot = await getDocs(invoicesQuery);
            const invoicesData = querySnapshot.docs.map(doc => doc.data() as Invoice);

            // 3. Calculate metrics
            const totalRevenue = invoicesData.reduce((sum, inv) => sum + inv.value, 0);
            const estimatedTax = totalRevenue * (taxRate / 100);
            const invoiceCount = invoicesData.length;

            setReportData({
                totalRevenue,
                taxRate,
                estimatedTax,
                invoiceCount
            });

        } catch (error) {
            console.error("Error generating tax report: ", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível gerar o relatório.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Relatório de Impostos</h1>
                    <p className="text-muted-foreground">
                        Calcule uma estimativa do seu imposto (Simples Nacional) com base nas notas pagas.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                   <DatePickerWithPresets date={date} setDate={setDate} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Apuração de {format(date, 'MMMM, yyyy', { locale: ptBR })}</CardTitle>
                    <CardDescription>
                        Esta é uma estimativa com base nas notas fiscais com status "paga" no período selecionado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Faturamento Bruto (Período)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <Skeleton className="h-8 w-3/4" />
                                ) : (
                                    <div className="text-2xl font-bold">
                                        {reportData?.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    {loading ? <Skeleton className="h-4 w-1/2 mt-1" /> : `Baseado em ${reportData?.invoiceCount ?? 0} nota(s) paga(s).`}
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Alíquota Aplicada</CardTitle>
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                     <Skeleton className="h-8 w-3/4" />
                                ) : (
                                    <div className="text-2xl font-bold">
                                        {reportData?.taxRate.toFixed(2) ?? '0.00'}%
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    {loading ? <Skeleton className="h-4 w-1/2 mt-1" /> : 'Configurada na página de Configurações.'}
                                </div>
                            </CardContent>
                        </Card>
                         <Card className="border-primary/50 bg-primary/5">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Valor Estimado do Imposto</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                 {loading ? (
                                     <Skeleton className="h-8 w-3/4" />
                                ) : (
                                    <div className="text-2xl font-bold text-primary">
                                        {reportData?.estimatedTax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'R$ 0,00'}
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    {loading ? <Skeleton className="h-4 w-1/2 mt-1" /> : 'Este é o valor estimado para o DAS.'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
