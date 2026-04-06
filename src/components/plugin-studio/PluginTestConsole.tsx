import { useState } from 'react';
import { Play, Trash2, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PluginFieldDef, TestRun } from '@/types/pluginStudio';
import { toast } from 'sonner';

interface Props {
  inputs: PluginFieldDef[];
  testRuns: TestRun[];
  onRunTest: (inputValues: Record<string, unknown>) => void;
  onClearRuns: () => void;
}

export function PluginTestConsole({ inputs, testRuns, onRunTest, onClearRuns }: Props) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('input');

  const handleRun = () => {
    const parsed: Record<string, unknown> = {};
    for (const field of inputs) {
      const raw = inputValues[field.name] || '';
      if (field.required && !raw.trim()) {
        toast.error(`Campo obrigatório: ${field.label}`);
        return;
      }
      if (field.type === 'json') {
        try { parsed[field.name] = JSON.parse(raw || '{}'); } catch { parsed[field.name] = raw; }
      } else if (field.type === 'number') {
        parsed[field.name] = Number(raw) || 0;
      } else if (field.type === 'boolean') {
        parsed[field.name] = raw === 'true';
      } else {
        parsed[field.name] = raw;
      }
    }
    onRunTest(parsed);
    setActiveTab('output');
  };

  const latestRun = testRuns[0];

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-border px-2">
          <TabsList className="h-8 bg-transparent border-0 p-0">
            <TabsTrigger value="input" className="text-[10px] h-7 data-[state=active]:bg-accent">Input</TabsTrigger>
            <TabsTrigger value="output" className="text-[10px] h-7 data-[state=active]:bg-accent">Output</TabsTrigger>
            <TabsTrigger value="logs" className="text-[10px] h-7 data-[state=active]:bg-accent">
              Logs
              {latestRun?.logs.length ? (
                <Badge variant="secondary" className="ml-1 h-4 text-[8px] px-1">{latestRun.logs.length}</Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-[10px] h-7 data-[state=active]:bg-accent">Histórico</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearRuns} title="Limpar histórico">
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={handleRun}>
              <Play className="h-3 w-3" />
              Executar
            </Button>
          </div>
        </div>

        {/* Input tab */}
        <TabsContent value="input" className="flex-1 overflow-auto p-2 space-y-2 m-0">
          {inputs.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">Defina inputs no Schema para testar</p>
          ) : (
            inputs.map(field => (
              <div key={field.name}>
                <Label className="text-[10px] flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                  <span className="text-muted-foreground font-mono">({field.type})</span>
                </Label>
                <Textarea
                  className="text-xs font-mono min-h-[32px] resize-y"
                  rows={field.type === 'json' ? 3 : 1}
                  placeholder={field.placeholder || ''}
                  value={inputValues[field.name] || ''}
                  onChange={e => setInputValues(prev => ({ ...prev, [field.name]: e.target.value }))}
                />
              </div>
            ))
          )}
        </TabsContent>

        {/* Output tab */}
        <TabsContent value="output" className="flex-1 overflow-auto p-2 m-0">
          {latestRun ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                {latestRun.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {latestRun.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                {latestRun.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                <span className="font-medium capitalize">{latestRun.status}</span>
                {latestRun.duration && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {latestRun.duration}ms
                  </span>
                )}
              </div>
              <pre className="text-[11px] font-mono bg-muted/50 rounded-md p-2 overflow-auto whitespace-pre-wrap max-h-[300px]">
                {latestRun.output ? JSON.stringify(latestRun.output, null, 2) : 'Sem output'}
              </pre>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-8">Execute um teste para ver o resultado</p>
          )}
        </TabsContent>

        {/* Logs tab */}
        <TabsContent value="logs" className="flex-1 overflow-auto m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-0.5 font-mono text-[10px]">
              {latestRun?.logs.length ? (
                latestRun.logs.map((log, i) => (
                  <div key={i} className="text-muted-foreground leading-relaxed">
                    <span className="text-muted-foreground/50">[{String(i).padStart(3, '0')}]</span> {log}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhum log</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="flex-1 overflow-auto m-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {testRuns.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-8">Nenhuma execução</p>
              ) : (
                testRuns.map(run => (
                  <div key={run.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 text-xs">
                    {run.status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    {run.status === 'error' && <XCircle className="h-3 w-3 text-destructive" />}
                    {run.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span className="text-muted-foreground">{new Date(run.timestamp).toLocaleTimeString()}</span>
                    {run.duration && <span className="text-muted-foreground">{run.duration}ms</span>}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
