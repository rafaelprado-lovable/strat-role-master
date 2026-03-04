import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Terminal, MessageCircle, Globe, AlertTriangle, Repeat } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  ssh_execution: Terminal,
  send_whatsapp_message_v1: MessageCircle,
  api_call_v1: Globe,
  get_specific_incident_v1: AlertTriangle,
};

const colorMap: Record<string, string> = {
  ssh_execution: 'border-chart-3 bg-chart-3/10',
  send_whatsapp_message_v1: 'border-chart-2 bg-chart-2/10',
  api_call_v1: 'border-chart-5 bg-chart-5/10',
  get_specific_incident_v1: 'border-chart-4 bg-chart-4/10',
};

function TaskNodeComponent({ data, selected }: NodeProps) {
  const d = data as { label: string; definition_id: string; description?: string; hasForEach?: boolean };
  const Icon = iconMap[d.definition_id] || Globe;
  const colorClass = colorMap[d.definition_id] || 'border-border bg-card';

  return (
    <div
      className={`
        rounded-lg px-4 py-3 min-w-[180px] max-w-[240px] shadow-sm border-2 transition-shadow
        ${colorClass}
        ${selected ? 'ring-2 ring-ring shadow-md' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-foreground" />
        <span className="font-medium text-sm text-foreground truncate">{d.label}</span>
        {d.hasForEach && <Repeat className="h-3 w-3 text-chart-4 shrink-0" />}
      </div>
      {d.description && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{d.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-2 !border-background" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
