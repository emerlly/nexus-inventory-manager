import {
  LayoutDashboard,
  Users,
  UserCheck,
  Truck,
  FolderOpen,
  Package,
  ShoppingCart,
  ArrowLeftRight,
  LogOut,
  ClipboardList,
  CreditCard,
  Building2,
  Settings,
  FileText,
  BarChart3,
  Calculator,
  Wallet,
  Heart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/products", icon: Package },
  { title: "Vendas", url: "/sales", icon: ShoppingCart },
  { title: "Análise de Vendas", url: "/sales/analytics", icon: BarChart3 },
  { title: "Pedidos", url: "/orders", icon: ClipboardList },
  { title: "Orçamentos", url: "/budgets", icon: FileText },
  { title: "Pagamentos", url: "/payments", icon: CreditCard },
  { title: "Movimentações", url: "/stock/movements", icon: ArrowLeftRight },
  { title: "Fluxo de Caixa", url: "/cashflow", icon: Wallet },
  { title: "CRM", url: "/crm", icon: Heart },
  { title: "Precificação", url: "/pricing", icon: Calculator },
];

const registerNav = [
  { title: "Clientes", url: "/customers", icon: UserCheck },
  { title: "Fornecedores", url: "/suppliers", icon: Truck },
  { title: "Categorias", url: "/categories", icon: FolderOpen },
];

const settingsNav = [
  { title: "Usuários", url: "/users", icon: Users },
  { title: "Empresa", url: "/settings/company", icon: Building2 },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const isAdminOrManager = user?.role === "admin" || user?.role === "gerente";

  return (
    <Sidebar className="h-full border-r border-white/10">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary shadow-sm">
            <Package className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>

          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-base font-bold text-sidebar-foreground truncate">
              NexusSystems
            </span>

            <span className="text-xs text-sidebar-muted truncate">
              {user?.company?.name || "Minha Empresa"}
            </span>
          </div>
        </div>
      </SidebarHeader>

    <SidebarContent className="flex-1 overflow-y-auto scrollbar-hide">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {registerNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminOrManager && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted">
              <Settings className="mr-1 inline h-3 w-3" />
              Configurações
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name || "Usuário"}</p>
              <p className="truncate text-xs text-sidebar-muted">{user?.role || "admin"}</p>
            </div>
          </div>
          <button onClick={logout} className="rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" title="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
