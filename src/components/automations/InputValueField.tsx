import { useState, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Variable, ChevronDown } from 'lucide-react';
import { TaskDefinition } from '@/types/automations';
import { BUILTIN_TASK_DEFINITIONS } from './taskDefinitions';

interface InputValueFieldProps {
  paramName: string;
  paramType: string;
  mandatory: boolean;
  value: string;
  onChange: (value: string) => void;
  currentNodeId: string;
  nodes: Node[];
  edges: Edge[];
}

function getUpstreamNodes(
  currentNodeId: string,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  const upstreamIds = new Set<string>();

  function findUpstream(nodeId: string) {
    edges.forEach((edge) => {
      if (edge.target === nodeId && !upstreamIds.has(edge.source)) {
        upstreamIds.add(edge.source);
        findUpstream(edge.source);
      }
    });
  }

  findUpstream(currentNodeId);
  return nodes.filter((node) => upstreamIds.has(node.id));
}

export function InputValueField({
  paramName,
  paramType,
  mandatory,
  value,
  onChange,
  currentNodeId,
  nodes,
  edges,
}: InputValueFieldProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upstreamNodes = getUpstreamNodes(currentNodeId, nodes, edges);

  const handleInsertReference = (reference: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || value.length;
      const end = inputRef.current.selectionEnd || value.length;
      const newValue = value.substring(0, start) + reference + value.substring(end);
      onChange(newValue);
    } else {
      onChange(value + reference);
    }
    setOpen(false);
  };

  const hasReference = value.includes('{{') && value.includes('}}');

  // Get outputs from upstream node's definition schema
  const getNodeOutputs = (node: Node): { key: string; type: string }[] => {
    const defId = node.data.definitionId as string;
    if (!defId) return [];
    // Search in builtin + any custom stored on node
    const def = BUILTIN_TASK_DEFINITIONS.find((d) => d.id === defId);
    if (!def) return [];
    return Object.entries(def.schema.outputs).map(([key, type]) => ({ key, type }));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-xs">
          {paramName}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {paramType}
        </Badge>
        {mandatory && (
          <span className="text-[10px] text-destructive font-bold">*</span>
        )}
      </div>
      <div className="flex gap-1">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={`Valor para ${paramName}...`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`h-8 text-sm font-mono ${hasReference ? 'pr-8 bg-primary/5 border-primary/30' : ''}`}
          />
          {hasReference && (
            <Variable className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          )}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              disabled={upstreamNodes.length === 0}
              title={upstreamNodes.length === 0 ? 'Conecte blocos anteriores' : 'Inserir referência'}
            >
              <Variable className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-2 border-b bg-muted/30">
              <p className="text-xs font-medium">Outputs disponíveis</p>
              <p className="text-[10px] text-muted-foreground">
                Clique para inserir no campo
              </p>
            </div>
            <ScrollArea className="max-h-[250px]">
              <div className="p-2 space-y-3">
                {upstreamNodes.map((node) => {
                  const outputs = getNodeOutputs(node);
                  if (outputs.length === 0) return null;
                  return (
                    <div key={node.id} className="space-y-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {node.data.label as string}
                      </Badge>
                      <div className="space-y-0.5 ml-1">
                        {outputs.map((output) => {
                          const reference = `{{${node.id}.${output.key}}}`;
                          return (
                            <div
                              key={output.key}
                              className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer text-xs"
                              onClick={() => handleInsertReference(reference)}
                            >
                              <code className="font-mono text-primary">{output.key}</code>
                              <Badge variant="outline" className="text-[9px] ml-auto">
                                {output.type}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      {hasReference && (
        <p className="text-[10px] text-muted-foreground">
          Usando referência de outro bloco
        </p>
      )}
    </div>
  );
}
