import { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Variable, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface OutputReferenceSelectProps {
  currentNodeId: string;
  nodes: Node[];
  edges: Edge[];
  onInsert: (reference: string) => void;
}

// Define what outputs each block type produces
const BLOCK_OUTPUTS: Record<string, { key: string; label: string; description: string }[]> = {
  alarm: [
    { key: 'alarmId', label: 'ID do Alarme', description: 'Identificador único do alarme' },
    { key: 'alarmType', label: 'Tipo', description: 'Tipo do alarme (critical, warning, info)' },
    { key: 'service', label: 'Serviço', description: 'Nome do serviço afetado' },
    { key: 'message', label: 'Mensagem', description: 'Mensagem do alarme' },
    { key: 'timestamp', label: 'Timestamp', description: 'Data/hora do alarme' },
  ],
  incident: [
    { key: 'incidentId', label: 'ID do Incidente', description: 'Identificador único' },
    { key: 'priority', label: 'Prioridade', description: 'P1, P2, P3 ou P4' },
    { key: 'team', label: 'Equipe', description: 'Equipe responsável' },
    { key: 'title', label: 'Título', description: 'Título do incidente' },
    { key: 'description', label: 'Descrição', description: 'Descrição detalhada' },
  ],
  rabbit_full: [
    { key: 'queueName', label: 'Nome da Fila', description: 'Nome da fila RabbitMQ' },
    { key: 'messageCount', label: 'Qtd Mensagens', description: 'Número de mensagens na fila' },
    { key: 'usagePercent', label: 'Uso (%)', description: 'Percentual de uso da fila' },
    { key: 'threshold', label: 'Threshold', description: 'Limite configurado' },
  ],
  webhook: [
    { key: 'statusCode', label: 'Status Code', description: 'Código HTTP de resposta' },
    { key: 'responseBody', label: 'Response Body', description: 'Corpo da resposta' },
    { key: 'responseHeaders', label: 'Headers', description: 'Headers da resposta' },
  ],
  email: [
    { key: 'sent', label: 'Enviado', description: 'Status de envio (true/false)' },
    { key: 'messageId', label: 'Message ID', description: 'ID da mensagem enviada' },
  ],
  slack: [
    { key: 'sent', label: 'Enviado', description: 'Status de envio (true/false)' },
    { key: 'messageTs', label: 'Message TS', description: 'Timestamp da mensagem Slack' },
  ],
  script: [
    { key: 'result', label: 'Resultado', description: 'Valor retornado pelo script' },
    { key: 'success', label: 'Sucesso', description: 'Status de execução (true/false)' },
    { key: 'error', label: 'Erro', description: 'Mensagem de erro (se houver)' },
  ],
  delay: [
    { key: 'completed', label: 'Completado', description: 'Status do delay' },
    { key: 'duration', label: 'Duração', description: 'Tempo aguardado' },
  ],
  if: [
    { key: 'result', label: 'Resultado', description: 'Resultado da condição (true/false)' },
    { key: 'branch', label: 'Branch', description: 'Caminho seguido (true/false)' },
  ],
  filter: [
    { key: 'passed', label: 'Passou', description: 'Se passou no filtro (true/false)' },
    { key: 'data', label: 'Dados', description: 'Dados filtrados' },
  ],
  customBlock: [
    { key: 'stdout', label: 'Stdout', description: 'Saída padrão do script' },
    { key: 'stderr', label: 'Stderr', description: 'Saída de erro do script' },
    { key: 'exitCode', label: 'Exit Code', description: 'Código de saída' },
    { key: 'result', label: 'Resultado', description: 'Resultado parseado (JSON)' },
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

export function OutputReferenceSelect({
  currentNodeId,
  nodes,
  edges,
  onInsert,
}: OutputReferenceSelectProps) {
  const [open, setOpen] = useState(false);
  
  const upstreamNodes = getUpstreamNodes(currentNodeId, nodes, edges);
  
  const handleCopy = (reference: string) => {
    navigator.clipboard.writeText(reference);
    toast.success('Referência copiada');
  };
  
  const handleInsert = (reference: string) => {
    onInsert(reference);
    setOpen(false);
  };
  
  if (upstreamNodes.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-2 border rounded-md bg-muted/30">
        Conecte blocos anteriores para referenciar suas saídas
      </div>
    );
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Variable className="h-4 w-4 mr-2" />
          Inserir variável de saída
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <p className="text-sm font-medium">Saídas disponíveis</p>
          <p className="text-xs text-muted-foreground">
            Selecione para inserir no campo de parâmetros
          </p>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2 space-y-4">
            {upstreamNodes.map((node) => {
              const nodeData = node.data as { label: string; type: string };
              const outputs = BLOCK_OUTPUTS[nodeData.type] || [];
              
              if (outputs.length === 0) return null;
              
              return (
                <div key={node.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {nodeData.label}
                    </Badge>
                  </div>
                  <div className="space-y-1 ml-2">
                    {outputs.map((output) => {
                      const reference = `{{${node.id}.${output.key}}}`;
                      return (
                        <div
                          key={output.key}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                          onClick={() => handleInsert(reference)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{output.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {output.description}
                            </p>
                            <code className="text-xs bg-muted px-1 rounded mt-1 inline-block">
                              {reference}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(reference);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
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
  );
}
