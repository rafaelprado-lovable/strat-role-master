import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Terminal, MessageCircle, Globe, AlertTriangle, Repeat } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  ssh_execution: Terminal,
  send_whatsapp_message_v1: MessageCircle,
  api_call_v1: Globe,
  get_specific_incident_v1: AlertTriangle,
};

const colorMap: Record<string, { border: string; bg: string; iconBg: string; accent: string }> = {
  ssh_execution: {
    border: 'border-chart-3/60',
    bg: 'bg-gradient-to-br from-chart-3/10 to-chart-3/5',
    iconBg: 'bg-chart-3/20 text-chart-3',
    accent: 'bg-chart-3',
  },
  send_whatsapp_message_v1: {
    border: 'border-chart-2/60',
    bg: 'bg-gradient-to-br from-chart-2/10 to-chart-2/5',
    iconBg: 'bg-chart-2/20 text-chart-2',
    accent: 'bg-chart-2',
  },
  api_call_v1: {
    border: 'border-chart-5/60',
    bg: 'bg-gradient-to-br from-chart-5/10 to-chart-5/5',
    iconBg: 'bg-chart-5/20 text-chart-5',
    accent: 'bg-chart-5',
  },
  get_specific_incident_v1: {
    border: 'border-chart-4/60',
    bg: 'bg-gradient-to-br from-chart-4/10 to-chart-4/5',
    iconBg: 'bg-chart-4/20 text-chart-4',
    accent: 'bg-chart-4',
  },
};

const defaultColor = {
  border: 'border-border',
  bg: 'bg-card',
  iconBg: 'bg-muted text-muted-foreground',
  accent: 'bg-muted-foreground',
};

function TaskNodeComponent({ data, selected }: NodeProps) {
  const d = data as { label: string; definition_id: string; description?: string; hasForEach?: boolean; hasLoop?: boolean };
  const Icon = iconMap[d.definition_id] || Globe;
  const colors = colorMap[d.definition_id] || defaultColor;

  return (
    <div
      className={`
        rounded-xl px-4 py-3 min-w-[190px] max-w-[250px] border-2 relative
        backdrop-blur-sm shadow-sm
        transition-all duration-200
        ${colors.border} ${colors.bg}
        ${selected ? 'ring-2 ring-ring ring-offset-1 ring-offset-background shadow-lg scale-[1.02]' : 'hover:shadow-md'}
      `}
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-3 right-3 h-[2px] rounded-b-full ${colors.accent} opacity-60`} />

      {/* Top (target) */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-primary !w-3 !h-3 !border-2 !border-background !-top-1.5" />

      {/* Right source — for loop-back */}
      <Handle type="source" position={Position.Right} id="loop-out" className="!bg-chart-4 !w-2.5 !h-2.5 !border-2 !border-background !top-1/2" />
      {/* Left target — for loop-back */}
      <Handle type="target" position={Position.Left} id="loop-in" className="!bg-chart-4 !w-2.5 !h-2.5 !border-2 !border-background !top-1/2" />

      <div className="flex items-center gap-2.5 mt-0.5">
        <div className={`p-1.5 rounded-lg ${colors.iconBg} shrink-0`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold text-sm text-foreground truncate leading-tight">{d.label}</span>
      </div>

      {(d.hasForEach || d.hasLoop) && (
        <div className="flex items-center gap-2 mt-2">
          {d.hasForEach && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-chart-4/10 border border-chart-4/20">
              <Repeat className="h-2.5 w-2.5 text-chart-4" />
              <span className="text-[10px] text-chart-4 font-medium">for each</span>
            </div>
          )}
          {d.hasLoop && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-chart-4/10 border border-chart-4/20">
              <Repeat className="h-2.5 w-2.5 text-chart-4" />
              <span className="text-[10px] text-chart-4 font-medium">while</span>
            </div>
          )}
        </div>
      )}

      {d.description && (
        <p className="text-[11px] text-muted-foreground mt-1.5 truncate leading-relaxed">{d.description}</p>
      )}

      {/* Bottom (source) */}
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-primary !w-3 !h-3 !border-2 !border-background !-bottom-1.5" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
