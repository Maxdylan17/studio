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
import { LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: 'Logout Realizado',
      description: 'Você foi desconectado com segurança.',
    });
    router.push('/login');
  };

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
                <AvatarImage src="https://placehold.co/40x40" alt="Avatar" data-ai-hint="avatar user" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="font-medium text-sm text-sidebar-foreground truncate">Usuário Teste</span>
                <span className="text-xs text-sidebar-foreground/70 truncate">usuario@fiscalflow.com</span>
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
