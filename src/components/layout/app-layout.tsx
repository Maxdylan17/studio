
'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Logo } from './logo';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '../ui/skeleton';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // This is a placeholder for a real Firebase config check
  const isFirebaseConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, isFirebaseConfigured]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logout Realizado',
        description: 'Você foi desconectado com segurança.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no Logout',
        description: 'Ocorreu um erro ao tentar sair. Tente novamente.',
      });
    }
  };
  
  if (!isFirebaseConfigured) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-8 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Configuração do Firebase Incompleta</h1>
        <p className="text-muted-foreground max-w-md">
          A configuração do seu projeto Firebase parece estar faltando ou incorreta. Por favor, verifique as variáveis de ambiente NEXT_PUBLIC_FIREBASE_* para habilitar a autenticação e o banco de dados.
        </p>
      </div>
    );
  }

  if (loading) {
     return (
        <div className="flex min-h-svh w-full">
            {/* Skeleton for Sidebar */}
            <div className="hidden md:flex flex-col w-64 border-r p-2 gap-2">
                <div className="flex items-center gap-2 p-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex flex-col gap-1 p-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
                 <div className="mt-auto flex items-center gap-3 p-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" />
                         <Skeleton className="h-3 w-32" />
                    </div>
                 </div>
            </div>
            {/* Skeleton for Main Content */}
            <div className="flex-1 flex flex-col">
                 <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
                    <Skeleton className="h-7 w-7" />
                 </header>
                 <main className="flex-1 p-4 sm:p-8 pt-6">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <div className="space-y-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                 </main>
            </div>
        </div>
     )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter>
           <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.photoURL ?? undefined} alt="Avatar" data-ai-hint="avatar user"/>
                <AvatarFallback>{user?.displayName?.charAt(0) ?? user?.email?.charAt(0) ?? 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="font-medium text-sm text-sidebar-foreground truncate">{user?.displayName ?? 'Usuário'}</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">{user?.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 ml-auto group-data-[collapsible=icon]:hidden"
                onClick={handleLogout}
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger />
          <div className="w-full flex-1">
            {/* Can add breadcrumbs or search here */}
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
