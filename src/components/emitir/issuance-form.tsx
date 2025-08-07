
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Separator } from '../ui/separator';
import { Send, Trash2, Search, PlusCircle, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, ExtractedData, Client } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSearchParams } from 'next/navigation';


const itemSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.coerce.number().min(0.001, 'Quantidade inválida'),
  unitPrice: z.coerce.number().min(0.01, 'Preço inválido'),
});

const formSchema = z.object({
  naturezaOperacao: z.string().min(1, "Selecione a natureza da operação."),
  destinatario: z.object({
    nome: z.string().min(2, 'Nome/Razão Social é obrigatório'),
    cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido'),
    endereco: z.string().optional(),
    clientId: z.string().optional(),
  }),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item.'),
  dueDate: z.date().optional(),
});

interface IssuanceFormProps {
    initialData: ExtractedData | null;
    onReset: () => void;
}

export function IssuanceForm({ initialData, onReset }: IssuanceFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [foundClients, setFoundClients] = useState<Client[]>([]);
  const [openClientSearch, setOpenClientSearch] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      naturezaOperacao: 'Venda de mercadoria',
      destinatario: {
        nome: initialData?.recipient?.name || '',
        cpf_cnpj: initialData?.recipient?.document || '',
        endereco: initialData?.recipient?.address || '',
        clientId: ''
      },
      items: initialData?.items && initialData.items.length > 0 ? initialData.items : [{ description: '', quantity: 1, unitPrice: 0 }],
      dueDate: undefined,
    },
  });

  // Effect to sync form with `initialData` when it changes
  useEffect(() => {
    form.reset({
       naturezaOperacao: 'Venda de mercadoria',
       destinatario: {
        nome: initialData?.recipient?.name || '',
        cpf_cnpj: initialData?.recipient?.document || '',
        endereco: initialData?.recipient?.address || '',
        clientId: ''
      },
      items: initialData?.items && initialData.items.length > 0 ? initialData.items : [{ description: '', quantity: 1, unitPrice: 0 }],
      dueDate: undefined,
    });
  }, [initialData, form]);

  useEffect(() => {
    // This effect handles the redirect from the "Captura" flow where a new client was just created.
    const newClientId = searchParams.get('clientId');
    const newClientName = searchParams.get('clientName');
    const newClientDoc = searchParams.get('clientDoc');
    const itemsJson = searchParams.get('items');
    
    if (newClientId) {
        form.setValue('destinatario.clientId', newClientId);
        if (newClientName) form.setValue('destinatario.nome', newClientName);
        if (newClientDoc) form.setValue('destinatario.cpf_cnpj', newClientDoc);

        if (itemsJson) {
            try {
                const items = JSON.parse(itemsJson);
                form.setValue('items', items);
            } catch (e) {
                console.error("Failed to parse items from URL", e);
            }
        }
        // Clean up URL params
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, form]);


  useEffect(() => {
    const searchClients = async () => {
        if (clientSearchTerm.length > 2 && user) {
             const clientQuery = query(
                collection(db, "clients"), 
                where('userId', '==', user.uid),
                where('name', '>=', clientSearchTerm),
                where('name', '<=', clientSearchTerm + '\uf8ff'),
                limit(5)
            );
            const clientSnap = await getDocs(clientQuery);
            setFoundClients(clientSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
        } else {
            setFoundClients([]);
        }
    }
    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [clientSearchTerm, user])
  
  const handleSelectClient = (client: Client) => {
    form.setValue('destinatario.nome', client.name);
    form.setValue('destinatario.cpf_cnpj', client.cpf_cnpj);
    form.setValue('destinatario.endereco', client.email); // Usando email como placeholder de endereço
    form.setValue('destinatario.clientId', client.id);
    setOpenClientSearch(false);
  }

  const { fields, remove, append } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const totalValue = form.watch('items').reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para emitir uma nota.'});
        return;
    }

    const newInvoice: Omit<Invoice, 'id'> = {
      key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
      client: values.destinatario.nome,
      clientId: values.destinatario.clientId || null,
      destinatario: values.destinatario,
      date: new Date().toISOString().split('T')[0],
      status: 'pendente',
      value: totalValue,
      userId: user.uid,
      items: values.items,
      dueDate: values.dueDate ? values.dueDate.toISOString().split('T')[0] : undefined,
      naturezaOperacao: values.naturezaOperacao,
    }

    try {
        const docRef = await addDoc(collection(db, "invoices"), newInvoice);

        toast({
          title: 'Nota Emitida com Sucesso!',
          description: 'Sua nota fiscal foi enviada para a SEFAZ e salva no histórico.',
        });

        router.push(`/notas/${docRef.id}/danfe`);
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
              <CardTitle>Formulário de Emissão</CardTitle>
              <CardDescription>Preencha ou revise os dados para gerar a nota fiscal.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                 <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                    <PopoverTrigger asChild>
                       <Button variant="outline" className="w-full justify-start">
                           <Search className="mr-2 h-4 w-4" />
                           Buscar Cliente Existente
                       </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" side="bottom" align="start">
                        <Command>
                            <CommandInput 
                                onValueChange={setClientSearchTerm} 
                                placeholder="Digite o nome do cliente..."
                             />
                            <CommandList>
                                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {foundClients.map(client => (
                                        <CommandItem key={client.id} onSelect={() => handleSelectClient(client)}>
                                            {client.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                 </Popover>

                <FormField
                    control={form.control}
                    name="destinatario.nome"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome/Razão Social do Destinatário</FormLabel>
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
                        <FormLabel>CPF/CNPJ do Destinatário</FormLabel>
                        <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                control={form.control}
                name="destinatario.endereco"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Endereço / E-mail do Destinatário</FormLabel>
                    <FormControl>
                        <Input placeholder="Rua, Número, Bairro / email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                 <Separator/>

                 <FormField
                  control={form.control}
                  name="naturezaOperacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Natureza da Operação</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de operação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Venda de mercadoria">Venda de mercadoria</SelectItem>
                          <SelectItem value="Prestação de serviço">Prestação de serviço</SelectItem>
                          <SelectItem value="Remessa">Remessa</SelectItem>
                          <SelectItem value="Retorno">Retorno</SelectItem>
                          <SelectItem value="Devolução">Devolução</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data de Vencimento</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Separator/>

                <div className="flex row items-center justify-between">
                    <h3 className="text-lg font-semibold">Itens da Nota</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Adicionar
                    </Button>
                </div>

                <div className="space-y-4 max-h-[250px] overflow-y-auto p-1">
                    {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-x-2 sm:gap-x-4 gap-y-2 items-start p-1">
                        <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                            <FormItem className="col-span-12 sm:col-span-6">
                            <FormLabel className="sr-only sm:hidden">Descrição</FormLabel>
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
                            <FormLabel className="sr-only sm:hidden">Qtd.</FormLabel>
                            <FormControl>
                                <Input type="number" step="any" {...field} placeholder="Qtd." />
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
                            <FormLabel className="sr-only sm:hidden">Preço Unit.</FormLabel>
                            <FormControl>
                                <Input type="number" step="any" placeholder="R$" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="col-span-3 sm:col-span-2 flex justify-end items-end h-full">
                            <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                            >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover Item</span>
                            </Button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4 pt-6">
            <Separator />
            <div className='flex justify-between items-center'>
                <p className="text-lg font-semibold">
                    Total: {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                 <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Emitindo...' : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Emitir Nota Fiscal
                    </>
                    )}
                </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
