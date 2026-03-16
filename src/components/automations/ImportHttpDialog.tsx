import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Import, Terminal, Code2 } from 'lucide-react';
import { detectAndParse, type ParsedHttpRequest } from '@/services/httpImportParser';

interface ImportHttpDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedHttpRequest) => void;
}

export function ImportHttpDialog({ open, onClose, onImport }: ImportHttpDialogProps) {
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<ParsedHttpRequest | null>(null);

  const handleParse = () => {
    if (!code.trim()) return;
    const parsed = detectAndParse(code);
    setPreview(parsed);
  };

  const handleImport = () => {
    if (preview) {
      onImport(preview);
      setCode('');
      setPreview(null);
      onClose();
    }
  };

  const handleClose = () => {
    setCode('');
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Import className="h-4 w-4 text-primary" />
            Importar cURL / Python Requests
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Terminal className="h-3 w-3" /> cURL
            </Badge>
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Code2 className="h-3 w-3" /> Python requests
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cole o comando aqui</Label>
            <Textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setPreview(null); }}
              placeholder={`curl -X POST 'https://api.example.com/data' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"key": "value"}'\n\nou\n\nrequests.post('https://api.example.com/data', headers={'Content-Type': 'application/json'}, json={'key': 'value'})`}
              className="min-h-[140px] font-mono text-xs"
            />
          </div>

          {!preview && (
            <Button onClick={handleParse} variant="outline" size="sm" className="w-full" disabled={!code.trim()}>
              Analisar
            </Button>
          )}

          {preview && (
            <div className="space-y-2 p-3 rounded-lg bg-muted border border-border">
              <p className="text-xs font-semibold text-foreground">Preview dos campos:</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">Método:</span>
                  <Badge variant="secondary" className="text-[10px]">{preview.method}</Badge>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground w-16 shrink-0">URL:</span>
                  <code className="text-primary font-mono text-[11px] break-all">{preview.url || '—'}</code>
                </div>
                {preview.headers && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Headers:</span>
                    <pre className="text-[10px] font-mono bg-background p-2 rounded border border-border overflow-x-auto">{preview.headers}</pre>
                  </div>
                )}
                {preview.body && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Body:</span>
                    <pre className="text-[10px] font-mono bg-background p-2 rounded border border-border overflow-x-auto">{preview.body}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={handleClose}>Cancelar</Button>
          <Button size="sm" onClick={handleImport} disabled={!preview}>
            <Import className="h-3.5 w-3.5 mr-1" />
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
