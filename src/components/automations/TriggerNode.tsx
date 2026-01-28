import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, Bug, Database } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  alarm: AlertTriangle,
  incident: Bug,
  rabbit_full: Database,
};

const colorMap: Record<string, string> = {
  alarm: 'bg-orange-500',
  incident: 'bg-red-500',
  rabbit_full: 'bg-purple-500',
};

interface TriggerNodeProps {
  data: {
    label: string;
    type: string;
    config?: Record<string, unknown>;
  };
  selected?: boolean;
}

function TriggerNode({ data, selected }: TriggerNodeProps) {
  const Icon = iconMap[data.type] || AlertTriangle;
  const bgColor = colorMap[data.type] || 'bg-orange-500';

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-background shadow-lg min-w-[160px] transition-all ${
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Gatilho</p>
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

export default memo(TriggerNode);
