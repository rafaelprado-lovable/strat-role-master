import { type Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ArrowRight, Repeat, Info } from 'lucide-react';

interface EdgeConfigPanelProps {
  edge: Edge;
  onUpdate: (id: string, data: Partial<Edge['data']>) => void;
  onClose: () => void;
}

type LoopMode = 'none' | 'while_condition' | 'while_true';

export function EdgeConfigPanel({ edge, onUpdate, onClose }: EdgeConfigPanelProps) {
  const d = (edge.data || {}) as Record<string, any>;
  const isSelfLoop = edge.source === edge.target;

  const update = (key: string, value: unknown) => {
    onUpdate(edge.id, { ...d, [key]: value });
  };

  const updateMultiple = (updates: Record<string, unknown>) => {
    onUpdate(edge.id, { ...d, ...updates });
  };

  // Determine current loop mode — use explicit loop_mode if stored, else infer
  const getLoopMode = (): LoopMode => {
    if (!d.loop) return 'none';
    if (d.loop_mode === 'while_condition') return 'while_condition';
    if (d.loop_mode === 'while_true') return 'while_true';
    // Fallback inference for legacy data
    if (d.condition) return 'while_condition';
    return 'while_true';
  };

  const loopMode = getLoopMode();

  const setLoopMode = (mode: LoopMode) => {
    switch (mode) {
      case 'none':
        updateMultiple({ loop: false, loop_mode: undefined, max_iterations: undefined, condition: '' });
        break;
      case 'while_true':
        updateMultiple({ loop: true, loop_mode: 'while_true', max_iterations: d.max_iterations || 5, condition: '' });
        break;
      case 'while_condition':
        updateMultiple({ loop: true, loop_mode: 'while_condition', max_iterations: d.max_iterations || 5, condition: d.condition || '' });
        break;
    }
  };

  return (
    <div className="w-80 shrink-0 border rounded-lg bg-card overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {d.loop ? <Repeat className="h-4 w-4 text-chart-4" /> : <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-semibold text-sm text-foreground">
            {d.loop ? 'Configuração do While Loop' : 'Configuração da Conexão'}
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Edge info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1.5">
          <span>{edge.source}</span>
          {isSelfLoop ? (
            <Repeat className="h-3 w-3 text-chart-4" />
          ) : (
            <ArrowRight className="h-3 w-3" />
          )}
          <span>{edge.target}</span>
          {isSelfLoop && <span className="text-chart-4 font-semibold ml-1">(self-loop)</span>}
        </div>

        {/* Loop Mode Selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Tipo de Conexão</Label>
          <Select value={loopMode} onValueChange={(v) => setLoopMode(v as LoopMode)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3 w-3" />
                  <span>Simples (A → B)</span>
                </div>
              </SelectItem>
              <SelectItem value="while_condition">
                <div className="flex items-center gap-2">
                  <Repeat className="h-3 w-3 text-chart-4" />
                  <span>While (condição)</span>
                </div>
              </SelectItem>
              <SelectItem value="while_true">
                <div className="flex items-center gap-2">
                  <Repeat className="h-3 w-3 text-chart-4" />
                  <span>While true (infinito até max)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Condition — always visible for simple + while_condition */}
        {(loopMode === 'none' || loopMode === 'while_condition') && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {loopMode === 'while_condition' ? (
                <>Condição do while <span className="text-destructive">*</span></>
              ) : (
                'Condição (opcional)'
              )}
            </Label>
            <Input
              value={d.condition || ''}
              onChange={(e) => update('condition', e.target.value)}
              placeholder={loopMode === 'while_condition'
                ? 'node-retry.output.status != 200'
                : 'node-a.output.status == 200'
              }
              className="h-8 text-sm font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Formato: <code className="bg-muted px-1 rounded">left == | != | {'>'} | {'<'} right</code>
            </p>
            {loopMode === 'while_condition' && !d.condition?.trim() && (
              <p className="text-xs text-destructive">⚠ Preencha a condição ou mude para "While true"</p>
            )}
          </div>
        )}

        {/* While Loop Config */}
        {(loopMode === 'while_condition' || loopMode === 'while_true') && (
          <div className="space-y-3 border-t border-border pt-3">
            {/* Explanation card */}
            <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/30 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-chart-4 shrink-0" />
                <p className="text-xs font-semibold text-foreground">
                  {loopMode === 'while_true' ? 'While True (Loop infinito)' : 'While com Condição'}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {loopMode === 'while_true' ? (
                  <>
                    <p>O nó será executado repetidamente até atingir o limite de <strong>max_iterations</strong>.</p>
                    <p>Útil para polling, retries, ou processos que precisam de repetição fixa.</p>
                  </>
                ) : (
                  <>
                    <p>O nó será executado enquanto a <strong>condição for verdadeira</strong>.</p>
                    <p><strong>Break:</strong> quando a condição ficar falsa OU atingir max_iterations.</p>
                  </>
                )}
              </div>
            </div>

            {/* max_iterations */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                max_iterations (limite de repetições) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={d.max_iterations || ''}
                onChange={(e) => update('max_iterations', parseInt(e.target.value) || undefined)}
                className="h-8 text-sm"
              />
              {(!d.max_iterations || d.max_iterations < 1) && (
                <p className="text-xs text-destructive">⚠ Obrigatório — define o limite máximo de repetições</p>
              )}
            </div>

            {/* Pseudo-code preview */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Preview do comportamento:</Label>
              <div className="p-2.5 rounded bg-muted border border-border font-mono text-xs text-foreground leading-relaxed">
                {loopMode === 'while_condition' ? (
                  <>
                    <div className="text-chart-4">// Repete enquanto condição = true</div>
                    <div>i = 0</div>
                    <div><span className="text-chart-4 font-bold">while</span> ({d.condition || '...'}) {'{'}</div>
                    <div className="pl-4">executar(<span className="text-chart-2">{edge.source}</span>)</div>
                    <div className="pl-4">i++</div>
                    <div className="pl-4"><span className="text-destructive font-bold">if</span> (i &gt;= {d.max_iterations || '?'}) <span className="text-destructive font-bold">break</span></div>
                    <div>{'}'}</div>
                  </>
                ) : (
                  <>
                    <div className="text-chart-4">// Repete {d.max_iterations || '?'} vezes</div>
                    <div><span className="text-chart-4 font-bold">for</span> (i = 0; i &lt; {d.max_iterations || '?'}; i++) {'{'}</div>
                    <div className="pl-4">executar(<span className="text-chart-2">{edge.source}</span>)</div>
                    <div>{'}'}</div>
                  </>
                )}
              </div>
            </div>

            {/* How to create tip */}
            {!isSelfLoop && (
              <div className="p-2 rounded bg-muted text-[10px] text-muted-foreground">
                💡 <strong>Dica:</strong> Para loops, conecte o nó de volta nele mesmo (self-loop) arrastando a saída direita para a entrada esquerda.
              </div>
            )}
          </div>
        )}

        {/* Simple connection info when no loop */}
        {loopMode === 'none' && !d.condition && (
          <div className="p-2 rounded bg-muted text-[10px] text-muted-foreground">
            Conexão simples: o nó de destino será executado após o de origem.
            {!isSelfLoop && ' Adicione uma condição para criar um fluxo condicional.'}
          </div>
        )}
      </div>
    </div>
  );
}
