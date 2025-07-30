
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, FileText, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Client, Invoice } from '@/lib/definitions';
import { handleGenerateAndUpdateAvatar } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

export default function ClienteDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = React.useState<Client | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [clientFormData, setClientFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    avatarPrompt: ''
  });
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const clientId = params.id;
    if (!clientId) return;

    setLoadingData(true);

    // Fetch client data
    const clientUnsubscribe = onSnapshot(doc(db, "clients", clientId), (doc) => {
      if (doc.exists()) {
        const clientData = { id: doc.id, ...doc.data() } as Client;
        setClient(clientData);
        setClientFormData({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          cpf_cnpj: clientData.cpf_cnpj,
          avatarPrompt: ''
        });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Cliente não encontrado.' });
        router.push('/clientes');
      }
    }, (error) => {
        console.error("Error fetching client: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o cliente.' });
    });

    // Fetch invoices for the client
    const invoicesQuery = query(collection(db, "invoices"), where("clientId", "==", clientId));
    const invoicesUnsubscribe = onSnapshot(invoicesQuery, (querySnapshot) => {
        const invoicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Invoice[];
        setInvoices(invoicesData);
        setLoadingData(false);
    }, (error) => {
        console.error("Error fetching invoices: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as notas do cliente.' });
        setLoadingData(false);
    });

    return () => {
      clientUnsubscribe();
      invoicesUnsubscribe();
    };
  }, [params.id, router, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setClientFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleOpenEditDialog = () => {
    if (!client) return;
    setClientFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        cpf_cnpj: client.cpf_cnpj,
        avatarPrompt: ''
    });
    setOpen(true);
  };
  
  const handleSaveChanges = async () => {
    if (!client) return;

    if (clientFormData.name && clientFormData.email && clientFormData.phone && clientFormData.cpf_cnpj) {
        const clientRef = doc(db, "clients", client.id);
        const { avatarPrompt, ...updateData } = clientFormData;
        await updateDoc(clientRef, updateData);
        toast({
          title: 'Cliente Atualizado!',
          description: `${clientFormData.name} foi atualizado com sucesso.`,
        });

        if (clientFormData.avatarPrompt) {
            toast({
              title: 'Gerando novo avatar...',
              description: 'O avatar está sendo atualizado com sua descrição.',
            });
            handleGenerateAndUpdateAvatar({ clientId: client.id, name: clientFormData.name, prompt: clientFormData.avatarPrompt })
            .catch(error => {
                console.error("Failed to re-generate avatar:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro no Avatar',
                    description: 'Não foi possível gerar o novo avatar.',
                });
            });
        }
      setOpen(false);
    } else {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha todos os campos para salvar.' });
    }
  };

  const handleDeleteClient = async () => {
    if(!client) return;
    await deleteDoc(doc(db, "clients", client.id));
    toast({
        title: 'Cliente Excluído!',
        description: 'O cliente foi removido da sua lista.',
        variant: 'destructive'
    });
    router.push('/clientes');
  };

  const isLoading = loadingData || !client;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8 animate-in fade-in-0">
        {/* Header */}
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar</span>
            </Button>
            <h1 className="flex-1 text-2xl font-bold tracking-tight sm:text-3xl truncate">
              {isLoading ? <Skeleton className="h-8 w-64" /> : client.name}
            </h1>
            <div className="flex items-center gap-2">
                <Button onClick={handleOpenEditDialog} disabled={isLoading}>
                    <Edit className="mr-0 h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Editar Cliente</span>
                </Button>
                <Button onClick={handleDeleteClient} variant="destructive" disabled={isLoading}>
                    <Trash2 className="mr-0 h-4 w-4 sm:mr-2" />
                     <span className="hidden sm:inline">Excluir</span>
                </Button>
            </div>
        </div>

        {/* Client Info Card */}
        <Card>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                {isLoading ? <Skeleton className="h-24 w-24 rounded-full" /> : (
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="logo abstract" />
                        <AvatarFallback>{client.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                )}
                <div className="grid gap-1 text-sm">
                    <CardTitle className="text-xl">{isLoading ? <Skeleton className="h-6 w-48" /> : client.name}</CardTitle>
                    {isLoading ? (
                        <div className="space-y-2 pt-1">
                            <Skeleton className="h-4 w-56" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    ) : (
                        <>
                         <div className="text-muted-foreground">{client.email}</div>
                         <div className="text-muted-foreground">{client.cpf_cnpj}</div>
                         <div className="text-muted-foreground">{client.phone}</div>
                        </>
                    )}
                </div>
            </CardHeader>
        </Card>
        
        {/* Invoices History Card */}
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Notas Fiscais</CardTitle>
                <CardDescription>
                    Todas as notas fiscais emitidas para este cliente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº Chave</TableHead>
                            <TableHead className="hidden sm:table-cell">Status</TableHead>
                            <TableHead className="hidden md:table-cell">Data</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                           Array.from({ length: 3 }).map((_, i) => (
                             <TableRow key={i}>
                               <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                               <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24" /></TableCell>
                               <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                             </TableRow>
                           ))
                        ) : invoices.length > 0 ? (
                           invoices.map((invoice) => (
                             <TableRow key={invoice.id}>
                               <TableCell>
                                 <div className="font-mono text-xs break-all">{invoice.key}</div>
                               </TableCell>
                               <TableCell className="hidden sm:table-cell">
                                 <Badge variant={invoice.status === 'autorizada' ? 'default' : invoice.status === 'cancelada' ? 'destructive' : 'secondary'} className="capitalize">
                                   {invoice.status}
                                 </Badge>
                               </TableCell>
                               <TableCell className="hidden md:table-cell">{invoice.date}</TableCell>
                               <TableCell className="text-right">R$ {invoice.value}</TableCell>
                             </TableRow>
                           ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <div className="text-center text-muted-foreground py-8">
                                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                        <p className='mb-2 font-medium'>Nenhuma nota fiscal encontrada.</p>
                                        <p className='text-sm'>Nenhuma nota foi emitida para este cliente ainda.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                    <DialogDescription>
                        Altere as informações do cliente. Clique em salvar para concluir.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nome</Label>
                      <Input id="name" value={clientFormData.name} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">E-mail</Label>
                      <Input id="email" type="email" value={clientFormData.email} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cpf_cnpj" className="text-right">CPF/CNPJ</Label>
                      <Input id="cpf_cnpj" value={clientFormData.cpf_cnpj} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">Telefone</Label>
                      <Input id="phone" value={clientFormData.phone} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="avatarPrompt" className="text-right pt-2">
                        Avatar <span className="text-xs text-muted-foreground">(IA)</span>
                    </Label>
                    <Textarea id="avatarPrompt" value={clientFormData.avatarPrompt} onChange={handleInputChange} placeholder="Descreva um novo avatar para ser gerado." className="col-span-3" rows={2} />
                  </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSaveChanges}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

    