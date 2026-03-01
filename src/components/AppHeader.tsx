import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader({ title }: { title?: string }) {
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4">
      <SidebarTrigger />
      {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
      <div className="ml-auto flex items-center gap-3">
         <ThemeToggle className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <span className="text-sm text-muted-foreground">
          Olá, <span className="font-medium text-foreground">{user?.name || "Usuário"}</span>
        </span>
      </div>
    </header>
  );
}
