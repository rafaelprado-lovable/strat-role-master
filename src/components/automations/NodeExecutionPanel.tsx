import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight, Zap, RotateCcw } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

type PayloadType = 'json' | 'string' | 'integer' | 'boolean';

const PAYLOAD_TYPES: { value: PayloadType; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
];

interface NodeExecutionPanelProps {
  nodeId: string;
  definitionId: string;
  inputs: Record<string, unknown>;
}

interface ExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

export function NodeExecutionPanel({ nodeId, definitionId, inputs }: NodeExecutionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [resolveTemplates, setResolveTemplates] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [payloadText, setPayloadText] = useState('');
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [payloadType, setPayloadType] = useState<PayloadType>('json');

  const buildDefaultPayload = () => JSON.stringify({
    definition_id: definitionId,
    task_id: `${nodeId}-unit`,
    resolve_templates: resolveTemplates,
    config: inputs,
  }, null, 2);

  // Sync payload when inputs/definitionId/resolveTemplates change (only if not manually edited)
  useEffect(() => {
    setPayloadText(buildDefaultPayload());
    setPayloadError(null);
  }, [definitionId, nodeId, resolveTemplates]);

  const handleResetPayload = () => {
    setPayloadText(buildDefaultPayload());
    setPayloadError(null);
  };

  const handleExecute = async () => {
    let parsedPayload: any;
    if (payloadType === 'json') {
      try {
        parsedPayload = JSON.parse(payloadText);
      } catch {
        setPayloadError('JSON inválido. Corrija o payload antes de executar.');
        return;
      }
    } else if (payloadType === 'integer') {
      const num = Number(payloadText.trim());
      if (isNaN(num) || !Number.isInteger(num)) {
        setPayloadError('Valor inteiro inválido.');
        return;
      }
      parsedPayload = num;
    } else if (payloadType === 'boolean') {
      const val = payloadText.trim().toLowerCase();
      if (val !== 'true' && val !== 'false') {
        setPayloadError('Use "true" ou "false".');
        return;
      }
      parsedPayload = val === 'true';
    } else {
      parsedPayload = payloadText;
    }
    setPayloadError(null);
    setRunning(true);
    setResult(null);
    const start = Date.now();

    try {
      const response = await apiClient.rawFetch('/v1/create/node/execution', {
        method: 'POST',
        headers: {
          orchestrator: 'lovable',
        },
        body: JSON.stringify(parsedPayload),
      });

      const duration = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        setResult({
          success: false,
          error: `HTTP ${response.status}: ${errorText || response.statusText}`,
          duration,
        });
        return;
      }

      const data = response.status === 204 ? null : await response.json().catch(() => null);
      setResult({ success: true, data, duration });
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Erro desconhecido',
        duration: Date.now() - start,
      });
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
            Útil para testar a configuração sem rodar o workflow completo.
          </p>

          {/* resolve_templates toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">resolve_templates</Label>
            <Switch checked={resolveTemplates} onCheckedChange={setResolveTemplates} />
          </div>
          <p className="text-[10px] text-muted-foreground -mt-2">
            {resolveTemplates
              ? 'Templates {{...}} serão resolvidos pelo motor antes da execução.'
              : 'Templates {{...}} NÃO serão resolvidos (ideal para testes isolados com valores fixos).'}
          </p>

          {/* Editable payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Payload (editável)</Label>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={handleResetPayload}>
                <RotateCcw className="h-3 w-3" />
                Resetar
              </Button>
            </div>
            <Textarea
              value={payloadText}
              onChange={(e) => {
                setPayloadText(e.target.value);
                setPayloadError(null);
              }}
              autoFormatJson
              className={`text-[11px] min-h-[120px] font-mono bg-muted/50 ${payloadError ? 'border-destructive' : ''}`}
            />
            {payloadError && (
              <p className="text-[10px] text-destructive">{payloadError}</p>
            )}
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
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Executar bloco
              </>
            )}
          </Button>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
                <span className={`text-xs font-semibold ${result.success ? 'text-chart-2' : 'text-destructive'}`}>
                  {result.success ? 'Sucesso' : 'Erro'}
                </span>
                {result.duration !== undefined && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {result.duration}ms
                  </span>
                )}
              </div>
              <Textarea
                value={
                  result.success
                    ? JSON.stringify(result.data, null, 2) || 'Sem resposta (204)'
                    : result.error || 'Erro desconhecido'
                }
                readOnly
                className={`text-[11px] min-h-[100px] font-mono ${
                  result.success ? 'bg-chart-2/5 border-chart-2/30' : 'bg-destructive/5 border-destructive/30'
                }`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
