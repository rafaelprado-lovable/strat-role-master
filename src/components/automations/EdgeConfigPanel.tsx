import { type Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, ArrowRight, Repeat } from 'lucide-react';

interface EdgeConfigPanelProps {
  edge: Edge;
  onUpdate: (id: string, data: Partial<Edge['data']>) => void;
  onClose: () => void;
}

export function EdgeConfigPanel({ edge, onUpdate, onClose }: EdgeConfigPanelProps) {
  const d = (edge.data || {}) as Record<string, any>;

  const update = (key: string, value: unknown) => {
    onUpdate(edge.id, { ...d, [key]: value });
  };

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
            Formato: left == | != | {'>'} | {'<'} right
          </p>
        </div>

        {/* While Loop */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-chart-4" />
              <Label className="text-xs font-semibold">While Loop</Label>
            </div>
            <Switch
              checked={!!d.loop}
              onCheckedChange={(v) => {
                update('loop', v);
                if (v && !d.max_iterations) update('max_iterations', 5);
              }}
            />
          </div>

          {d.loop && (
            <div className="space-y-3 pl-1">
              {/* While condition info */}
              <div className="p-2 rounded bg-chart-4/10 border border-chart-4/30 text-xs text-foreground space-y-1">
                <p className="font-semibold">Comportamento:</p>
                <p>• <strong>Com condição:</strong> repete enquanto a condição for verdadeira (while condition)</p>
                <p>• <strong>Sem condição:</strong> repete sempre (while true)</p>
                <p>• <strong>Break:</strong> quando a condição fica falsa ou atinge max_iterations</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">max_iterations <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={d.max_iterations || ''}
                  onChange={(e) => update('max_iterations', parseInt(e.target.value) || undefined)}
                  className="h-8 text-sm"
                />
                {(!d.max_iterations || d.max_iterations < 1) && (
                  <p className="text-xs text-destructive">⚠ max_iterations é obrigatório — funciona como break de segurança</p>
                )}
              </div>

              <div className="p-2 rounded bg-muted text-[10px] text-muted-foreground font-mono">
                {d.condition
                  ? `while (${d.condition}) { ... } // max ${d.max_iterations || '?'}x`
                  : `while (true) { ... } // max ${d.max_iterations || '?'}x`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
