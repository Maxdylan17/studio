
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
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, ExtractedData } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import React from 'react';


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
    clientId: z.string().optional(),
  }),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item.'),
});

interface IssuanceFormProps {
    initialData: ExtractedData | null;
    onReset: () => void;
}

const FAKE_USER_ID = "local-user";

export function IssuanceForm({ initialData, onReset }: IssuanceFormProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinatario: {
        nome: initialData?.recipient?.name || '',
        cpf_cnpj: initialData?.recipient?.document || '',
        endereco: initialData?.recipient?.address || '',
        clientId: ''
      },
      items: initialData?.items && initialData.items.length > 0 ? initialData.items : [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });


  const { fields, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const totalValue = form.watch('items').reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    const newInvoice: Omit<Invoice, 'id'> = {
      key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
      client: values.destinatario.nome,
      clientId: values.destinatario.clientId || null,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={onReset}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Voltar</span>
                    </Button>
                    <div>
                        <CardTitle>Revisar e Emitir</CardTitle>
                        <CardDescription>Verifique os dados extraídos pela IA e confirme a emissão.</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <div className="grid lg:grid-cols-2 gap-6">
            <Card>
            <CardHeader>
                <CardTitle>Destinatário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-start p-1">
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
                        <FormItem className="col-span-6 sm:col-span-2">
                        <FormLabel>Qtd.</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                        <FormItem className="col-span-6 sm:col-span-2">
                        <FormLabel>Preço Unit.</FormLabel>
                        <FormControl>
                            <Input type="number" step="any" placeholder="R$" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="col-span-12 sm:col-span-2 flex justify-end items-end sm:pt-8">
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
        
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Emitindo...' : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Emitir Nota Fiscal
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
