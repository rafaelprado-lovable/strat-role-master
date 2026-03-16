import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Share2, Terminal, Code2, Braces, Box } from 'lucide-react';

interface ExportHttpDialogProps {
  open: boolean;
  onClose: () => void;
  inputs: Record<string, unknown>;
}

function parseHeaders(raw: unknown): Record<string, string> | null {
  if (!raw) return null;
  try {
    const h = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Object.keys(h).length > 0 ? h : null;
  } catch {
    return null;
  }
}

function parseBody(raw: unknown): unknown | null {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return raw;
  }
}

function buildCurl(inputs: Record<string, unknown>): string {
  const url = String(inputs.url || 'https://example.com');
  const method = String(inputs.method || 'GET').toUpperCase();
  const parts: string[] = [`curl -X ${method}`];
  const headers = parseHeaders(inputs.headers);
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      parts.push(`  -H '${k}: ${v}'`);
    }
  }
  if (inputs.body) {
    const bodyStr = typeof inputs.body === 'object' ? JSON.stringify(inputs.body) : String(inputs.body);
    parts.push(`  -d '${bodyStr}'`);
  }
  if (inputs.timeout) parts.push(`  --max-time ${inputs.timeout}`);
  parts.push(`  '${url}'`);
  return parts.join(' \\\n');
}

function buildPython(inputs: Record<string, unknown>): string {
  const url = String(inputs.url || 'https://example.com');
  const method = String(inputs.method || 'GET').toLowerCase();
  const lines: string[] = ['import requests', ''];
  const headers = parseHeaders(inputs.headers);
  if (headers) {
    lines.push(`headers = ${JSON.stringify(headers, null, 4)}`, '');
  }
  const body = parseBody(inputs.body);
  if (body) {
    lines.push(`payload = ${JSON.stringify(body, null, 4)}`, '');
  }
  const args: string[] = [`'${url}'`];
  if (headers) args.push('headers=headers');
  if (body) args.push('json=payload');
  if (inputs.timeout) args.push(`timeout=${inputs.timeout}`);
  if (args.length <= 2) {
    lines.push(`response = requests.${method}(${args.join(', ')})`);
  } else {
    lines.push(`response = requests.${method}(`);
    args.forEach((a, i) => lines.push(`    ${a}${i < args.length - 1 ? ',' : ''}`));
    lines.push(')');
  }
  lines.push('', 'print(response.status_code)', 'print(response.json())');
  return lines.join('\n');
}

function buildFetch(inputs: Record<string, unknown>): string {
  const url = String(inputs.url || 'https://example.com');
  const method = String(inputs.method || 'GET').toUpperCase();
  const headers = parseHeaders(inputs.headers);
  const body = parseBody(inputs.body);

  const lines: string[] = [];
  const optionParts: string[] = [];

  optionParts.push(`  method: '${method}'`);

  if (headers) {
    const hStr = JSON.stringify(headers, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');
    optionParts.push(`  headers: ${hStr}`);
  }

  if (body) {
    const bStr = JSON.stringify(body, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');
    optionParts.push(`  body: JSON.stringify(${bStr})`);
  }

  if (inputs.timeout) {
    lines.push(`const controller = new AbortController();`);
    lines.push(`const timeoutId = setTimeout(() => controller.abort(), ${Number(inputs.timeout) * 1000});`);
    lines.push('');
    optionParts.push(`  signal: controller.signal`);
  }

  lines.push(`const response = await fetch('${url}', {`);
  lines.push(optionParts.join(',\n'));
  lines.push('});');

  if (inputs.timeout) {
    lines.push('clearTimeout(timeoutId);');
  }

  lines.push('');
  lines.push('const data = await response.json();');
  lines.push('console.log(response.status, data);');

  return lines.join('\n');
}

function buildAxios(inputs: Record<string, unknown>): string {
  const url = String(inputs.url || 'https://example.com');
  const method = String(inputs.method || 'GET').toLowerCase();
  const headers = parseHeaders(inputs.headers);
  const body = parseBody(inputs.body);

  const lines: string[] = ["import axios from 'axios';", ''];

  const configParts: string[] = [];
  configParts.push(`  method: '${method}'`);
  configParts.push(`  url: '${url}'`);

  if (headers) {
    const hStr = JSON.stringify(headers, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');
    configParts.push(`  headers: ${hStr}`);
  }

  if (body) {
    const bStr = JSON.stringify(body, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n');
    configParts.push(`  data: ${bStr}`);
  }

  if (inputs.timeout) {
    configParts.push(`  timeout: ${Number(inputs.timeout) * 1000}`);
  }

  lines.push('const response = await axios({');
  lines.push(configParts.join(',\n'));
  lines.push('});');
  lines.push('');
  lines.push('console.log(response.status, response.data);');

  return lines.join('\n');
}

type TabKey = 'curl' | 'python' | 'fetch' | 'axios';

const TAB_CONFIG: { key: TabKey; label: string; icon: typeof Terminal }[] = [
  { key: 'curl', label: 'cURL', icon: Terminal },
  { key: 'python', label: 'Python', icon: Code2 },
  { key: 'fetch', label: 'Fetch', icon: Braces },
  { key: 'axios', label: 'Axios', icon: Box },
];

export function ExportHttpDialog({ open, onClose, inputs }: ExportHttpDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const codes: Record<TabKey, string> = {
    curl: buildCurl(inputs),
    python: buildPython(inputs),
    fetch: buildFetch(inputs),
    axios: buildAxios(inputs),
  };

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
            {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="flex-1 gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TAB_CONFIG.map(({ key, label }) => (
            <TabsContent key={key} value={key} className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={() => handleCopy(codes[key], key)}
                >
                  {copied === key ? <Check className="h-3 w-3 text-chart-2" /> : <Copy className="h-3 w-3" />}
                  {copied === key ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <Textarea
                value={codes[key]}
                readOnly
                className="min-h-[180px] font-mono text-xs"
              />
            </TabsContent>
          ))}
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
