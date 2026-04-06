import { useMemo } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { PluginProject } from '@/types/pluginStudio';

interface Props {
  project: PluginProject;
}

export function PluginJsonPreview({ project }: Props) {
  const json = useMemo(() => {
    const obj = {
      definition_id: project.definition_id,
      label: project.name,
      icon: project.icon,
      description: project.description,
      category: project.category,
      group: project.group || undefined,
      inputs: project.inputs,
      outputs: project.outputs,
      files: project.files.map(f => ({
        name: f.name,
        language: f.language,
        is_entry: f.isEntry || false,
      })),
    };
    return JSON.stringify(obj, null, 2);
  }, [project]);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    toast.success('JSON copiado!');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">JSON Preview</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <pre className="text-[11px] font-mono p-3 text-foreground leading-relaxed whitespace-pre-wrap">
          {json}
        </pre>
      </ScrollArea>
    </div>
  );
}
