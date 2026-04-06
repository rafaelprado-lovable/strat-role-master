import { type Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X, ArrowRight, Repeat, ShieldAlert } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EdgeConfigPanelProps {
  edge: Edge;
  onUpdate: (id: string, data: Partial<Edge['data']>) => void;
  onClose: () => void;
}

export function EdgeConfigPanel({ edge, onUpdate, onClose }: EdgeConfigPanelProps) {
  const d = (edge.data || {}) as Record<string, any>;
  const isSelfLoop = edge.source === edge.target;
  const isMobile = useIsMobile();

  const update = (key: string, value: unknown) => {
    onUpdate(edge.id, { ...d, [key]: value });
  };

  const content = isSelfLoop ? (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1.5">
        <span>{edge.source}</span>
        <Repeat className="h-3 w-3 text-chart-4" />
        <span>{edge.target}</span>
        <span className="text-chart-4 font-semibold ml-1">(self-loop)</span>
      </div>
      <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/30">
        <p className="text-xs text-muted-foreground">
          Para configurar este loop, <strong>clique no nó</strong> e use a seção "While Loop" no painel lateral.
        </p>
      </div>
    </>
  ) : (
    <>
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1.5">
        <span>{edge.source}</span>
        <ArrowRight className="h-3 w-3" />
        <span>{edge.target}</span>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Condição (opcional)</Label>
        <Input
          value={d.condition || ''}
          onChange={(e) => update('condition', e.target.value)}
          placeholder="node-a.output.status == 200"
          className="h-8 text-sm font-mono"
        />
        <p className="text-[10px] text-muted-foreground">
          Formato: <code className="bg-muted px-1 rounded">left == | != | {'>'} | {'<'} right</code>
        </p>
      </div>

      {/* Continue on failure toggle */}
      <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
          <div>
            <Label className="text-xs font-medium">Continue on Failure</Label>
            <p className="text-[10px] text-muted-foreground">
              Executa o nó destino mesmo se o nó origem falhar
            </p>
          </div>
        </div>
        <Switch
          checked={!!d.continue_on_failure}
          onCheckedChange={(v) => update('continue_on_failure', v)}
        />
      </div>

      {!d.condition && !d.continue_on_failure && (
        <div className="p-2 rounded bg-muted text-[10px] text-muted-foreground">
          Conexão simples: o nó de destino será executado após o de origem. Adicione uma condição para criar um fluxo condicional.
        </div>
      )}
    </>
  );

  const headerTitle = isSelfLoop ? 'While Loop Edge' : 'Configuração da Conexão';
  const HeaderIcon = isSelfLoop ? Repeat : ArrowRight;
  const headerIconClass = isSelfLoop ? 'text-chart-4' : 'text-muted-foreground';

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="w-[90vw] max-w-md p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-sm flex items-center gap-2">
              <HeaderIcon className={`h-4 w-4 ${headerIconClass}`} />
              {headerTitle}
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-3">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-80 shrink-0 border rounded-lg bg-card overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <HeaderIcon className={`h-4 w-4 ${headerIconClass}`} />
          <h3 className="font-semibold text-sm text-foreground">{headerTitle}</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="p-4 space-y-3">{content}</div>
    </div>
  );
}
