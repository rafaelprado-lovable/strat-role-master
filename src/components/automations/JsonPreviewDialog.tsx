import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface JsonPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: object;
}

export function JsonPreviewDialog({ open, onOpenChange, json }: JsonPreviewDialogProps) {
  const jsonStr = JSON.stringify(json, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    toast.success('JSON copiado para a área de transferência');
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${(json as any).id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exportado');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>JSON do Workflow</DialogTitle>
        </DialogHeader>
        <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-auto max-h-[55vh] text-foreground">
          {jsonStr}
        </pre>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
