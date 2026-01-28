import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, Filter } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  if: GitBranch,
  filter: Filter,
};

const colorMap: Record<string, string> = {
  if: 'bg-cyan-500',
  filter: 'bg-teal-500',
};

interface ConditionNodeProps {
  data: {
    label: string;
    type: string;
    config?: Record<string, unknown>;
  };
  selected?: boolean;
}

function ConditionNode({ data, selected }: ConditionNodeProps) {
  const Icon = iconMap[data.type] || GitBranch;
  const bgColor = colorMap[data.type] || 'bg-cyan-500';

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-lg min-w-[160px] transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Condição</p>
          <p className="font-semibold text-sm">{data.label}</p>
        </div>
      </div>
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
    </div>
  );
}

export default memo(ConditionNode);
