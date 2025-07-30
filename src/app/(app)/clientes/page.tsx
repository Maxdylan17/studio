
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, FileText } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Client } from '@/lib/definitions';
import { handleGenerateAndUpdateAvatar } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';


const FAKE_USER_ID = "local-user";

export default function ClientesPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
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
    setLoadingData(true);
    const q = query(collection(db, "clients"), where("userId", "==", FAKE_USER_ID));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
        setClients(clientsData);
        setLoadingData(false);
    }, (error) => {
        console.error("Error fetching clients: ", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os clientes.' });
        setLoadingData(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setClientFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleOpenDialog = () => {
    setClientFormData({ name: '', email: '', phone: '', cpf_cnpj: '', avatarPrompt: '' });
    setOpen(true);
  }

  const handleSaveClient = async () => {
    if (clientFormData.name && clientFormData.email && clientFormData.phone && clientFormData.cpf_cnpj) {
        // Add new client
        const { avatarPrompt, ...newClientData } = {
          ...clientFormData,
          userId: FAKE_USER_ID,
          avatarUrl: '', // Start with empty avatar
        };
        const docRef = await addDoc(collection(db, "clients"), newClientData);
        toast({
          title: 'Cliente Salvo!',
          description: `${clientFormData.name} foi adicionado. Gerando avatar...`,
        });

        // Trigger avatar generation in the background
        handleGenerateAndUpdateAvatar({ clientId: docRef.id, name: newClientData.name, prompt: clientFormData.avatarPrompt || undefined })
            .catch(error => {
                console.error("Failed to generate avatar:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro no Avatar',
                    description: 'Não foi possível gerar o avatar para o cliente.',
                });
            });

      setOpen(false);
    } else {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha todos os campos para salvar.' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    await deleteDoc(doc(db, "clients", clientId));
    toast({
        title: 'Cliente Excluído!',
        description: 'O cliente foi removido da sua lista.',
        variant: 'destructive'
    })
  };

  const handleRowClick = (clientId: string) => {
    router.push(`/clientes/${clientId}`);
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isLoading = loadingData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8 animate-in fade-in-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <div className="flex items-center gap-2">
           <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleOpenDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                <DialogDescription>
                    Preencha as informações do novo cliente. Clique em salvar para concluir.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                      Nome
                      </Label>
                      <Input
                      id="name"
                      value={clientFormData.name}
                      onChange={handleInputChange}
                      placeholder="Empresa Exemplo"
                      className="col-span-3"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                      E-mail
                      </Label>
                      <Input
                      id="email"
                      type="email"
                      value={clientFormData.email}
                      onChange={handleInputChange}
                      placeholder="contato@exemplo.com"
                      className="col-span-3"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="cpf_cnpj" className="text-right">
                      CPF/CNPJ
                      </Label>
                      <Input
                      id="cpf_cnpj"
                      value={clientFormData.cpf_cnpj}
                      onChange={handleInputChange}
                      placeholder="00.000.000/0001-00"
                      className="col-span-3"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                      Telefone
                      </Label>
                      <Input
                      id="phone"
                      value={clientFormData.phone}
                      onChange={handleInputChange}
                      placeholder="(11) 99999-9999"
                      className="col-span-3"
                      />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="avatarPrompt" className="text-right pt-2">
                        Avatar <span className="text-xs text-muted-foreground">(IA)</span>
                    </Label>
                    <Textarea
                        id="avatarPrompt"
                        value={clientFormData.avatarPrompt}
                        onChange={handleInputChange}
                        placeholder={"Opcional: Descreva o logo. Ex: um foguete decolando."}
                        className="col-span-3"
                        rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                <Button type="submit" onClick={handleSaveClient}>
                    Salvar Cliente
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between gap-4'>
                <div>
                    <CardTitle>Lista de Clientes</CardTitle>
                    <CardDescription>
                        Gerencie seus clientes cadastrados.
                    </CardDescription>
                </div>
                <div className="relative sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar cliente..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                        <div className='flex items-center gap-3'>
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className='space-y-1'>
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer" onClick={() => handleRowClick(client.id)}>
                    <TableCell className="font-medium">
                        <div className='flex items-center gap-3'>
                            <Avatar>
                                <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="logo abstract"/>
                                <AvatarFallback>{client.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                {client.name}
                                <div className="text-xs text-muted-foreground md:hidden">{client.email}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {client.email}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                        {client.cpf_cnpj}
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleRowClick(client.id)}>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                            Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        <div className="text-center text-muted-foreground py-8">
                            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className='mb-2 font-medium'>Nenhum cliente encontrado.</p>
                            <p className='text-sm'>Adicione um novo cliente para começar.</p>
                        </div>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    