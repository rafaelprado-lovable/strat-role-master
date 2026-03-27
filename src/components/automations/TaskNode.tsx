import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { icons, Globe, Repeat } from 'lucide-react';

function resolveIcon(iconName?: string): React.ElementType {
  if (!iconName) return Globe;
  const pascal = iconName
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return (icons as Record<string, React.ElementType>)[pascal] || Globe;
}

const colorMap: Record<string, string> = {
  ssh_execution: '270 75% 60%',
  send_whatsapp_message_v1: '142 70% 45%',
  api_call_v1: '190 100% 45%',
  get_specific_incident_v1: '35 95% 55%',
  delay_v1: '210 100% 50%',
  llm_analyse_v1: '280 80% 55%',
  condition_v1: '160 60% 45%',
  switch_v1: '160 60% 45%',
  filter_v1: '160 60% 45%',
  code_execution_v1: '45 100% 50%',
};

const defaultHsl = '220 10% 50%';

// Colors for switch case handles
const switchCaseColors = [
  '210 100% 50%', // blue
  '142 70% 45%',  // green
  '35 95% 55%',   // orange
  '280 80% 55%',  // violet
  '350 80% 55%',  // red
  '190 100% 45%', // cyan
];

function TaskNodeComponent({ data, selected }: NodeProps) {
  const d = data as {
    label: string;
    definition_id: string;
    icon?: string;
    description?: string;
    hasForEach?: boolean;
    hasLoop?: boolean;
    isTrigger?: boolean;
    switchCases?: string[];
  };
  const Icon = resolveIcon(d.icon);
  const hsl = colorMap[d.definition_id] || defaultHsl;
  const isTrigger = !!d.isTrigger;
  const isSwitch = d.definition_id === 'switch_v1';
  const cases = isSwitch ? (d.switchCases || ['Case 1', 'Default']) : [];

  // Calculate node height based on number of cases
  const nodeHeight = isSwitch ? Math.max(52, 20 + cases.length * 22) : 52;

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 group"
      style={{ width: isSwitch ? 100 : 80 }}
    >
      {/* Left (target) handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-2.5 !h-2.5 !border-2 !border-background !-left-1"
          style={{ background: `hsl(${hsl})`, top: nodeHeight / 2 }}
        />
      )}

      {/* Main icon box */}
      <div
        className={`
          rounded-xl flex items-center justify-center
          border-2 shadow-md transition-all duration-150
          bg-card
          ${selected
            ? 'ring-2 ring-ring ring-offset-1 ring-offset-background scale-105 shadow-lg'
            : 'group-hover:shadow-lg group-hover:scale-[1.03]'
          }
        `}
        style={{
          borderColor: `hsl(${hsl} / 0.5)`,
          width: isSwitch ? 72 : 52,
          height: nodeHeight,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `hsl(${hsl} / 0.15)` }}
          >
            <Icon
              size={20}
              strokeWidth={2.4}
              absoluteStrokeWidth
              className="shrink-0"
              style={{ color: `hsl(${hsl})` }}
            />
          </div>
          {/* Switch case labels inside the box */}
          {isSwitch && cases.length > 0 && (
            <div className="flex flex-col gap-0.5 w-full px-1">
              {cases.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: `hsl(${switchCaseColors[i % switchCaseColors.length]})` }}
                  />
                  <span className="text-[7px] text-muted-foreground truncate leading-tight">{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Label */}
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

      {/* Right (source) handles — multiple for switch, single for others */}
      {isSwitch ? (
        cases.map((c, i) => (
          <Handle
            key={`switch-${i}`}
            type="source"
            position={Position.Right}
            id={`switch-${i}`}
            className="!w-2.5 !h-2.5 !border-2 !border-background !-right-1"
            style={{
              background: `hsl(${switchCaseColors[i % switchCaseColors.length]})`,
              top: 16 + ((nodeHeight - 16) / (cases.length + 1)) * (i + 1),
            }}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-2.5 !h-2.5 !border-2 !border-background !-right-1"
          style={{ background: `hsl(${hsl})`, top: nodeHeight / 2 }}
        />
      )}

      {/* Loop handles */}
      <Handle type="source" position={Position.Bottom} id="loop-out" className="!bg-chart-4 !w-2 !h-2 !border-2 !border-background" />
      <Handle type="target" position={Position.Top} id="loop-in" className="!bg-chart-4 !w-2 !h-2 !border-2 !border-background" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
