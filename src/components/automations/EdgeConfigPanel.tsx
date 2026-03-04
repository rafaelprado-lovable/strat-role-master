import { type Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, ArrowRight, Repeat } from 'lucide-react';

interface EdgeConfigPanelProps {
  edge: Edge;
  onUpdate: (id: string, data: Partial<Edge['data']>) => void;
  onClose: () => void;
}

export function EdgeConfigPanel({ edge, onUpdate, onClose }: EdgeConfigPanelProps) {
  const d = (edge.data || {}) as Record<string, any>;
  const isSelfLoop = edge.source === edge.target;

  const update = (key: string, value: unknown) => {
    onUpdate(edge.id, { ...d, [key]: value });
  };

  // Self-loop edges are configured via NodeConfigPanel — show read-only info here
  if (isSelfLoop) {
    return (
      <div className="w-80 shrink-0 border rounded-lg bg-card overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-chart-4" />
            <h3 className="font-semibold text-sm text-foreground">While Loop Edge</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-4 space-y-3">
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
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 border rounded-lg bg-card overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Configuração da Conexão</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Edge info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1.5">
          <span>{edge.source}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{edge.target}</span>
        </div>

        {/* Condition */}
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

        {/* Simple info */}
        {!d.condition && (
          <div className="p-2 rounded bg-muted text-[10px] text-muted-foreground">
            Conexão simples: o nó de destino será executado após o de origem. Adicione uma condição para criar um fluxo condicional.
          </div>
        )}
      </div>
    </div>
  );
}
