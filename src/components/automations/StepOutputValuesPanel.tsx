import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowUpFromLine } from 'lucide-react';
import { StepOutputValue, PARAM_TYPES, ParamType } from '@/types/automations';

interface StepOutputValuesPanelProps {
  outputs: StepOutputValue[];
  onChange: (outputs: StepOutputValue[]) => void;
}

export function StepOutputValuesPanel({ outputs, onChange }: StepOutputValuesPanelProps) {
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<ParamType>('string');

  const handleAdd = () => {
    if (!newParamName.trim()) return;

    const newOutput: StepOutputValue = {
      paramName: newParamName.trim().replace(/\s+/g, '_').toLowerCase(),
      paramType: newParamType,
    };

    onChange([...outputs, newOutput]);
    setNewParamName('');
    setNewParamType('string');
  };

  const handleRemove = (paramName: string) => {
    onChange(outputs.filter((o) => o.paramName !== paramName));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Valores de Saída (Output)</Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Dados produzidos por este bloco para os próximos steps
      </p>

      {outputs.length > 0 && (
        <div className="space-y-2">
          {outputs.map((output) => (
            <div
              key={output.paramName}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {output.paramName}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {output.paramType}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRemove(output.paramName)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground">Adicionar saída</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome (ex: success_rate)"
            value={newParamName}
            onChange={(e) => setNewParamName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm"
          />
          <Select value={newParamType} onValueChange={(v) => setNewParamType(v as ParamType)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARAM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleAdd}
          disabled={!newParamName.trim()}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar Saída
        </Button>
      </div>
    </div>
  );
}
