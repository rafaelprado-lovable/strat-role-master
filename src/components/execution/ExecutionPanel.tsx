import { useState, useMemo } from 'react';
import { getSkipDetail } from '@/components/execution/ExecutionCanvas';
import type { SelectedEdgeInfo } from '@/components/execution/ExecutionCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Activity, Clock, Copy, Layers, Terminal, Filter,
  Radio, Repeat, AlertTriangle, CheckCircle2, Loader2, Circle, FileJson,
  SkipForward, Ban,
} from 'lucide-react';
import type { ExecutionDTO, ExecutionLogEntry, TaskState, ForEachItemStatus } from '@/types/execution';
import { toast } from 'sonner';

const stateIcons: Record<TaskState, React.ReactNode> = {
  waiting_start: <Circle className="h-3 w-3 text-muted-foreground" />,
  running: <Loader2 className="h-3 w-3 text-primary animate-spin" />,
  finished: <CheckCircle2 className="h-3 w-3 text-chart-2" />,
  error: <AlertTriangle className="h-3 w-3 text-destructive" />,
};

const logTypeColors: Record<string, string> = {
  node_start: 'text-primary',
  node_finish: 'text-chart-2',
  node_error: 'text-destructive',
  loop_iteration: 'text-chart-4',
  loop_reopen: 'text-chart-4',
  for_each_item_start: 'text-chart-5',
  for_each_item_finish: 'text-chart-5',
  for_each_stream_dispatch: 'text-accent',
  execution_start: 'text-primary',
  execution_finish: 'text-chart-2',
  execution_error: 'text-destructive',
};

interface ExecutionPanelProps {
  execution: ExecutionDTO;
  selectedNodeId: string | null;
  onRerunNode?: (nodeId: string) => void;
}

export function ExecutionPanel({ execution, selectedNodeId, onRerunNode }: ExecutionPanelProps) {
  const [logFilter, setLogFilter] = useState('');
  const ctrl = execution.execution_controller;
  const wf = execution.execution_data;

  // Summary stats
  const totalNodes = wf.nodes.length;
  const finishedNodes = Object.values(ctrl.task_states).filter(s => s === 'finished').length;
  const progress = totalNodes > 0 ? (finishedNodes / totalNodes) * 100 : 0;
  const duration = execution.started_at
    ? ((execution.finished_at ? new Date(execution.finished_at).getTime() : Date.now()) - new Date(execution.started_at).getTime())
    : 0;

  // Selected node data
  const selectedNodeData = selectedNodeId ? wf.nodes.find(n => n.id === selectedNodeId) : null;
  const selectedTaskState = selectedNodeId ? ctrl.task_states[selectedNodeId] : undefined;
  const selectedOutput = selectedNodeId ? ctrl.task_outputs[selectedNodeId] : undefined;
  const selectedInputs = selectedNodeId ? wf.inputs[selectedNodeId] : undefined;
  const selectedForEach = selectedNodeId
    ? ctrl.for_each_tracker[selectedNodeId] || ctrl.for_each_stream_tracker[selectedNodeId]
    : undefined;
  const selectedLoopNotBefore = selectedNodeId ? ctrl.loop_not_before[selectedNodeId] : undefined;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!logFilter.trim()) return execution.logs;
    const q = logFilter.toLowerCase();
    return execution.logs.filter(l =>
      (l.node_id && l.node_id.toLowerCase().includes(q)) ||
      (l.edge_id && l.edge_id.toLowerCase().includes(q)) ||
      l.message.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q)
    );
  }, [execution.logs, logFilter]);

  const copyJson = (obj: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    toast.success('JSON copiado');
  };

  const stateLabel: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground' },
    running: { label: 'Executando', color: 'bg-primary/20 text-primary' },
    finished: { label: 'Concluído', color: 'bg-chart-2/20 text-chart-2' },
    error: { label: 'Erro', color: 'bg-destructive/20 text-destructive' },
    stopped: { label: 'Parado', color: 'bg-muted text-muted-foreground' },
  };

  const globalStatus = stateLabel[ctrl.state] || stateLabel.pending;

  return (
    <div className="h-full flex flex-col border border-border rounded-xl bg-card overflow-hidden">
      <Tabs defaultValue="summary" className="flex flex-col h-full">
        <TabsList className="shrink-0 mx-3 mt-3 bg-muted/50">
          <TabsTrigger value="summary" className="gap-1.5 text-xs"><Activity className="h-3 w-3" /> Resumo</TabsTrigger>
          <TabsTrigger value="returns" className="gap-1.5 text-xs"><FileJson className="h-3 w-3" /> Retornos</TabsTrigger>
          <TabsTrigger value="node" className="gap-1.5 text-xs"><Layers className="h-3 w-3" /> Nó</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 text-xs"><Terminal className="h-3 w-3" /> Logs</TabsTrigger>
        </TabsList>

        {/* ─── Summary ─── */}
        <TabsContent value="summary" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado Global</span>
                  <Badge className={`${globalStatus.color} text-[10px] font-bold`}>{globalStatus.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Execution ID" value={ctrl.execution_id} mono />
                  <InfoCard label="Workflow" value={wf.name} />
                  <InfoCard label="Início" value={new Date(execution.started_at).toLocaleString('pt-BR')} />
                  <InfoCard label="Duração" value={`${(duration / 1000).toFixed(1)}s`} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span className="font-mono">{finishedNodes}/{totalNodes} nós</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Task states overview */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nós</span>
                <div className="space-y-1">
                  {wf.nodes.map(n => (
                    <div key={n.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      {stateIcons[ctrl.task_states[n.id] || 'waiting_start']}
                      <span className="text-xs font-mono text-foreground flex-1 truncate">{n.id}</span>
                      <span className="text-[10px] text-muted-foreground">{n.definition_id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loop counters */}
              {Object.keys(ctrl.loop_counters).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-chart-4 uppercase tracking-wider flex items-center gap-1.5">
                    <Repeat className="h-3 w-3" /> Loop Counters
                  </span>
                  {Object.entries(ctrl.loop_counters).map(([edgeId, count]) => (
                    <div key={edgeId} className="flex items-center justify-between p-2 rounded-lg bg-chart-4/5 border border-chart-4/10">
                      <span className="text-xs font-mono text-foreground">{edgeId}</span>
                      <span className="text-xs font-bold text-chart-4">{count} iterações</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Returns ─── */}
        <TabsContent value="returns" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retorno dos Nós</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => copyJson(ctrl.task_outputs)}>
                  <Copy className="h-3 w-3 mr-1" /> Copiar Tudo
                </Button>
              </div>
              {wf.nodes.map(n => {
                const taskState = ctrl.task_states[n.id] || 'waiting_start';
                const output = ctrl.task_outputs[n.id];
                const hasOutput = output?.output && Object.keys(output.output).length > 0;
                const hasError = !!output?.error;
                const isSkipped = hasOutput && output.output.skipped === true;
                const isFinished = taskState === 'finished';
                const isWaiting = taskState === 'waiting_start';
                const isRunning = taskState === 'running';

                // Determine header style based on status
                const headerBg = isSkipped
                  ? 'bg-muted/50 border-b border-muted-foreground/10'
                  : isFinished
                    ? 'bg-chart-2/5 border-b border-chart-2/10'
                    : hasError
                      ? 'bg-destructive/5 border-b border-destructive/10'
                      : 'bg-muted/30';

                return (
                  <div key={n.id} className={`rounded-lg border overflow-hidden ${isSkipped ? 'border-muted-foreground/20 opacity-70' : isFinished ? 'border-chart-2/20' : hasError ? 'border-destructive/20' : 'border-border/30'}`}>
                    {/* Header row 1: icon + name + badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 ${headerBg}`}>
                      {isSkipped ? (
                        <SkipForward className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <span className="shrink-0">{stateIcons[taskState]}</span>
                      )}
                      <span className={`text-xs font-semibold flex-1 min-w-0 truncate ${isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {String((n.config as any)?.label || n.id)}
                      </span>
                      {isSkipped && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-muted text-muted-foreground border-muted-foreground/20 gap-1 shrink-0">
                          <Ban className="h-2 w-2" /> SKIP
                        </Badge>
                      )}
                      {isFinished && !isSkipped && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-chart-2/10 text-chart-2 border-chart-2/20 shrink-0">
                          OK
                        </Badge>
                      )}
                      {isRunning && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 animate-pulse shrink-0">
                          RUN
                        </Badge>
                      )}
                      {hasOutput && (
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => copyJson(output.output)}>
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </div>
                    {/* Header row 2: definition_id */}
                    <div className="px-3 py-1 border-t border-border/10 bg-muted/10">
                      <span className="text-[10px] font-mono text-muted-foreground truncate block">{n.definition_id}</span>
                    </div>
                    {/* Skipped reason */}
                    {isSkipped && output.output.reason && (() => {
                      const detail = getSkipDetail(String(output.output.reason));
                      return (
                        <div className="px-3 py-2.5 bg-muted/20 border-t border-border/10 space-y-1">
                          <div className="flex items-center gap-2">
                            <Ban className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] font-semibold text-foreground">{detail.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">{detail.detail}</p>
                        </div>
                      );
                    })()}
                    {hasError && (
                      <div className="px-3 py-2 bg-destructive/5 border-t border-destructive/10">
                        <pre className="text-[11px] text-destructive font-mono whitespace-pre-wrap">{output.error}</pre>
                      </div>
                    )}
                    {hasOutput && !isSkipped ? (
                      <pre className="text-[11px] font-mono p-3 bg-card/50 overflow-x-auto max-h-60 text-foreground whitespace-pre-wrap border-t border-border/20">
                        {JSON.stringify(output.output, null, 2)}
                      </pre>
                    ) : !isSkipped ? (
                      <div className="px-3 py-2 text-[11px] text-muted-foreground italic border-t border-border/20">
                        {isWaiting ? '⏸ Aguardando execução...' : isRunning ? '⚡ Em execução...' : 'Sem output'}
                      </div>
                    ) : null}
                    {output?.duration_ms !== undefined && (
                      <div className="px-3 py-1 text-[10px] text-muted-foreground font-mono border-t border-border/10 bg-muted/10">
                        ⏱ {output.duration_ms >= 1000 ? `${(output.duration_ms / 1000).toFixed(1)}s` : `${output.duration_ms}ms`}
                      </div>
                    )}
                    {output?.items && output.items.length > 0 && (
                      <div className="px-3 py-2 border-t border-border/10 bg-chart-4/5">
                        <span className="text-[10px] font-semibold text-chart-4 flex items-center gap-1 mb-1">
                          <Repeat className="h-2.5 w-2.5" /> for_each ({output.count} itens)
                        </span>
                        <pre className="text-[11px] font-mono overflow-x-auto max-h-40 text-foreground whitespace-pre-wrap">
                          {JSON.stringify(output.items, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
              {wf.nodes.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Nenhum nó no workflow</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Node Detail ─── */}
        <TabsContent value="node" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {!selectedNodeId ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Layers className="h-8 w-8 mx-auto mb-3 opacity-40" />
                  <p>Selecione um nó no canvas para inspecionar</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{selectedNodeId}</h3>
                      <p className="text-[11px] text-muted-foreground font-mono">{selectedNodeData?.definition_id}</p>
                    </div>
                    <div className="flex gap-1.5">
                      {stateIcons[selectedTaskState || 'waiting_start']}
                      <span className="text-xs capitalize">{selectedTaskState || 'waiting_start'}</span>
                    </div>
                  </div>

                  {onRerunNode && (
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onRerunNode(selectedNodeId)}>
                      Reexecutar nó
                    </Button>
                  )}

                  {/* Inputs */}
                  <JsonSection title="Input Resolvido" data={selectedInputs} onCopy={() => copyJson(selectedInputs)} />

                  {/* Output */}
                  <JsonSection title="Output Real" data={selectedOutput?.output} onCopy={() => copyJson(selectedOutput?.output)} />

                  {/* Error */}
                  {selectedOutput?.error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <span className="text-xs font-semibold text-destructive">Erro</span>
                      <pre className="text-[11px] mt-1 text-destructive/80 whitespace-pre-wrap font-mono">{selectedOutput.error}</pre>
                    </div>
                  )}

                  {/* Duration */}
                  {selectedOutput?.duration_ms !== undefined && (
                    <InfoCard label="Duração" value={`${selectedOutput.duration_ms}ms (${(selectedOutput.duration_ms / 1000).toFixed(2)}s)`} />
                  )}

                  {/* Loop not before */}
                  {selectedLoopNotBefore && (
                    <div className="p-3 rounded-lg bg-chart-4/5 border border-chart-4/10">
                      <span className="text-xs font-semibold text-chart-4 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Próximo disparo
                      </span>
                      <p className="text-xs font-mono mt-1 text-foreground">{new Date(selectedLoopNotBefore).toLocaleString('pt-BR')}</p>
                    </div>
                  )}

                  {/* For each detail */}
                  {selectedForEach && (
                    <ForEachSection tracker={selectedForEach} isStream={'stream' in selectedForEach} />
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Logs ─── */}
        <TabsContent value="logs" className="flex-1 overflow-hidden flex flex-col">
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filtrar por node_id, edge_id, tipo..."
                value={logFilter}
                onChange={e => setLogFilter(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-3 pb-3 space-y-0.5">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">Nenhum log encontrado</p>
              ) : (
                filteredLogs.map((log, i) => <LogEntry key={i} log={log} />)
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ───

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">{label}</span>
      <span className={`text-xs text-foreground block mt-0.5 truncate ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

function JsonSection({ title, data, onCopy }: { title: string; data: unknown; onCopy: () => void }) {
  if (!data) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onCopy}>
          <Copy className="h-3 w-3 mr-1" /> Copiar
        </Button>
      </div>
      <pre className="text-[11px] font-mono p-3 rounded-lg bg-muted/50 border border-border/30 overflow-x-auto max-h-48 text-foreground whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function ForEachSection({ tracker, isStream }: { tracker: any; isStream: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isStream ? <Radio className="h-3.5 w-3.5 text-accent" /> : <Repeat className="h-3.5 w-3.5 text-chart-4" />}
        <span className="text-xs font-semibold text-foreground">
          {isStream ? 'For Each (Stream)' : 'For Each'}
        </span>
        <Badge variant="outline" className="text-[10px] ml-auto">
          {tracker.completed}/{tracker.total}
        </Badge>
      </div>
      <Progress value={(tracker.completed / tracker.total) * 100} className="h-1.5" />
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {(tracker.items as ForEachItemStatus[]).map((item: ForEachItemStatus) => (
          <div key={item.index} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 text-[11px]">
            {stateIcons[item.state]}
            <span className="font-mono text-foreground">[{item.index}]</span>
            <span className="text-muted-foreground truncate flex-1">{JSON.stringify(item.item)}</span>
            {item.state === 'finished' && <CheckCircle2 className="h-3 w-3 text-chart-2 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function LogEntry({ log }: { log: ExecutionLogEntry }) {
  const colorClass = logTypeColors[log.type] || 'text-foreground';
  const time = new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded hover:bg-muted/30 transition-colors group">
      <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5">{time}</span>
      <span className={`text-[10px] font-bold uppercase shrink-0 pt-0.5 min-w-[80px] ${colorClass}`}>
        {log.type.replace(/_/g, ' ')}
      </span>
      <span className="text-[11px] text-foreground flex-1">{log.message}</span>
      {log.node_id && (
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {log.node_id}
        </span>
      )}
    </div>
  );
}
