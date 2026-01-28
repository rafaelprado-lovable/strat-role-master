import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Tag } from 'lucide-react';

interface OutputConfig {
  key: string;
  label: string;
  description: string;
}

interface OutputConfigPanelProps {
  outputs: OutputConfig[];
  onChange: (outputs: OutputConfig[]) => void;
}

export function OutputConfigPanel({ outputs, onChange }: OutputConfigPanelProps) {
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAdd = () => {
    if (!newKey.trim() || !newLabel.trim()) return;

    const newOutput: OutputConfig = {
      key: newKey.trim().replace(/\s+/g, '_').toLowerCase(),
      label: newLabel.trim(),
      description: newDescription.trim(),
    };

    onChange([...outputs, newOutput]);
    setNewKey('');
    setNewLabel('');
    setNewDescription('');
  };

  const handleRemove = (key: string) => {
    onChange(outputs.filter((o) => o.key !== key));
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
        <Tag className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Saídas do bloco</Label>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Configure os campos de saída que este bloco disponibiliza para os próximos steps
      </p>

      {outputs.length > 0 && (
        <div className="space-y-2">
          {outputs.map((output) => (
            <div
              key={output.key}
              className="flex items-center gap-2 p-2 rounded-md border bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {output.key}
                  </Badge>
                  <span className="text-sm font-medium truncate">{output.label}</span>
                </div>
                {output.description && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {output.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => handleRemove(output.key)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 p-3 border rounded-md bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground">Adicionar saída</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Chave (ex: result)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm"
          />
          <Input
            placeholder="Nome (ex: Resultado)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm"
          />
        </div>
        <Input
          placeholder="Descrição (opcional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyPress={handleKeyPress}
          className="text-sm"
        />
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={handleAdd}
          disabled={!newKey.trim() || !newLabel.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Adicionar saída
        </Button>
      </div>
    </div>
  );
}
