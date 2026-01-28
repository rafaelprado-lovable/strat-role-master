import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Terminal, Server } from 'lucide-react';

interface CustomBlockNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  color?: string;
  icon?: 'terminal' | 'server';
  machineId?: string;
  scriptPath?: string;
  config?: Record<string, unknown>;
}

const CustomBlockNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CustomBlockNodeData;
  const Icon = nodeData.icon === 'server' ? Server : Terminal;
  const colorClass = nodeData.color || 'bg-rose-500';

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg border-2 min-w-[180px] bg-card ${
        selected ? 'border-primary' : 'border-border'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-muted-foreground"
      />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium">{nodeData.label}</div>
          <div className="text-xs text-muted-foreground">Bloco Customizado</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-muted-foreground"
      />
    </div>
  );
});

CustomBlockNode.displayName = 'CustomBlockNode';

export default CustomBlockNode;
