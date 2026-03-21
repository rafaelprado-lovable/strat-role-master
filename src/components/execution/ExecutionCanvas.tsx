import { useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, BackgroundVariant, Panel,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Terminal, MessageCircle, Globe, AlertTriangle, Timer, Repeat, Zap, Radio, SkipForward, Ban } from 'lucide-react';
import type { TaskState, ExecutionController } from '@/types/execution';

// ─── Execution Node ───
const iconMap: Record<string, React.ElementType> = {
  ssh_execution: Terminal,
  send_whatsapp_message_v1: MessageCircle,
  api_call_v1: Globe,
  get_specific_incident_v1: AlertTriangle,
  delay_v1: Timer,
};

const stateStyles: Record<TaskState, { ring: string; bg: string; pulse?: boolean; label: string; dot: string }> = {
  waiting_start: { ring: 'ring-muted-foreground/30', bg: 'bg-muted/40', label: 'Aguardando', dot: 'bg-muted-foreground' },
  running: { ring: 'ring-primary', bg: 'bg-primary/10', pulse: true, label: 'Executando', dot: 'bg-primary' },
  finished: { ring: 'ring-chart-2', bg: 'bg-chart-2/10', label: 'Concluído', dot: 'bg-chart-2' },
  error: { ring: 'ring-destructive', bg: 'bg-destructive/10', label: 'Erro', dot: 'bg-destructive' },
};

// Using chart-2 for green/success since that's available

function ExecutionNodeComponent({ data, selected }: NodeProps) {
  const d = data as any;
  const Icon = iconMap[d.definition_id] || Globe;
  const state: TaskState = d.taskState || 'waiting_start';
  const isSkipped = !!d.isSkipped;
  const skipReason = d.skipReason;
  const s = stateStyles[state];
  const hasForEach = d.hasForEach;
  const hasStream = d.hasStream;
  const hasLoop = d.hasLoop;
  const forEachProgress = d.forEachProgress;
  const loopCount = d.loopCount;
  const duration = d.duration_ms;

  return (
    <div
      className={`
        rounded-xl px-4 py-3 min-w-[200px] max-w-[260px] border-2 relative backdrop-blur-sm shadow-sm
        ring-2 transition-all duration-300 group/node
        ${isSkipped ? 'ring-muted-foreground/20 bg-muted/30 border-muted-foreground/20 opacity-60' : `${s.ring} ${s.bg} border-border/50`}
        ${!isSkipped && s.pulse ? 'animate-pulse' : ''}
        ${selected ? 'ring-offset-2 ring-offset-background shadow-lg scale-[1.02]' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} id="left" className="!bg-primary !w-3 !h-3 !border-2 !border-background !-left-1.5" />
      <Handle type="source" position={Position.Bottom} id="loop-out" className="!bg-chart-4 !w-2.5 !h-2.5 !border-2 !border-background" />
      <Handle type="target" position={Position.Top} id="loop-in" className="!bg-chart-4 !w-2.5 !h-2.5 !border-2 !border-background" />

      {/* State dot / Skipped indicator */}
      {isSkipped ? (
        <div className="absolute top-2 right-2">
          <Ban className="h-3 w-3 text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${s.dot} ${s.pulse ? 'animate-ping' : ''}`} />
          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${s.dot}`} />
        </>
      )}

      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-card/80 shrink-0">
          <Icon className="h-3.5 w-3.5 text-foreground" />
        </div>
        <div className="min-w-0">
          <span className={`font-semibold text-sm truncate block ${isSkipped ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{d.label}</span>
          <span className="text-[10px] text-muted-foreground font-mono block">{d.nodeId}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${isSkipped ? 'bg-muted/60 text-muted-foreground' : s.bg + ' text-foreground'} border border-border/30`}>
          {isSkipped ? '⏭ Skipado' : s.label}
        </span>
        {hasForEach && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-chart-4/10 text-chart-4 border border-chart-4/20 flex items-center gap-1">
            <Repeat className="h-2.5 w-2.5" /> for_each
          </span>
        )}
        {hasStream && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 flex items-center gap-1">
            <Radio className="h-2.5 w-2.5" /> STREAM
          </span>
        )}
        {hasLoop && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-chart-4/10 text-chart-4 border border-chart-4/20 flex items-center gap-1">
            <Repeat className="h-2.5 w-2.5" /> while
          </span>
        )}
      </div>

      {/* Progress for for_each */}
      {forEachProgress && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>{forEachProgress.completed}/{forEachProgress.total} itens</span>
            <span>{Math.round((forEachProgress.completed / forEachProgress.total) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-chart-4 rounded-full transition-all duration-500" style={{ width: `${(forEachProgress.completed / forEachProgress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Loop counter */}
      {loopCount !== undefined && (
        <div className="mt-1.5 text-[10px] text-chart-4 font-mono">
          🔄 Iteração {loopCount}
        </div>
      )}

      {/* Duration */}
      {duration !== undefined && state === 'finished' && (
        <div className="mt-1 text-[10px] text-muted-foreground font-mono">
          ⏱ {duration >= 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`}
        </div>
      )}

      {/* Skip reason tooltip */}
      {isSkipped && skipReason && (
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 hidden group-hover/node:flex z-50 pointer-events-none">
          <div className="px-2 py-1 rounded-md bg-popover border border-border shadow-md text-[10px] text-muted-foreground whitespace-nowrap">
            {String(skipReason).replace(/_/g, ' ')}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Right} id="right" className="!bg-primary !w-3 !h-3 !border-2 !border-background !-right-1.5" />
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

  return (
    <>
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
          {hasCondition && (
            <span className="text-[9px] font-mono text-muted-foreground max-w-[180px] truncate">
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

interface ExecutionCanvasProps {
  workflow: any;
  controller: ExecutionController;
  selectedNodeId: string | null;
  onNodeSelect: (nodeId: string | null) => void;
}

export function ExecutionCanvas({ workflow, controller, selectedNodeId, onNodeSelect }: ExecutionCanvasProps) {
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

  return (
    <div className="h-full w-full rounded-xl border border-border overflow-hidden bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeSelect(node.id)}
        onPaneClick={() => onNodeSelect(null)}
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
