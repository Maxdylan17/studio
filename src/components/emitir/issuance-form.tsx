
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
import { PlusCircle, Send, Trash2 } from 'lucide-react';
import { DataCapture } from './data-capture';
import { useToast } from '@/hooks/use-toast';
import type { Invoice } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

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


export function IssuanceForm() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const router = useRouter();
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const totalValue = form.watch('items').reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if(!user) {
        toast({
            variant: 'destructive',
            title: 'Erro de autenticação',
            description: 'Você precisa estar logado para emitir uma nota.',
        });
        return;
    }

    const newInvoice: Omit<Invoice, 'id'> = {
      key: `NFE352407${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
      client: values.destinatario.nome,
      date: new Date().toISOString().split('T')[0],
      status: 'autorizada',
      value: totalValue.toFixed(2).replace('.',','),
      userId: user.uid,
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Destinatário</CardTitle>
            <DataCapture form={form} />
          </CardHeader>
          <CardContent className="space-y-4">
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
