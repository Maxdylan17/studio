
'use client';

import {
  BarChart2,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '../ui/sidebar';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/emitir', label: 'Emitir Nota', icon: FilePlus2 },
  { href: '/notas', label: 'Notas Fiscais', icon: FileText },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        return (
          <SidebarMenuItem key={link.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
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
