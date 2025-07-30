
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/definitions';
import { Download, Mail, Eye, FileText, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { handleGenerateInvoiceEmail } from '@/lib/actions';

const FAKE_USER_ID = "local-user";

export default function NotasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoadingData(true);
      try {
          const q = query(collection(db, "invoices"), where("userId", "==", FAKE_USER_ID), orderBy("date", "desc"));
          const querySnapshot = await getDocs(q);
          const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[];
          setInvoices(invoicesData);
      } catch (error) {
          console.error("Error fetching invoices: ", error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as notas fiscais.' });
      } finally {
          setLoadingData(false);
      }
    }
    fetchInvoices();
  }, [toast]);


  const handleAction = (action: string) => {
    toast({
      title: `Ação: ${action}`,
      description: `Sua solicitação foi processada (Simulação).`,
    });
  };

  const handleSendEmail = async () => {
    if (!selectedInvoice) return;
    
    setIsSendingEmail(true);
    try {
        // Find client email
        let clientEmail = '';
        if (selectedInvoice.clientId) {
            const clientSnap = await getDoc(doc(db, "clients", selectedInvoice.clientId));
            if (clientSnap.exists()) {
                clientEmail = clientSnap.data().email;
            }
        }
        
        if (!clientEmail) {
            toast({
                variant: 'destructive',
                title: 'E-mail não encontrado',
                description: 'Não foi possível encontrar o e-mail do cliente. Verifique o cadastro do cliente.',
            });
            setIsSendingEmail(false);
            return;
        }

        const emailData = await handleGenerateInvoiceEmail({
            clientName: selectedInvoice.client,
            invoiceDate: selectedInvoice.date,
            invoiceValue: selectedInvoice.value,
            invoiceKey: selectedInvoice.key
        });

        // Use mailto to open default email client. We need to URI-encode the subject and body.
        const subject = encodeURIComponent(emailData.subject);
        // To use HTML in mailto, it's not universally supported but we can try.
        // We'll construct a simple text representation as a fallback.
        const plainTextBody = `Olá ${selectedInvoice.client},\n\nSua nota fiscal está disponível.\n\nDetalhes:\nData: ${selectedInvoice.date}\nValor: R$ ${selectedInvoice.value}\n\nChave de Acesso: ${selectedInvoice.key}\n\nAtenciosamente,`;
        
        const bodyForMailto = encodeURIComponent(emailData.body)
          .replace(/%3Cbr%3E/g, '%0A')
          .replace(/%3Cbr\s\/\3E/g, '%0A')
          .replace(/%3Cp%3E/g, '')
          .replace(/%3C\/p%3E/g, '%0A%0A')
          .replace(/%3Ch1%3E/g, '')
          .replace(/%3C\/h1%3E/g, '%0A')
          .replace(/%3Ch2%3E/g, '')
          .replace(/%3C\/h2%3E/g, '%0A')
          .replace(/%3Cstrong%3E/g, '')
          .replace(/%3C\/strong%3E/g, '');


        window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${bodyForMailto}`;

        toast({
            title: 'E-mail pronto para envio!',
            description: 'Seu cliente de e-mail foi aberto com a mensagem.'
        });

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro ao Gerar E-mail',
            description: 'Não foi possível criar o corpo do e-mail. Tente novamente.'
        });
        console.error(error);
    } finally {
        setIsSendingEmail(false);
        setSelectedInvoice(null);
    }
  }


  const isLoading = loadingData;

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 animate-in fade-in-0">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Notas Fiscais</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
          <CardDescription>
            Visualize e gerencie suas notas fiscais emitidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-28 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium">{invoice.client}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                        R$ {invoice.value}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge
                      variant={
                        invoice.status === 'autorizada'
                          ? 'default'
                          : invoice.status === 'cancelada'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {invoice.date}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">R$ {invoice.value}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <Eye className="mr-0 h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Detalhes</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              ) : (
                <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center">
                         <div className="text-center text-muted-foreground py-12">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className='mb-2 font-medium'>Nenhuma nota fiscal encontrada.</p>
                            <p className='text-sm'>Vá para a página "Emitir Nota" para criar sua primeira.</p>
                        </div>
                     </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedInvoice && (
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={(open) => !open && setSelectedInvoice(null)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Nota Fiscal</DialogTitle>
              <DialogDescription>
                Informações completas da nota fiscal selecionada.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">
                  Cliente:
                </span>
                <span className="col-span-2">{selectedInvoice.client}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">
                  Valor:
                </span>
                <span className="col-span-2">R$ {selectedInvoice.value}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">
                  Data:
                </span>
                <span className="col-span-2">{selectedInvoice.date}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">
                  Status:
                </span>
                <span className="col-span-2">
                   <Badge
                      variant={
                        selectedInvoice.status === 'autorizada'
                          ? 'default'
                          : selectedInvoice.status === 'cancelada'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="capitalize"
                    >
                      {selectedInvoice.status}
                    </Badge>
                </span>
              </div>
               <div className="grid grid-cols-3 items-start gap-4">
                <span className="font-semibold text-muted-foreground pt-1">
                  Chave:
                </span>
                <span className="col-span-2 break-all font-mono text-xs">
                  {selectedInvoice.key}
                </span>
              </div>
            </div>
            <DialogFooter className='flex-col sm:flex-row sm:justify-start gap-2 flex-wrap'>
              <Button onClick={() => handleAction('Baixar DANFE (PDF)')} variant="secondary">
                <Download className="mr-2 h-4 w-4" /> Baixar DANFE (PDF)
              </Button>
              <Button onClick={() => handleAction('Baixar XML')} variant="secondary">
                <Download className="mr-2 h-4 w-4" /> Baixar XML
              </Button>
               <Button onClick={handleSendEmail} variant="secondary" disabled={isSendingEmail}>
                 {isSendingEmail ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Mail className="mr-2 h-4 w-4" />
                 )}
                 {isSendingEmail ? 'Gerando...' : 'Enviar por E-mail'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
