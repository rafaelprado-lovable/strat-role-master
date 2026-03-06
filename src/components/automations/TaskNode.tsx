import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Terminal, MessageCircle, Globe, AlertTriangle, Repeat, Timer, Brain } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  ssh_execution: Terminal,
  send_whatsapp_message_v1: MessageCircle,
  api_call_v1: Globe,
  get_specific_incident_v1: AlertTriangle,
  delay_v1: Timer,
  llm_analyse_v1: Brain,
};

const colorMap: Record<string, string> = {
  ssh_execution: '270 75% 60%',       // chart-3 purple
  send_whatsapp_message_v1: '142 70% 45%', // green (whatsapp)
  api_call_v1: '190 100% 45%',        // chart-5 cyan
  get_specific_incident_v1: '35 95% 55%',  // orange
  delay_v1: '210 100% 50%',           // chart-1 blue
  llm_analyse_v1: '280 80% 55%',      // violet
};

const defaultHsl = '220 10% 50%';

function TaskNodeComponent({ data, selected }: NodeProps) {
  const d = data as { label: string; definition_id: string; description?: string; hasForEach?: boolean; hasLoop?: boolean };
  const Icon = iconMap[d.definition_id] || Globe;
  const hsl = colorMap[d.definition_id] || defaultHsl;

  return (
    <div
      className={`
        relative flex flex-col items-center gap-1.5
        w-[80px] group
      `}
    >
      {/* Left (target) handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !border-2 !border-background !-left-1 !top-[36px]"
        style={{ background: `hsl(${hsl})` }}
      />

      {/* Main icon box — n8n style */}
      <div
        className={`
          w-[52px] h-[52px] rounded-xl flex items-center justify-center
          border-2 shadow-md transition-all duration-150
          bg-card
          ${selected
            ? 'ring-2 ring-ring ring-offset-1 ring-offset-background scale-105 shadow-lg'
            : 'group-hover:shadow-lg group-hover:scale-[1.03]'
          }
        `}
        style={{ borderColor: `hsl(${hsl} / 0.5)` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `hsl(${hsl} / 0.15)` }}
        >
          <Icon className="w-5 h-5" style={{ color: `hsl(${hsl})` }} />
        </div>
      </div>

      {/* Label — below the box */}
      <span className="text-[10px] font-medium text-foreground text-center leading-tight max-w-[90px] truncate">
        {d.label}
      </span>

      {/* Badges */}
      {(d.hasForEach || d.hasLoop) && (
        <div className="flex items-center gap-1">
          {d.hasForEach && (
            <div className="flex items-center gap-0.5 px-1 py-px rounded bg-chart-4/10 border border-chart-4/20">
              <Repeat className="h-2 w-2 text-chart-4" />
              <span className="text-[8px] text-chart-4 font-medium">each</span>
            </div>
          )}
          {d.hasLoop && (
            <div className="flex items-center gap-0.5 px-1 py-px rounded bg-chart-4/10 border border-chart-4/20">
              <Repeat className="h-2 w-2 text-chart-4" />
              <span className="text-[8px] text-chart-4 font-medium">loop</span>
            </div>
          )}
        </div>
      )}

      {/* Right (source) handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !border-2 !border-background !-right-1 !top-[36px]"
        style={{ background: `hsl(${hsl})` }}
      />

      {/* Loop handles */}
      <Handle type="source" position={Position.Bottom} id="loop-out" className="!bg-chart-4 !w-2 !h-2 !border-2 !border-background" />
      <Handle type="target" position={Position.Top} id="loop-in" className="!bg-chart-4 !w-2 !h-2 !border-2 !border-background" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
