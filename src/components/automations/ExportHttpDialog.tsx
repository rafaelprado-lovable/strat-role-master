import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Share2, Terminal, Code2 } from 'lucide-react';

interface ExportHttpDialogProps {
  open: boolean;
  onClose: () => void;
  inputs: Record<string, unknown>;
}

function buildCurl(inputs: Record<string, unknown>): string {
  const url = String(inputs.url || 'https://example.com');
  const method = String(inputs.method || 'GET').toUpperCase();
  const parts: string[] = [`curl -X ${method}`];

  // Headers
  if (inputs.headers) {
    try {
      const headers = typeof inputs.headers === 'string' ? JSON.parse(inputs.headers) : inputs.headers;
      for (const [k, v] of Object.entries(headers)) {
        parts.push(`  -H '${k}: ${v}'`);
      }
    } catch {
      // If it's a template string, add as-is
      parts.push(`  -H '${inputs.headers}'`);
    }
  }

  // Body
  if (inputs.body) {
    const bodyStr = typeof inputs.body === 'object' ? JSON.stringify(inputs.body) : String(inputs.body);
    parts.push(`  -d '${bodyStr}'`);
  }

  // Timeout
  if (inputs.timeout) {
    parts.push(`  --max-time ${inputs.timeout}`);
  }

  parts.push(`  '${url}'`);
  return parts.join(' \\\n');
}

function buildPython(inputs: Record<string, unknown>): string {
  const url = String(inputs.url || 'https://example.com');
  const method = String(inputs.method || 'GET').toLowerCase();
  const lines: string[] = ['import requests', ''];

  // Headers
  let hasHeaders = false;
  if (inputs.headers) {
    try {
      const headers = typeof inputs.headers === 'string' ? JSON.parse(inputs.headers) : inputs.headers;
      if (Object.keys(headers).length > 0) {
        hasHeaders = true;
        lines.push(`headers = ${JSON.stringify(headers, null, 4)}`);
        lines.push('');
      }
    } catch {
      hasHeaders = true;
      lines.push(`headers = ${inputs.headers}`);
      lines.push('');
    }
  }

  // Body
  let hasBody = false;
  if (inputs.body) {
    hasBody = true;
    try {
      const body = typeof inputs.body === 'string' ? JSON.parse(inputs.body) : inputs.body;
      lines.push(`payload = ${JSON.stringify(body, null, 4)}`);
    } catch {
      lines.push(`payload = ${inputs.body}`);
    }
    lines.push('');
  }

  // Build request call
  const args: string[] = [`'${url}'`];
  if (hasHeaders) args.push('headers=headers');
  if (hasBody) args.push('json=payload');
  if (inputs.timeout) args.push(`timeout=${inputs.timeout}`);

  if (args.length <= 2) {
    lines.push(`response = requests.${method}(${args.join(', ')})`);
  } else {
    lines.push(`response = requests.${method}(`);
    args.forEach((a, i) => {
      lines.push(`    ${a}${i < args.length - 1 ? ',' : ''}`);
    });
    lines.push(')');
  }

  lines.push('');
  lines.push('print(response.status_code)');
  lines.push('print(response.json())');

  return lines.join('\n');
}

export function ExportHttpDialog({ open, onClose, inputs }: ExportHttpDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const curlCode = buildCurl(inputs);
  const pythonCode = buildPython(inputs);

  const handleCopy = async (code: string, type: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Share2 className="h-4 w-4 text-primary" />
            Exportar configuração HTTP
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="curl" className="flex-1 gap-1.5 text-xs">
              <Terminal className="h-3.5 w-3.5" /> cURL
            </TabsTrigger>
            <TabsTrigger value="python" className="flex-1 gap-1.5 text-xs">
              <Code2 className="h-3.5 w-3.5" /> Python
            </TabsTrigger>
          </TabsList>

          <TabsContent value="curl" className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Comando cURL</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={() => handleCopy(curlCode, 'curl')}
              >
                {copied === 'curl' ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                {copied === 'curl' ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <Textarea
              value={curlCode}
              readOnly
              className="min-h-[160px] font-mono text-xs"
            />
          </TabsContent>

          <TabsContent value="python" className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Python requests</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1"
                onClick={() => handleCopy(pythonCode, 'python')}
              >
                {copied === 'python' ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                {copied === 'python' ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <Textarea
              value={pythonCode}
              readOnly
              className="min-h-[200px] font-mono text-xs"
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
