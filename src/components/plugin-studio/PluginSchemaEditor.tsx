import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PluginFieldDef } from '@/types/pluginStudio';
import { cn } from '@/lib/utils';

const FIELD_TYPES = ['string', 'text', 'number', 'boolean', 'json', 'list'] as const;

interface Props {
  title: string;
  fields: PluginFieldDef[];
  onChange: (fields: PluginFieldDef[]) => void;
  color?: string;
}

export function PluginSchemaEditor({ title, fields, onChange, color = 'primary' }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const addField = () => {
    onChange([...fields, {
      name: `field_${fields.length + 1}`,
      label: `Campo ${fields.length + 1}`,
      type: 'string',
      required: false,
      placeholder: '',
      description: '',
    }]);
  };

  const updateField = (index: number, updates: Partial<PluginFieldDef>) => {
    const updated = fields.map((f, i) => i === index ? { ...f, ...updates } : f);
    onChange(updated);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent/50 rounded-md transition-colors">
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">{fields.length} campos</span>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-1 px-1 pb-2">
        {fields.map((field, index) => (
          <div key={index} className="border border-border/50 rounded-md bg-background">
            {/* Field header */}
            <button
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-xs transition-colors',
                expanded === `${index}` ? 'bg-accent/30' : 'hover:bg-accent/20'
              )}
              onClick={() => setExpanded(expanded === `${index}` ? null : `${index}`)}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
              <code className="font-mono text-[11px] text-foreground">{field.name}</code>
              <span className="text-[10px] text-muted-foreground">({field.type})</span>
              {field.required && <span className="text-[9px] bg-destructive/20 text-destructive px-1 rounded">req</span>}
              <Trash2
                className="h-3 w-3 ml-auto text-muted-foreground hover:text-destructive cursor-pointer"
                onClick={(e) => { e.stopPropagation(); removeField(index); }}
              />
            </button>

            {/* Field details */}
            {expanded === `${index}` && (
              <div className="px-3 py-2 space-y-2 border-t border-border/30">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Name (ID)</Label>
                    <Input
                      className="h-7 text-xs font-mono"
                      value={field.name}
                      onChange={e => updateField(index, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Label</Label>
                    <Input
                      className="h-7 text-xs"
                      value={field.label}
                      onChange={e => updateField(index, { label: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px]">Tipo</Label>
                    <Select value={field.type} onValueChange={v => updateField(index, { type: v as any })}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Switch
                      checked={field.required || false}
                      onCheckedChange={v => updateField(index, { required: v })}
                    />
                    <Label className="text-[10px]">Obrigatório</Label>
                  </div>
                </div>

                <div>
                  <Label className="text-[10px]">Placeholder</Label>
                  <Input
                    className="h-7 text-xs"
                    value={field.placeholder || ''}
                    onChange={e => updateField(index, { placeholder: e.target.value })}
                    placeholder="Texto de exemplo..."
                  />
                </div>

                <div>
                  <Label className="text-[10px]">Descrição</Label>
                  <Input
                    className="h-7 text-xs"
                    value={field.description || ''}
                    onChange={e => updateField(index, { description: e.target.value })}
                    placeholder="Descreva o campo..."
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" size="sm" className="w-full h-7 text-[10px] gap-1 mt-1" onClick={addField}>
          <Plus className="h-3 w-3" />
          Adicionar campo
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
