import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PluginProject } from '@/types/pluginStudio';

interface Props {
  project: PluginProject;
  onChange: (updates: Partial<PluginProject>) => void;
}

export function PluginMetadataPanel({ project, onChange }: Props) {
  return (
    <div className="space-y-3 p-3">
      <div>
        <Label className="text-[10px]">Nome do Plugin</Label>
        <Input
          className="h-8 text-xs"
          value={project.name}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="Meu Plugin"
        />
      </div>

      <div>
        <Label className="text-[10px]">Definition ID</Label>
        <Input
          className="h-8 text-xs font-mono"
          value={project.definition_id}
          onChange={e => onChange({ definition_id: e.target.value })}
          placeholder="my_plugin_v1"
        />
      </div>

      <div>
        <Label className="text-[10px]">Descrição</Label>
        <Textarea
          className="text-xs min-h-[50px] resize-y"
          value={project.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Descreva o que este plugin faz..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px]">Categoria</Label>
          <Select value={project.category} onValueChange={v => onChange({ category: v as any })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trigger">Gatilho</SelectItem>
              <SelectItem value="action">Ação</SelectItem>
              <SelectItem value="filter">Filtro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px]">Ícone</Label>
          <Input
            className="h-8 text-xs"
            value={project.icon}
            onChange={e => onChange({ icon: e.target.value })}
            placeholder="⚡"
          />
        </div>
      </div>

      <div>
        <Label className="text-[10px]">Grupo</Label>
        <Input
          className="h-8 text-xs"
          value={project.group || ''}
          onChange={e => onChange({ group: e.target.value })}
          placeholder="ServiceNow, WhatsApp, Custom..."
        />
      </div>
    </div>
  );
}
