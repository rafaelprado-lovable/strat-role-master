import { useState, useMemo } from 'react';
import { type Node, type Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { X, Repeat, Eye, ShieldAlert, Info, Timer, ListChecks, Zap, Code, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { DEFINITION_IDS, type WorkflowForEach } from '@/types/automations';
import { PLUGIN_SCHEMAS, type PluginField } from '@/types/pluginSchemas';
import { useIsMobile } from '@/hooks/use-mobile';

interface NodeConfigPanelProps {
  node: Node;
  inputs: Record<string, unknown>;
  loopEdge: Edge | null;
  allNodes: Node[];
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onUpdateInputs: (nodeId: string, inputs: Record<string, unknown>) => void;
  onUpdateEdge: (id: string, data: Partial<Edge['data']>) => void;
  onCreateLoopEdge: (nodeId: string) => void;
  onDeleteLoopEdge: (edgeId: string) => void;
  onRenameNode: (oldId: string, newLabel: string) => void;
  onClose: () => void;
}

function resolveTemplate(template: string, mockData: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.\-]+)\}\}/g, (_, key) => {
    const val = key.split('.').reduce((o: any, k: string) => o?.[k], mockData);
    return val !== undefined ? String(val) : `[${key}]`;
  });
}

export function NodeConfigPanel({ node, inputs, loopEdge, allNodes, onUpdate, onUpdateInputs, onUpdateEdge, onCreateLoopEdge, onDeleteLoopEdge, onClose }: NodeConfigPanelProps) {
  const d = node.data as Record<string, any>;
  const forEach: WorkflowForEach | undefined = d.for_each;
  const [forEachEnabled, setForEachEnabled] = useState(!!forEach);
  const [inputsJson, setInputsJson] = useState(JSON.stringify(inputs || {}, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Loop delay state (from inputs)
  const currentInputs = inputs || {};
  const [loopDelaySeconds, setLoopDelaySeconds] = useState<string>(
    currentInputs.loop_delay_seconds !== undefined ? String(currentInputs.loop_delay_seconds) : ''
  );
  const [loopDelayMs, setLoopDelayMs] = useState<string>(
    currentInputs.loop_delay_ms !== undefined ? String(currentInputs.loop_delay_ms) : ''
  );

  const handleLoopDelayChange = (field: 'loop_delay_seconds' | 'loop_delay_ms', value: string) => {
    if (field === 'loop_delay_seconds') setLoopDelaySeconds(value);
    else setLoopDelayMs(value);

    const num = value === '' ? undefined : Number(value);
    if (value !== '' && (isNaN(num!) || num! < 0)) return; // don't persist invalid

    const updated = { ...currentInputs };
    if (value === '' || value === undefined) {
      delete updated[field];
    } else {
      updated[field] = num!;
    }
    onUpdateInputs(node.id, updated);
  };

  // Loop state
  const loopEnabled = !!loopEdge;
  const loopData = loopEdge ? (loopEdge.data || {}) as Record<string, any> : null;
  const loopMode = loopData?.loop_mode || (loopData?.condition ? 'while_condition' : 'while_true');

  const update = (updates: Record<string, unknown>) => {
    onUpdate(node.id, { ...d, ...updates });
  };

  const updateLoopEdge = (updates: Record<string, unknown>) => {
    if (!loopEdge) return;
    onUpdateEdge(loopEdge.id, { ...(loopEdge.data || {}), ...updates });
  };

  const toggleLoop = (enabled: boolean) => {
    if (enabled) {
      onCreateLoopEdge(node.id);
      update({ hasLoop: true });
    } else {
      if (loopEdge) onDeleteLoopEdge(loopEdge.id);
      update({ hasLoop: false });
    }
  };

  const setLoopMode = (mode: 'while_condition' | 'while_true') => {
    if (mode === 'while_true') {
      updateLoopEdge({ loop_mode: 'while_true', condition: '' });
    } else {
      updateLoopEdge({ loop_mode: 'while_condition', condition: loopData?.condition || '' });
    }
  };

  const updateForEach = (field: string, value: string) => {
    const current = d.for_each || { items: '', item_var: 'item', index_var: 'index' };
    let parsedValue: any = value;
    if (field === 'reopen_tasks') {
      try { parsedValue = JSON.parse(value); } catch { return; }
    }
    if (field === 'stream') {
      parsedValue = value === 'true';
    }
    update({ for_each: { ...current, [field]: parsedValue }, hasForEach: true });
  };

  const toggleForEach = (enabled: boolean) => {
    setForEachEnabled(enabled);
    if (enabled) {
      update({ for_each: { items: '', item_var: 'item', index_var: 'index' }, hasForEach: true });
    } else {
      update({ for_each: undefined, hasForEach: false });
    }
  };

  const normalizeJsonString = (raw: string): string => {
    // 1. Replace single quotes with double quotes (but not inside double-quoted strings)
    let result = raw;
    // Simple approach: if no double quotes exist, swap all single quotes
    if (!result.includes('"')) {
      result = result.replace(/'/g, '"');
    } else {
      // Replace only single-quoted keys/values: 'xxx' → "xxx"
      result = result.replace(/'([^']*?)'/g, '"$1"');
    }
    // 2. Wrap bare {{...}} templates in double quotes if not already quoted
    result = result.replace(/:\s*(\{\{[^}]+\}\})\s*([,}\n])/g, ': "$1"$2');
    return result;
  };

  const handleInputsChange = (val: string) => {
    setInputsJson(val);
    const trimmed = val.trim();
    if (!trimmed || trimmed === '{}') {
      setJsonError('');
      onUpdateInputs(node.id, {});
      return;
    }
    // Try raw first
    try {
      const parsed = JSON.parse(trimmed);
      setJsonError('');
      onUpdateInputs(node.id, parsed);
      return;
    } catch {
      // Try normalized
    }
    try {
      const normalized = normalizeJsonString(trimmed);
      const parsed = JSON.parse(normalized);
      setJsonError('');
      onUpdateInputs(node.id, parsed);
    } catch {
      setJsonError('JSON inválido — use aspas duplas ("") em chaves e valores');
    }
  };

  const mockData: Record<string, unknown> = {
    item: { campo: 'valor_mock', id: 123 },
    index: 0,
  };

  const isMobile = useIsMobile();

  const panelContent = (
    <>
      {/* Header - only on desktop */}
      {!isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-sm text-foreground">Configuração do Nó</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* ID (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-xs">ID do Nó</Label>
          <Input value={node.id} disabled className="h-8 text-sm font-mono bg-muted" />
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <Label className="text-xs">Nome</Label>
          <Input
            value={d.label || ''}
            onChange={(e) => update({ label: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Definition ID */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo (definition_id) <span className="text-destructive">*</span></Label>
          <Select value={d.definition_id || ''} onValueChange={(v) => {
            const def = DEFINITION_IDS.find(dd => dd.value === v);
            update({ definition_id: v, label: def?.label || v });
          }}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {DEFINITION_IDS.map((def) => (
                <SelectItem key={def.value} value={def.value}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Descrição</Label>
          <Input
            value={d.description || ''}
            onChange={(e) => update({ description: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* ============ WHILE LOOP SECTION ============ */}
        <div className="border-t border-border pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-chart-4" />
              <Label className="text-xs font-semibold text-chart-4">While Loop</Label>
            </div>
            <Switch checked={loopEnabled} onCheckedChange={toggleLoop} />
          </div>

          {loopEnabled && loopData && (
            <div className="space-y-3">
              {/* Loop Mode */}
              <div className="space-y-1.5">
                <Label className="text-xs">Modo do loop</Label>
                <Select value={loopMode} onValueChange={(v) => setLoopMode(v as any)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="while_condition">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-3 w-3 text-chart-4" />
                        <span>While (condição)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="while_true">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-3 w-3 text-chart-4" />
                        <span>While true (fixo)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* While condition */}
              {loopMode === 'while_condition' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Condição do while <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-1">
                    <Input
                      value={loopData.condition || ''}
                      onChange={(e) => updateLoopEdge({ condition: e.target.value })}
                      placeholder="node-id.output.status != 200"
                      className="h-8 text-sm font-mono flex-1"
                    />
                    <RefDropdown
                      allNodes={allNodes}
                      currentNodeId={node.id}
                      onSelect={(ref) => updateLoopEdge({ condition: (loopData.condition || '') + `{{${ref}}}` })}
                    />
                  </div>
                  {!loopData.condition?.trim() && (
                    <p className="text-xs text-destructive">⚠ Preencha a condição</p>
                  )}
                </div>
              )}

              {/* Max iterations */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  max_iterations <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={loopData.max_iterations || ''}
                  onChange={(e) => updateLoopEdge({ max_iterations: parseInt(e.target.value) || undefined })}
                  className="h-8 text-sm"
                />
                {(!loopData.max_iterations || loopData.max_iterations < 1) && (
                  <p className="text-xs text-destructive">⚠ Obrigatório — limita o número máximo de repetições</p>
                )}
              </div>

              {/* Break condition explanation */}
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <p className="text-xs font-semibold text-foreground">Condições de Break</p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-destructive font-bold shrink-0">1.</span>
                    <p>
                      <strong>max_iterations atingido:</strong> para após{' '}
                      <code className="bg-muted px-1 rounded text-foreground">{loopData.max_iterations || '?'}</code> execuções
                    </p>
                  </div>
                  {loopMode === 'while_condition' && loopData.condition ? (
                    <div className="flex items-start gap-2">
                      <span className="text-destructive font-bold shrink-0">2.</span>
                      <p>
                        <strong>Condição falsa:</strong> quando{' '}
                        <code className="bg-muted px-1 rounded text-foreground">{loopData.condition}</code>{' '}
                        retornar <code className="bg-muted px-1 rounded text-destructive">false</code>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="text-chart-4 font-bold shrink-0">2.</span>
                      <p><em>Sem condição — o loop só para pelo max_iterations</em></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Loop Delay */}
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-chart-4" />
                  <Label className="text-xs font-semibold text-chart-4">Delay entre iterações</Label>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-1">Delay entre execuções do loop (while). Se ambos forem preenchidos, segundos tem prioridade.</p>

                <div className="space-y-1.5">
                  <Label className="text-xs">Delay (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={loopDelaySeconds}
                    onChange={(e) => handleLoopDelayChange('loop_delay_seconds', e.target.value)}
                    placeholder="Ex: 10"
                    className="h-8 text-sm font-mono"
                  />
                  {loopDelaySeconds !== '' && (isNaN(Number(loopDelaySeconds)) || Number(loopDelaySeconds) < 0) && (
                    <p className="text-xs text-destructive">⚠ Valor deve ser um número ≥ 0</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Delay (ms)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    value={loopDelayMs}
                    onChange={(e) => handleLoopDelayChange('loop_delay_ms', e.target.value)}
                    placeholder="Ex: 5000"
                    className="h-8 text-sm font-mono"
                  />
                  {loopDelayMs !== '' && (isNaN(Number(loopDelayMs)) || Number(loopDelayMs) < 0) && (
                    <p className="text-xs text-destructive">⚠ Valor deve ser um número ≥ 0</p>
                  )}
                </div>

                {loopDelaySeconds !== '' && loopDelayMs !== '' && (
                  <div className="flex items-start gap-2 p-2 rounded bg-chart-4/10 border border-chart-4/20">
                    <Info className="h-3.5 w-3.5 text-chart-4 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-foreground">
                      <strong>loop_delay_seconds</strong> tem prioridade e será usado pelo motor. O valor em ms será ignorado.
                    </p>
                  </div>
                )}
              </div>

              {/* Reopen Tasks */}
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5 text-chart-2" />
                  <Label className="text-xs font-semibold text-chart-2">Reexecutar Tasks (reopen_tasks)</Label>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-1">
                  Selecione quais nós devem ser reexecutados a cada iteração do loop. O nó atual ({node.id}) é incluído automaticamente.
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {allNodes.map((n) => {
                    const nd = n.data as Record<string, any>;
                    const reopenTasks: string[] = loopData?.reopen_tasks || [];
                    const isCurrentNode = n.id === node.id;
                    const isChecked = isCurrentNode || reopenTasks.includes(n.id);
                    return (
                      <label
                        key={n.id}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50 ${isCurrentNode ? 'opacity-70' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCurrentNode}
                          onChange={(e) => {
                            let updated = [...reopenTasks];
                            if (e.target.checked) {
                              if (!updated.includes(n.id)) updated.push(n.id);
                            } else {
                              updated = updated.filter(id => id !== n.id);
                            }
                            // Always ensure current node is included
                            if (!updated.includes(node.id)) updated.push(node.id);
                            updateLoopEdge({ reopen_tasks: updated });
                          }}
                          className="rounded border-border"
                        />
                        <span className="font-mono text-foreground">{n.id}</span>
                        <span className="text-muted-foreground truncate">({nd.label || nd.definition_id})</span>
                        {isCurrentNode && <span className="text-chart-2 text-[10px]">(auto)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Pseudo-code preview */}
              <div className="p-2.5 rounded bg-muted border border-border font-mono text-xs text-foreground leading-relaxed">
                <div className="text-chart-4">// Pseudo-código do loop</div>
                {loopMode === 'while_condition' && loopData.condition ? (
                  <>
                    <div>i = 0</div>
                    <div><span className="text-chart-4 font-bold">while</span> ({loopData.condition}) {'{'}</div>
                    {((loopData.reopen_tasks || []) as string[]).filter((t: string) => t !== node.id).map((t: string) => (
                      <div key={t} className="pl-4">reopen(<span className="text-chart-2">{t}</span>)</div>
                    ))}
                    <div className="pl-4">executar(<span className="text-chart-2">{node.id}</span>)</div>
                    {(loopDelaySeconds !== '' || loopDelayMs !== '') && (
                      <div className="pl-4 text-muted-foreground">sleep({loopDelaySeconds !== '' ? `${loopDelaySeconds}s` : `${loopDelayMs}ms`})</div>
                    )}
                    <div className="pl-4">i++</div>
                    <div className="pl-4"><span className="text-destructive font-bold">if</span> (i &gt;= {loopData.max_iterations || '?'}) <span className="text-destructive font-bold">break</span></div>
                    <div>{'}'}</div>
                  </>
                ) : (
                  <>
                    <div><span className="text-chart-4 font-bold">for</span> (i = 0; i &lt; {loopData.max_iterations || '?'}; i++) {'{'}</div>
                    {((loopData.reopen_tasks || []) as string[]).filter((t: string) => t !== node.id).map((t: string) => (
                      <div key={t} className="pl-4">reopen(<span className="text-chart-2">{t}</span>)</div>
                    ))}
                    <div className="pl-4">executar(<span className="text-chart-2">{node.id}</span>)</div>
                    {(loopDelaySeconds !== '' || loopDelayMs !== '') && (
                      <div className="pl-4 text-muted-foreground">sleep({loopDelaySeconds !== '' ? `${loopDelaySeconds}s` : `${loopDelayMs}ms`})</div>
                    )}
                    <div>{'}'}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* for_each */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-semibold">for_each</Label>
            </div>
            <Switch checked={forEachEnabled} onCheckedChange={toggleForEach} />
          </div>

          {forEachEnabled && (
            <div className="space-y-3 pl-1">
              {/* Items */}
              <div className="space-y-1.5">
                <Label className="text-xs">items <span className="text-destructive">*</span></Label>
                <div className="flex gap-1">
                  <Input
                    value={forEach?.items || ''}
                    onChange={(e) => updateForEach('items', e.target.value)}
                    placeholder="{{node-x.output.items}}"
                    className="h-8 text-sm font-mono flex-1"
                  />
                  <RefDropdown
                    allNodes={allNodes}
                    currentNodeId={node.id}
                    onSelect={(ref) => updateForEach('items', (forEach?.items || '') + `{{${ref}}}`)}
                  />
                </div>
              </div>

              {/* Stream toggle - fan-out from THIS node to children */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-chart-3" />
                    <Label className="text-xs font-semibold text-chart-3">Stream (fan-out para filhos)</Label>
                  </div>
                  <Switch
                    checked={!!forEach?.stream}
                    onCheckedChange={(v) => updateForEach('stream', v ? 'true' : 'false')}
                  />
                </div>
                {forEach?.stream && (
                  <div className="p-2 rounded bg-chart-3/10 border border-chart-3/20">
                    <p className="text-[10px] text-foreground">
                      <strong>Stream ativo:</strong> cada item processado por este nó será despachado individualmente para os nós filhos (downstream), criando loops aninhados. Os nós conectados abaixo receberão <code className="bg-muted px-1 rounded">item</code> a item automaticamente.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">item_var</Label>
                <Input
                  value={forEach?.item_var || 'item'}
                  onChange={(e) => updateForEach('item_var', e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">index_var</Label>
                <Input
                  value={forEach?.index_var || 'index'}
                  onChange={(e) => updateForEach('index_var', e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              {forEach?.item_var && forEach?.index_var && forEach.item_var === forEach.index_var && (
                <p className="text-xs text-destructive">⚠ item_var e index_var não podem ser iguais</p>
              )}

              {/* Reopen Tasks for for_each */}
              <div className="space-y-3 border-t border-border pt-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5 text-chart-2" />
                  <Label className="text-xs font-semibold text-chart-2">Reexecutar Tasks (reopen_tasks)</Label>
                </div>
                <p className="text-[10px] text-muted-foreground -mt-1">
                  Selecione quais nós devem ser reexecutados a cada iteração do for_each. O nó atual ({node.id}) é incluído automaticamente.
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {allNodes.map((n) => {
                    const nd = n.data as Record<string, any>;
                    const reopenTasks: string[] = forEach?.reopen_tasks || [];
                    const isCurrentNode = n.id === node.id;
                    const isChecked = isCurrentNode || reopenTasks.includes(n.id);
                    return (
                      <label
                        key={n.id}
                        className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer hover:bg-muted/50 ${isCurrentNode ? 'opacity-70' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isCurrentNode}
                          onChange={(e) => {
                            let updated = [...reopenTasks];
                            if (e.target.checked) {
                              if (!updated.includes(n.id)) updated.push(n.id);
                            } else {
                              updated = updated.filter(id => id !== n.id);
                            }
                            if (!updated.includes(node.id)) updated.push(node.id);
                            updateForEach('reopen_tasks', JSON.stringify(updated));
                          }}
                          className="rounded border-border"
                        />
                        <span className="font-mono text-foreground">{n.id}</span>
                        <span className="text-muted-foreground truncate">({nd.label || nd.definition_id})</span>
                        {isCurrentNode && <span className="text-chart-2 text-[10px]">(auto)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============ PLUGIN INPUTS ============ */}
        <PluginInputsSection
          nodeId={node.id}
          definitionId={d.definition_id}
          inputs={inputs}
          allNodes={allNodes}
          onUpdateInputs={onUpdateInputs}
          currentNodeId={node.id}
        />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="w-[90vw] max-w-md p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-sm">Configuração do Nó</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col">{panelContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-80 shrink-0 border rounded-lg bg-card overflow-y-auto flex flex-col">
      {panelContent}
    </div>
  );
}

// ========== Ref Dropdown (reusable) ==========

function RefDropdown({ allNodes, currentNodeId, onSelect }: {
  allNodes: Node[];
  currentNodeId: string;
  onSelect: (ref: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const upstreamNodes = allNodes.filter(n => n.id !== currentNodeId);
  const schemas = upstreamNodes.map(n => {
    const nd = n.data as Record<string, any>;
    const schema = PLUGIN_SCHEMAS[nd.definition_id];
    return { node: n, schema, nd };
  });

  if (upstreamNodes.length === 0) return null;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 text-xs font-mono text-chart-4 border-chart-4/30 hover:bg-chart-4/10"
        onClick={() => setOpen(!open)}
        title="Inserir referência de outro nó"
      >
        {'{{}}'}
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-56 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover p-1.5 shadow-md space-y-1">
          {schemas.map(({ node: n, schema, nd }) => (
            <div key={n.id}>
              <p className="text-[10px] font-semibold text-muted-foreground px-1 pt-1">{nd.label || n.id}</p>
              <button
                className="w-full text-left px-2 py-1 rounded text-xs font-mono hover:bg-muted truncate"
                onClick={() => { onSelect(`${n.id}.output`); setOpen(false); }}
              >
                {`{{${n.id}.output}}`}
              </button>
              {schema?.outputs?.map(o => (
                <button
                  key={o.name}
                  className="w-full text-left px-2 py-1 rounded text-xs font-mono hover:bg-muted truncate"
                  onClick={() => { onSelect(`${n.id}.output.${o.name}`); setOpen(false); }}
                >
                  {`{{${n.id}.output.${o.name}}}`}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== Plugin Inputs Section ==========

interface PluginInputsSectionProps {
  nodeId: string;
  definitionId: string;
  inputs: Record<string, unknown>;
  allNodes: Node[];
  onUpdateInputs: (nodeId: string, inputs: Record<string, unknown>) => void;
  currentNodeId: string;
}

function PluginInputsSection({ nodeId, definitionId, inputs, allNodes, onUpdateInputs, currentNodeId }: PluginInputsSectionProps) {
  const schema = PLUGIN_SCHEMAS[definitionId];
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJson, setRawJson] = useState(JSON.stringify(inputs || {}, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [showOutputs, setShowOutputs] = useState(false);

  // Upstream nodes for variable references
  const upstreamNodes = allNodes.filter(n => n.id !== currentNodeId);

  const handleFieldChange = (fieldName: string, value: string) => {
    const updated = { ...(inputs || {}), [fieldName]: value === '' ? undefined : value };
    // Clean undefined values
    Object.keys(updated).forEach(k => {
      if (updated[k] === undefined) delete updated[k];
    });
    onUpdateInputs(nodeId, updated);
  };

  const handleRawJsonChange = (val: string) => {
    setRawJson(val);
    const trimmed = val.trim();
    if (!trimmed || trimmed === '{}') {
      setJsonError('');
      onUpdateInputs(nodeId, {});
      return;
    }
    try {
      let normalized = val;
      if (!normalized.includes('"')) normalized = normalized.replace(/'/g, '"');
      else normalized = normalized.replace(/'([^']*?)'/g, '"$1"');
      normalized = normalized.replace(/:\s*(\{\{[^}]+\}\})\s*([,}\n])/g, ': "$1"$2');
      const parsed = JSON.parse(normalized);
      setJsonError('');
      onUpdateInputs(nodeId, parsed);
    } catch {
      setJsonError('JSON inválido');
    }
  };

  const insertReference = (fieldName: string, ref: string) => {
    const current = String((inputs as any)?.[fieldName] || '');
    handleFieldChange(fieldName, current + `{{${ref}}}`);
  };

  if (!schema) {
    // Fallback: raw JSON for unknown plugins
    return (
      <div className="border-t border-border pt-3 space-y-1.5">
        <Label className="text-xs font-semibold">Inputs (JSON)</Label>
        <Textarea
          value={rawJson}
          onChange={(e) => handleRawJsonChange(e.target.value)}
          placeholder={'{\n  "key": "value"\n}'}
          className="text-sm min-h-[100px] font-mono"
        />
        {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
        <p className="text-[10px] text-muted-foreground">
          Plugin sem schema definido — use JSON livre.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-3 space-y-3">
      {/* Plugin header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Inputs — {schema.name}</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1 text-muted-foreground"
            onClick={() => setShowRawJson(!showRawJson)}
          >
            <Code className="h-3 w-3" />
            {showRawJson ? 'Campos' : 'JSON'}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">{schema.description}</p>
      </div>

      {showRawJson ? (
        /* Raw JSON mode */
        <div className="space-y-1.5">
          <Textarea
            value={JSON.stringify(inputs || {}, null, 2)}
            onChange={(e) => handleRawJsonChange(e.target.value)}
            className="text-sm min-h-[100px] font-mono"
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
          <p className="text-[10px] text-muted-foreground">
            Aceita templates: {'{{node-id.output.campo}}'}, {'{{item.campo}}'}
          </p>
        </div>
      ) : (
        /* Structured fields */
        <div className="space-y-2.5">
          {schema.inputs.map((field) => (
            <PluginFieldInput
              key={field.name}
              field={field}
              value={String((inputs as any)?.[field.name] ?? '')}
              onChange={(v) => handleFieldChange(field.name, v)}
              upstreamNodes={upstreamNodes}
              schema={schema}
              onInsertRef={(ref) => insertReference(field.name, ref)}
            />
          ))}
        </div>
      )}

      {/* Outputs reference */}
      <div className="border-t border-border pt-2">
        <button
          onClick={() => setShowOutputs(!showOutputs)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          {showOutputs ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <ArrowRight className="h-3 w-3" />
          Outputs disponíveis ({schema.outputs.length})
        </button>
        {showOutputs && (
          <div className="mt-2 space-y-1">
            {schema.outputs.map((out) => (
              <div key={out.name} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50 text-xs">
                <code className="text-primary font-mono text-[11px]">{`{{${nodeId}.output.${out.name}}}`}</code>
                <span className="text-muted-foreground ml-auto">{out.label}</span>
              </div>
            ))}
            {schema.outputs.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Use estas referências nos inputs de nós downstream.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== Single Field Input ==========

interface PluginFieldInputProps {
  field: PluginField;
  value: string;
  onChange: (value: string) => void;
  upstreamNodes: Node[];
  schema: import('@/types/pluginSchemas').PluginSchema;
  onInsertRef: (ref: string) => void;
}

function PluginFieldInput({ field, value, onChange, upstreamNodes, onInsertRef }: PluginFieldInputProps) {
  const [showRefs, setShowRefs] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
          <span className="text-muted-foreground font-normal ml-1.5 text-[10px]">{field.name}</span>
        </Label>
        {upstreamNodes.length > 0 && (
          <button
            onClick={() => setShowRefs(!showRefs)}
            className="text-[10px] text-primary hover:underline"
          >
            {showRefs ? 'Fechar' : '{{ref}}'}
          </button>
        )}
      </div>

      {field.type === 'json' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="text-sm min-h-[60px] font-mono"
        />
      ) : (
        <Input
          type={field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-8 text-sm font-mono"
        />
      )}

      {field.description && (
        <p className="text-[10px] text-muted-foreground">{field.description}</p>
      )}

      {/* Reference picker */}
      {showRefs && (
        <div className="p-2 rounded border border-border bg-muted/30 space-y-1 max-h-32 overflow-y-auto">
          {upstreamNodes.map(n => {
            const nd = n.data as Record<string, any>;
            const nodeSchema = PLUGIN_SCHEMAS[nd.definition_id];
            const outputs = nodeSchema?.outputs || [];
            return (
              <div key={n.id} className="space-y-0.5">
                <p className="text-[10px] font-semibold text-foreground">{nd.label || n.id}</p>
                {outputs.length > 0 ? outputs.map(out => (
                  <button
                    key={out.name}
                    onClick={() => { onInsertRef(`${n.id}.output.${out.name}`); setShowRefs(false); }}
                    className="block w-full text-left text-[10px] text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded font-mono"
                  >
                    {`{{${n.id}.output.${out.name}}}`}
                  </button>
                )) : (
                  <button
                    onClick={() => { onInsertRef(`${n.id}.output`); setShowRefs(false); }}
                    className="block w-full text-left text-[10px] text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded font-mono"
                  >
                    {`{{${n.id}.output}}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {field.required && !value.trim() && (
        <p className="text-[10px] text-destructive">⚠ Campo obrigatório</p>
      )}
    </div>
  );
}
