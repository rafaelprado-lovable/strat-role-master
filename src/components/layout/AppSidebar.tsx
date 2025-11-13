import { useState } from 'react';
import {
  LayoutDashboard,
  CheckCircle,
  Headphones,
  ShieldCheck,
  Rocket,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Logo } from './Logo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const menuItems = [
  {
    title: 'Visão Geral',
    url: '/',
    icon: LayoutDashboard,
    hasSubmenu: false,
  },
  {
    title: 'Qualidade',
    url: '/quality',
    icon: CheckCircle,
    hasSubmenu: false,
  },
  {
    title: 'Suporte',
    url: '/support',
    icon: Headphones,
    hasSubmenu: false,
  },
  {
    title: 'Área de Qualidade',
    icon: ShieldCheck,
    hasSubmenu: true,
    submenu: [
      { title: 'Organizações', url: '/organizations' },
      { title: 'Permissões', url: '/permissions' },
      { title: 'Funções', url: '/roles' },
      { title: 'Usuários', url: '/users' },
      { title: 'Departamentos', url: '/departments' },
      { title: 'Escopos', url: '/scopes' },
    ],
  },
  {
    title: 'Produção',
    url: '/production',
    icon: Rocket,
    hasSubmenu: true,
    submenu: [
      { title: 'Insights', url: '/insights' },
    ],
  },
];

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const [expandedItem, setExpandedItem] = useState<string>('Área de Qualidade');

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-primary"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.hasSubmenu && item.submenu ? (
                    <Collapsible
                      open={expandedItem === item.title}
                      onOpenChange={(isOpen) =>
                        setExpandedItem(isOpen ? item.title : '')
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-primary">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {open && <span>{item.title}</span>}
                          </div>
                          {open && (
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedItem === item.title ? 'rotate-180' : ''
                              }`}
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.submenu.length > 0 && (
                        <CollapsibleContent className="ml-6 mt-1 space-y-1">
                          {item.submenu.map((subitem) => (
                            <NavLink
                              key={subitem.url}
                              to={subitem.url}
                              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-primary"
                              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                            >
                              {open && <span>{subitem.title}</span>}
                            </NavLink>
                          ))}
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url || '#'}
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-primary"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-primary"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <Settings className="h-4 w-4" />
                {open && <span>Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-sidebar-accent hover:text-destructive">
              <LogOut className="h-4 w-4" />
              {open && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
