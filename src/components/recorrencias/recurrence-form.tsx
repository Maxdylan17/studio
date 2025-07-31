
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
import { ArrowLeft, Save, Trash2, Search, PlusCircle, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Recurrence, Client } from '@/lib/definitions';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, query, where, getDocs, limit } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Calendar } from '../ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { format, formatISO } from 'date-fns';

const itemSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.coerce.number().min(0.001, 'Quantidade inválida'),
  unitPrice: z.coerce.number().min(0.01, 'Preço inválido'),
});

const formSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente."),
  clientName: z.string(),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item.'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.coerce.number().int().min(1, "O intervalo deve ser de no mínimo 1."),
  startDate: z.date({ required_error: "A data de início é obrigatória."}),
  endDate: z.date().optional(),
});

interface RecurrenceFormProps {
    recurrence: Recurrence | null;
    onCancel: () => void;
}

export function RecurrenceForm({ recurrence, onCancel }: RecurrenceFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [foundClients, setFoundClients] = useState<Client[]>([]);
  const [openClientSearch, setOpenClientSearch] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: recurrence?.clientId || '',
      clientName: recurrence?.clientName || '',
      items: recurrence?.items || [{ description: '', quantity: 1, unitPrice: 0 }],
      frequency: recurrence?.frequency || 'monthly',
      interval: recurrence?.interval || 1,
      startDate: recurrence ? new Date(recurrence.startDate) : new Date(),
      endDate: recurrence?.endDate ? new Date(recurrence.endDate) : undefined,
    },
  });

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
    form.setValue('clientId', client.id);
    form.setValue('clientName', client.name);
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
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.'});
        return;
    }

    const recurrenceData = {
        ...values,
        userId: user.uid,
        status: recurrence?.status || 'active',
        lastGeneratedDate: recurrence?.lastGeneratedDate || null,
        startDate: formatISO(values.startDate, { representation: 'date' }),
        endDate: values.endDate ? formatISO(values.endDate, { representation: 'date' }) : null,
        totalValue: totalValue,
    };

    try {
        if (recurrence) {
            await updateDoc(doc(db, "recurrences", recurrence.id), recurrenceData);
            toast({ title: 'Recorrência Atualizada!', description: 'As alterações foram salvas.' });
        } else {
            await addDoc(collection(db, "recurrences"), recurrenceData);
            toast({ title: 'Recorrência Criada!', description: 'A nova recorrência foi salva com sucesso.' });
        }
        onCancel();
    } catch (error) {
        console.error("Error saving recurrence: ", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar a recorrência. Tente novamente.',
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={onCancel}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                    <div>
                        <CardTitle>{recurrence ? 'Editar Recorrência' : 'Nova Recorrência'}</CardTitle>
                        <CardDescription>
                            Configure os detalhes para a geração automática de faturas.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Selecione o Cliente</FormLabel>
                                <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {field.value ? form.getValues('clientName') : "Selecione um cliente"}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
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
                                                        <CommandItem key={client.id} value={client.name} onSelect={() => handleSelectClient(client)}>
                                                            {client.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Configuração da Recorrência</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Frequência</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a frequência" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="daily">Diária</SelectItem>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="interval"
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel>Intervalo</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Data de Início</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                            {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Data de Fim (Opcional)</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            >
                                            {field.value ? format(field.value, "PPP") : <span>Selecione uma data</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Itens da Fatura</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Adicionar Item
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto p-4">
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
            </CardContent>
             <CardFooter className="flex-col items-stretch gap-4 pt-6">
                <Separator />
                <div className='flex justify-end items-center'>
                    <p className="text-lg font-semibold">
                        Total: {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
             </CardFooter>
            </Card>
        </div>
        
        <div className="flex justify-end gap-2">
           <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Recorrência
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
