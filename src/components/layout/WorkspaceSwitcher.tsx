import { Check, ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useNavigate } from "react-router-dom";

export function WorkspaceSwitcher() {
  const { workspaces, current, setCurrent } = useWorkspace();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <span
            className="h-3 w-3 rounded-full border border-border"
            style={{ background: current?.color || "hsl(var(--muted))" }}
          />
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium truncate max-w-[140px]">
            {current?.name || "Sem workspace"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 && (
          <div className="px-2 py-3 text-sm text-muted-foreground">Nenhum workspace cadastrado</div>
        )}
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws._id} onClick={() => setCurrent(ws._id)} className="gap-2">
            <span className="h-3 w-3 rounded-full border border-border" style={{ background: ws.color }} />
            <span className="flex-1 truncate">{ws.name}</span>
            {current?._id === ws._id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/workspaces")}>
          Gerenciar workspaces…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
