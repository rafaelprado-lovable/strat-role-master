import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { DefinitionField } from "@/services/definitionService";

interface Props {
  label: string;
  fields: DefinitionField[];
  onChange: (fields: DefinitionField[]) => void;
}

const FIELD_TYPES: DefinitionField['type'][] = ['string', 'text', 'number', 'boolean', 'json', 'list'];

export function DefinitionFieldsEditor({ label, fields, onChange }: Props) {
  const addField = () => {
    onChange([...fields, { name: '', label: '', type: 'string', required: false, placeholder: '', description: '' }]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, patch: Partial<DefinitionField>) => {
    onChange(fields.map((f, i) => i === index ? { ...f, ...patch } : f));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="h-3 w-3 mr-1" /> Campo
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Nenhum campo definido</p>
      )}

      {fields.map((field, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 rounded-md border border-border bg-muted/30">
          <div className="col-span-3">
            <Input
              placeholder="name"
              value={field.name}
              onChange={(e) => updateField(i, { name: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="col-span-3">
            <Input
              placeholder="Label"
              value={field.label}
              onChange={(e) => updateField(i, { label: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="col-span-2">
            <Select value={field.type} onValueChange={(v) => updateField(i, { type: v as DefinitionField['type'] })}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 flex items-center justify-center pt-2">
            <Checkbox
              checked={field.required || false}
              onCheckedChange={(checked) => updateField(i, { required: !!checked })}
            />
          </div>
          <div className="col-span-2">
            <Input
              placeholder="Placeholder"
              value={field.placeholder || ''}
              onChange={(e) => updateField(i, { placeholder: e.target.value })}
              className="text-xs"
            />
          </div>
          <div className="col-span-1 flex items-center justify-center">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeField(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}

      {fields.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-3 text-[10px] text-muted-foreground">
          <span className="col-span-3">name</span>
          <span className="col-span-3">label</span>
          <span className="col-span-2">tipo</span>
          <span className="col-span-1 text-center">req</span>
          <span className="col-span-2">placeholder</span>
          <span className="col-span-1"></span>
        </div>
      )}
    </div>
  );
}
