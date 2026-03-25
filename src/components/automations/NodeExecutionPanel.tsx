import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight, Zap, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import type { PluginField } from '@/types/pluginSchemas';

type FieldType = 'string' | 'integer' | 'boolean' | 'json';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
];

interface ConfigField {
  key: string;
  value: string;
  type: FieldType;
}

function pluginTypeToFieldType(t: string): FieldType {
  if (t === 'boolean') return 'boolean';
  if (t === 'number') return 'integer';
  if (t === 'json' || t === 'text') return 'json';
  return 'string';
}

function serializeValue(val: unknown): string {
  if (typeof val === 'object' && val !== null) return JSON.stringify(val, null, 2);
  return String(val ?? '');
}

function parseFieldValue(raw: string, type: FieldType): { value: unknown; error?: string } {
  switch (type) {
    case 'integer': {
      const n = Number(raw.trim());
      if (raw.trim() === '' || isNaN(n) || !Number.isInteger(n)) return { value: null, error: 'Inteiro inválido' };
      return { value: n };
    }
    case 'boolean': {
      const v = raw.trim().toLowerCase();
      if (v === 'true') return { value: true };
      if (v === 'false') return { value: false };
      return { value: null, error: 'Use true ou false' };
    }
    case 'json': {
      if (!raw.trim()) return { value: null };
      try { return { value: JSON.parse(raw) }; }
      catch { return { value: null, error: 'JSON inválido' }; }
    }
    default:
      return { value: raw };
  }
}

interface NodeExecutionPanelProps {
  nodeId: string;
  definitionId: string;
  inputs: Record<string, unknown>;
  schemaFields?: PluginField[];
}

interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

export function NodeExecutionPanel({ nodeId, definitionId, inputs, schemaFields }: NodeExecutionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [resolveTemplates, setResolveTemplates] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [fields, setFields] = useState<ConfigField[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});

  const inputsKey = JSON.stringify(inputs);

  const buildFields = useCallback((): ConfigField[] => {
    if (schemaFields && schemaFields.length > 0) {
      return schemaFields.map(sf => ({
        key: sf.name,
        value: inputs[sf.name] !== undefined ? serializeValue(inputs[sf.name]) : '',
        type: pluginTypeToFieldType(sf.type),
      }));
    }
    return Object.entries(inputs).map(([key, val]) => ({
      key,
      value: serializeValue(val),
      type: typeof val === 'boolean' ? 'boolean' as FieldType
        : typeof val === 'number' ? 'integer' as FieldType
        : typeof val === 'object' && val !== null ? 'json' as FieldType
        : 'string' as FieldType,
    }));
  }, [schemaFields, inputsKey]);

  useEffect(() => {
    setFields(buildFields());
    setFieldErrors({});
  }, [definitionId, nodeId, inputsKey, schemaFields]);

  const updateField = (index: number, patch: Partial<ConfigField>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...patch } : f));
    setFieldErrors(prev => { const n = { ...prev }; delete n[index]; return n; });
  };

  const addField = () => {
    setFields(prev => [...prev, { key: '', value: '', type: 'string' }]);
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    const errors: Record<number, string> = {};
    const config: Record<string, unknown> = {};

    fields.forEach((f, i) => {
      if (!f.key.trim()) return; // skip empty keys
      if (!f.value.trim()) return; // skip empty values
      const parsed = parseFieldValue(f.value, f.type);
      if (parsed.error) { errors[i] = parsed.error; return; }
      config[f.key] = parsed.value;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setRunning(true);
    setResult(null);
    const start = Date.now();

    const payload = {
      definition_id: definitionId,
      task_id: `${nodeId}-unit`,
      resolve_templates: resolveTemplates,
      config,
    };

    try {
      const response = await apiClient.rawFetch('/v1/create/node/execution', {
        method: 'POST',
        headers: { orchestrator: 'lovable' },
        body: JSON.stringify(payload),
      });

      const duration = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        setResult({ success: false, error: `HTTP ${response.status}: ${errorText || response.statusText}`, duration });
        return;
      }

      const data = response.status === 204 ? null : await response.json().catch(() => null);
      setResult({ success: true, data, duration });
    } catch (err: any) {
      setResult({ success: false, error: err.message || 'Erro desconhecido', duration: Date.now() - start });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-chart-3" /> : <ChevronRight className="h-3.5 w-3.5 text-chart-3" />}
        <Zap className="h-4 w-4 text-chart-3" />
        <Label className="text-xs font-semibold text-chart-3 cursor-pointer">Executar Bloco (Unit Test)</Label>
      </button>

      {expanded && (
        <div className="space-y-3 pl-1">
          <p className="text-[10px] text-muted-foreground">
            Executa este bloco isoladamente via <code className="bg-muted px-1 rounded font-mono">/v1/create/node/execution</code>.
          </p>

          <div className="flex items-center justify-between">
            <Label className="text-xs">resolve_templates</Label>
            <Switch checked={resolveTemplates} onCheckedChange={setResolveTemplates} />
          </div>

          {/* Config fields */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Config</Label>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={addField}>
                <Plus className="h-3 w-3" /> Campo
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={i} className="space-y-1 rounded-md border border-border p-2 bg-muted/30">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{field.key || '(sem nome)'}</Label>
                    <Select value={field.type} onValueChange={v => updateField(i, { type: v as FieldType })}>
                      <SelectTrigger className="h-6 text-[10px] w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!schemaFields?.find(sf => sf.name === field.key) && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeField(i)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  {field.type === 'json' ? (
                    <Textarea
                      value={field.value}
                      onChange={e => updateField(i, { value: e.target.value })}
                      placeholder="{}"
                      autoFormatJson
                      className={`text-[11px] min-h-[60px] font-mono bg-background ${fieldErrors[i] ? 'border-destructive' : ''}`}
                    />
                  ) : field.type === 'boolean' ? (
                    <Select value={field.value.toLowerCase() === 'true' ? 'true' : 'false'} onValueChange={v => updateField(i, { value: v })}>
                      <SelectTrigger className={`h-7 text-[11px] ${fieldErrors[i] ? 'border-destructive' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true" className="text-xs">true</SelectItem>
                        <SelectItem value="false" className="text-xs">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={field.value}
                      onChange={e => updateField(i, { value: e.target.value })}
                      placeholder={field.type === 'integer' ? '0' : 'valor'}
                      type={field.type === 'integer' ? 'number' : 'text'}
                      className={`h-7 text-[11px] font-mono ${fieldErrors[i] ? 'border-destructive' : ''}`}
                    />
                  )}

                  {fieldErrors[i] && (
                    <p className="text-[10px] text-destructive">{fieldErrors[i]}</p>
                  )}
                </div>
              ))}

              {fields.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Nenhum campo disponível.</p>
              )}
            </div>
          </div>

          {/* Execute button */}
          <Button
            onClick={handleExecute}
            disabled={running || !definitionId}
            className="w-full gap-2"
            size="sm"
            variant={result?.success === false ? 'destructive' : 'default'}
          >
            {running ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Executando...</>
            ) : (
              <><Play className="h-3.5 w-3.5" /> Executar bloco</>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle2 className="h-4 w-4 text-chart-2" /> : <XCircle className="h-4 w-4 text-destructive" />}
                <span className={`text-xs font-semibold ${result.success ? 'text-chart-2' : 'text-destructive'}`}>
                  {result.success ? 'Sucesso' : 'Erro'}
                </span>
                {result.duration !== undefined && (
                  <span className="text-[10px] text-muted-foreground ml-auto">{result.duration}ms</span>
                )}
              </div>
              <Textarea
                value={result.success ? JSON.stringify(result.data, null, 2) || 'Sem resposta (204)' : result.error || 'Erro desconhecido'}
                readOnly
                className={`text-[11px] min-h-[100px] font-mono ${result.success ? 'bg-chart-2/5 border-chart-2/30' : 'bg-destructive/5 border-destructive/30'}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
