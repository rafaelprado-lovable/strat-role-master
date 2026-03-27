import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { type Node, type Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Repeat, Eye, ShieldAlert, Info, Timer, ListChecks, Zap, Code, Code2, ArrowRight, ChevronDown, ChevronRight, Import, Share2, Settings2, GitBranch, Database, Play } from 'lucide-react';
import { CodeEditorPanel } from './CodeEditorPanel';
import { type WorkflowForEach } from '@/types/automations';
import type { BlockDef } from './FlowEditor';
import { PLUGIN_SCHEMAS, type PluginField } from '@/types/pluginSchemas';
import type { Definition, DefinitionField } from '@/services/definitionService';
import { useIsMobile } from '@/hooks/use-mobile';
import { ImportHttpDialog } from './ImportHttpDialog';
import { ExportHttpDialog } from './ExportHttpDialog';
import { NodeExecutionPanel } from './NodeExecutionPanel';
import type { ParsedHttpRequest } from '@/services/httpImportParser';

interface NodeConfigPanelProps {
  node: Node;
  inputs: Record<string, unknown>;
  loopEdge: Edge | null;
  allNodes: Node[];
  definitions: BlockDef[];
  apiDefinitions: Definition[];
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

export function NodeConfigPanel({ node, inputs, loopEdge, allNodes, definitions, apiDefinitions, onUpdate, onUpdateInputs, onUpdateEdge, onCreateLoopEdge, onDeleteLoopEdge, onRenameNode, onClose }: NodeConfigPanelProps) {
  const d = node.data as Record<string, any>;
  const forEach: WorkflowForEach | undefined = d.for_each;
  const [forEachEnabled, setForEachEnabled] = useState(!!forEach);
  const [inputsJson, setInputsJson] = useState(JSON.stringify(inputs || {}, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const isCodeNode = d.definition_id === 'code_execution_v1';
  const panelWidth = isCodeNode && activeTab === 'code' ? 'w-[700px]' : 'w-[420px]';

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

  const hasLoop = loopEnabled;
  const hasForEach = forEachEnabled;
  const hasDefinition = !!d.definition_id;

  const panelContent = (
    <>
      {/* Header */}
      {!isMobile && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <Settings2 className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{d.label || node.id}</h3>
              <p className="text-[10px] text-muted-foreground font-mono truncate">{d.definition_id || 'Sem tipo definido'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-2 pt-1 pb-0 h-auto gap-0 shrink-0">
          <TabsTrigger value="general" className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3 py-2 gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="inputs" className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3 py-2 gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Inputs
          </TabsTrigger>
          <TabsTrigger value="flow" className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3 py-2 gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Fluxo
            {(hasLoop || hasForEach) && <span className="w-1.5 h-1.5 rounded-full bg-chart-4 shrink-0" />}
          </TabsTrigger>
          <TabsTrigger value="test" className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3 py-2 gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Teste
          </TabsTrigger>
          {d.definition_id === 'code_execution_v1' && (
            <TabsTrigger value="code" className="rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs px-3 py-2 gap-1.5">
              <Code2 className="h-3.5 w-3.5" />
              Código
            </TabsTrigger>
          )}
        </TabsList>

        {/* ===== TAB: GERAL ===== */}
        <TabsContent value="general" className="flex-1 overflow-y-auto mt-0 p-5 space-y-5">
          {/* ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">ID do Nó</Label>
            <Textarea value={node.id} disabled className="text-sm font-mono bg-muted/50 min-h-[36px]" />
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Nome</Label>
            <Textarea
              value={d.label || ''}
              onChange={(e) => update({ label: e.target.value })}
              className="text-sm min-h-[36px]"
              placeholder="Nome do bloco"
            />
          </div>

          {/* Definition ID */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Tipo (definition_id) <span className="text-destructive">*</span></Label>
            <Select value={d.definition_id || ''} onValueChange={(v) => {
              const def = definitions.find(dd => dd.value === v);
              const newLabel = def?.label || v;
              const switchUpdate = v === 'switch_v1' ? { switchCases: ['Case 1', 'Case 2', 'Default'] } : { switchCases: undefined };
              update({ definition_id: v, label: newLabel, isTrigger: def?.category === 'trigger', ...switchUpdate });
              onRenameNode(node.id, newLabel);
            }}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                {definitions.map((def) => (
                  <SelectItem key={def.value} value={def.value}>
                    {def.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Descrição</Label>
            <Textarea
              value={d.description || ''}
              onChange={(e) => update({ description: e.target.value })}
              className="text-sm min-h-[36px]"
              placeholder="Descrição opcional"
            />
          </div>

          {/* Switch Cases */}
          {d.definition_id === 'switch_v1' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-chart-2/10">
                    <Share2 className="h-4 w-4 text-chart-2" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-chart-2">Switch Cases</Label>
                    <p className="text-[10px] text-muted-foreground">Caminhos de saída do switch</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    const cases = (d.switchCases as string[]) || [];
                    update({ switchCases: [...cases, `Case ${cases.length + 1}`] });
                  }}
                >
                  + Case
                </Button>
              </div>
              <div className="space-y-1.5 pl-1 border-l-2 border-chart-2/20 ml-3">
                {((d.switchCases as string[]) || []).map((c: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 pl-4">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: `hsl(${['210 100% 50%', '142 70% 45%', '35 95% 55%', '280 80% 55%', '350 80% 55%', '190 100% 45%'][i % 6]})` }}
                    />
                    <Input
                      value={c}
                      onChange={(e) => {
                        const cases = [...((d.switchCases as string[]) || [])];
                        cases[i] = e.target.value;
                        update({ switchCases: cases });
                      }}
                      className="h-7 text-xs flex-1"
                      placeholder={`Case ${i + 1}`}
                    />
                    {((d.switchCases as string[]) || []).length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const cases = ((d.switchCases as string[]) || []).filter((_: string, j: number) => j !== i);
                          update({ switchCases: cases });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB: INPUTS ===== */}
        <TabsContent value="inputs" className="flex-1 overflow-y-auto mt-0 p-5 space-y-4">
          <PluginInputsSection
            nodeId={node.id}
            definitionId={d.definition_id}
            inputs={inputs}
            allNodes={allNodes}
            definitions={definitions}
            apiDefinitions={apiDefinitions}
            onUpdateInputs={onUpdateInputs}
            currentNodeId={node.id}
          />
        </TabsContent>

        {/* ===== TAB: FLUXO (Loop + ForEach) ===== */}
        <TabsContent value="flow" className="flex-1 overflow-y-auto mt-0 p-5 space-y-6">
          {/* ---- WHILE LOOP ---- */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-chart-4/10">
                  <Repeat className="h-4 w-4 text-chart-4" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-chart-4">While Loop</Label>
                  <p className="text-[10px] text-muted-foreground">Repetir execução com condição</p>
                </div>
              </div>
              <Switch checked={loopEnabled} onCheckedChange={toggleLoop} />
            </div>

            {loopEnabled && loopData && (
              <div className="space-y-4 pl-1 border-l-2 border-chart-4/20 ml-3">
                <div className="pl-4 space-y-4">
                  {/* Loop Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Modo do loop</Label>
                    <Select value={loopMode} onValueChange={(v) => setLoopMode(v as any)}>
                      <SelectTrigger className="h-9 text-sm">
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
                      <Textarea
                          value={loopData.condition || ''}
                          onChange={(e) => updateLoopEdge({ condition: e.target.value })}
                          placeholder="node-id.output.status != 200"
                          className="text-sm font-mono flex-1 min-h-[36px]"
                        />
                        <RefDropdown
                          allNodes={allNodes}
                          currentNodeId={node.id}
                          definitions={definitions}
                          apiDefinitions={apiDefinitions}
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
                      className="h-9 text-sm"
                    />
                    {(!loopData.max_iterations || loopData.max_iterations < 1) && (
                      <p className="text-xs text-destructive">⚠ Obrigatório — limita o número máximo de repetições</p>
                    )}
                  </div>

                  {/* Break condition info */}
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
                    <p className="text-[10px] text-muted-foreground -mt-1">Se ambos forem preenchidos, segundos tem prioridade.</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Segundos</Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={loopDelaySeconds}
                          onChange={(e) => handleLoopDelayChange('loop_delay_seconds', e.target.value)}
                          placeholder="Ex: 10"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Milissegundos</Label>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={loopDelayMs}
                          onChange={(e) => handleLoopDelayChange('loop_delay_ms', e.target.value)}
                          placeholder="Ex: 5000"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    </div>

                    {loopDelaySeconds !== '' && loopDelayMs !== '' && (
                      <div className="flex items-start gap-2 p-2 rounded bg-chart-4/10 border border-chart-4/20">
                        <Info className="h-3.5 w-3.5 text-chart-4 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-foreground">
                          <strong>loop_delay_seconds</strong> tem prioridade.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reopen Tasks */}
                  <div className="space-y-3 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-3.5 w-3.5 text-chart-2" />
                      <Label className="text-xs font-semibold text-chart-2">Reexecutar Tasks</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground -mt-1">
                      Nós reexecutados a cada iteração. O nó atual ({node.id}) é incluído automaticamente.
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-border p-2">
                      {allNodes.map((n) => {
                        const nd = n.data as Record<string, any>;
                        const reopenTasks: string[] = loopData?.reopen_tasks || [];
                        const isCurrentNode = n.id === node.id;
                        const isChecked = isCurrentNode || reopenTasks.includes(n.id);
                        return (
                          <label
                            key={n.id}
                            className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer hover:bg-muted/50 transition-colors ${isCurrentNode ? 'opacity-70' : ''}`}
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

                  {/* Pseudo-code */}
                  <div className="p-3 rounded-lg bg-muted border border-border font-mono text-xs text-foreground leading-relaxed">
                    <div className="text-chart-4 mb-1">// Pseudo-código do loop</div>
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
              </div>
            )}
          </div>

          {/* ---- FOR EACH ---- */}
          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-muted">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">for_each</Label>
                  <p className="text-[10px] text-muted-foreground">Iterar sobre uma lista de itens</p>
                </div>
              </div>
              <Switch checked={forEachEnabled} onCheckedChange={toggleForEach} />
            </div>

            {forEachEnabled && (
              <div className="space-y-4 pl-1 border-l-2 border-muted-foreground/20 ml-3">
                <div className="pl-4 space-y-4">
                  {/* Items */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">items <span className="text-destructive">*</span></Label>
                    <div className="flex gap-1">
                      <Textarea
                        value={forEach?.items || ''}
                        onChange={(e) => updateForEach('items', e.target.value)}
                        placeholder="{{node-x.output.items}}"
                        className="text-sm font-mono flex-1 min-h-[36px]"
                      />
                      <RefDropdown
                        allNodes={allNodes}
                        currentNodeId={node.id}
                        definitions={definitions}
                        apiDefinitions={apiDefinitions}
                        onSelect={(ref) => updateForEach('items', (forEach?.items || '') + `{{${ref}}}`)}
                      />
                    </div>
                  </div>

                  {/* Stream toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-chart-3" />
                        <Label className="text-xs font-semibold text-chart-3">Stream (fan-out)</Label>
                      </div>
                      <Switch
                        checked={!!forEach?.stream}
                        onCheckedChange={(v) => updateForEach('stream', v ? 'true' : 'false')}
                      />
                    </div>
                    {forEach?.stream && (
                      <div className="p-2.5 rounded-lg bg-chart-3/10 border border-chart-3/20">
                        <p className="text-[10px] text-foreground">
                          <strong>Stream ativo:</strong> cada item será despachado individualmente para os nós filhos.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">item_var</Label>
                      <Textarea
                        value={forEach?.item_var || 'item'}
                        onChange={(e) => updateForEach('item_var', e.target.value)}
                        className="text-sm font-mono min-h-[36px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">index_var</Label>
                      <Textarea
                        value={forEach?.index_var || 'index'}
                        onChange={(e) => updateForEach('index_var', e.target.value)}
                        className="text-sm font-mono min-h-[36px]"
                      />
                    </div>
                  </div>

                  {forEach?.item_var && forEach?.index_var && forEach.item_var === forEach.index_var && (
                    <p className="text-xs text-destructive">⚠ item_var e index_var não podem ser iguais</p>
                  )}

                  {/* Reopen Tasks for for_each */}
                  <div className="space-y-3 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-3.5 w-3.5 text-chart-2" />
                      <Label className="text-xs font-semibold text-chart-2">Reexecutar Tasks</Label>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-border p-2">
                      {allNodes.map((n) => {
                        const nd = n.data as Record<string, any>;
                        const reopenTasks: string[] = forEach?.reopen_tasks || [];
                        const isCurrentNode = n.id === node.id;
                        const isChecked = isCurrentNode || reopenTasks.includes(n.id);
                        return (
                          <label
                            key={n.id}
                            className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer hover:bg-muted/50 transition-colors ${isCurrentNode ? 'opacity-70' : ''}`}
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
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== TAB: TESTE ===== */}
        <TabsContent value="test" className="flex-1 overflow-y-auto mt-0 p-5">
          {hasDefinition ? (
            <NodeExecutionPanelWithSchema
              nodeId={node.id}
              definitionId={d.definition_id}
              inputs={inputs}
              apiDefinitions={apiDefinitions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Play className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Selecione um tipo de bloco na aba <strong>Geral</strong> para executar testes.</p>
            </div>
          )}
        </TabsContent>

        {/* ===== TAB: CÓDIGO ===== */}
        {d.definition_id === 'code_execution_v1' && (
          <TabsContent value="code" className="flex-1 overflow-hidden mt-0 p-4 flex flex-col">
            <CodeEditorPanel
              code={(d.code as string) || ''}
              language={(d.code_language as 'python' | 'javascript' | 'shell' | 'json') || 'python'}
              onCodeChange={(code) => update({ code })}
              onLanguageChange={(lang) => update({ code_language: lang })}
            />
          </TabsContent>
        )}
      </Tabs>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="w-[90vw] max-w-lg p-0 overflow-hidden">
          <SheetHeader className="px-5 py-3.5 border-b border-border">
            <SheetTitle className="text-sm">{d.label || 'Configuração do Nó'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-[calc(100%-60px)]">{panelContent}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={`${panelWidth} shrink-0 border rounded-lg bg-card overflow-hidden flex flex-col transition-all duration-200`}>
      {panelContent}
    </div>
  );
}

// ========== Ref Dropdown (reusable) ==========

function RefDropdown({ allNodes, currentNodeId, definitions, apiDefinitions, onSelect }: {
  allNodes: Node[];
  currentNodeId: string;
  definitions: BlockDef[];
  apiDefinitions?: Definition[];
  onSelect: (ref: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const upstreamNodes = allNodes.filter(n => n.id !== currentNodeId);

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
          {upstreamNodes.map((n) => {
            const nd = n.data as Record<string, any>;
            const apiDef = apiDefinitions?.find(d => d.definition_id === nd.definition_id);
            const outputs: { name: string; label: string }[] = apiDef?.outputs
              ? apiDef.outputs.map(o => ({ name: o.name, label: o.label }))
              : (PLUGIN_SCHEMAS[nd.definition_id]?.outputs || []);
            return (
              <div key={n.id}>
                <p className="text-[10px] font-semibold text-muted-foreground px-1 pt-1">{nd.label || n.id}</p>
                <button
                  className="w-full text-left px-2 py-1 rounded text-xs font-mono hover:bg-muted truncate"
                  onClick={() => { onSelect(`${n.id}.output`); setOpen(false); }}
                >
                  {`{{${n.id}.output}}`}
                </button>
                {outputs.map(o => (
                  <button
                    key={o.name}
                    className="w-full text-left px-2 py-1 rounded text-xs font-mono hover:bg-muted truncate"
                    onClick={() => { onSelect(`${n.id}.output.${o.name}`); setOpen(false); }}
                  >
                    {`{{${n.id}.output.${o.name}}}`}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== Node Execution with Schema ==========

function NodeExecutionPanelWithSchema({ nodeId, definitionId, inputs, apiDefinitions }: { nodeId: string; definitionId: string; inputs: Record<string, unknown>; apiDefinitions: Definition[] }) {
  const apiDef = apiDefinitions.find(d => d.definition_id === definitionId);
  const staticSchema = PLUGIN_SCHEMAS[definitionId];

  const schemaFields: PluginField[] = apiDef?.inputs
    ? apiDef.inputs.map(f => ({ name: f.name, label: f.label, type: f.type as PluginField['type'], required: f.required, placeholder: f.placeholder, description: f.description }))
    : (staticSchema?.inputs || []);

  return (
    <NodeExecutionPanel
      nodeId={nodeId}
      definitionId={definitionId}
      inputs={inputs}
      schemaFields={schemaFields}
    />
  );
}

// ========== Plugin Inputs Section ==========

interface PluginInputsSectionProps {
  nodeId: string;
  definitionId: string;
  inputs: Record<string, unknown>;
  allNodes: Node[];
  definitions: BlockDef[];
  apiDefinitions: Definition[];
  onUpdateInputs: (nodeId: string, inputs: Record<string, unknown>) => void;
  currentNodeId: string;
}

function PluginInputsSection({ nodeId, definitionId, inputs, allNodes, definitions, apiDefinitions, onUpdateInputs, currentNodeId }: PluginInputsSectionProps) {
  const staticSchema = PLUGIN_SCHEMAS[definitionId];
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [typeOverrides, setTypeOverrides] = useState<Record<string, PluginField['type']>>({});
  
  // Find the API definition to get dynamic inputs/outputs
  const apiDef = apiDefinitions.find(d => d.definition_id === definitionId);
  
  // Check if this is an HTTP-type plugin
  const isHttpPlugin = definitionId === 'http_agent_v1' || definitionId?.includes('http');

  const handleHttpImport = (parsed: ParsedHttpRequest) => {
    const updated: Record<string, unknown> = { ...(inputs || {}) };
    if (parsed.url) updated.url = parsed.url;
    if (parsed.method) updated.method = parsed.method;
    if (parsed.headers) updated.headers = parsed.headers;
    if (parsed.body) updated.body = parsed.body;
    onUpdateInputs(nodeId, updated);
  };
  
  // Resolve inputs/outputs: prefer API definition, fallback to static PLUGIN_SCHEMAS
  const resolvedInputs: PluginField[] = (apiDef?.inputs
    ? apiDef.inputs.map(f => ({ name: f.name, label: f.label, type: f.type as PluginField['type'], required: f.required, placeholder: f.placeholder, description: f.description }))
    : (staticSchema?.inputs || [])
  ).map(f => typeOverrides[f.name] ? { ...f, type: typeOverrides[f.name] } : f);

  const resolvedOutputs: PluginField[] = apiDef?.outputs
    ? apiDef.outputs.map(f => ({ name: f.name, label: f.label, type: f.type as PluginField['type'], required: f.required, placeholder: f.placeholder, description: f.description }))
    : (staticSchema?.outputs || []);
  const resolvedName = apiDef?.label || staticSchema?.name || definitionId;
  const resolvedDescription = apiDef?.description || staticSchema?.description || '';
  const hasSchema = resolvedInputs.length > 0 || resolvedOutputs.length > 0;
  
  const [showRawJson, setShowRawJson] = useState(false);
  const [rawJson, setRawJson] = useState(JSON.stringify(inputs || {}, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [showOutputs, setShowOutputs] = useState(false);

  // Upstream nodes for variable references
  const upstreamNodes = allNodes.filter(n => n.id !== currentNodeId);

  const handleFieldChange = (fieldName: string, value: string) => {
    const updated = { ...(inputs || {}), [fieldName]: value === '' ? undefined : value };
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

  if (!hasSchema) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Inputs (JSON)</Label>
        <Textarea
          value={rawJson}
          onChange={(e) => handleRawJsonChange(e.target.value)}
          placeholder={'{\n  "key": "value"\n}'}
          className="text-sm min-h-[100px] font-mono"
          autoFormatJson
        />
        {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
        <p className="text-[10px] text-muted-foreground">
          Plugin sem schema definido — use JSON livre.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plugin header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Inputs — {resolvedName}</Label>
          <div className="flex items-center gap-1">
            {isHttpPlugin && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-primary"
                  onClick={() => setShowImportDialog(true)}
                >
                  <Import className="h-3 w-3" />
                  Importar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-chart-2"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Share2 className="h-3 w-3" />
                  Exportar
                </Button>
              </>
            )}
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
        </div>
        <p className="text-[10px] text-muted-foreground">{resolvedDescription}</p>
      </div>

      {/* Import/Export HTTP Dialogs */}
      {isHttpPlugin && (
        <>
          <ImportHttpDialog
            open={showImportDialog}
            onClose={() => setShowImportDialog(false)}
            onImport={handleHttpImport}
          />
          <ExportHttpDialog
            open={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            inputs={inputs}
          />
        </>
      )}

      {showRawJson ? (
        <div className="space-y-1.5">
          <Textarea
            value={JSON.stringify(inputs || {}, null, 2)}
            onChange={(e) => handleRawJsonChange(e.target.value)}
            className="text-sm min-h-[100px] font-mono"
            autoFormatJson
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
          <p className="text-[10px] text-muted-foreground">
            Aceita templates: {'{{node-id.output.campo}}'}, {'{{item.campo}}'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {resolvedInputs.map((field) => (
            <PluginFieldInput
              key={field.name}
              field={field}
              value={String((inputs as any)?.[field.name] ?? '')}
              onChange={(v) => handleFieldChange(field.name, v)}
              upstreamNodes={upstreamNodes}
              allNodes={allNodes}
              apiDefinitions={apiDefinitions}
              onInsertRef={(ref) => insertReference(field.name, ref)}
              onChangeType={(t) => setTypeOverrides(prev => ({ ...prev, [field.name]: t }))}
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
          Outputs disponíveis ({resolvedOutputs.length})
        </button>
        {showOutputs && (
          <div className="mt-2 space-y-1">
            {resolvedOutputs.map((out) => (
              <div key={out.name} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/50 text-xs">
                <code className="text-primary font-mono text-[11px]">{`{{${nodeId}.output.${out.name}}}`}</code>
                <span className="text-muted-foreground ml-auto">{out.label}</span>
              </div>
            ))}
            {resolvedOutputs.length > 0 && (
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
  allNodes: Node[];
  apiDefinitions: Definition[];
  onInsertRef: (ref: string) => void;
  onChangeType?: (type: PluginField['type']) => void;
}

const INPUT_TYPE_OPTIONS: { value: PluginField['type']; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
  { value: 'list', label: 'List' },
];

function PluginFieldInput({ field, value, onChange, upstreamNodes, allNodes, apiDefinitions, onInsertRef, onChangeType }: PluginFieldInputProps) {
  const [showRefs, setShowRefs] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1.5">
        <Label className="text-xs flex-1 min-w-0 truncate">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
          <span className="text-muted-foreground font-normal ml-1.5 text-[10px]">{field.name}</span>
        </Label>
        <Select value={field.type} onValueChange={(v) => onChangeType?.(v as PluginField['type'])}>
          <SelectTrigger className="h-7 text-[10px] w-[80px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INPUT_TYPE_OPTIONS.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {upstreamNodes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRefs(!showRefs)}
            className="h-7 px-2 text-[10px] text-primary shrink-0 gap-1"
          >
            {showRefs ? 'Fechar' : '{{ref}}'}
          </Button>
        )}
      </div>

      {field.type === 'json' || field.type === 'text' || field.type === 'list' ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={cn("text-sm min-h-[80px]", field.type === 'json' && "font-mono")}
          autoFormatJson={field.type === 'json'}
        />
      ) : field.type === 'boolean' ? (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Sim</SelectItem>
            <SelectItem value="false">Não</SelectItem>
          </SelectContent>
        </Select>
      ) : field.type === 'number' ? (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="h-9 text-sm font-mono"
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="text-sm font-mono min-h-[36px]"
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
            // Prefer API definition outputs, fallback to static PLUGIN_SCHEMAS
            const apiDef = apiDefinitions.find(d => d.definition_id === nd.definition_id);
            const outputs: { name: string; label: string }[] = apiDef?.outputs
              ? apiDef.outputs.map(o => ({ name: o.name, label: o.label }))
              : (PLUGIN_SCHEMAS[nd.definition_id]?.outputs || []);
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
