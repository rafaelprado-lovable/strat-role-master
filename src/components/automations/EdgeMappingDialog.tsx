import { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Link2, Plus, Trash2 } from 'lucide-react';

interface ParameterMapping {
  sourceOutput: string;
  targetInput: string;
}

interface EdgeMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edge: Edge | null;
  sourceNode: Node | null;
  targetNode: Node | null;
  onSave: (edgeId: string, mappings: ParameterMapping[]) => void;
}

// Default outputs for each block type
const DEFAULT_OUTPUTS: Record<string, { key: string; label: string }[]> = {
  alarm: [
    { key: 'alarmId', label: 'ID do Alarme' },
    { key: 'alarmType', label: 'Tipo' },
    { key: 'service', label: 'Serviço' },
    { key: 'message', label: 'Mensagem' },
    { key: 'timestamp', label: 'Timestamp' },
  ],
  incident: [
    { key: 'incidentId', label: 'ID do Incidente' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'team', label: 'Equipe' },
    { key: 'title', label: 'Título' },
    { key: 'description', label: 'Descrição' },
  ],
  rabbit_full: [
    { key: 'queueName', label: 'Nome da Fila' },
    { key: 'messageCount', label: 'Qtd Mensagens' },
    { key: 'usagePercent', label: 'Uso (%)' },
    { key: 'threshold', label: 'Threshold' },
  ],
  webhook: [
    { key: 'statusCode', label: 'Status Code' },
    { key: 'responseBody', label: 'Response Body' },
    { key: 'responseHeaders', label: 'Headers' },
  ],
  email: [
    { key: 'sent', label: 'Enviado' },
    { key: 'messageId', label: 'Message ID' },
  ],
  slack: [
    { key: 'sent', label: 'Enviado' },
    { key: 'messageTs', label: 'Message TS' },
  ],
  script: [
    { key: 'result', label: 'Resultado' },
    { key: 'success', label: 'Sucesso' },
    { key: 'error', label: 'Erro' },
  ],
  delay: [
    { key: 'completed', label: 'Completado' },
    { key: 'duration', label: 'Duração' },
  ],
  if: [
    { key: 'result', label: 'Resultado' },
    { key: 'branch', label: 'Branch' },
  ],
  filter: [
    { key: 'passed', label: 'Passou' },
    { key: 'data', label: 'Dados' },
  ],
  customBlock: [
    { key: 'stdout', label: 'Stdout' },
    { key: 'stderr', label: 'Stderr' },
    { key: 'exitCode', label: 'Exit Code' },
    { key: 'result', label: 'Resultado' },
  ],
};

// Default inputs for each block type
const DEFAULT_INPUTS: Record<string, { key: string; label: string }[]> = {
  webhook: [
    { key: 'url', label: 'URL' },
    { key: 'body', label: 'Body' },
    { key: 'headers', label: 'Headers' },
  ],
  email: [
    { key: 'to', label: 'Destinatário' },
    { key: 'subject', label: 'Assunto' },
    { key: 'body', label: 'Corpo' },
  ],
  slack: [
    { key: 'channel', label: 'Canal' },
    { key: 'message', label: 'Mensagem' },
  ],
  script: [
    { key: 'input', label: 'Input' },
  ],
  delay: [
    { key: 'duration', label: 'Duração' },
  ],
  if: [
    { key: 'field', label: 'Campo' },
    { key: 'value', label: 'Valor' },
  ],
  filter: [
    { key: 'expression', label: 'Expressão' },
  ],
  customBlock: [
    { key: 'params', label: 'Parâmetros' },
  ],
};

export function EdgeMappingDialog({
  open,
  onOpenChange,
  edge,
  sourceNode,
  targetNode,
  onSave,
}: EdgeMappingDialogProps) {
  const [mappings, setMappings] = useState<ParameterMapping[]>([]);

  useEffect(() => {
    if (edge && open) {
      // Load existing mappings from edge data
      const existingMappings = (edge.data?.mappings as ParameterMapping[]) || [];
      setMappings(existingMappings);
    }
  }, [edge, open]);

  if (!edge || !sourceNode || !targetNode) return null;

  const sourceData = sourceNode.data as Record<string, unknown>;
  const targetData = targetNode.data as Record<string, unknown>;
  const sourceType = sourceData.type as string;
  const targetType = targetData.type as string;

  // Get outputs from source node (custom + default)
  const sourceConfig = (sourceData.config as Record<string, unknown>) || {};
  const customOutputs = (sourceConfig.outputs as { key: string; label: string }[]) || [];
  const defaultOutputs = DEFAULT_OUTPUTS[sourceType] || [];
  const sourceOutputs = [...customOutputs, ...defaultOutputs];

  // Get inputs for target node
  const targetInputs = DEFAULT_INPUTS[targetType] || [];

  const handleAddMapping = () => {
    setMappings([...mappings, { sourceOutput: '', targetInput: '' }]);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleMappingChange = (
    index: number,
    field: 'sourceOutput' | 'targetInput',
    value: string
  ) => {
    setMappings(
      mappings.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const handleSave = () => {
    const validMappings = mappings.filter(
      (m) => m.sourceOutput && m.targetInput
    );
    onSave(edge.id, validMappings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Mapeamento de Parâmetros
          </DialogTitle>
          <DialogDescription>
            Configure quais saídas do bloco anterior serão usadas como entradas do próximo
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Connection summary */}
          <div className="flex items-center justify-center gap-4 p-4 mb-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <Badge variant="secondary" className="mb-1">
                {sourceNode.data.label as string}
              </Badge>
              <p className="text-xs text-muted-foreground">Origem</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <div className="text-center">
              <Badge variant="secondary" className="mb-1">
                {targetNode.data.label as string}
              </Badge>
              <p className="text-xs text-muted-foreground">Destino</p>
            </div>
          </div>

          {/* Mappings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mapeamentos</Label>
              <Button size="sm" variant="outline" onClick={handleAddMapping}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar
              </Button>
            </div>

            {mappings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm border rounded-md border-dashed">
                <p>Nenhum mapeamento configurado</p>
                <p className="text-xs mt-1">
                  Clique em "Adicionar" para mapear saídas para entradas
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {mappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-md border bg-card"
                    >
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Saída (origem)
                        </Label>
                        <Select
                          value={mapping.sourceOutput}
                          onValueChange={(v) =>
                            handleMappingChange(index, 'sourceOutput', v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceOutputs.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Nenhuma saída disponível
                              </SelectItem>
                            ) : (
                              sourceOutputs.map((output) => (
                                <SelectItem key={output.key} value={output.key}>
                                  {output.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-5" />

                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Entrada (destino)
                        </Label>
                        <Select
                          value={mapping.targetInput}
                          onValueChange={(v) =>
                            handleMappingChange(index, 'targetInput', v)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {targetInputs.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Nenhuma entrada disponível
                              </SelectItem>
                            ) : (
                              targetInputs.map((input) => (
                                <SelectItem key={input.key} value={input.key}>
                                  {input.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 mt-5"
                        onClick={() => handleRemoveMapping(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Quick reference */}
            {sourceOutputs.length > 0 && (
              <div className="mt-4 p-3 rounded-md bg-muted/30 border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Saídas disponíveis de "{sourceNode.data.label as string}":
                </p>
                <div className="flex flex-wrap gap-1">
                  {sourceOutputs.map((output) => (
                    <Badge
                      key={output.key}
                      variant="outline"
                      className="text-xs font-mono"
                    >
                      {output.key}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Mapeamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
