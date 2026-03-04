import { useState } from 'react';
import { type Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Repeat, Eye } from 'lucide-react';
import { DEFINITION_IDS, type WorkflowForEach } from '@/types/automations';

interface NodeConfigPanelProps {
  node: Node;
  inputs: Record<string, unknown>;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onUpdateInputs: (nodeId: string, inputs: Record<string, unknown>) => void;
  onClose: () => void;
}

function resolveTemplate(template: string, mockData: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.\-]+)\}\}/g, (_, key) => {
    const val = key.split('.').reduce((o: any, k: string) => o?.[k], mockData);
    return val !== undefined ? String(val) : `[${key}]`;
  });
}

export function NodeConfigPanel({ node, inputs, onUpdate, onUpdateInputs, onClose }: NodeConfigPanelProps) {
  const d = node.data as Record<string, any>;
  const forEach: WorkflowForEach | undefined = d.for_each;
  const [forEachEnabled, setForEachEnabled] = useState(!!forEach);
  const [inputsJson, setInputsJson] = useState(JSON.stringify(inputs || {}, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: unknown) => {
    onUpdate(node.id, { ...d, [key]: value });
  };

  const updateForEach = (field: string, value: string) => {
    const current = d.for_each || { items: '', item_var: 'item', index_var: 'index' };
    update('for_each', { ...current, [field]: value });
    update('hasForEach', true);
  };

  const toggleForEach = (enabled: boolean) => {
    setForEachEnabled(enabled);
    if (enabled) {
      update('for_each', { items: '', item_var: 'item', index_var: 'index' });
      update('hasForEach', true);
    } else {
      update('for_each', undefined);
      update('hasForEach', false);
    }
  };

  const handleInputsChange = (val: string) => {
    setInputsJson(val);
    try {
      const parsed = JSON.parse(val);
      setJsonError('');
      onUpdateInputs(node.id, parsed);
    } catch {
      setJsonError('JSON inválido');
    }
  };

  const mockData: Record<string, unknown> = {
    item: { campo: 'valor_mock', id: 123 },
    index: 0,
  };

  return (
    <div className="w-80 shrink-0 border rounded-lg bg-card overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Configuração do Nó</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* ID (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-xs">ID do Nó</Label>
          <Input value={node.id} disabled className="h-8 text-sm font-mono bg-muted" />
        </div>

        {/* Label */}
        <div className="space-y-1.5">
          <Label className="text-xs">Nome</Label>
          <Input
            value={d.label || ''}
            onChange={(e) => update('label', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Definition ID */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo (definition_id) <span className="text-destructive">*</span></Label>
          <Select value={d.definition_id || ''} onValueChange={(v) => update('definition_id', v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {DEFINITION_IDS.map((def) => (
                <SelectItem key={def.value} value={def.value}>
                  {def.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs">Descrição</Label>
          <Input
            value={d.description || ''}
            onChange={(e) => update('description', e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* for_each */}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs font-semibold">for_each</Label>
            </div>
            <Switch checked={forEachEnabled} onCheckedChange={toggleForEach} />
          </div>

          {forEachEnabled && (
            <div className="space-y-3 pl-1">
              <div className="space-y-1.5">
                <Label className="text-xs">items <span className="text-destructive">*</span></Label>
                <Input
                  value={forEach?.items || ''}
                  onChange={(e) => updateForEach('items', e.target.value)}
                  placeholder="{{node-x.output.items}}"
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">item_var</Label>
                <Input
                  value={forEach?.item_var || 'item'}
                  onChange={(e) => updateForEach('item_var', e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">index_var</Label>
                <Input
                  value={forEach?.index_var || 'index'}
                  onChange={(e) => updateForEach('index_var', e.target.value)}
                  className="h-8 text-sm font-mono"
                />
              </div>
              {forEach?.item_var && forEach?.index_var && forEach.item_var === forEach.index_var && (
                <p className="text-xs text-destructive">⚠ item_var e index_var não podem ser iguais</p>
              )}
            </div>
          )}
        </div>

        {/* Inputs JSON */}
        <div className="border-t border-border pt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">Inputs (JSON)</Label>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-3 w-3" />
              {showPreview ? 'Ocultar' : 'Preview'}
            </Button>
          </div>
          <Textarea
            value={inputsJson}
            onChange={(e) => handleInputsChange(e.target.value)}
            placeholder='{"key": "value", "msg": "{{item.campo}}"}'
            className="text-sm min-h-[100px] font-mono"
          />
          {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}

          {showPreview && !jsonError && (
            <div className="mt-2 p-2 rounded bg-muted text-xs font-mono whitespace-pre-wrap text-muted-foreground">
              {resolveTemplate(inputsJson, mockData)}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            Templates: {'{{item.campo}}'}, {'{{index}}'}, {'{{node-id.output.campo}}'}
          </p>
        </div>
      </div>
    </div>
  );
}
