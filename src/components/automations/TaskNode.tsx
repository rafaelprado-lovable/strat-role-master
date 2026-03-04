import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap, Database, Mail, Globe, Clock, Code, GitBranch } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  trigger: Zap,
  database: Database,
  email: Mail,
  http: Globe,
  delay: Clock,
  script: Code,
  condition: GitBranch,
};

const colorMap: Record<string, string> = {
  trigger: 'border-primary bg-primary/10',
  database: 'border-chart-3 bg-chart-3/10',
  email: 'border-accent bg-accent/10',
  http: 'border-chart-5 bg-chart-5/10',
  delay: 'border-chart-4 bg-chart-4/10',
  script: 'border-muted-foreground bg-muted',
  condition: 'border-chart-2 bg-chart-2/10',
};

function TaskNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as { label: string; type: string; description?: string };
  const Icon = iconMap[nodeData.type] || Code;
  const colorClass = colorMap[nodeData.type] || 'border-border bg-card';

  return (
    <div
      className={`
        rounded-lg border-2 px-4 py-3 min-w-[180px] max-w-[240px] shadow-sm
        transition-shadow
        ${colorClass}
        ${selected ? 'ring-2 ring-ring shadow-md' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-foreground" />
        <span className="font-medium text-sm text-foreground truncate">{nodeData.label}</span>
      </div>
      {nodeData.description && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{nodeData.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
