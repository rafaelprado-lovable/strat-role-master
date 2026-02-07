import { Node, Edge } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { TaskDefinition } from '@/types/automations';
import { InputValueField } from './InputValueField';

interface TaskConfigPanelProps {
  node: Node;
  definition: TaskDefinition | undefined;
  nodes: Node[];
  edges: Edge[];
  onUpdateLabel: (label: string) => void;
  onUpdateConfig: (key: string, value: unknown) => void;
  onDelete: () => void;
}

export function TaskConfigPanel({
  node,
  definition,
  nodes,
  edges,
  onUpdateLabel,
  onUpdateConfig,
  onDelete,
}: TaskConfigPanelProps) {
  const config = (node.data.config as Record<string, unknown>) || {};

  if (!definition) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Definição não encontrada para este nó.
      </div>
    );
  }

  const inputEntries = Object.entries(definition.schema.inputs);
  const outputEntries = Object.entries(definition.schema.outputs);

  return (
    <div className="space-y-4">
      {/* Node label */}
      <div className="space-y-2">
        <Label>Nome do bloco</Label>
        <Input
          value={(node.data.label as string) || ''}
          onChange={(e) => onUpdateLabel(e.target.value)}
        />
      </div>

      <div className="text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px]">
          {definition.type}
        </Badge>{' '}
        {definition.description}
      </div>

      {/* Inputs — configurable */}
      {inputEntries.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Inputs</Label>
            </div>
            {inputEntries.map(([paramName, paramType]) => (
              <InputValueField
                key={paramName}
                paramName={paramName}
                paramType={paramType}
                mandatory={false}
                value={(config[paramName] as string) || ''}
                onChange={(val) => onUpdateConfig(paramName, val)}
                currentNodeId={node.id}
                nodes={nodes}
                edges={edges}
              />
            ))}
          </div>
        </>
      )}

      {/* Outputs — read-only info */}
      {outputEntries.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Outputs</Label>
            </div>
            <div className="flex flex-wrap gap-1">
              {outputEntries.map(([paramName, paramType]) => (
                <Badge
                  key={paramName}
                  variant="outline"
                  className="text-xs font-mono"
                >
                  {paramName}
                  <span className="ml-1 text-[9px] text-muted-foreground">
                    ({paramType})
                  </span>
                </Badge>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Use {'{{nodeId.output}}'} para referenciar em outros blocos
            </p>
          </div>
        </>
      )}

      {/* Machine info for remote scripts */}
      {definition.scriptPath && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs">Script Path</Label>
            <Input value={definition.scriptPath} disabled className="bg-muted text-xs" />
          </div>
        </>
      )}

      <Separator />
      <Button variant="destructive" className="w-full" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Remover bloco
      </Button>
    </div>
  );
}
