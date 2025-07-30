
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
import { Download, Mail, Eye, FileText, RefreshCw, Send, X } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { handleGenerateInvoiceEmail } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';


type EmailContent = {
  to: string;
  subject: string;
  body: string;
}

export default function NotasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
        setLoadingData(false);
        return;
    }

    const fetchInvoices = async () => {
      setLoadingData(true);
      try {
          const q = query(collection(db, "invoices"), where("userId", "==", user.uid), orderBy("date", "desc"));
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
  }, [user, toast]);


  const handleAction = (action: string) => {
    toast({
      title: `Ação: ${action}`,
      description: `Sua solicitação foi processada (Simulação).`,
    });
  };
  
  const handleOpenDanfe = (invoiceId: string) => {
    window.open(`/notas/${invoiceId}/danfe`, '_blank');
  };

  const handleOpenDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsDialogOpen(true);
  }

  const handleOpenEmailDialog = async () => {
    if (!selectedInvoice || !user) return;
    
    setLoadingAction('email');
    try {
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
                title: 'E-mail do cliente não encontrado',
                description: 'Verifique o cadastro do cliente para adicionar um e-mail.',
            });
            setLoadingAction(null);
            return;
        }
        
        const settingsDoc = await getDoc(doc(db, "settings", user.uid));
        const companyName = settingsDoc.exists() ? settingsDoc.data().companyName : 'Sua Empresa';

        const emailData = await handleGenerateInvoiceEmail({
            clientName: selectedInvoice.client,
            invoiceDate: selectedInvoice.date,
            invoiceValue: selectedInvoice.value,
            invoiceKey: selectedInvoice.key,
            companyName: companyName,
        });

        setEmailContent({
          to: clientEmail,
          subject: emailData.subject,
          body: emailData.body
        });
        
        setDetailsDialogOpen(false); // Fecha o dialog de detalhes
        setEmailDialogOpen(true); // Abre o dialog de email

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro ao Gerar E-mail',
            description: 'Não foi possível criar o conteúdo do e-mail. Tente novamente.'
        });
        console.error(error);
    } finally {
        setLoadingAction(null);
    }
  }
  
  const handleSendEmail = () => {
    setLoadingAction('send');
    // Simulação de envio
    setTimeout(() => {
        toast({
            title: 'E-mail enviado com sucesso!',
            description: `A nota fiscal foi enviada para ${emailContent?.to}.`
        });
        setEmailDialogOpen(false);
        setEmailContent(null);
        setLoadingAction(null);
    }, 1500);
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
                        <TableCell><Skeleton className="h-5 w-24 sm:w-40" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium truncate max-w-40 sm:max-w-xs">{invoice.client}</div>
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
                      onClick={() => handleOpenDetails(invoice)}
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

      {/* Details Dialog */}
      {selectedInvoice && (
        <Dialog
          open={detailsDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
                setSelectedInvoice(null);
            }
            setDetailsDialogOpen(open);
          }}
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
              <Button onClick={() => handleOpenDanfe(selectedInvoice.id)} variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" /> Baixar DANFE
              </Button>
              <Button onClick={() => handleAction('Baixar XML')} variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" /> Baixar XML
              </Button>
               <Button onClick={handleOpenEmailDialog} variant="default" disabled={loadingAction === 'email'} size="sm">
                 {loadingAction === 'email' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                 ) : (
                    <Mail className="mr-2 h-4 w-4" />
                 )}
                 {loadingAction === 'email' ? 'Gerando...' : 'Enviar por E-mail'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Email Dialog */}
      {emailContent && (
         <Dialog open={emailDialogOpen} onOpenChange={(open) => {
            if (!open) {
                setEmailContent(null);
            }
            setEmailDialogOpen(open);
         }}>
             <DialogContent className="sm:max-w-3xl">
                 <DialogHeader>
                    <DialogTitle>Enviar Nota Fiscal por E-mail</DialogTitle>
                    <DialogDescription>
                        Revise o e-mail gerado pela IA antes de enviar para o seu cliente.
                    </DialogDescription>
                 </DialogHeader>
                 <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-6 items-center gap-4">
                        <label htmlFor="email-to" className="col-span-1 text-sm font-medium text-muted-foreground">Para:</label>
                        <Input id="email-to" value={emailContent.to} readOnly className="col-span-5" />
                     </div>
                     <div className="grid grid-cols-6 items-center gap-4">
                        <label htmlFor="email-subject" className="col-span-1 text-sm font-medium text-muted-foreground">Assunto:</label>
                        <Input id="email-subject" value={emailContent.subject} readOnly className="col-span-5" />
                     </div>
                    <Separator />
                     <div 
                        className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-card p-4 h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: emailContent.body }} 
                     />
                 </div>
                 <DialogFooter>
                    <Button variant="ghost" onClick={() => setEmailDialogOpen(false)} disabled={loadingAction === 'send'}>Cancelar</Button>
                     <Button onClick={handleSendEmail} disabled={loadingAction === 'send'}>
                        {loadingAction === 'send' ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {loadingAction === 'send' ? 'Enviando...' : 'Enviar E-mail'}
                    </Button>
                 </DialogFooter>
             </DialogContent>
         </Dialog>
      )}
    </div>
  );
}
