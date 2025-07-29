
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
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string; // Added this field
  userId: string; // This can be a static value now
};

const FAKE_USER_ID = "local-user";

export default function ClientesPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingClient, setEditingClient] = React.useState<Partial<Client> | null>(null);
  const [clientFormData, setClientFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: ''
  });
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchClients = async () => {
        setLoadingData(true);
        try {
          const q = query(collection(db, "clients"), where("userId", "==", FAKE_USER_ID));
          const querySnapshot = await getDocs(q);
          const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
          setClients(clientsData);
        } catch (error) {
          console.error("Error fetching clients: ", error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os clientes.' });
        } finally {
          setLoadingData(false);
        }
    };

    fetchClients();
  }, [toast]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleOpenDialog = (client: Partial<Client> | null) => {
    setEditingClient(client);
    setClientFormData(client ? { name: client.name || '', email: client.email || '', phone: client.phone || '', cpf_cnpj: client.cpf_cnpj || '' } : { name: '', email: '', phone: '', cpf_cnpj: '' });
    setOpen(true);
  }

  const handleSaveClient = async () => {
    if (clientFormData.name && clientFormData.email && clientFormData.phone && clientFormData.cpf_cnpj) {
      if (editingClient && editingClient.id) {
        // Edit existing client
        const clientRef = doc(db, "clients", editingClient.id);
        await updateDoc(clientRef, clientFormData);
        setClients(clients.map((client) =>
          client.id === editingClient.id ? { ...client, ...clientFormData } : client
        ) as Client[]);
        toast({
          title: 'Cliente Atualizado!',
          description: `${clientFormData.name} foi atualizado com sucesso.`,
        });
      } else {
        // Add new client
        const newClientData = {
          ...clientFormData,
          userId: FAKE_USER_ID,
        };
        const docRef = await addDoc(collection(db, "clients"), newClientData);
        setClients([...clients, { id: docRef.id, ...newClientData }]);
        toast({
          title: 'Cliente Salvo!',
          description: `${clientFormData.name} foi adicionado à sua lista de clientes.`,
        });
      }
      setOpen(false);
      setEditingClient(null);
    } else {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Preencha todos os campos para salvar.' });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    await deleteDoc(doc(db, "clients", clientId));
    const updatedClients = clients.filter((client) => client.id !== clientId);
    setClients(updatedClients);
    toast({
        title: 'Cliente Excluído!',
        description: 'O cliente foi removido da sua lista.',
        variant: 'destructive'
    })
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf_cnpj.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isLoading = loadingData;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <div className="flex items-center gap-2">
           <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) setEditingClient(null); setOpen(isOpen);}}>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</DialogTitle>
                <DialogDescription>
                    {editingClient ? 'Altere as informações do cliente.' : 'Preencha as informações do novo cliente.'} Clique em salvar para concluir.
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
            <div className='flex sm:flex-row flex-col justify-between gap-4'>
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
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                    <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {client.email}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                        {client.cpf_cnpj}
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenDialog(client)}>Editar</DropdownMenuItem>
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
                        <div className="text-center text-muted-foreground">
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
