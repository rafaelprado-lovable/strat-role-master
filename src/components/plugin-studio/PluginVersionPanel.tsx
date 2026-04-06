import { useState } from 'react';
import { GitBranch, Tag, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PluginVersion, PluginProject } from '@/types/pluginStudio';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Props {
  versions: PluginVersion[];
  currentProject: PluginProject;
  onCreateVersion: (label: string) => void;
  onRestore: (version: PluginVersion) => void;
}

export function PluginVersionPanel({ versions, currentProject, onCreateVersion, onRestore }: Props) {
  const [showTag, setShowTag] = useState(false);
  const [tagLabel, setTagLabel] = useState('');

  const handleCreate = () => {
    if (!tagLabel.trim()) return;
    onCreateVersion(tagLabel.trim());
    setTagLabel('');
    setShowTag(false);
    toast.success('Versão criada');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" />
          Versões
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTag(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {versions.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-8">Nenhuma versão salva</p>
          ) : (
            versions.map(v => (
              <div key={v.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/30 group">
                <Tag className="h-3 w-3 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{v.label || v.version}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">{v.version}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => onRestore(v)}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showTag} onOpenChange={setShowTag}>
        <DialogContent className="sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Criar Versão</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="ex: v1.0.0 - Release inicial"
            value={tagLabel}
            onChange={e => setTagLabel(e.target.value)}
            className="h-8 text-xs"
          />
          <DialogFooter>
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={!tagLabel.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
