import { useState } from 'react';
import { FileCode2, Plus, Trash2, Play, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { PluginFile } from '@/types/pluginStudio';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const LANG_ICONS: Record<string, string> = {
  python: '🐍',
  javascript: '⚡',
  shell: '🖥️',
  json: '📋',
};

const LANG_EXTS: Record<string, string> = {
  python: '.py',
  javascript: '.js',
  shell: '.sh',
  json: '.json',
};

interface Props {
  files: PluginFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onAddFile: (file: PluginFile) => void;
  onDeleteFile: (id: string) => void;
  pluginName: string;
}

export function PluginFileExplorer({ files, activeFileId, onSelectFile, onAddFile, onDeleteFile, pluginName }: Props) {
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState<PluginFile['language']>('python');

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    const ext = LANG_EXTS[newFileLang];
    const name = newFileName.endsWith(ext) ? newFileName : `${newFileName}${ext}`;
    onAddFile({
      id: `file-${Date.now()}`,
      name,
      language: newFileLang,
      content: '',
    });
    setNewFileName('');
    setShowNewFile(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <FolderOpen className="h-3.5 w-3.5" />
          Arquivos
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNewFile(true)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Project name */}
      <div className="px-3 py-2 border-b border-border/50">
        <span className="text-xs font-medium text-foreground truncate block">{pluginName || 'Novo Plugin'}</span>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.map(file => (
          <button
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors group',
              activeFileId === file.id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
            )}
          >
            <span className="text-sm">{LANG_ICONS[file.language] || '📄'}</span>
            <span className="flex-1 text-left truncate">{file.name}</span>
            {file.isEntry && (
              <Play className="h-3 w-3 text-primary shrink-0" />
            )}
            {!file.isEntry && files.length > 1 && (
              <Trash2
                className="h-3 w-3 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
              />
            )}
          </button>
        ))}
      </div>

      {/* New file dialog */}
      <Dialog open={showNewFile} onOpenChange={setShowNewFile}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Novo Arquivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="nome_do_arquivo"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              className="h-8 text-xs"
            />
            <Select value={newFileLang} onValueChange={v => setNewFileLang(v as PluginFile['language'])}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="shell">Shell</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button size="sm" className="h-8 text-xs" onClick={handleCreate} disabled={!newFileName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
