import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  AlertTriangle,
  Bug,
  Database,
  Webhook,
  Mail,
  MessageSquare,
  Zap,
  Clock,
  GitBranch,
  Filter,
  Server,
  Terminal,
  Cog,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'alert-triangle': AlertTriangle,
  bug: Bug,
  database: Database,
  webhook: Webhook,
  mail: Mail,
  'message-square': MessageSquare,
  zap: Zap,
  clock: Clock,
  'git-branch': GitBranch,
  filter: Filter,
  server: Server,
  terminal: Terminal,
};

interface TaskInstanceNodeData extends Record<string, unknown> {
  label: string;
  definitionId: string;
  category?: string;
  icon?: string;
  color?: string;
  type?: string;
}

const TaskInstanceNode = memo(({ data, selected }: NodeProps) => {
  const d = data as TaskInstanceNodeData;
  const Icon = ICON_MAP[d.icon || ''] || Cog;
  const colorClass = d.color || 'bg-primary';
  const isCondition = d.type === 'condition';
  const isTrigger = d.type === 'trigger';

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-lg min-w-[170px] transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      {/* Target handle — not on triggers */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      )}

      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">
            {d.category || 'Task'}
          </p>
          <p className="font-semibold text-sm">{d.label}</p>
        </div>
      </div>

      {/* Source handles */}
      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '30%' }}
            className="!bg-green-500 !w-3 !h-3 !border-2 !border-background"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '70%' }}
            className="!bg-red-500 !w-3 !h-3 !border-2 !border-background"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      )}
    </div>
  );
});

TaskInstanceNode.displayName = 'TaskInstanceNode';

export default TaskInstanceNode;
