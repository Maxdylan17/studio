
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
import { Download, Mail, Eye, FileText, RefreshCw, Send, X, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { handleGenerateInvoiceEmail } from '@/lib/actions';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


type EmailContent = {
  to: string;
  subject: string;
  body: string;
}

const WhatsAppIcon = () => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.06 22L7.32 20.64C8.75 21.41 10.36 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2M12.04 3.67C16.56 3.67 20.28 7.39 20.28 11.91C20.28 16.43 16.56 20.15 12.04 20.15C10.48 20.15 8.99 19.76 7.67 19.03L7.14 18.72L4.24 19.57L5.12 16.78L4.83 16.24C4.01 14.85 3.57 13.32 3.57 11.91C3.57 7.39 7.39 3.67 12.04 3.67M9.23 7.29C8.98 7.29 8.76 7.34 8.58 7.51C8.4 7.68 7.97 8.1 7.97 8.92C7.97 9.74 8.58 10.5 8.71 10.69C8.83 10.88 10.02 12.83 12.03 13.63C13.65 14.29 14.08 14.12 14.39 14.08C14.71 14.03 15.53 13.51 15.7 12.95C15.87 12.38 15.87 11.91 15.82 11.82C15.77 11.72 15.59 11.67 15.34 11.53C15.09 11.38 13.95 10.82 13.73 10.73C13.51 10.64 13.34 10.59 13.17 10.88C13 11.17 12.51 11.67 12.34 11.87C12.17 12.07 11.99 12.09 11.74 11.95C11.5 11.81 10.74 11.58 9.82 10.78C9.09 10.15 8.61 9.35 8.49 9.11C8.37 8.87 8.46 8.73 8.58 8.61C8.68 8.51 8.81 8.36 8.93 8.24C9.05 8.12 9.12 8.01 9.23 7.84C9.33 7.67 9.28 7.53 9.23 7.43C9.18 7.34 8.86 6.46 8.71 6.02C8.56 5.58 8.41 5.61 8.28 5.61C8.15 5.61 7.99 5.61 7.82 5.61C7.65 5.61 7.38 5.66 7.15 5.88C6.92 6.1 6.46 6.55 6.46 7.4C6.46 8.25 6.92 9.03 7.04 9.2C7.17 9.37 8.28 11.16 10.22 12.02C11.75 12.7 12.21 12.89 12.63 12.89C13.04 12.89 13.75 12.82 13.97 12.5C14.19 12.18 14.19 11.67 14.14 11.53C14.09 11.38 13.88 11.31 13.68 11.22C13.48 11.12 12.56 10.64 12.35 10.55C12.15 10.46 12.01 10.44 11.89 10.64C11.77 10.83 11.39 11.27 11.28 11.4C11.17 11.53 11.06 11.55 10.92 11.5C10.78 11.45 10.17 11.25 9.4 10.59C8.79 10.05 8.37 9.35 8.28 9.15C8.18 8.95 8.25 8.83 8.35 8.73C8.43 8.65 8.53 8.53 8.63 8.42C8.73 8.31 8.77 8.24 8.84 8.12C8.9 8.01 8.88 7.92 8.83 7.82C8.78 7.72 8.33 6.64 8.15 6.22C7.97 5.8 7.79 5.75 7.64 5.75C7.49 5.75 7.32 5.75 7.15 5.75C6.98 5.75 6.71 5.8 6.51 6.02C6.31 6.24 5.88 6.68 5.88 7.51C5.88 8.34 6.34 9.12 6.46 9.29C6.59 9.46 7.7 11.25 9.65 12.11C11.17 12.8 11.64 12.98 12.05 12.98C12.47 12.98 13.18 12.92 13.39 12.59C13.62 12.27 13.62 11.76 13.57 11.62C13.52 11.48 13.31 11.41 13.11 11.31C12.91 11.22 11.99 10.74 11.78 10.65C11.58 10.56 11.44 10.53 11.32 10.73C11.2 10.93 10.82 11.37 10.71 11.5C10.6 11.63 10.48 11.65 10.35 11.6C10.21 11.55 9.6 11.35 8.83 10.69C8.22 10.14 7.8 9.45 7.71 9.25C7.62 9.05 7.68 8.93 7.78 8.83C7.86 8.75 7.96 8.63 8.06 8.52C8.16 8.41 8.2 8.34 8.27 8.22C8.33 8.1 8.31 8.02 8.26 7.92C8.21 7.82 7.76 6.74 7.58 6.32C7.4 5.9 7.22 5.85 7.07 5.85C6.92 5.85 6.75 5.85 6.58 5.85Z"></path>
    </svg>
);


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

  const fetchInvoices = async () => {
    if (!user) {
        setLoadingData(false);
        return;
    }
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

  useEffect(() => {
    fetchInvoices();
  }, [user]);


  const handleDeleteInvoice = async (invoiceId: string) => {
    setLoadingAction(`delete-${invoiceId}`);
    try {
      await deleteDoc(doc(db, "invoices", invoiceId));
      toast({ title: 'Nota Fiscal Excluída!', description: 'A nota foi removida do seu histórico.' });
      fetchInvoices(); // Re-fetch invoices to update the list
      setDetailsDialogOpen(false); // Close dialog if open
    } catch (error) {
      console.error("Error deleting invoice: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir a nota fiscal.' });
    } finally {
      setLoadingAction(null);
    }
  };

  
  const handleOpenDanfe = (invoiceId: string) => {
    window.open(`/notas/${invoiceId}/danfe`, '_blank');
  };

  const handleShareOnWhatsApp = async () => {
    if (!selectedInvoice) return;
    setLoadingAction('whatsapp');

    try {
        let clientPhone = '';
        if (selectedInvoice.clientId) {
            const clientSnap = await getDoc(doc(db, "clients", selectedInvoice.clientId));
            if (clientSnap.exists()) {
                // Remove non-numeric characters for the phone number
                clientPhone = (clientSnap.data().phone || '').replace(/\D/g, '');
            }
        }
        
        if (!clientPhone) {
            toast({
                variant: 'destructive',
                title: 'Telefone não encontrado',
                description: 'O cliente não possui um número de telefone válido para envio via WhatsApp.',
            });
            setLoadingAction(null);
            return;
        }

        const danfeUrl = `${window.location.origin}/notas/${selectedInvoice.id}/danfe`;
        const message = `Olá, ${selectedInvoice.client}! Segue a sua nota fiscal no valor de R$ ${selectedInvoice.value}, emitida em ${selectedInvoice.date}. Você pode visualizá-la aqui: ${danfeUrl}`;

        // Construct the WhatsApp URL
        const whatsappUrl = `https://wa.me/${clientPhone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
        
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao compartilhar',
            description: 'Não foi possível gerar o link do WhatsApp. Verifique os dados do cliente.'
        });
        console.error("Error sharing on WhatsApp: ", error);
    } finally {
        setLoadingAction(null);
    }
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
            <DialogFooter className='flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-between sm:items-center'>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto" disabled={loadingAction === `delete-${selectedInvoice.id}`}>
                        {loadingAction === `delete-${selectedInvoice.id}` ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a nota fiscal
                        dos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteInvoice(selectedInvoice.id)}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end flex-wrap">
                    <Button onClick={() => handleOpenDanfe(selectedInvoice.id)} variant="secondary" size="sm">
                        <Download className="mr-2 h-4 w-4" /> Baixar DANFE
                    </Button>
                    <Button onClick={handleShareOnWhatsApp} variant="secondary" size="sm" disabled={loadingAction === 'whatsapp'}>
                        {loadingAction === 'whatsapp' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <WhatsAppIcon />}
                        <span className="ml-2">WhatsApp</span>
                    </Button>
                    <Button onClick={handleOpenEmailDialog} variant="default" disabled={loadingAction === 'email'} size="sm">
                        {loadingAction === 'email' ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Mail className="mr-2 h-4 w-4" />
                        )}
                        {loadingAction === 'email' ? 'Gerando...' : 'E-mail'}
                    </Button>
                </div>
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

    

    