
'use client';

import * as React from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Invoice, Client, InvoiceItem } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PixIcon } from '@/components/ui/pix-icon';
import { Input } from '@/components/ui/input';

const statusConfig: { [key in Invoice['status']]: { variant: "default" | "secondary" | "destructive" | "success" | "warning"; text: string } } = {
  pendente: { variant: 'warning', text: 'Pendente' },
  paga: { variant: 'success', text: 'Paga' },
  vencida: { variant: 'destructive', text: 'Vencida' },
  cancelada: { variant: 'destructive', text: 'Cancelada' },
  rascunho: { variant: 'secondary', text: 'Rascunho' },
};


export default function DanfePage({ params }: { params: { id:string } }) {
  const [invoice, setInvoice] = React.useState<Invoice | null>(null);
  const [client, setClient] = React.useState<Client | null>(null);
  const [companySettings, setCompanySettings] = React.useState<{ name: string; cnpj: string } | null>(null);
  const [items, setItems] = React.useState<InvoiceItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const pixCopiaECola = '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5913Sua Empresa6009SAO PAULO62070503***6304E2A4';

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
          setLoading(false);
          router.push('/dashboard');
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
                  name: settingsData.companyName || 'Sua Empresa (Configure em Configurações)',
                  cnpj: settingsData.cnpj || 'Seu CNPJ (Configure em Configurações)'
              });
          } else {
               setCompanySettings({
                  name: 'Sua Empresa (Configure em Configurações)',
                  cnpj: 'Seu CNPJ (Configure em Configurações)'
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

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    toast({
        title: 'Copiado!',
        description: 'O código PIX foi copiado para a área de transferência.'
    })
  }

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

        <div className="danfe-container border bg-card p-6 sm:p-8 rounded-lg shadow-sm">
                <div className="space-y-6 text-xs sm:text-sm">
                    {/* Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b gap-4">
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold">{companySettings?.name}</h2>
                            <p className="text-muted-foreground">Rua da Tecnologia, 123 - Tecnovale, SP</p>
                            <p className="text-muted-foreground">CNPJ: {companySettings?.cnpj}</p>
                        </div>
                        <div className="text-left sm:text-right border p-2 rounded-md w-full sm:w-auto">
                            <h3 className="text-base font-bold">DANFE</h3>
                            <p className='text-muted-foreground'>Doc. Auxiliar da NF-e</p>
                            <p className="font-mono text-xs mt-1 break-all">{invoice?.key}</p>
                        </div>
                    </header>

                    {/* Invoice Details */}
                    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className='border p-3 rounded-md'>
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Status</p>
                             <Badge variant={statusConfig[invoice.status].variant} className="mt-1 text-sm">
                                {statusConfig[invoice.status].text}
                            </Badge>
                        </div>
                         <div className='border p-3 rounded-md'>
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Natureza da Operação</p>
                            <p className="font-medium">{invoice.naturezaOperacao}</p>
                        </div>
                         <div className='border p-3 rounded-md'>
                            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Data de Emissão</p>
                            <p className="font-medium">{invoice.date}</p>
                        </div>
                        {invoice.dueDate && (
                             <div className='border p-3 rounded-md'>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Data de Vencimento</p>
                                <p className="font-medium">{invoice.dueDate}</p>
                            </div>
                        )}
                    </section>

                    {/* Recipient */}
                    <section>
                        <h4 className="font-bold mb-2 text-base border-b pb-1">Destinatário / Remetente</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            <div>
                                <p className="text-muted-foreground text-xs">NOME/RAZÃO SOCIAL</p>
                                <p className="font-medium">{client?.name ?? invoice?.client}</p>
                            </div>
                             <div>
                                <p className="text-muted-foreground text-xs">CPF/CNPJ</p>
                                <p className="font-medium">{client?.cpf_cnpj}</p>
                            </div>
                             <div className='col-span-full'>
                                <p className="text-muted-foreground text-xs">ENDEREÇO/E-MAIL</p>
                                <p className="font-medium">{client?.email ?? invoice.destinatario.endereco}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">TELEFONE</p>
                                <p className="font-medium">{client?.phone}</p>
                            </div>
                        </div>
                    </section>
                    
                    {/* Items */}
                    {items && items.length > 0 && (
                        <section>
                            <h4 className="font-bold mb-2 text-base border-b pb-1">Cálculo do Imposto / Itens</h4>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-muted">
                                        <tr className="border-b">
                                            <th className="p-2 font-medium">Descrição do Produto/Serviço</th>
                                            <th className="p-2 w-20 text-center font-medium">Qtd.</th>
                                            <th className="p-2 w-28 text-right font-medium">Valor Unit.</th>
                                            <th className="p-2 w-28 text-right font-medium">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index} className="border-b last:border-none">
                                                <td className="p-2 align-top">{item.description}</td>
                                                <td className="p-2 text-center align-top">{item.quantity}</td>
                                                <td className="p-2 text-right align-top">{item.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                                <td className="p-2 text-right align-top">{(item.quantity * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* PIX Payment Section */}
                    {invoice.status !== 'paga' && invoice.status !== 'cancelada' && (
                        <section className="pt-4">
                            <h4 className="font-bold mb-4 text-base border-b pb-1 flex items-center gap-2"><PixIcon /> Pague com PIX</h4>
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className='text-center'>
                                    <Image 
                                        src="https://placehold.co/200x200.png"
                                        alt="QR Code PIX" 
                                        width={160} 
                                        height={160} 
                                        className="rounded-md border p-1"
                                        data-ai-hint="qr code"
                                    />
                                    <p className="text-xs mt-1 text-muted-foreground">Escaneie para pagar</p>
                                </div>
                                <div className="space-y-3 flex-1 w-full">
                                    <p className="text-sm font-medium">Ou use o PIX Copia e Cola:</p>
                                    <div className="flex gap-2">
                                        <Input readOnly value={pixCopiaECola} className="text-xs bg-muted" />
                                        <Button size="icon" variant="outline" onClick={handleCopyToClipboard}>
                                            <Copy className="h-4 w-4" />
                                            <span className="sr-only">Copiar</span>
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">O pagamento é confirmado em poucos instantes.</p>
                                </div>
                            </div>
                        </section>
                    )}


                    {/* Footer */}
                    <footer className="pt-4">
                         <Separator className="mb-4" />
                        <div className="flex justify-end">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Valor Total dos Itens:</span>
                                    <span className="font-medium">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-base font-bold">
                                    <span>VALOR TOTAL DA NOTA:</span>
                                    <span>{invoice.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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

    


    