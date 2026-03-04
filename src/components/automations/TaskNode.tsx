import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Database, Mail, Globe, Clock, Code, GitBranch, Repeat, RefreshCw } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  trigger: Zap,
  database: Database,
  email: Mail,
  http: Globe,
  delay: Clock,
  script: Code,
  condition: GitBranch,
  forEach: Repeat,
  while: RefreshCw,
};

const colorMap: Record<string, string> = {
  trigger: 'border-primary bg-primary/10',
  database: 'border-chart-3 bg-chart-3/10',
  email: 'border-accent bg-accent/10',
  http: 'border-chart-5 bg-chart-5/10',
  delay: 'border-chart-4 bg-chart-4/10',
  script: 'border-muted-foreground bg-muted',
  condition: 'border-chart-2 bg-chart-2/10',
  forEach: 'border-chart-4 bg-chart-4/10',
  while: 'border-chart-5 bg-chart-5/10',
};

const LOOP_TYPES = ['forEach', 'while'];
const CONDITION_TYPE = 'condition';

function TaskNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as { label: string; type: string; description?: string };
  const Icon = iconMap[nodeData.type] || Code;
  const colorClass = colorMap[nodeData.type] || 'border-border bg-card';
  const isLoop = LOOP_TYPES.includes(nodeData.type);
  const isCondition = nodeData.type === CONDITION_TYPE;

  return (
    <div
      className={`
        rounded-lg px-4 py-3 min-w-[180px] max-w-[240px] shadow-sm
        transition-shadow
        ${colorClass}
        ${isLoop ? 'border-2 border-dashed' : 'border-2'}
        ${selected ? 'ring-2 ring-ring shadow-md' : ''}
      `}
    >
      {/* Target handle (top) */}
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />

      {/* Loop: loop-back handle (left) — receives the return connection */}
      {isLoop && (
        <Handle
          type="target"
          position={Position.Left}
          id="loop-back"
          className="!bg-chart-4 !w-3 !h-3 !border-2 !border-background"
          style={{ top: '50%' }}
        />
      )}

      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-foreground" />
        <span className="font-medium text-sm text-foreground truncate">{nodeData.label}</span>
        {isLoop && <Repeat className="h-3 w-3 text-muted-foreground" />}
      </div>
      {nodeData.description && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{nodeData.description}</p>
      )}

      {/* Condition: True (left) / False (right) handles */}
      {isCondition && (
        <>
          <Handle
            type="source"
            position={Position.Left}
            id="true"
            className="!bg-chart-2 !w-3 !h-3 !border-2 !border-background"
            style={{ bottom: 4, top: 'auto' }}
          />
          <span className="absolute -left-3 bottom-[-18px] text-[10px] font-semibold text-chart-2">True</span>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            className="!bg-destructive !w-3 !h-3 !border-2 !border-background"
            style={{ bottom: 4, top: 'auto' }}
          />
          <span className="absolute -right-4 bottom-[-18px] text-[10px] font-semibold text-destructive">False</span>
        </>
      )}

      {/* Loop: loop-body (bottom-left) + loop-done (bottom-right) */}
      {isLoop && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="loop-body"
            className="!bg-chart-4 !w-3 !h-3 !border-2 !border-background"
            style={{ left: '30%' }}
          />
          <span className="absolute left-[18%] bottom-[-18px] text-[10px] font-semibold text-chart-4">Body</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="loop-done"
            className="!bg-primary !w-3 !h-3 !border-2 !border-background"
            style={{ left: '70%' }}
          />
          <span className="absolute left-[60%] bottom-[-18px] text-[10px] font-semibold text-primary">Done</span>
        </>
      )}

      {/* Default source handle (bottom) — only for non-condition, non-loop nodes */}
      {!isCondition && !isLoop && (
        <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      )}
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
