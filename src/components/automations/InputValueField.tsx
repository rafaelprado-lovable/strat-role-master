import { useState, useRef, useEffect } from 'react';
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
import { StepOutputValue } from '@/types/automations';

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

// Default outputs for each block type
const BLOCK_OUTPUTS: Record<string, { key: string; label: string; type: string }[]> = {
  alarm: [
    { key: 'alarmId', label: 'ID do Alarme', type: 'string' },
    { key: 'alarmType', label: 'Tipo', type: 'string' },
    { key: 'service', label: 'Serviço', type: 'string' },
    { key: 'message', label: 'Mensagem', type: 'string' },
    { key: 'timestamp', label: 'Timestamp', type: 'string' },
  ],
  incident: [
    { key: 'incidentId', label: 'ID do Incidente', type: 'string' },
    { key: 'priority', label: 'Prioridade', type: 'string' },
    { key: 'team', label: 'Equipe', type: 'string' },
    { key: 'title', label: 'Título', type: 'string' },
    { key: 'description', label: 'Descrição', type: 'string' },
  ],
  rabbit_full: [
    { key: 'queueName', label: 'Nome da Fila', type: 'string' },
    { key: 'messageCount', label: 'Qtd Mensagens', type: 'integer' },
    { key: 'usagePercent', label: 'Uso (%)', type: 'integer' },
    { key: 'threshold', label: 'Threshold', type: 'integer' },
  ],
  webhook: [
    { key: 'statusCode', label: 'Status Code', type: 'integer' },
    { key: 'responseBody', label: 'Response Body', type: 'object' },
    { key: 'responseHeaders', label: 'Headers', type: 'object' },
  ],
  email: [
    { key: 'sent', label: 'Enviado', type: 'boolean' },
    { key: 'messageId', label: 'Message ID', type: 'string' },
  ],
  slack: [
    { key: 'sent', label: 'Enviado', type: 'boolean' },
    { key: 'messageTs', label: 'Message TS', type: 'string' },
  ],
  script: [
    { key: 'result', label: 'Resultado', type: 'object' },
    { key: 'success', label: 'Sucesso', type: 'boolean' },
    { key: 'error', label: 'Erro', type: 'string' },
  ],
  delay: [
    { key: 'completed', label: 'Completado', type: 'boolean' },
    { key: 'duration', label: 'Duração', type: 'integer' },
  ],
  if: [
    { key: 'result', label: 'Resultado', type: 'boolean' },
    { key: 'branch', label: 'Branch', type: 'string' },
  ],
  filter: [
    { key: 'passed', label: 'Passou', type: 'boolean' },
    { key: 'data', label: 'Dados', type: 'object' },
  ],
  customBlock: [
    { key: 'stdout', label: 'Stdout', type: 'string' },
    { key: 'stderr', label: 'Stderr', type: 'string' },
    { key: 'exitCode', label: 'Exit Code', type: 'integer' },
    { key: 'result', label: 'Resultado', type: 'object' },
  ],
};

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
    // Insert at cursor position or append
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

  // Check if value contains a reference
  const hasReference = value.includes('{{') && value.includes('}}');

  // Get all available outputs from upstream nodes
  const getNodeOutputs = (node: Node) => {
    const nodeData = node.data as { type: string; stepOutputValue?: StepOutputValue[] };
    const customOutputs = nodeData.stepOutputValue || [];
    const defaultOutputs = BLOCK_OUTPUTS[nodeData.type] || [];
    
    return [
      ...customOutputs.map((o) => ({ key: o.paramName, label: o.paramName, type: o.paramType })),
      ...defaultOutputs,
    ];
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
              title={upstreamNodes.length === 0 ? 'Conecte blocos anteriores para usar suas saídas' : 'Inserir referência de saída'}
            >
              <Variable className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-2 border-b bg-muted/30">
              <p className="text-xs font-medium">Saídas disponíveis</p>
              <p className="text-[10px] text-muted-foreground">
                Clique para inserir no campo
              </p>
            </div>
            <ScrollArea className="max-h-[250px]">
              <div className="p-2 space-y-3">
                {upstreamNodes.map((node) => {
                  const nodeData = node.data as { label: string; type: string };
                  const outputs = getNodeOutputs(node);

                  if (outputs.length === 0) return null;

                  return (
                    <div key={node.id} className="space-y-1.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {nodeData.label}
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
                              <code className="font-mono text-primary">
                                {output.key}
                              </code>
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
