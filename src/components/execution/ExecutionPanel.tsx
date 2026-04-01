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
  SkipForward, Ban, ChevronDown, ChevronRight,
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
  selectedEdge?: SelectedEdgeInfo | null;
  onRerunNode?: (nodeId: string) => void;
}

export function ExecutionPanel({ execution, selectedNodeId, selectedEdge, onRerunNode }: ExecutionPanelProps) {
  const [logFilter, setLogFilter] = useState('');
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());
  const ctrl = execution.execution_controller;
  const wf = execution.execution_data;

  const totalNodes = wf.nodes.length;
  const finishedNodes = Object.values(ctrl.task_states).filter(s => s === 'finished').length;
  const errorNodes = Object.values(ctrl.task_states).filter(s => s === 'error').length;
  const runningNodes = Object.values(ctrl.task_states).filter(s => s === 'running').length;
  const progress = totalNodes > 0 ? (finishedNodes / totalNodes) * 100 : 0;
  const duration = execution.started_at
    ? ((execution.finished_at ? new Date(execution.finished_at).getTime() : Date.now()) - new Date(execution.started_at).getTime())
    : 0;

  const selectedNodeData = selectedNodeId ? wf.nodes.find(n => n.id === selectedNodeId) : null;
  const selectedTaskState = selectedNodeId ? ctrl.task_states[selectedNodeId] : undefined;
  const selectedOutput = selectedNodeId ? ctrl.task_outputs[selectedNodeId] : undefined;
  const selectedInputs = selectedNodeId ? wf.inputs[selectedNodeId] : undefined;
  const selectedForEach = selectedNodeId
    ? ctrl.for_each_tracker[selectedNodeId] || ctrl.for_each_stream_tracker[selectedNodeId]
    : undefined;
  const selectedLoopNotBefore = selectedNodeId ? ctrl.loop_not_before[selectedNodeId] : undefined;

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

  const toggleOutput = (nodeId: string) => {
    setExpandedOutputs(prev => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const stateLabel: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Pendente', color: 'bg-muted text-muted-foreground border-border', icon: <Circle className="h-3.5 w-3.5" /> },
    running: { label: 'Executando', color: 'bg-primary/10 text-primary border-primary/20', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    finished: { label: 'Concluído', color: 'bg-chart-2/10 text-chart-2 border-chart-2/20', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    success: { label: 'Sucesso', color: 'bg-chart-2/10 text-chart-2 border-chart-2/20', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    error: { label: 'Erro', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    stopped: { label: 'Parado', color: 'bg-muted text-muted-foreground border-border', icon: <Ban className="h-3.5 w-3.5" /> },
  };

  const globalStatus = stateLabel[ctrl.state] || stateLabel.pending;

  return (
    <div className="h-full flex flex-col border border-border rounded-xl bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
      <Tabs defaultValue="summary" className="flex flex-col h-full">
        <div className="shrink-0 px-2 pt-2 md:px-3 md:pt-3">
          <TabsList className="w-full bg-muted/40 p-0.5 h-auto">
            <TabsTrigger value="summary" className="gap-1 text-[10px] md:text-xs flex-1 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Activity className="h-3 w-3" /> <span className="hidden sm:inline">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="returns" className="gap-1 text-[10px] md:text-xs flex-1 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileJson className="h-3 w-3" /> <span className="hidden sm:inline">Retornos</span>
            </TabsTrigger>
            <TabsTrigger value="node" className="gap-1 text-[10px] md:text-xs flex-1 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layers className="h-3 w-3" /> <span className="hidden sm:inline">Nó</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1 text-[10px] md:text-xs flex-1 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Terminal className="h-3 w-3" /> <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── Summary ─── */}
        <TabsContent value="summary" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 md:p-4 space-y-4">
              {/* Global state card */}
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${globalStatus.color}`}>
                {globalStatus.icon}
                <div className="flex-1 min-w-0">
                  <span className="text-xs md:text-sm font-bold">{globalStatus.label}</span>
                  <span className="text-[10px] font-mono opacity-70 block truncate">{ctrl.execution_id}</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <InfoCard icon={<Clock className="h-3 w-3 text-muted-foreground" />} label="Duração" value={`${(duration / 1000).toFixed(1)}s`} />
                <InfoCard icon={<Activity className="h-3 w-3 text-muted-foreground" />} label="Progresso" value={`${finishedNodes}/${totalNodes}`} />
                <InfoCard icon={<CheckCircle2 className="h-3 w-3 text-chart-2" />} label="Concluídos" value={String(finishedNodes)} highlight="success" />
                <InfoCard
                  icon={errorNodes > 0 ? <AlertTriangle className="h-3 w-3 text-destructive" /> : <Loader2 className="h-3 w-3 text-primary" />}
                  label={errorNodes > 0 ? "Erros" : "Em execução"}
                  value={String(errorNodes > 0 ? errorNodes : runningNodes)}
                  highlight={errorNodes > 0 ? "error" : runningNodes > 0 ? "running" : undefined}
                />
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <Progress value={progress} className="h-2" />
                <p className="text-[10px] text-muted-foreground text-right">{Math.round(progress)}% completo</p>
              </div>

              {/* Nodes list */}
              <div className="space-y-1">
                <SectionLabel>Nós</SectionLabel>
                <div className="space-y-0.5">
                  {wf.nodes.map(n => {
                    const st = ctrl.task_states[n.id] || 'waiting_start';
                    const isSkipped = ctrl.task_outputs[n.id]?.output?.skipped === true;
                    return (
                      <div key={n.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        {isSkipped ? <SkipForward className="h-3 w-3 text-muted-foreground shrink-0" /> : stateIcons[st]}
                        <span className={`text-[11px] font-mono flex-1 truncate ${isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {String((n.config as any)?.label || n.id)}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono shrink-0">{n.definition_id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Loop counters */}
              {Object.keys(ctrl.loop_counters).length > 0 && (
                <div className="space-y-1">
                  <SectionLabel className="text-chart-4"><Repeat className="h-3 w-3 inline mr-1" />Loops</SectionLabel>
                  {Object.entries(ctrl.loop_counters).map(([edgeId, count]) => (
                    <div key={edgeId} className="flex items-center justify-between p-2 rounded-lg bg-chart-4/5 border border-chart-4/10">
                      <span className="text-[11px] font-mono text-foreground truncate">{edgeId}</span>
                      <Badge variant="outline" className="text-[9px] border-chart-4/20 text-chart-4">{count}x</Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-1">
                <SectionLabel>Tempos</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoCard label="Início" value={new Date(execution.started_at).toLocaleString('pt-BR')} />
                  {execution.finished_at && (
                    <InfoCard label="Fim" value={new Date(execution.finished_at).toLocaleString('pt-BR')} />
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Returns ─── */}
        <TabsContent value="returns" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 md:p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <SectionLabel>Retorno dos Nós</SectionLabel>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={() => copyJson(ctrl.task_outputs)}>
                  <Copy className="h-2.5 w-2.5" /> Tudo
                </Button>
              </div>
              {wf.nodes.map(n => {
                const taskState = ctrl.task_states[n.id] || 'waiting_start';
                const output = ctrl.task_outputs[n.id];
                const hasOutput = output?.output && Object.keys(output.output).length > 0;
                const hasError = !!output?.error;
                const isSkipped = hasOutput && output.output.skipped === true;
                const isFinished = taskState === 'finished';
                const isRunning = taskState === 'running';
                const isExpanded = expandedOutputs.has(n.id);

                const statusColor = isSkipped
                  ? 'border-muted-foreground/15'
                  : isFinished ? 'border-chart-2/20'
                  : hasError ? 'border-destructive/20'
                  : 'border-border/30';

                return (
                  <div key={n.id} className={`rounded-lg border overflow-hidden ${statusColor} transition-colors`}>
                    {/* Clickable header */}
                    <button
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors ${
                        isSkipped ? 'bg-muted/20' : isFinished ? 'bg-chart-2/5' : hasError ? 'bg-destructive/5' : 'bg-muted/10'
                      }`}
                      onClick={() => toggleOutput(n.id)}
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      {isSkipped ? (
                        <SkipForward className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <span className="shrink-0">{stateIcons[taskState]}</span>
                      )}
                      <span className={`text-[11px] md:text-xs font-semibold flex-1 min-w-0 truncate ${isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {String((n.config as any)?.label || n.id)}
                      </span>
                      {isSkipped && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-muted text-muted-foreground border-muted-foreground/20 shrink-0">SKIP</Badge>
                      )}
                      {isFinished && !isSkipped && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-chart-2/10 text-chart-2 border-chart-2/20 shrink-0">OK</Badge>
                      )}
                      {isRunning && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-primary/20 animate-pulse shrink-0">RUN</Badge>
                      )}
                      {hasOutput && (
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={(e) => { e.stopPropagation(); copyJson(output.output); }}>
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      )}
                    </button>

                    {/* Expandable content */}
                    {isExpanded && (
                      <div className="border-t border-border/20">
                        {/* Definition */}
                        <div className="px-3 py-1 bg-muted/5">
                          <span className="text-[9px] md:text-[10px] font-mono text-muted-foreground truncate block">{n.definition_id}</span>
                        </div>

                        {/* Skipped reason */}
                        {isSkipped && output.output.reason && (() => {
                          const detail = getSkipDetail(String(output.output.reason));
                          return (
                            <div className="px-3 py-2 bg-muted/10 border-t border-border/10 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <Ban className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-[10px] md:text-[11px] font-semibold text-foreground">{detail.label}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed pl-[18px]">{detail.detail}</p>
                            </div>
                          );
                        })()}

                        {/* Error */}
                        {hasError && (
                          <div className="px-3 py-2 bg-destructive/5 border-t border-destructive/10">
                            <pre className="text-[10px] md:text-[11px] text-destructive font-mono whitespace-pre-wrap break-all">{output.error}</pre>
                          </div>
                        )}

                        {/* Output JSON */}
                        {hasOutput && !isSkipped ? (
                          <pre className="text-[10px] md:text-[11px] font-mono p-3 bg-card/50 overflow-x-auto max-h-52 text-foreground whitespace-pre-wrap break-all border-t border-border/10">
                            {JSON.stringify(output.output, null, 2)}
                          </pre>
                        ) : !isSkipped ? (
                          <div className="px-3 py-2 text-[10px] md:text-[11px] text-muted-foreground italic border-t border-border/10">
                            {taskState === 'waiting_start' ? '⏸ Aguardando...' : isRunning ? '⚡ Executando...' : 'Sem output'}
                          </div>
                        ) : null}

                        {/* Duration */}
                        {output?.duration_ms !== undefined && (
                          <div className="px-3 py-1 text-[9px] md:text-[10px] text-muted-foreground font-mono border-t border-border/10 bg-muted/5 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {output.duration_ms >= 1000 ? `${(output.duration_ms / 1000).toFixed(1)}s` : `${output.duration_ms}ms`}
                          </div>
                        )}

                        {/* For each items */}
                        {output?.items && output.items.length > 0 && (
                          <div className="px-3 py-2 border-t border-border/10 bg-chart-4/5">
                            <span className="text-[9px] md:text-[10px] font-semibold text-chart-4 flex items-center gap-1 mb-1">
                              <Repeat className="h-2.5 w-2.5" /> for_each ({output.count} itens)
                            </span>
                            <pre className="text-[10px] md:text-[11px] font-mono overflow-x-auto max-h-32 text-foreground whitespace-pre-wrap break-all">
                              {JSON.stringify(output.items, null, 2)}
                            </pre>
                          </div>
                        )}
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
        <TabsContent value="node" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-3 md:p-4 space-y-4">
              {selectedEdge ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-chart-2/10">
                      <Filter className="h-3.5 w-3.5 text-chart-2" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs md:text-sm text-foreground">Condição da Aresta</h3>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{selectedEdge.edgeId}</p>
                    </div>
                  </div>

                  {/* Condition expression */}
                  <div className="p-3 rounded-lg bg-chart-2/5 border border-chart-2/20">
                    <span className="text-[9px] md:text-[10px] font-semibold text-chart-2 uppercase tracking-wider block mb-1">Expressão IF</span>
                    <pre className="text-[11px] md:text-xs font-mono text-foreground whitespace-pre-wrap break-all">{selectedEdge.condition}</pre>
                  </div>

                  {/* Source → Target */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider block">Origem</span>
                      <span className="text-[10px] md:text-xs font-mono text-foreground block mt-0.5 truncate">{selectedEdge.sourceNodeId}</span>
                      <span className="text-[9px] capitalize text-muted-foreground">{selectedEdge.sourceState}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wider block">Destino</span>
                      <span className="text-[10px] md:text-xs font-mono text-foreground block mt-0.5 truncate">{selectedEdge.targetNodeId}</span>
                      <span className="text-[9px] capitalize text-muted-foreground">{selectedEdge.targetState}</span>
                    </div>
                  </div>

                  {/* Evaluation result */}
                  <div className="p-3 rounded-lg border border-border/30 bg-muted/10 space-y-2">
                    <span className="text-[9px] md:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Resultado</span>
                    {selectedEdge.targetState === 'waiting_start' && selectedEdge.sourceState === 'finished' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Ban className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-[11px] md:text-xs text-destructive font-semibold">Condição NÃO atendida</span>
                        </div>
                        <ConditionExplanation condition={selectedEdge.condition} sourceOutput={selectedEdge.sourceOutput} />
                      </>
                    ) : selectedEdge.targetState !== 'waiting_start' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                          <span className="text-[11px] md:text-xs text-chart-2 font-semibold">Condição atendida</span>
                        </div>
                        <ConditionExplanation condition={selectedEdge.condition} sourceOutput={selectedEdge.sourceOutput} met />
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[11px] md:text-xs text-muted-foreground">Aguardando avaliação</span>
                      </div>
                    )}
                  </div>

                  {/* Loop info */}
                  {selectedEdge.isLoop && (
                    <div className="p-3 rounded-lg bg-chart-4/5 border border-chart-4/10">
                      <span className="text-[9px] md:text-[10px] font-semibold text-chart-4 uppercase tracking-wider flex items-center gap-1">
                        <Repeat className="h-3 w-3" /> Loop
                      </span>
                      <div className="mt-1 text-[11px] md:text-xs text-foreground font-mono">
                        Iteração: {selectedEdge.loopCounter ?? 0} / {selectedEdge.maxIterations ?? '∞'}
                      </div>
                    </div>
                  )}

                  <JsonSection
                    title={`Output de "${selectedEdge.sourceNodeId}"`}
                    data={selectedEdge.sourceOutput}
                    onCopy={() => copyJson(selectedEdge.sourceOutput)}
                  />
                </div>
              ) : !selectedNodeId ? (
                <div className="text-center py-10 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                    <Layers className="h-5 w-5 opacity-40" />
                  </div>
                  <p className="text-xs md:text-sm">Selecione um nó ou aresta no canvas</p>
                </div>
              ) : (
                <>
                  {/* Node header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs md:text-sm text-foreground truncate">{String((selectedNodeData?.config as any)?.label || selectedNodeId)}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{selectedNodeData?.definition_id}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md bg-muted/30 border border-border/30">
                      {stateIcons[selectedTaskState || 'waiting_start']}
                      <span className="text-[10px] md:text-xs capitalize font-medium">{selectedTaskState || 'waiting_start'}</span>
                    </div>
                  </div>


                  <JsonSection title="Input Resolvido" data={selectedInputs} onCopy={() => copyJson(selectedInputs)} />
                  <JsonSection title="Output Real" data={selectedOutput?.output} onCopy={() => copyJson(selectedOutput?.output)} />

                  {selectedOutput?.error && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <span className="text-[10px] md:text-xs font-semibold text-destructive">Erro</span>
                      <pre className="text-[10px] md:text-[11px] mt-1 text-destructive/80 whitespace-pre-wrap break-all font-mono">{selectedOutput.error}</pre>
                    </div>
                  )}

                  {selectedOutput?.duration_ms !== undefined && (
                    <InfoCard icon={<Clock className="h-3 w-3 text-muted-foreground" />} label="Duração" value={`${selectedOutput.duration_ms}ms (${(selectedOutput.duration_ms / 1000).toFixed(2)}s)`} />
                  )}

                  {selectedLoopNotBefore && (
                    <div className="p-3 rounded-lg bg-chart-4/5 border border-chart-4/10">
                      <span className="text-[10px] md:text-xs font-semibold text-chart-4 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Próximo disparo
                      </span>
                      <p className="text-[10px] md:text-xs font-mono mt-1 text-foreground">{new Date(selectedLoopNotBefore).toLocaleString('pt-BR')}</p>
                    </div>
                  )}

                  {selectedForEach && (
                    <ForEachSection tracker={selectedForEach} isStream={'stream' in selectedForEach} />
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ─── Logs ─── */}
        <TabsContent value="logs" className="flex-1 overflow-hidden flex flex-col mt-0">
          <div className="px-3 pt-2 pb-1.5 shrink-0">
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Filtrar logs..."
                value={logFilter}
                onChange={e => setLogFilter(e.target.value)}
                className="pl-7 h-7 text-[11px] md:text-xs"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="px-2 md:px-3 pb-3 space-y-px">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-[11px] md:text-xs text-muted-foreground py-8">Nenhum log encontrado</p>
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

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center ${className}`}>
      {children}
    </span>
  );
}

function InfoCard({ label, value, mono, icon, highlight }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode; highlight?: 'success' | 'error' | 'running' }) {
  const highlightClass = highlight === 'success'
    ? 'border-chart-2/15 bg-chart-2/5'
    : highlight === 'error'
      ? 'border-destructive/15 bg-destructive/5'
      : highlight === 'running'
        ? 'border-primary/15 bg-primary/5'
        : 'border-border/30 bg-muted/20';

  return (
    <div className={`p-2 md:p-2.5 rounded-lg border ${highlightClass}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-[11px] md:text-xs text-foreground block mt-0.5 truncate ${mono ? 'font-mono' : 'font-semibold'}`}>{value}</span>
    </div>
  );
}

function JsonSection({ title, data, onCopy }: { title: string; data: unknown; onCopy: () => void }) {
  if (!data) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs font-semibold text-muted-foreground">{title}</span>
        <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] md:text-[10px] gap-1" onClick={onCopy}>
          <Copy className="h-2.5 w-2.5" /> Copiar
        </Button>
      </div>
      <pre className="text-[10px] md:text-[11px] font-mono p-2 md:p-3 rounded-lg bg-muted/30 border border-border/20 overflow-x-auto max-h-44 text-foreground whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function resolveTemplateValue(template: string, sourceOutput: any): string {
  if (!template || !sourceOutput) return String(template);
  const match = template.match(/^\{\{(.+?)\}\}$/);
  if (!match) return String(template);
  const parts = match[1].split('.');
  const outputIdx = parts.indexOf('output');
  if (outputIdx === -1) return String(template);
  const fieldParts = parts.slice(outputIdx + 1);
  let val: any = sourceOutput?.output ?? sourceOutput;
  for (const p of fieldParts) {
    if (val == null) return 'undefined';
    val = val[p];
  }
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function ConditionExplanation({ condition, sourceOutput, met }: { condition: string; sourceOutput?: any; met?: boolean }) {
  const ops = ['!=', '==', '>=', '<=', '>', '<'];
  let operator = '';
  let leftRaw = '';
  let rightRaw = '';
  for (const op of ops) {
    const idx = condition.indexOf(op);
    if (idx !== -1) {
      operator = op;
      leftRaw = condition.substring(0, idx).trim();
      rightRaw = condition.substring(idx + op.length).trim();
      break;
    }
  }
  if (!operator) {
    return (
      <p className="text-[10px] md:text-[11px] text-muted-foreground italic pl-5">
        Não foi possível interpretar a expressão.
      </p>
    );
  }

  const leftResolved = resolveTemplateValue(leftRaw, sourceOutput);
  const rightResolved = resolveTemplateValue(rightRaw, sourceOutput);
  const borderColor = met ? 'border-chart-2/20 bg-chart-2/5' : 'border-destructive/20 bg-destructive/5';
  const textColor = met ? 'text-chart-2' : 'text-destructive';

  return (
    <div className={`rounded-lg border p-2 md:p-2.5 space-y-1 ${borderColor}`}>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5 md:gap-2 items-center text-[10px] md:text-[11px]">
        <div className="space-y-0.5 min-w-0">
          <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-muted-foreground block">Esquerdo</span>
          <code className="text-[10px] font-mono text-foreground block truncate">{leftRaw}</code>
          <span className={`text-[10px] font-bold font-mono block truncate ${textColor}`}>{leftResolved}</span>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-muted-foreground px-0.5">{operator}</span>
        <div className="space-y-0.5 min-w-0">
          <span className="text-[8px] md:text-[9px] uppercase tracking-wider text-muted-foreground block">Direito</span>
          <code className="text-[10px] font-mono text-foreground block truncate">{rightRaw}</code>
          <span className={`text-[10px] font-bold font-mono block truncate ${textColor}`}>{rightResolved}</span>
        </div>
      </div>
      <p className="text-[9px] md:text-[10px] text-muted-foreground">
        {met
          ? `✅ "${leftResolved}" ${operator === '==' ? 'é igual a' : operator === '!=' ? 'é diferente de' : operator} "${rightResolved}"`
          : `❌ "${leftResolved}" ${operator === '==' ? '≠' : operator === '!=' ? '=' : `não satisfaz ${operator}`} "${rightResolved}"`
        }
      </p>
    </div>
  );
}

function ForEachSection({ tracker, isStream }: { tracker: any; isStream: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isStream ? <Radio className="h-3.5 w-3.5 text-accent" /> : <Repeat className="h-3.5 w-3.5 text-chart-4" />}
        <span className="text-[11px] md:text-xs font-semibold text-foreground">
          {isStream ? 'For Each (Stream)' : 'For Each'}
        </span>
        <Badge variant="outline" className="text-[9px] ml-auto">
          {tracker.completed}/{tracker.total}
        </Badge>
      </div>
      <Progress value={(tracker.completed / tracker.total) * 100} className="h-1.5" />
      <div className="space-y-0.5 max-h-36 overflow-y-auto">
        {(tracker.items as ForEachItemStatus[]).map((item: ForEachItemStatus) => (
          <div key={item.index} className="flex items-center gap-2 p-1.5 rounded bg-muted/20 text-[10px] md:text-[11px]">
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
    <div className="flex items-start gap-1.5 md:gap-2 py-1.5 px-1.5 md:px-2 rounded hover:bg-muted/20 transition-colors group">
      <span className="text-[9px] md:text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5">{time}</span>
      <span className={`text-[9px] md:text-[10px] font-bold uppercase shrink-0 pt-0.5 min-w-[60px] md:min-w-[80px] ${colorClass}`}>
        {log.type.replace(/_/g, ' ')}
      </span>
      <span className="text-[10px] md:text-[11px] text-foreground flex-1 break-all">{log.message}</span>
      {log.node_id && (
        <span className="text-[9px] font-mono text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
          {log.node_id}
        </span>
      )}
    </div>
  );
}
