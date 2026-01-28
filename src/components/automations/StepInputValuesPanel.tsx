import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowDownToLine } from 'lucide-react';
import { StepInputValue, PARAM_TYPES, ParamType } from '@/types/automations';

interface StepInputValuesPanelProps {
  inputs: StepInputValue[];
  onChange: (inputs: StepInputValue[]) => void;
}

export function StepInputValuesPanel({ inputs, onChange }: StepInputValuesPanelProps) {
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<ParamType>('string');
  const [newMandatory, setNewMandatory] = useState(false);

  const handleAdd = () => {
    if (!newParamName.trim()) return;

    const newInput: StepInputValue = {
      paramName: newParamName.trim().replace(/\s+/g, '_').toLowerCase(),
      paramType: newParamType,
      mandatory: newMandatory,
    };

    onChange([...inputs, newInput]);
    setNewParamName('');
    setNewParamType('string');
    setNewMandatory(false);
  };

  const handleRemove = (paramName: string) => {
    onChange(inputs.filter((i) => i.paramName !== paramName));
  };

  const handleToggleMandatory = (paramName: string) => {
    onChange(
      inputs.map((i) =>
        i.paramName === paramName ? { ...i, mandatory: !i.mandatory } : i
      )
    );
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
        <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Valores de Entrada (Input)</Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Parâmetros variáveis que podem vir de steps anteriores
      </p>

      {inputs.length > 0 && (
        <div className="space-y-2">
          {inputs.map((input) => (
            <div
              key={input.paramName}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {input.paramName}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {input.paramType}
                  </Badge>
                  {input.mandatory ? (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                      Obrigatório
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                      Opcional
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleToggleMandatory(input.paramName)}
              >
                {input.mandatory ? 'Tornar opcional' : 'Tornar obrigatório'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRemove(input.paramName)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground">Adicionar entrada</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome (ex: service_name)"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="mandatory"
              checked={newMandatory}
              onCheckedChange={setNewMandatory}
            />
            <Label htmlFor="mandatory" className="text-sm cursor-pointer">
              Obrigatório
            </Label>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            disabled={!newParamName.trim()}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
