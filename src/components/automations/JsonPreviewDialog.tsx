import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Copy, Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { workflowService } from '@/services/workflowService';
import { Workflow } from '@/types/automations';

interface JsonPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: object;
  workflow?: Workflow;
  onSaved?: () => void;
}

export function JsonPreviewDialog({ open, onOpenChange, json, workflow, onSaved }: JsonPreviewDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
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

  // Check if workflow already exists on backend (has backend-assigned timestamps)
  const isExisting = workflow?.createdAt && workflow?.updatedAt;

  const handlePublish = async () => {
    if (!workflow) return;
    setIsSaving(true);
    try {
      if (isExisting) {
        await workflowService.update(workflow.id, workflow);
        toast.success('Workflow atualizado no servidor');
      } else {
        await workflowService.create(workflow);
        toast.success('Workflow cadastrado no servidor');
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Erro ao ${isExisting ? 'atualizar' : 'cadastrar'}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button onClick={handlePublish} disabled={isSaving || !workflow}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
