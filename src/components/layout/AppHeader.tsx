import { ThemeToggle } from '@/components/ThemeToggle';

export function AppHeader() {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="w-64"></div>

      <h1 className="text-xl font-semibold text-foreground">
        Heimdall
      </h1>

      <div className="flex items-center gap-4 w-64 justify-end">
        <ThemeToggle />
        <span className="text-sm font-medium text-foreground">Rafael Prado</span>
      </div>
    </header>
  );
}
