import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Webhook, Mail, MessageSquare, Zap, Clock } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  webhook: Webhook,
  email: Mail,
  slack: MessageSquare,
  script: Zap,
  delay: Clock,
};

const colorMap: Record<string, string> = {
  webhook: 'bg-blue-500',
  email: 'bg-green-500',
  slack: 'bg-indigo-500',
  script: 'bg-yellow-500',
  delay: 'bg-gray-500',
};

interface ActionNodeProps {
  data: {
    label: string;
    type: string;
    config?: Record<string, unknown>;
  };
  selected?: boolean;
}

function ActionNode({ data, selected }: ActionNodeProps) {
  const Icon = iconMap[data.type] || Zap;
  const bgColor = colorMap[data.type] || 'bg-blue-500';

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
          <p className="text-xs text-muted-foreground font-medium">Ação</p>
          <p className="font-semibold text-sm">{data.label}</p>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !w-3 !h-3 !border-2 !border-background"
      />
    </div>
  );
}

export default memo(ActionNode);
