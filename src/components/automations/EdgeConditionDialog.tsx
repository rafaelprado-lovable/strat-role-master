import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Link2 } from 'lucide-react';
import { TaskDefinition, WorkflowEdge } from '@/types/automations';

interface EdgeConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edge: { id: string; from: string; to: string; condition?: string } | null;
  sourceLabel: string;
  targetLabel: string;
  sourceDefinition?: TaskDefinition;
  onSave: (edgeId: string, condition: string | undefined) => void;
}

export function EdgeConditionDialog({
  open,
  onOpenChange,
  edge,
  sourceLabel,
  targetLabel,
  sourceDefinition,
  onSave,
}: EdgeConditionDialogProps) {
  const [hasCondition, setHasCondition] = useState(false);
  const [condition, setCondition] = useState('');

  useEffect(() => {
    if (edge && open) {
      setHasCondition(!!edge.condition);
      setCondition(edge.condition || '');
    }
  }, [edge, open]);

  if (!edge) return null;

  const outputKeys = sourceDefinition
    ? Object.keys(sourceDefinition.schema.outputs)
    : [];

  const handleSave = () => {
    onSave(edge.id, hasCondition && condition.trim() ? condition.trim() : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Configurar Edge
          </DialogTitle>
          <DialogDescription>
            Configure uma condição opcional para esta conexão
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Connection summary */}
          <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/50">
            <Badge variant="secondary">{sourceLabel}</Badge>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <Badge variant="secondary">{targetLabel}</Badge>
          </div>

          {/* Condition toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Condicional</Label>
              <p className="text-xs text-muted-foreground">
                A execução só segue se a condição for verdadeira
              </p>
            </div>
            <Switch checked={hasCondition} onCheckedChange={setHasCondition} />
          </div>

          {hasCondition && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Condição</Label>
                <Input
                  placeholder={`Ex: ${edge.from}.status == 200`}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">nodeId.output</code> para
                  referenciar saídas
                </p>
              </div>

              {/* Available outputs reference */}
              {outputKeys.length > 0 && (
                <div className="p-3 rounded-md bg-muted/30 border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Saídas de "{sourceLabel}":
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {outputKeys.map((key) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className="text-xs font-mono cursor-pointer hover:bg-primary/10"
                        onClick={() =>
                          setCondition((prev) =>
                            prev
                              ? `${prev} ${edge.from}.${key}`
                              : `${edge.from}.${key}`
                          )
                        }
                      >
                        {edge.from}.{key}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
