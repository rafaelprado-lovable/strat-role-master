import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Settings,
  Rocket,
  PhoneCallIcon,
  ChartAreaIcon,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Logo } from "./Logo";
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
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Mapa de ícones (string → componente real)
const iconMap: Record<string, React.ElementType> = {
  settings: Settings,
  rocket: Rocket,
  phone: PhoneCallIcon,
  chart: ChartAreaIcon,
  dashboard: LayoutDashboard,
};

export function AppSidebar() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [expandedItem, setExpandedItem] = useState<string>("");
  const handleLogout = () => {
    console.log("clicou em sair");
    localStorage.clear(); // limpa tudo
    window.location.href = '/login';
  };
  // 🔹 Simula se o usuário é admin (pode vir de API ou auth context)
  const isAdmin = true; // <-- depois substituímos por um dado real

  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const userId = localStorage.getItem('userId');

    fetch(
      "http://10.151.1.54:8000/v1/read/menu/list?userId=" + userId,
      { method: "GET", headers: myHeaders }
    )
      .then((response) => response.json())
      .then((data) => {
        let items: any[] = [];

        // 1️⃣ Processa menus e submenus normais
        const menuItems = data.menu.map((menu: any) => {
          const submenus = data.submenu.filter(
            (sub: any) => sub.menu === menu.name
          );

          return {
            title: menu.name,
            url: menu.url || "/",        // menus normais podem ter ou não url
            icon: iconMap[menu.icone?.toLowerCase()] || LayoutDashboard,
            hasSubmenu: submenus.length > 0,
            submenu: submenus.map((sub: any) => ({
              title: sub.name,
              url: sub.url
            }))
          };
        });

        items = [...menuItems];

        // 2️⃣ Processa GUIA ÚNICA (sempre link direto, sem submenu)
        const guiaUnicaItems = data.guia_unica.map((g: any) => ({
          title: g.name,
          url: g.url,
          icon: iconMap[g.icone?.toLowerCase()] || LayoutDashboard,
          hasSubmenu: false,
          submenu: []
        }));

        items = [...items, ...guiaUnicaItems];

        // 3️⃣ Processa APIs (opcional: quer mostrar? Se sim, como guia única)
        const apiItems = data.api.map((api: any) => ({
          title: api.name,
          url: api.url,
          icon: iconMap[api.icone?.toLowerCase()] || Settings,
          hasSubmenu: false,
          submenu: []
        }));

        // Se quiser exibir APIs como menus diretos
        // items = [...items, ...apiItems];

        // 4️⃣ Admin (se for admin)
        if (isAdmin) {
          items.push({
            title: "Administração",
            url: "/production",
            icon: Rocket,
            hasSubmenu: true,
            submenu: [
              { title: "Organizações", url: "/organizations" },
              { title: "Escopos", url: "/scopes" },
              { title: "Permissões", url: "/permissions" },
              { title: "Funções", url: "/roles" },
              { title: "Departamentos", url: "/departments" },
              { title: "Usuários", url: "/users" }
            ]
          });
        }

        setMenuItems(items);
      })
      .catch((error) => console.error("Erro ao carregar menu:", error));
  }, []);

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* HEADER */}
      <SidebarHeader className="border-b border-sidebar-border p-5">
        <div className="flex items-center justify-between">
          <Logo />
        </div>
      </SidebarHeader>

      {/* CONTEÚDO */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.hasSubmenu ? (
                    <Collapsible
                      open={expandedItem === item.title}
                      onOpenChange={(isOpen) =>
                        setExpandedItem(isOpen ? item.title : "")
                      }
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-primary">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              expandedItem === item.title ? "rotate-180" : ""
                            }`}
                          />
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
                              <span>{subitem.title}</span>
                            </NavLink>
                          ))}
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url || "#"}
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-primary"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
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
                <span>Configurações</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="hover:bg-sidebar-accent hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
