
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/layout/logo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido.'),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setIsSuccess(false);
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada para o link de redefinição de senha.',
      });
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Password reset error", error);
      let description = 'Ocorreu um erro. Verifique o e-mail e tente novamente.';
      if (error.code === 'auth/user-not-found') {
        description = 'Nenhuma conta encontrada com este e-mail.'
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            {isSuccess
              ? 'O link foi enviado com sucesso!'
              : 'Insira seu e-mail para receber um link de redefinição.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
             <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Se você não receber o e-mail em alguns minutos, verifique sua pasta de spam.
                </p>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Voltar para o Login</Link>
                </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@example.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Cancelar</Link>
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
