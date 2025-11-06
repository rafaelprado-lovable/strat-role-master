import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          <svg
            className="h-8 w-8"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 2L4 10v10c0 10 6.5 19.35 16 22 9.5-2.65 16-12 16-22V10L20 2z"
              fill="currentColor"
              className="text-primary"
            />
            <path
              d="M15 20l3.5 3.5L26 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-sm font-medium text-muted-foreground">eng</span>
        </div>
      </div>

      <h1 className="text-xl font-semibold text-foreground absolute left-1/2 -translate-x-1/2">
        Heimdall
      </h1>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">Rafael Prado</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            RP
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
