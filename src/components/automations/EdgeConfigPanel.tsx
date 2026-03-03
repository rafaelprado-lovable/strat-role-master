import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Link2, Trash2 } from 'lucide-react';
import { TaskDefinition } from '@/types/automations';

export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';
export type EdgeArrowType = 'arrow' | 'arrowclosed' | 'none';

export interface EdgeStyleConfig {
  lineStyle: EdgeLineStyle;
  arrowType: EdgeArrowType;
}

interface EdgeConfigPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edge: { id: string; from: string; to: string; condition?: string; styleConfig?: EdgeStyleConfig } | null;
  sourceLabel: string;
  targetLabel: string;
  sourceDefinition?: TaskDefinition;
  onSave: (edgeId: string, condition: string | undefined, styleConfig: EdgeStyleConfig) => void;
  onDelete: (edgeId: string) => void;
}

const LINE_STYLES: { value: EdgeLineStyle; label: string; preview: string }[] = [
  { value: 'solid', label: 'Sólida', preview: '────────' },
  { value: 'dashed', label: 'Tracejada', preview: '── ── ── ' },
  { value: 'dotted', label: 'Pontilhada', preview: '· · · · · · · ·' },
];

const ARROW_TYPES: { value: EdgeArrowType; label: string; preview: string }[] = [
  { value: 'arrowclosed', label: 'Seta preenchida', preview: '───▶' },
  { value: 'arrow', label: 'Seta aberta', preview: '───>' },
  { value: 'none', label: 'Sem seta', preview: '────' },
];

export function EdgeConfigPanel({
  open,
  onOpenChange,
  edge,
  sourceLabel,
  targetLabel,
  sourceDefinition,
  onSave,
  onDelete,
}: EdgeConfigPanelProps) {
  const [hasCondition, setHasCondition] = useState(false);
  const [condition, setCondition] = useState('');
  const [lineStyle, setLineStyle] = useState<EdgeLineStyle>('solid');
  const [arrowType, setArrowType] = useState<EdgeArrowType>('arrowclosed');

  useEffect(() => {
    if (edge && open) {
      setHasCondition(!!edge.condition);
      setCondition(edge.condition || '');
      setLineStyle(edge.styleConfig?.lineStyle || 'solid');
      setArrowType(edge.styleConfig?.arrowType || 'arrowclosed');
    }
  }, [edge, open]);

  if (!edge) return null;

  const outputKeys = sourceDefinition
    ? Object.keys(sourceDefinition.schema.outputs)
    : [];

  const handleSave = () => {
    onSave(
      edge.id,
      hasCondition && condition.trim() ? condition.trim() : undefined,
      { lineStyle, arrowType }
    );
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Configurar Conexão
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Connection summary */}
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-muted/50">
            <Badge variant="secondary" className="text-xs">{sourceLabel}</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">{targetLabel}</Badge>
          </div>

          <Separator />

          {/* Line Style */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tipo de Linha</Label>
            <div className="space-y-2">
              {LINE_STYLES.map((ls) => (
                <button
                  key={ls.value}
                  onClick={() => setLineStyle(ls.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-sm ${
                    lineStyle === ls.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="font-medium">{ls.label}</span>
                  <span className="font-mono text-muted-foreground text-xs">{ls.preview}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Arrow Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Seta</Label>
            <div className="space-y-2">
              {ARROW_TYPES.map((at) => (
                <button
                  key={at.value}
                  onClick={() => setArrowType(at.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-sm ${
                    arrowType === at.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="font-medium">{at.label}</span>
                  <span className="font-mono text-muted-foreground text-xs">{at.preview}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Condition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Condicional</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Execução segue só se a condição for verdadeira
                </p>
              </div>
              <Switch checked={hasCondition} onCheckedChange={setHasCondition} />
            </div>

            {hasCondition && (
              <div className="space-y-3">
                <Input
                  placeholder={`Ex: ${edge.from}.status == 200`}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Use <code className="bg-muted px-1 rounded">nodeId.output</code> para referenciar saídas
                </p>

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
                              prev ? `${prev} ${edge.from}.${key}` : `${edge.from}.${key}`
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

          <Separator />

          {/* Actions */}
          <div className="flex justify-between pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(edge.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
            <Button size="sm" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
