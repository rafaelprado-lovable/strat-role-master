import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, BackgroundVariant, Panel,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Terminal, MessageCircle, Globe, AlertTriangle, Timer, Repeat, Zap, Radio, SkipForward, Ban, CheckCircle2 } from 'lucide-react';
import type { TaskState, ExecutionController } from '@/types/execution';

export const skipReasonDetails: Record<string, { label: string; detail: string }> = {
  edge_condition_not_met: {
    label: 'Condição não atendida',
    detail: 'A condição da aresta de entrada não foi satisfeita com os dados do nó anterior.',
  },
  upstream_skipped: {
    label: 'Nó anterior skipado',
    detail: 'Um ou mais nós predecessores foram skipados, impedindo a execução deste nó.',
  },
  upstream_error: {
    label: 'Erro no nó anterior',
    detail: 'Um nó predecessor finalizou com erro, cancelando a cadeia de execução.',
  },
  no_data: {
    label: 'Sem dados de entrada',
    detail: 'Os dados necessários para executar este nó estavam vazios ou indisponíveis.',
  },
  for_each_empty: {
    label: 'Lista vazia no for_each',
    detail: 'A lista de itens do for_each estava vazia, não havendo itens para iterar.',
  },
  timeout: {
    label: 'Timeout excedido',
    detail: 'O tempo máximo de espera foi atingido antes de receber uma resposta.',
  },
};

export function getSkipDetail(reason: string): { label: string; detail: string } {
  return skipReasonDetails[reason] || {
    label: reason.replace(/_/g, ' '),
    detail: `Motivo reportado pelo motor de execução: "${reason.replace(/_/g, ' ')}"`,
  };
}

// ─── Execution Node ───
const iconMap: Record<string, React.ElementType> = {
  ssh_execution: Terminal,
  send_whatsapp_message_v1: MessageCircle,
  api_call_v1: Globe,
  get_specific_incident_v1: AlertTriangle,
  delay_v1: Timer,
};

const stateStyles: Record<string, { border: string; bg: string; pulse?: boolean; label: string; dot: string; iconBg: string }> = {
  waiting_start: { border: '220 10% 50%', bg: 'bg-muted/40', label: 'Aguardando', dot: 'bg-muted-foreground', iconBg: 'hsl(220 10% 50% / 0.15)' },
  running: { border: 'var(--primary)', bg: 'bg-primary/10', pulse: true, label: 'Executando', dot: 'bg-primary', iconBg: 'hsl(var(--primary) / 0.15)' },
  finished: { border: 'var(--chart-2)', bg: 'bg-chart-2/10', label: 'Concluído', dot: 'bg-chart-2', iconBg: 'hsl(var(--chart-2) / 0.15)' },
  error: { border: 'var(--destructive)', bg: 'bg-destructive/10', label: 'Erro', dot: 'bg-destructive', iconBg: 'hsl(var(--destructive) / 0.15)' },
  failed: { border: 'var(--destructive)', bg: 'bg-destructive/10', label: 'Falhou', dot: 'bg-destructive', iconBg: 'hsl(var(--destructive) / 0.15)' },
};

// Color map matching TaskNode for consistency
const colorMap: Record<string, string> = {
  ssh_execution: '270 75% 60%',
  send_whatsapp_message_v1: '142 70% 45%',
  api_call_v1: '190 100% 45%',
  get_specific_incident_v1: '35 95% 55%',
  delay_v1: '210 100% 50%',
  llm_analyse_v1: '280 80% 55%',
  condition_v1: '160 60% 45%',
  switch_v1: '160 60% 45%',
  filter_v1: '160 60% 45%',
};
const defaultHsl = '220 10% 50%';

function ExecutionNodeComponent({ data, selected }: NodeProps) {
  const d = data as any;
  const Icon = iconMap[d.definition_id] || Globe;
  const state: TaskState = d.taskState || 'waiting_start';
  const isSkipped = !!d.isSkipped;
  const skipReason = d.skipReason;
  const s = stateStyles[state] || stateStyles.waiting_start;
  const hsl = colorMap[d.definition_id] || defaultHsl;
  const hasForEach = d.hasForEach;
  const hasStream = d.hasStream;
  const hasLoop = d.hasLoop;
  const forEachProgress = d.forEachProgress;
  const loopCount = d.loopCount;
  const duration = d.duration_ms;

  // Track previous state for transition animations
  const prevStateRef = useRef<TaskState>(state);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (prevStateRef.current !== state) {
      const prev = prevStateRef.current;
      prevStateRef.current = state;

      if (state === 'running') {
        setAnimClass('exec-node-enter-running');
      } else if (state === 'finished' && (prev === 'running')) {
        setAnimClass('exec-node-enter-finished');
      } else if (state === 'error') {
        setAnimClass('exec-node-enter-error');
      } else {
        setAnimClass('');
      }

      // Clear animation class after it plays
      const timer = setTimeout(() => setAnimClass(''), 700);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Border color based on state
  const borderColor = isSkipped
    ? 'hsl(var(--muted-foreground) / 0.25)'
    : state === 'waiting_start'
      ? `hsl(${hsl} / 0.4)`
      : `hsl(${s.border})`;

  // Glow shadow for running/finished states
  const glowShadow = state === 'running'
    ? `0 0 16px hsl(var(--primary) / 0.4), 0 0 6px hsl(var(--primary) / 0.2)`
    : state === 'finished'
      ? `0 0 12px hsl(var(--chart-2) / 0.3)`
      : state === 'error'
        ? `0 0 12px hsl(var(--destructive) / 0.3)`
        : undefined;

  return (
    <div
      className={`relative flex flex-col items-center gap-1 w-[90px] group/node ${animClass}`}
    >
      {/* Left (target) handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !border-2 !border-background !-left-1 !top-[30px]"
        style={{ background: `hsl(${hsl})` }}
      />

      {/* Main icon box */}
      <div
        className={`
          relative w-[56px] h-[56px] rounded-xl flex items-center justify-center
          border-2 transition-all duration-500 ease-out
          bg-card
          ${isSkipped ? 'opacity-50 grayscale' : ''}
          ${selected ? 'ring-2 ring-ring ring-offset-1 ring-offset-background scale-105' : 'group-hover/node:scale-[1.03]'}
        `}
        style={{
          borderColor,
          boxShadow: glowShadow,
        }}
      >
        {/* State indicator */}
        {!isSkipped && (
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
            {state === 'running' && (
              <>
                <div className={`absolute w-4 h-4 rounded-full ${s.dot} animate-ping opacity-40`} />
                <div className={`absolute w-3 h-3 rounded-full ${s.dot} opacity-20 animate-pulse`} />
              </>
            )}
            {state === 'finished' && (
              <div className="relative bg-background rounded-full p-px">
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
              </div>
            )}
            {state === 'error' && (
              <div className="relative bg-background rounded-full p-px">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              </div>
            )}
            {state === 'waiting_start' && (
              <div className={`relative w-2.5 h-2.5 rounded-full ${s.dot} border-2 border-background`} />
            )}
            {state === 'running' && (
              <div className={`relative w-2.5 h-2.5 rounded-full ${s.dot} border-2 border-background`} />
            )}
          </div>
        )}
        {isSkipped && (
          <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
            <Ban className="h-3 w-3 text-muted-foreground" />
          </div>
        )}

        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500"
          style={{ background: isSkipped ? 'hsl(var(--muted) / 0.5)' : `hsl(${hsl} / 0.15)` }}
        >
          <Icon
            size={20}
            strokeWidth={2.4}
            absoluteStrokeWidth
            className={`shrink-0 transition-all duration-300 ${state === 'running' ? 'animate-pulse' : ''}`}
            style={{ color: isSkipped ? 'hsl(var(--muted-foreground))' : `hsl(${hsl})` }}
          />
        </div>
      </div>

      {/* Label */}
      <span className={`text-[10px] font-medium text-center leading-tight max-w-[100px] truncate transition-colors duration-300 ${isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
        {d.label}
      </span>

      {/* State label badge */}
      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full transition-all duration-500 ${isSkipped ? 'bg-muted/80 text-muted-foreground' : s.bg + ' text-foreground'} border border-border/30 uppercase tracking-wider`}>
        {isSkipped ? 'Skip' : s.label}
      </span>

      {/* Feature badges row */}
      {(hasForEach || hasStream || hasLoop) && (
        <div className="flex items-center gap-0.5">
          {hasForEach && (
            <div className="flex items-center gap-0.5 px-1 py-px rounded bg-chart-4/10 border border-chart-4/20">
              <Repeat className="h-2 w-2 text-chart-4" />
              <span className="text-[7px] text-chart-4 font-medium">each</span>
            </div>
          )}
          {hasStream && (
            <div className="flex items-center gap-0.5 px-1 py-px rounded bg-accent/10 border border-accent/20">
              <Radio className="h-2 w-2 text-accent" />
              <span className="text-[7px] text-accent font-medium">stream</span>
            </div>
          )}
          {hasLoop && (
            <div className="flex items-center gap-0.5 px-1 py-px rounded bg-chart-4/10 border border-chart-4/20">
              <Repeat className="h-2 w-2 text-chart-4" />
              <span className="text-[7px] text-chart-4 font-medium">loop</span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar for for_each */}
      {forEachProgress && (
        <div className="w-[80px]">
          <div className="flex justify-between text-[7px] text-muted-foreground mb-0.5">
            <span>{forEachProgress.completed}/{forEachProgress.total}</span>
            <span>{Math.round((forEachProgress.completed / forEachProgress.total) * 100)}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-chart-4 rounded-full transition-all duration-500" style={{ width: `${(forEachProgress.completed / forEachProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Loop counter */}
      {loopCount !== undefined && (
        <span className="text-[7px] text-chart-4 font-mono font-bold">
          iter. {loopCount}
        </span>
      )}

      {/* Duration — fade in */}
      {duration !== undefined && state === 'finished' && (
        <span className="text-[7px] text-muted-foreground font-mono animate-fade-in">
          {duration >= 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`}
        </span>
      )}

      {/* Skip reason tooltip */}
      {isSkipped && skipReason && (() => {
        const detail = getSkipDetail(skipReason);
        return (
          <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 hidden group-hover/node:flex z-50 pointer-events-none">
            <div className="px-3 py-2 rounded-lg bg-popover border border-border shadow-lg max-w-[220px] text-center">
              <div className="text-[10px] font-semibold text-foreground">{detail.label}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{detail.detail}</div>
            </div>
          </div>
        );
      })()}

      {/* Right (source) handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !border-2 !border-background !-right-1 !top-[30px]"
        style={{ background: `hsl(${hsl})` }}
      />

      {/* Loop handles */}
      <Handle type="source" position={Position.Bottom} id="loop-out" className="!bg-chart-4 !w-2 !h-2 !border-2 !border-background" />
      <Handle type="target" position={Position.Top} id="loop-in" className="!bg-chart-4 !w-2 !h-2 !border-2 !border-background" />
    </div>
  );
}

const ExecutionNode = memo(ExecutionNodeComponent);

// ─── Edge Renderer ───
function ExecutionEdgeComponent({
  id, source, target, sourceX, sourceY, targetX, targetY, data, style = {}, markerEnd,
}: any) {
  const edgeData = (data || {}) as Record<string, any>;
  const isLoop = !!edgeData.loop;
  const hasCondition = !!edgeData.condition;
  const isSelfLoop = source === target;
  const loopCount = edgeData.loopCounter;

  const edgeStyle = useMemo(() => {
    const base = { strokeWidth: 2, ...style };
    if (isLoop) return { ...base, stroke: 'hsl(var(--chart-4))', strokeDasharray: '6 3' };
    if (hasCondition) return { ...base, stroke: 'hsl(var(--chart-2))' };
    return { ...base, stroke: 'hsl(var(--primary))' };
  }, [isLoop, hasCondition, style]);

  let path: string;
  if (isSelfLoop) {
    const loopWidth = 60;
    const loopSize = 80;
    path = `M${sourceX},${sourceY} C${sourceX + loopWidth},${sourceY + loopSize} ${targetX + loopWidth},${targetY - loopSize} ${targetX},${targetY}`;
  } else {
    const midX = (sourceX + targetX) / 2;
    path = `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;
  }

  let labelX: number, labelY: number;
  if (isSelfLoop) {
    labelX = Math.max(sourceX, targetX) + 55;
    labelY = (sourceY + targetY) / 2;
  } else {
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2 - 16;
  }

  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* Invisible wider path for hover hit area */}
      <path
        d={path} fill="none" stroke="transparent" strokeWidth={24}
        className="react-flow__edge-interaction"
        style={{ pointerEvents: 'all', cursor: hasCondition ? 'pointer' : 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <path d={path} fill="none" style={edgeStyle} strokeDasharray={isLoop ? '6 3' : undefined} markerEnd={markerEnd} className="react-flow__edge-path" />
      <EdgeLabelRenderer>
        <div
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'none' }}
          className="flex flex-col items-center gap-0.5"
        >
          {isLoop && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-chart-4/20 text-chart-4 border border-chart-4/30">
              LOOP {loopCount !== undefined ? `(${loopCount}/${edgeData.max_iterations || '?'})` : ''}
            </span>
          )}
          {hasCondition && !isLoop && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-chart-2/20 text-chart-2 border border-chart-2/30">
              IF
            </span>
          )}
          {hasCondition && hovered && (
            <span className="text-[9px] font-mono text-muted-foreground max-w-[280px] px-2 py-1 rounded bg-popover border border-border shadow-md whitespace-pre-wrap text-center">
              {edgeData.condition}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const ExecutionEdge = memo(ExecutionEdgeComponent);

// ─── Canvas ───
const nodeTypes = { execution: ExecutionNode };
const edgeTypes = { execution: ExecutionEdge };

export interface SelectedEdgeInfo {
  edgeId: string;
  condition: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: Record<string, unknown> | undefined;
  sourceState: string;
  targetState: string;
  isLoop: boolean;
  maxIterations?: number;
  loopCounter?: number;
}

interface ExecutionCanvasProps {
  workflow: any;
  controller: ExecutionController;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  selectedEdge: SelectedEdgeInfo | null;
  onEdgeSelect: (edge: SelectedEdgeInfo | null) => void;
}

export function ExecutionCanvas({ workflow, controller, selectedNodeId, onNodeSelect, selectedEdge, onEdgeSelect }: ExecutionCanvasProps) {
  const selfLoopNodeIds = new Set(
    workflow.edges?.filter((e: any) => e.from === e.to && e.loop).map((e: any) => e.from) || []
  );

  const nodes: Node[] = useMemo(() =>
    (workflow.nodes || []).map((n: any, i: number) => {
      const taskState = controller.task_states[n.id] || 'waiting_start';
      const output = controller.task_outputs[n.id];
      const isSkipped = output?.output?.skipped === true;
      const feTracker = controller.for_each_tracker[n.id] || controller.for_each_stream_tracker[n.id];
      const isStream = !!controller.for_each_stream_tracker[n.id];
      const loopEdge = workflow.edges?.find((e: any) => e.from === n.id && e.to === n.id && e.loop);
      const loopCount = loopEdge?.id ? controller.loop_counters[loopEdge.id] : undefined;

      return {
        id: n.id,
        type: 'execution',
        position: n.position || { x: i * 300, y: 150 },
        selected: n.id === selectedNodeId,
        data: {
          label: n.config?.label || n.definition_id,
          definition_id: n.definition_id,
          nodeId: n.id,
          taskState,
          isSkipped,
          skipReason: isSkipped ? output?.output?.reason : undefined,
          hasForEach: !!n.for_each,
          hasStream: isStream,
          hasLoop: selfLoopNodeIds.has(n.id),
          forEachProgress: feTracker ? { completed: feTracker.completed, total: feTracker.total } : undefined,
          loopCount,
          duration_ms: output?.duration_ms,
        },
      };
    }),
    [workflow.nodes, controller, selectedNodeId, selfLoopNodeIds]
  );

  const edges: Edge[] = useMemo(() =>
    (workflow.edges || []).map((e: any, i: number) => {
      const isSelfLoop = e.from === e.to;
      return {
        id: e.id || `e-${i}`,
        source: e.from,
        target: e.to,
        sourceHandle: isSelfLoop ? 'loop-out' : 'right',
        targetHandle: isSelfLoop ? 'loop-in' : 'left',
        type: 'execution',
        data: {
          condition: e.condition || '',
          loop: e.loop || false,
          max_iterations: e.max_iterations,
          reopen_tasks: e.reopen_tasks,
          loopCounter: e.id ? controller.loop_counters[e.id] : undefined,
        },
      };
    }),
    [workflow.edges, controller]
  );

  const handleEdgeClick = useCallback((_: any, edge: Edge) => {
    const edgeData = (edge.data || {}) as Record<string, any>;
    if (!edgeData.condition) return;
    const sourceOutput = controller.task_outputs[edge.source]?.output;
    onEdgeSelect({
      edgeId: edge.id,
      condition: edgeData.condition,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      sourceOutput,
      sourceState: controller.task_states[edge.source] || 'waiting_start',
      targetState: controller.task_states[edge.target] || 'waiting_start',
      isLoop: !!edgeData.loop,
      maxIterations: edgeData.max_iterations,
      loopCounter: edgeData.loopCounter,
    });
  }, [controller, onEdgeSelect]);

  return (
    <div className="h-full w-full rounded-xl border border-border overflow-hidden bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => { onEdgeSelect(null); onNodeSelect(node.id); }}
        onEdgeClick={handleEdgeClick}
        onPaneClick={() => { onNodeSelect(null); onEdgeSelect(null); }}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        className="bg-background"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-muted/10" />
        <Controls className="!bg-card !border-border !shadow-sm" />
        <MiniMap className="!bg-card !border-border" nodeColor={(n) => {
          const state = (n.data as any)?.taskState;
          if (state === 'running') return 'hsl(var(--primary))';
          if (state === 'finished') return 'hsl(var(--chart-2))';
          if (state === 'error') return 'hsl(var(--destructive))';
          return 'hsl(var(--muted-foreground))';
        }} maskColor="hsl(var(--muted) / 0.5)" />
        {nodes.length === 0 && (
          <Panel position="top-center">
            <div className="bg-card border border-border rounded-lg px-6 py-4 text-center mt-20 shadow-sm">
              <p className="text-muted-foreground text-sm">Nenhum nó no workflow</p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
