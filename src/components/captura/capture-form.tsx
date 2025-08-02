
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowLeft, UserPlus, FilePen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ExtractedData } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { handleGenerateAndUpdateAvatar } from '@/lib/actions';


const formSchema = z.object({
  name: z.string().min(2, 'Nome/Razão Social é obrigatório'),
  cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
});

interface CaptureFormProps {
    initialData: ExtractedData | null;
    onReset: () => void;
}

export function CaptureForm({ initialData, onReset }: CaptureFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.recipient?.name || '',
      cpf_cnpj: initialData?.recipient?.document || '',
      email: '',
      phone: ''
    },
  });


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado para cadastrar um cliente.'});
        return;
    }

    const newClientData = {
        ...values,
        userId: user.uid,
        avatarUrl: '', // Start with empty avatar
    };

    try {
        const docRef = await addDoc(collection(db, "clients"), newClientData);
        toast({
          title: 'Cliente Cadastrado!',
          description: `${values.name} foi adicionado. Gerando avatar...`,
        });

        // Trigger avatar generation in the background
        handleGenerateAndUpdateAvatar({ clientId: docRef.id, name: newClientData.name })
            .catch(error => {
                console.error("Failed to generate avatar:", error);
                toast({
                    variant: 'destructive',
                    title: 'Erro no Avatar',
                    description: 'Não foi possível gerar o avatar para o cliente.',
                });
            });

        // If items were extracted, redirect to issuance form with client pre-filled
        if (initialData?.items && initialData.items.length > 0) {
            const queryParams = new URLSearchParams({
                clientId: docRef.id,
                items: JSON.stringify(initialData.items)
            }).toString();
            router.push(`/emitir?${queryParams}`);
        } else {
            router.push(`/clientes/${docRef.id}`);
        }

    } catch (error) {
        console.error("Error adding client: ", error);
        toast({
          variant: 'destructive',
          title: 'Erro ao cadastrar',
          description: 'Não foi possível salvar o cliente. Tente novamente.',
        });
    }
  }
  
  const handleRedirectToIssuance = () => {
    if (!initialData?.items || initialData.items.length === 0) return;
    const queryParams = new URLSearchParams({
        clientName: form.getValues('name'),
        clientDoc: form.getValues('cpf_cnpj'),
        items: JSON.stringify(initialData.items)
    }).toString();
    router.push(`/emitir?${queryParams}`);
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
                        <CardTitle>Revisar e Cadastrar</CardTitle>
                        <CardDescription>Verifique os dados extraídos, preencha o restante e confirme.</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Nome/Razão Social</FormLabel>
                      <FormControl>
                      <Input placeholder="Nome completo do cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="cpf_cnpj"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                          <Input type="email" placeholder="contato@cliente.com" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                />
              </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center">
            {initialData?.items && initialData.items.length > 0 ? (
                 <Button type="button" variant="secondary" onClick={handleRedirectToIssuance} disabled={!form.formState.isValid}>
                    <FilePen className="mr-2 h-4 w-4" />
                    Criar Fatura com {initialData.items.length} Itens
                </Button>
            ): <div></div>}
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Cadastrando...' : (
                <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Cadastrar Cliente
                </>
                )}
            </Button>
        </div>
      </form>
    </Form>
  );
}
