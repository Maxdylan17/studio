
'use client';

import {
  BarChart2,
  FilePen,
  LayoutDashboard,
  Settings,
  Users,
  BrainCircuit,
  ScanLine,
  Landmark,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/emitir', label: 'Gerador NF-e', icon: FilePen },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/notas', label: 'Faturas', icon: BarChart2 },
  { href: '/despesas', label: 'Despesas', icon: CreditCard },
  { href: '/relatorios', label: 'Assistente IA', icon: BrainCircuit },
  { href: '/impostos', label: 'Impostos', icon: Landmark },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname.startsWith(link.href) && (link.href !== '/' || pathname === '/');
        const isDashboardActive = pathname === '/' && link.href === '/dashboard';

        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive || isDashboardActive}
              tooltip={{ children: link.label }}
            >
              <Link href={link.href}>
                <Icon />
                <span>{link.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
