
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
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
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

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Tech Solutions Ltda.',
    email: 'contato@techsolutions.com.br',
    phone: '(11) 98765-4321',
  },
  {
    id: '2',
    name: 'Inova Comércio Global',
    email: 'suporte@inovaglobal.co',
    phone: '(21) 91234-5678',
  },
  {
    id: '3',
    name: 'Design Criativo Estúdio',
    email: 'criativo@design.com',
    phone: '(31) 99999-8888',
  },
  {
    id: '4',
    name: 'Consultoria Eficaz',
    email: 'atendimento@consultoriaeficaz.com',
    phone: '(41) 98877-6655',
  },
  {
    id: '5',
    name: 'Mercado Veloz',
    email: 'financeiro@mercadoveloz.net',
    phone: '(51) 99654-3210',
  },
];

const CLIENTS_STORAGE_KEY = 'fiscalflow:clients';


export default function ClientesPage() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [clientFormData, setClientFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
  });
  const { toast } = useToast();

  React.useEffect(() => {
    const savedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    } else {
      setClients(mockClients);
    }
  }, []);

  const persistClients = (updatedClients: Client[]) => {
    setClients(updatedClients);
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedClients));
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientFormData((prev) => ({ ...prev, [id]: value }));
  };
  
  const handleOpenDialog = (client: Client | null) => {
    setEditingClient(client);
    setClientFormData(client ? { ...client } : { name: '', email: '', phone: '' });
    setOpen(true);
  }

  const handleSaveClient = () => {
    if (clientFormData.name && clientFormData.email && clientFormData.phone) {
      let updatedClients;
      if (editingClient) {
        // Edit existing client
        updatedClients = clients.map((client) =>
          client.id === editingClient.id ? { ...client, ...clientFormData } : client
        );
        toast({
          title: 'Cliente Atualizado!',
          description: `${clientFormData.name} foi atualizado com sucesso.`,
        });
      } else {
        // Add new client
        const newClientData = {
          id: `client-${Date.now()}`,
          ...clientFormData,
        };
        updatedClients = [...clients, newClientData];
        toast({
          title: 'Cliente Salvo!',
          description: `${clientFormData.name} foi adicionado à sua lista de clientes.`,
        });
      }
      persistClients(updatedClients);
      setOpen(false);
      setEditingClient(null);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    const updatedClients = clients.filter((client) => client.id !== clientId);
    persistClients(updatedClients);
    toast({
        title: 'Cliente Excluído!',
        description: 'O cliente foi removido da sua lista.',
        variant: 'destructive'
    })
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 sm:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h3 className="text-3xl font-bold tracking-tight">Clientes</h3>
        <div className="flex items-center gap-2">
           <Dialog open={open} onOpenChange={setOpen}>
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
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                    <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {client.email}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                        {client.phone}
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
                        Nenhum cliente encontrado.
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
