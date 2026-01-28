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

interface OutputDef {
  key: string;
  label: string;
  required?: boolean;
}

// Default outputs for each block type
const DEFAULT_OUTPUTS: Record<string, OutputDef[]> = {
  alarm: [
    { key: 'alarmId', label: 'ID do Alarme', required: true },
    { key: 'alarmType', label: 'Tipo', required: true },
    { key: 'service', label: 'Serviço', required: false },
    { key: 'message', label: 'Mensagem', required: false },
    { key: 'timestamp', label: 'Timestamp', required: true },
  ],
  incident: [
    { key: 'incidentId', label: 'ID do Incidente', required: true },
    { key: 'priority', label: 'Prioridade', required: true },
    { key: 'team', label: 'Equipe', required: false },
    { key: 'title', label: 'Título', required: true },
    { key: 'description', label: 'Descrição', required: false },
  ],
  rabbit_full: [
    { key: 'queueName', label: 'Nome da Fila', required: true },
    { key: 'messageCount', label: 'Qtd Mensagens', required: true },
    { key: 'usagePercent', label: 'Uso (%)', required: true },
    { key: 'threshold', label: 'Threshold', required: false },
  ],
  webhook: [
    { key: 'statusCode', label: 'Status Code', required: true },
    { key: 'responseBody', label: 'Response Body', required: false },
    { key: 'responseHeaders', label: 'Headers', required: false },
  ],
  email: [
    { key: 'sent', label: 'Enviado', required: true },
    { key: 'messageId', label: 'Message ID', required: false },
  ],
  slack: [
    { key: 'sent', label: 'Enviado', required: true },
    { key: 'messageTs', label: 'Message TS', required: false },
  ],
  script: [
    { key: 'result', label: 'Resultado', required: false },
    { key: 'success', label: 'Sucesso', required: true },
    { key: 'error', label: 'Erro', required: false },
  ],
  delay: [
    { key: 'completed', label: 'Completado', required: true },
    { key: 'duration', label: 'Duração', required: false },
  ],
  if: [
    { key: 'result', label: 'Resultado', required: true },
    { key: 'branch', label: 'Branch', required: true },
  ],
  filter: [
    { key: 'passed', label: 'Passou', required: true },
    { key: 'data', label: 'Dados', required: false },
  ],
  customBlock: [
    { key: 'stdout', label: 'Stdout', required: false },
    { key: 'stderr', label: 'Stderr', required: false },
    { key: 'exitCode', label: 'Exit Code', required: true },
    { key: 'result', label: 'Resultado', required: false },
  ],
};

interface InputDef {
  key: string;
  label: string;
  required?: boolean;
}

// Default inputs for each block type
const DEFAULT_INPUTS: Record<string, InputDef[]> = {
  webhook: [
    { key: 'url', label: 'URL', required: true },
    { key: 'body', label: 'Body', required: false },
    { key: 'headers', label: 'Headers', required: false },
  ],
  email: [
    { key: 'to', label: 'Destinatário', required: true },
    { key: 'subject', label: 'Assunto', required: true },
    { key: 'body', label: 'Corpo', required: false },
  ],
  slack: [
    { key: 'channel', label: 'Canal', required: true },
    { key: 'message', label: 'Mensagem', required: true },
  ],
  script: [
    { key: 'input', label: 'Input', required: false },
  ],
  delay: [
    { key: 'duration', label: 'Duração', required: true },
  ],
  if: [
    { key: 'field', label: 'Campo', required: true },
    { key: 'value', label: 'Valor', required: true },
  ],
  filter: [
    { key: 'expression', label: 'Expressão', required: true },
  ],
  customBlock: [
    { key: 'params', label: 'Parâmetros', required: false },
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
  const customOutputs = (sourceConfig.outputs as OutputDef[]) || [];
  const defaultOutputs = DEFAULT_OUTPUTS[sourceType] || [];
  const sourceOutputs: OutputDef[] = [...customOutputs, ...defaultOutputs];

  // Get inputs for target node
  const targetInputs: InputDef[] = DEFAULT_INPUTS[targetType] || [];

  // Check if all required inputs are mapped
  const requiredInputs = targetInputs.filter((i) => i.required);
  const mappedInputs = mappings.map((m) => m.targetInput);
  const missingRequired = requiredInputs.filter((i) => !mappedInputs.includes(i.key));

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
                                  <span className="flex items-center gap-2">
                                    {output.label}
                                    {output.required && (
                                      <span className="text-[10px] text-destructive">*</span>
                                    )}
                                  </span>
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
                                  <span className="flex items-center gap-2">
                                    {input.label}
                                    {input.required && (
                                      <span className="text-[10px] text-destructive font-bold">*</span>
                                    )}
                                  </span>
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

            {/* Required inputs warning */}
            {missingRequired.length > 0 && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30">
                <p className="text-xs font-medium text-destructive mb-2">
                  Entradas obrigatórias não mapeadas:
                </p>
                <div className="flex flex-wrap gap-1">
                  {missingRequired.map((input) => (
                    <Badge
                      key={input.key}
                      variant="destructive"
                      className="text-xs"
                    >
                      {input.label}
                    </Badge>
                  ))}
                </div>
              </div>
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
                      variant={output.required ? "default" : "outline"}
                      className="text-xs font-mono"
                    >
                      {output.key}
                      {output.required && <span className="ml-1">*</span>}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  * = obrigatório
                </p>
              </div>
            )}

            {/* Target inputs reference */}
            {targetInputs.length > 0 && (
              <div className="mt-2 p-3 rounded-md bg-muted/30 border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Entradas de "{targetNode.data.label as string}":
                </p>
                <div className="flex flex-wrap gap-1">
                  {targetInputs.map((input) => (
                    <Badge
                      key={input.key}
                      variant={input.required ? "default" : "outline"}
                      className="text-xs font-mono"
                    >
                      {input.key}
                      {input.required && <span className="ml-1">*</span>}
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
          <Button onClick={handleSave} disabled={missingRequired.length > 0}>
            Salvar Mapeamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
