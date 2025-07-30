
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

// Mock data for items as it's not stored in the Invoice document
const mockItems: InvoiceItem[] = [
    { description: 'Consultoria de Software - 10 horas', quantity: 1, unitPrice: 1500.00 },
    { description: 'Desenvolvimento de Módulo de Relatórios', quantity: 1, unitPrice: 2500.00 },
];

export default function DanfePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [client, setClient] = React.useState<Client | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!params.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const invoiceRef = doc(db, 'invoices', params.id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Nota Fiscal não encontrada.' });
          setLoading(false);
          return;
        }
        
        const invoiceData = { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
        setInvoice(invoiceData);

        if (invoiceData.clientId) {
          const clientRef = doc(db, 'clients', invoiceData.clientId);
          const clientSnap = await getDoc(clientRef);
          if (clientSnap.exists()) {
            setClient({ id: clientSnap.id, ...clientSnap.data() } as Client);
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
  }, [params.id, toast]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loading || !invoice;
  const totalValue = mockItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

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
            {isLoading ? (
                <div className="space-y-6">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-10 w-1/3 ml-auto" />
                </div>
            ) : (
                <div className="space-y-6 text-sm">
                    {/* Header */}
                    <header className="flex justify-between items-start pb-4 border-b">
                        <div>
                            <h2 className="text-2xl font-bold">FiscalFlow Soluções</h2>
                            <p className="text-muted-foreground">Rua da Tecnologia, 123 - Tecnovale, SP</p>
                            <p className="text-muted-foreground">CNPJ: 00.000.000/0001-00</p>
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
                                    {mockItems.map((item, index) => (
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
            )}
        </div>
      </div>
    </div>
  );
}
