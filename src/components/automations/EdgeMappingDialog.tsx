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
import { StepInputValue, StepOutputValue } from '@/types/automations';

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
  paramName: string;
  paramType: string;
}

interface InputDef {
  paramName: string;
  paramType: string;
  mandatory: boolean;
}

// Default outputs for each block type (now using the new schema structure)
const DEFAULT_OUTPUTS: Record<string, StepOutputValue[]> = {
  alarm: [
    { paramName: 'alarmId', paramType: 'string' },
    { paramName: 'alarmType', paramType: 'string' },
    { paramName: 'service', paramType: 'string' },
    { paramName: 'message', paramType: 'string' },
    { paramName: 'timestamp', paramType: 'string' },
  ],
  incident: [
    { paramName: 'incidentId', paramType: 'string' },
    { paramName: 'priority', paramType: 'string' },
    { paramName: 'team', paramType: 'string' },
    { paramName: 'title', paramType: 'string' },
    { paramName: 'description', paramType: 'string' },
  ],
  rabbit_full: [
    { paramName: 'queueName', paramType: 'string' },
    { paramName: 'messageCount', paramType: 'integer' },
    { paramName: 'usagePercent', paramType: 'integer' },
    { paramName: 'threshold', paramType: 'integer' },
  ],
  webhook: [
    { paramName: 'statusCode', paramType: 'integer' },
    { paramName: 'responseBody', paramType: 'object' },
    { paramName: 'responseHeaders', paramType: 'object' },
  ],
  email: [
    { paramName: 'sent', paramType: 'boolean' },
    { paramName: 'messageId', paramType: 'string' },
  ],
  slack: [
    { paramName: 'sent', paramType: 'boolean' },
    { paramName: 'messageTs', paramType: 'string' },
  ],
  script: [
    { paramName: 'result', paramType: 'object' },
    { paramName: 'success', paramType: 'boolean' },
    { paramName: 'error', paramType: 'string' },
  ],
  delay: [
    { paramName: 'completed', paramType: 'boolean' },
    { paramName: 'duration', paramType: 'integer' },
  ],
  if: [
    { paramName: 'result', paramType: 'boolean' },
    { paramName: 'branch', paramType: 'string' },
  ],
  filter: [
    { paramName: 'passed', paramType: 'boolean' },
    { paramName: 'data', paramType: 'object' },
  ],
  customBlock: [
    { paramName: 'stdout', paramType: 'string' },
    { paramName: 'stderr', paramType: 'string' },
    { paramName: 'exitCode', paramType: 'integer' },
    { paramName: 'result', paramType: 'object' },
  ],
};

// Default inputs for each block type (now using the new schema structure)
const DEFAULT_INPUTS: Record<string, StepInputValue[]> = {
  webhook: [
    { paramName: 'url', paramType: 'string', mandatory: true },
    { paramName: 'body', paramType: 'object', mandatory: false },
    { paramName: 'headers', paramType: 'object', mandatory: false },
  ],
  email: [
    { paramName: 'to', paramType: 'string', mandatory: true },
    { paramName: 'subject', paramType: 'string', mandatory: true },
    { paramName: 'body', paramType: 'string', mandatory: false },
  ],
  slack: [
    { paramName: 'channel', paramType: 'string', mandatory: true },
    { paramName: 'message', paramType: 'string', mandatory: true },
  ],
  script: [
    { paramName: 'input', paramType: 'object', mandatory: false },
  ],
  delay: [
    { paramName: 'duration', paramType: 'integer', mandatory: true },
  ],
  if: [
    { paramName: 'field', paramType: 'string', mandatory: true },
    { paramName: 'value', paramType: 'string', mandatory: true },
  ],
  filter: [
    { paramName: 'expression', paramType: 'string', mandatory: true },
  ],
  customBlock: [],
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
      const existingMappings = (edge.data?.mappings as ParameterMapping[]) || [];
      setMappings(existingMappings);
    }
  }, [edge, open]);

  if (!edge || !sourceNode || !targetNode) return null;

  const sourceData = sourceNode.data as Record<string, unknown>;
  const targetData = targetNode.data as Record<string, unknown>;
  const sourceType = sourceData.type as string;
  const targetType = targetData.type as string;

  // Get outputs from source node (custom stepOutputValue + defaults)
  const customOutputs = (sourceData.stepOutputValue as StepOutputValue[]) || [];
  const defaultOutputs = DEFAULT_OUTPUTS[sourceType] || [];
  const sourceOutputs: OutputDef[] = [
    ...customOutputs.map((o) => ({ paramName: o.paramName, paramType: o.paramType })),
    ...defaultOutputs.map((o) => ({ paramName: o.paramName, paramType: o.paramType })),
  ];

  // Get inputs for target node (custom stepInputValue + defaults)
  const customInputs = (targetData.stepInputValue as StepInputValue[]) || [];
  const defaultInputs = DEFAULT_INPUTS[targetType] || [];
  const targetInputs: InputDef[] = [
    ...customInputs.map((i) => ({ paramName: i.paramName, paramType: i.paramType, mandatory: i.mandatory })),
    ...defaultInputs.map((i) => ({ paramName: i.paramName, paramType: i.paramType, mandatory: i.mandatory })),
  ];

  // Check if all required inputs are mapped
  const requiredInputs = targetInputs.filter((i) => i.mandatory);
  const mappedInputs = mappings.map((m) => m.targetInput);
  const missingRequired = requiredInputs.filter((i) => !mappedInputs.includes(i.paramName));

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
                                <SelectItem key={output.paramName} value={output.paramName}>
                                  <span className="flex items-center gap-2">
                                    {output.paramName}
                                    <Badge variant="outline" className="text-[9px] px-1">
                                      {output.paramType}
                                    </Badge>
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
                                <SelectItem key={input.paramName} value={input.paramName}>
                                  <span className="flex items-center gap-2">
                                    {input.paramName}
                                    <Badge variant="outline" className="text-[9px] px-1">
                                      {input.paramType}
                                    </Badge>
                                    {input.mandatory && (
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
                      key={input.paramName}
                      variant="destructive"
                      className="text-xs"
                    >
                      {input.paramName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick reference */}
            {sourceOutputs.length > 0 && (
              <div className="mt-4 p-3 rounded-md bg-muted/30 border">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Saídas de "{sourceNode.data.label as string}":
                </p>
                <div className="flex flex-wrap gap-1">
                  {sourceOutputs.map((output) => (
                    <Badge
                      key={output.paramName}
                      variant="outline"
                      className="text-xs font-mono"
                    >
                      {output.paramName}
                      <span className="ml-1 text-[9px] text-muted-foreground">
                        ({output.paramType})
                      </span>
                    </Badge>
                  ))}
                </div>
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
                      key={input.paramName}
                      variant={input.mandatory ? "default" : "outline"}
                      className="text-xs font-mono"
                    >
                      {input.paramName}
                      <span className="ml-1 text-[9px]">
                        ({input.paramType})
                      </span>
                      {input.mandatory && <span className="ml-1">*</span>}
                    </Badge>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  * = obrigatório
                </p>
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
