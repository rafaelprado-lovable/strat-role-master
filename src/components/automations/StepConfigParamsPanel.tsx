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
import { Plus, Trash2, Settings } from 'lucide-react';
import { StepConfigParam, PARAM_TYPES, ParamType } from '@/types/automations';

interface StepConfigParamsPanelProps {
  params: StepConfigParam[];
  onChange: (params: StepConfigParam[]) => void;
}

export function StepConfigParamsPanel({ params, onChange }: StepConfigParamsPanelProps) {
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState<ParamType>('string');
  const [newParamExample, setNewParamExample] = useState('');
  const [newParamValue, setNewParamValue] = useState('');

  const handleAdd = () => {
    if (!newParamName.trim()) return;

    const newParam: StepConfigParam = {
      paramName: newParamName.trim().replace(/\s+/g, '_').toLowerCase(),
      paramType: newParamType,
      paramExample: newParamExample.trim(),
      paramValue: newParamValue.trim(),
    };

    onChange([...params, newParam]);
    setNewParamName('');
    setNewParamType('string');
    setNewParamExample('');
    setNewParamValue('');
  };

  const handleRemove = (paramName: string) => {
    onChange(params.filter((p) => p.paramName !== paramName));
  };

  const handleUpdateValue = (paramName: string, value: string) => {
    onChange(
      params.map((p) =>
        p.paramName === paramName ? { ...p, paramValue: value } : p
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
        <Settings className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Parâmetros de Configuração</Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Variáveis estáticas do bloco (autenticação, endpoints, etc.)
      </p>

      {params.length > 0 && (
        <div className="space-y-2">
          {params.map((param) => (
            <div
              key={param.paramName}
              className="flex items-start gap-2 p-3 rounded-md border bg-muted/30"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {param.paramName}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {param.paramType}
                  </Badge>
                </div>
                <Input
                  placeholder={param.paramExample || 'Valor...'}
                  value={param.paramValue}
                  onChange={(e) => handleUpdateValue(param.paramName, e.target.value)}
                  className="h-8 text-sm"
                />
                {param.paramExample && (
                  <p className="text-[10px] text-muted-foreground">
                    Ex: {param.paramExample}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRemove(param.paramName)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground">Adicionar parâmetro</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome (ex: api_key)"
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
        <Input
          placeholder="Exemplo (ex: sk-xxx...)"
          value={newParamExample}
          onChange={(e) => setNewParamExample(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-sm"
        />
        <Input
          placeholder="Valor padrão"
          value={newParamValue}
          onChange={(e) => setNewParamValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-sm"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={handleAdd}
          disabled={!newParamName.trim()}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar Parâmetro
        </Button>
      </div>
    </div>
  );
}
