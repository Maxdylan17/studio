
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { PlusCircle, Send, Trash2, Users } from 'lucide-react';
import { DataCapture } from './data-capture';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { SmartIssuance } from './smart-issuance';

const itemSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.coerce.number().min(0.001, 'Quantidade inválida'),
  unitPrice: z.coerce.number().min(0.01, 'Preço inválido'),
});

const formSchema = z.object({
  destinatario: z.object({
    nome: z.string().min(2, 'Nome/Razão Social é obrigatório'),
    cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido'),
    endereco: z.string().optional(),
  }),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item.'),
});

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  userId: string;
};

const FAKE_USER_ID = "local-user";

export function IssuanceForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = React.useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinatario: {
        nome: '',
        cpf_cnpj: '',
        endereco: '',
      },
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  React.useEffect(() => {
    const fetchClients = async () => {
        setLoadingClients(true);
        try {
          const q = query(collection(db, "clients"), where("userId", "==", FAKE_USER_ID));
          const querySnapshot = await getDocs(q);
          const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
          setClients(clientsData);
        } catch (error) {
          console.error("Error fetching clients: ", error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os clientes.' });
        } finally {
          setLoadingClients(false);
        }
    };

    fetchClients();
  }, [toast]);


  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const totalValue = form.watch('items').reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if(selectedClient) {
      form.setValue('destinatario.nome', selectedClient.name, { shouldValidate: true });
      const clientDoc = selectedClient.cpf_cnpj || ''; 
      form.setValue('destinatario.cpf_cnpj', clientDoc, { shouldValidate: true });
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const newInvoice: Omit<Invoice, 'id'> = {
      key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
      client: values.destinatario.nome,
      date: new Date().toISOString().split('T')[0],
      status: 'autorizada',
      value: totalValue.toFixed(2).replace('.',','),
      userId: FAKE_USER_ID,
    }

    try {
        await addDoc(collection(db, "invoices"), newInvoice);

        toast({
          title: 'Nota Emitida com Sucesso!',
          description: 'Sua nota fiscal foi enviada para a SEFAZ e salva no histórico.',
        });

        router.push('/notas');
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao emitir nota',
          description: 'Não foi possível salvar a nota fiscal. Tente novamente.',
        });
    }
  }

  return (
    <Form {...form}>
       <SmartIssuance form={form} replace={replace} />
       <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-background px-2 text-sm text-muted-foreground">OU PREENCHA MANUALMENTE</span>
        </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Destinatário</CardTitle>
            <DataCapture form={form} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Cliente Existente</Label>
               {loadingClients ? (
                <Skeleton className="h-10 w-full" />
               ) : (
                <Select onValueChange={handleClientSelect} disabled={clients.length === 0}>
                  <SelectTrigger>
                    <SelectValue placeholder={clients.length > 0 ? "Selecione um cliente para preencher os dados" : "Nenhum cliente cadastrado"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               )}
            </div>
            
            <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-card px-2 text-sm text-muted-foreground">OU</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="destinatario.nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome/Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinatario.cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="destinatario.endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens da Nota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-end">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="col-span-12 sm:col-span-6">
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Produto ou serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="col-span-4 sm:col-span-2">
                      <FormLabel>Qtd.</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="col-span-5 sm:col-span-2">
                      <FormLabel>Preço Unit.</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="R$" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-3 sm:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            ))}
             <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Item
            </Button>
            <Separator className="my-4" />
            <div className='flex justify-end items-center'>
                <p className="text-lg font-semibold">
                    Total: {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Emitindo...' : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Emitir Nota
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
