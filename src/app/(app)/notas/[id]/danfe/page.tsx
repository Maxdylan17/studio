
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Invoice, Client, InvoiceItem } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export default function DanfePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [client, setClient] = React.useState<Client | null>(null);
  const [companySettings, setCompanySettings] = React.useState<{ name: string; cnpj: string } | null>(null);
  const [items, setItems] = React.useState<InvoiceItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!params.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Invoice
        const invoiceRef = doc(db, 'invoices', params.id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Nota Fiscal não encontrada.' });
          // Don't redirect, just show an error state, as this page might be accessed publicly.
          setLoading(false);
          return;
        }
        
        const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
        setInvoice(invoiceData);
        setItems(invoiceData.items || []);

        // Fetch Client
        if (invoiceData.clientId) {
          const clientRef = doc(db, 'clients', invoiceData.clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
          }
        }

        // Fetch Company Settings (from the user who created the invoice)
        if (invoiceData.userId) {
          const settingsRef = doc(db, 'settings', invoiceData.userId);
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists()) {
              const settingsData = settingsSnap.data();
              setCompanySettings({
                  name: settingsData.companyName || 'FiscalFlow Soluções',
                  cnpj: settingsData.cnpj || '00.000.000/0001-00'
              });
          } else {
               setCompanySettings({
                  name: 'FiscalFlow Soluções',
                  cnpj: '00.000.000/0001-00'
              });
          }
        }

      } catch (error) {
        console.error('Error fetching DANFE data:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os dados da nota.' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, toast, router]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loading;
  const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  
  if (isLoading) {
    return (
        <div className="bg-background min-h-screen p-4 sm:p-8 flex justify-center items-center">
             <div className="max-w-4xl w-full space-y-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-10 w-1/3 ml-auto" />
            </div>
        </div>
    )
  }

  if (!invoice) {
     return (
        <div className="bg-background min-h-screen p-4 sm:p-8 flex justify-center items-center">
             <div className="text-center">
                <h1 className="text-xl font-bold">Nota Fiscal não encontrada</h1>
                <p className="text-muted-foreground">O link pode estar incorreto ou a nota pode ter sido excluída.</p>
                <Button onClick={() => router.push('/dashboard')} className="mt-4">Voltar para o Dashboard</Button>
            </div>
        </div>
    )
  }


  return (
    <div className="bg-background min-h-screen p-4 sm:p-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .danfe-container, .danfe-container * {
            visibility: visible;
          }
          .danfe-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4 no-print">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Visualização de DANFE</h1>
            <Button onClick={handlePrint} disabled={isLoading}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir / Salvar PDF
            </Button>
        </div>

        <div className="danfe-container border bg-card p-8 rounded-lg shadow-sm">
                <div className="space-y-6 text-sm">
                    {/* Header */}
                    <header className="flex justify-between items-start pb-4 border-b">
                        <div>
                            <h2 className="text-2xl font-bold">{companySettings?.name}</h2>
                            <p className="text-muted-foreground">Rua da Tecnologia, 123 - Tecnovale, SP</p>
                            <p className="text-muted-foreground">CNPJ: {companySettings?.cnpj}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-bold">DANFE</h3>
                            <p>Documento Auxiliar da Nota Fiscal Eletrônica</p>
                            <p className="font-mono text-xs mt-2 bg-muted p-2 rounded-md">{invoice?.key}</p>
                        </div>
                    </header>

                    {/* Recipient */}
                    <section>
                        <h4 className="font-semibold mb-2 text-base">Destinatário / Remetente</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                            <div>
                                <p className="text-muted-foreground">NOME/RAZÃO SOCIAL</p>
                                <p className="font-medium">{client?.name ?? invoice?.client}</p>
                            </div>
                             <div>
                                <p className="text-muted-foreground">CPF/CNPJ</p>
                                <p className="font-medium">{client?.cpf_cnpj}</p>
                            </div>
                             <div>
                                <p className="text-muted-foreground">ENDEREÇO</p>
                                <p className="font-medium">{client?.email}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">TELEFONE</p>
                                <p className="font-medium">{client?.phone}</p>
                            </div>
                        </div>
                    </section>
                    
                    {/* Items */}
                    {items && items.length > 0 && (
                        <section>
                            <h4 className="font-semibold mb-2 text-base">Produtos / Serviços</h4>
                            <div className="border rounded-md">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr className="border-b">
                                            <th className="p-2 text-left font-medium">Descrição</th>
                                            <th className="p-2 w-24 text-center font-medium">Qtd.</th>
                                            <th className="p-2 w-32 text-right font-medium">Valor Unit.</th>
                                            <th className="p-2 w-32 text-right font-medium">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="border-b last:border-none">
                                                <td className="p-2">{item.description}</td>
                                                <td className="p-2 text-center">{item.quantity}</td>
                                                <td className="p-2 text-right">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2 text-right">{(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}


                    {/* Footer */}
                    <footer className="pt-4">
                        <div className="flex justify-end">
                            <div className="w-full max-w-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Valor Total dos Produtos/Serviços:</span>
                                    <span className="font-medium">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>VALOR TOTAL DA NOTA:</span>
                                    <span>{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center text-xs text-muted-foreground">
                            <p>Documento emitido por sistema de processamento de dados em conformidade com a legislação vigente.</p>
                            <p>Consulte a autenticidade em www.nfe.fazenda.gov.br/portal</p>
                        </div>
                    </footer>
                </div>
        </div>
      </div>
    </div>
  );
}

    