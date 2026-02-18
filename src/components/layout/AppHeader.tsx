import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Menu,
} from 'lucide-react';

export function AppHeader() {
  const { open, toggleSidebar } = useSidebar();
  const name = localStorage.getItem("userName");
  return (
    <header className="h-20 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-8 w-8 text-sidebar-foreground hover:text-sidebar-primary"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div className="w-64"></div>

      <h1 className="text-xl font-semibold text-foreground">
        Heimdall
      </h1>

      <div className="flex items-center gap-4 w-64 justify-end">
        <ThemeToggle />
        <span className="text-sm font-medium text-foreground">{name}</span>
      </div>
    </header>
  );
}
