import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { icons, Globe, Repeat, Zap } from 'lucide-react';

function resolveIcon(iconName?: string): React.ElementType {
  if (!iconName) return Globe;
  const pascal = iconName
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return (icons as Record<string, React.ElementType>)[pascal] || Globe;
}

const colorMap: Record<string, string> = {
  // Triggers
  get_specific_incident_v1: '35 95% 55%',
  webhook_trigger_v1: '25 90% 55%',
  schedule_trigger_v1: '40 85% 50%',
  // Filters / Flow control
  condition_v1: '160 60% 45%',
  switch_v1: '160 60% 45%',
  filter_v1: '160 60% 45%',
  merge_v1: '200 75% 50%',
  split_v1: '175 65% 45%',
  aggregate_v1: '230 60% 55%',
  sort_v1: '185 55% 50%',
  limit_v1: '170 50% 48%',
  deduplicate_v1: '195 60% 50%',
  noop_v1: '220 15% 55%',
  // Actions
  ssh_agent_v1: '270 75% 60%',
  send_whatsapp_message_v1: '142 70% 45%',
  http_agent_v1: '190 100% 45%',
  delay_v1: '210 100% 50%',
  llm_agent_v1: '280 80% 55%',
  code_execution_v1: '45 100% 50%',
  set_v1: '310 65% 55%',
  rename_keys_v1: '320 55% 50%',
  summarize_v1: '350 70% 55%',
  split_batches_v1: '150 55% 48%',
  wait_v1: '215 70% 55%',
};

const defaultHsl = '220 10% 50%';

const switchCaseColors = [
  '210 100% 50%',
  '142 70% 45%',
  '35 95% 55%',
  '280 80% 55%',
  '350 80% 55%',
  '190 100% 45%',
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

  const nodeHeight = isSwitch ? Math.max(64, 28 + cases.length * 22) : 64;
  const nodeWidth = isSwitch ? 110 : 90;

  return (
    <div
      className="relative flex flex-col items-center gap-1 group"
      style={{ width: nodeWidth + 20 }}
    >
      {/* Left (target) handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className="!w-3 !h-3 !rounded-full !border-2 !border-background !-left-1.5 !shadow-sm"
          style={{ background: `hsl(${hsl})`, top: nodeHeight / 2 }}
        />
      )}

      {/* Outer glow on selection */}
      <div
        className="absolute rounded-2xl transition-all duration-200 pointer-events-none"
        style={{
          inset: -4,
          top: -4,
          height: nodeHeight + 8,
          background: selected ? `hsl(${hsl} / 0.08)` : 'transparent',
          boxShadow: selected ? `0 0 20px 2px hsl(${hsl} / 0.2)` : 'none',
          borderRadius: 18,
        }}
      />

      {/* Main card */}
      <div
        className={`
          relative rounded-2xl flex flex-col items-center justify-center
          border shadow-md transition-all duration-200
          bg-card overflow-hidden
          ${selected
            ? 'shadow-lg scale-[1.04]'
            : 'group-hover:shadow-lg group-hover:scale-[1.02]'
          }
        `}
        style={{
          borderColor: selected ? `hsl(${hsl} / 0.7)` : `hsl(${hsl} / 0.3)`,
          borderWidth: selected ? 2 : 1.5,
          width: nodeWidth,
          height: nodeHeight,
        }}
      >
        {/* Top color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, hsl(${hsl} / 0.7), hsl(${hsl} / 0.3))`,
          }}
        />

        {/* Trigger lightning badge */}
        {isTrigger && (
          <div
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background shadow-sm"
            style={{ background: `hsl(${hsl})` }}
          >
            <Zap size={10} className="text-white fill-white" />
          </div>
        )}

        <div className="flex flex-col items-center gap-1.5 py-2">
          {/* Icon container */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, hsl(${hsl} / 0.18), hsl(${hsl} / 0.08))`,
              boxShadow: `0 2px 8px hsl(${hsl} / 0.15)`,
            }}
          >
            <Icon
              size={20}
              strokeWidth={2.2}
              absoluteStrokeWidth
              className="shrink-0"
              style={{ color: `hsl(${hsl})` }}
            />
          </div>

          {/* Switch case labels */}
          {isSwitch && cases.length > 0 && (
            <div className="flex flex-col gap-0.5 w-full px-2">
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
      <span
        className="text-[10px] font-semibold text-foreground text-center leading-tight max-w-[100px] truncate mt-0.5"
        title={d.label}
      >
        {d.label}
      </span>

      {/* Definition ID subtitle */}
      <span className="text-[8px] text-muted-foreground/60 font-mono truncate max-w-[100px]">
        {d.definition_id}
      </span>

      {/* Badges */}
      {(d.hasForEach || d.hasLoop) && (
        <div className="flex items-center gap-1 mt-0.5">
          {d.hasForEach && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border"
              style={{
                background: `hsl(${hsl} / 0.08)`,
                borderColor: `hsl(${hsl} / 0.2)`,
              }}
            >
              <Repeat className="h-2 w-2" style={{ color: `hsl(${hsl})` }} />
              <span className="text-[7px] font-semibold" style={{ color: `hsl(${hsl})` }}>each</span>
            </div>
          )}
          {d.hasLoop && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border"
              style={{
                background: `hsl(${hsl} / 0.08)`,
                borderColor: `hsl(${hsl} / 0.2)`,
              }}
            >
              <Repeat className="h-2 w-2" style={{ color: `hsl(${hsl})` }} />
              <span className="text-[7px] font-semibold" style={{ color: `hsl(${hsl})` }}>loop</span>
            </div>
          )}
        </div>
      )}

      {/* Right (source) handles */}
      {isSwitch ? (
        cases.map((_, i) => (
          <Handle
            key={`switch-${i}`}
            type="source"
            position={Position.Right}
            id={`switch-${i}`}
            className="!w-3 !h-3 !rounded-full !border-2 !border-background !-right-1.5 !shadow-sm"
            style={{
              background: `hsl(${switchCaseColors[i % switchCaseColors.length]})`,
              top: 20 + ((nodeHeight - 20) / (cases.length + 1)) * (i + 1),
            }}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className="!w-3 !h-3 !rounded-full !border-2 !border-background !-right-1.5 !shadow-sm"
          style={{ background: `hsl(${hsl})`, top: nodeHeight / 2 }}
        />
      )}

      {/* Loop handles */}
      <Handle type="source" position={Position.Bottom} id="loop-out" className="!bg-chart-4 !w-2.5 !h-2.5 !rounded-full !border-2 !border-background !shadow-sm" />
      <Handle type="target" position={Position.Top} id="loop-in" className="!bg-chart-4 !w-2.5 !h-2.5 !rounded-full !border-2 !border-background !shadow-sm" />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
