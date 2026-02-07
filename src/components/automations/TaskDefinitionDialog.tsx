import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Trash2, Settings, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { toast } from 'sonner';
import { TaskDefinition, Machine, ParamType, PARAM_TYPES } from '@/types/automations';

interface TaskDefinitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machines: Machine[];
  onSave: (definition: TaskDefinition) => void;
  editing?: TaskDefinition | null;
}

const COLORS = [
  { value: 'bg-rose-500', label: 'Rosa' },
  { value: 'bg-emerald-500', label: 'Verde' },
  { value: 'bg-violet-500', label: 'Violeta' },
  { value: 'bg-amber-500', label: 'Âmbar' },
  { value: 'bg-sky-500', label: 'Azul' },
  { value: 'bg-pink-500', label: 'Pink' },
];

const ICONS = [
  { value: 'terminal', label: 'Terminal' },
  { value: 'server', label: 'Servidor' },
  { value: 'zap', label: 'Zap' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'mail', label: 'Email' },
];

export function TaskDefinitionDialog({
  open,
  onOpenChange,
  machines,
  onSave,
  editing,
}: TaskDefinitionDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('remote_script');
  const [icon, setIcon] = useState('terminal');
  const [color, setColor] = useState('bg-rose-500');
  const [machineId, setMachineId] = useState('');
  const [scriptPath, setScriptPath] = useState('');
  const [inputs, setInputs] = useState<Record<string, ParamType>>({});
  const [outputs, setOutputs] = useState<Record<string, ParamType>>({});

  // Temp state for adding new params
  const [newInputName, setNewInputName] = useState('');
  const [newInputType, setNewInputType] = useState<ParamType>('string');
  const [newOutputName, setNewOutputName] = useState('');
  const [newOutputType, setNewOutputType] = useState<ParamType>('string');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description || '');
      setType(editing.type);
      setIcon(editing.icon || 'terminal');
      setColor(editing.color || 'bg-rose-500');
      setMachineId(editing.machineId || '');
      setScriptPath(editing.scriptPath || '');
      setInputs({ ...editing.schema.inputs });
      setOutputs({ ...editing.schema.outputs });
    } else {
      setName('');
      setDescription('');
      setType('remote_script');
      setIcon('terminal');
      setColor('bg-rose-500');
      setMachineId('');
      setScriptPath('');
      setInputs({});
      setOutputs({});
    }
  }, [editing, open]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    onSave({
      id: editing?.id || `custom_${Date.now()}`,
      name: name.trim(),
      type,
      description: description.trim(),
      icon,
      color,
      category: 'Customizados',
      machineId: machineId || undefined,
      scriptPath: scriptPath.trim() || undefined,
      schema: { inputs, outputs },
    });

    onOpenChange(false);
  };

  const addInput = () => {
    if (!newInputName.trim()) return;
    const key = newInputName.trim().replace(/\s+/g, '_').toLowerCase();
    setInputs((prev) => ({ ...prev, [key]: newInputType }));
    setNewInputName('');
    setNewInputType('string');
  };

  const addOutput = () => {
    if (!newOutputName.trim()) return;
    const key = newOutputName.trim().replace(/\s+/g, '_').toLowerCase();
    setOutputs((prev) => ({ ...prev, [key]: newOutputType }));
    setNewOutputName('');
    setNewOutputType('string');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar Task Definition' : 'Nova Task Definition'}
          </DialogTitle>
          <DialogDescription>
            Defina o schema de inputs e outputs para esta task.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="inputs" className="text-xs">
              <ArrowDownToLine className="h-3 w-3 mr-1" />
              Inputs ({Object.keys(inputs).length})
            </TabsTrigger>
            <TabsTrigger value="outputs" className="text-xs">
              <ArrowUpFromLine className="h-3 w-3 mr-1" />
              Outputs ({Object.keys(outputs).length})
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[45vh] mt-4">
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Restart Apache"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="O que esta task faz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICONS.map((i) => (
                        <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded ${c.value}`} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Máquina (opcional)</Label>
                <Select value={machineId} onValueChange={setMachineId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {machines.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.host})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Script Path (opcional)</Label>
                <Input
                  placeholder="/opt/scripts/my-script.sh"
                  value={scriptPath}
                  onChange={(e) => setScriptPath(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="inputs" className="mt-0 space-y-4">
              <p className="text-xs text-muted-foreground">
                Parâmetros de entrada que esta task recebe
              </p>
              {Object.entries(inputs).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(inputs).map(([key, pType]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                      <Badge variant="secondary" className="font-mono text-xs">{key}</Badge>
                      <Badge variant="outline" className="text-[10px]">{pType}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => {
                          const next = { ...inputs };
                          delete next[key];
                          setInputs(next);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome (ex: url)"
                    value={newInputName}
                    onChange={(e) => setNewInputName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addInput()}
                  />
                  <Select value={newInputType} onValueChange={(v) => setNewInputType(v as ParamType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARAM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="secondary" onClick={addInput} disabled={!newInputName.trim()} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Input
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="outputs" className="mt-0 space-y-4">
              <p className="text-xs text-muted-foreground">
                Dados produzidos por esta task para os próximos nós
              </p>
              {Object.entries(outputs).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(outputs).map(([key, pType]) => (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                      <Badge variant="secondary" className="font-mono text-xs">{key}</Badge>
                      <Badge variant="outline" className="text-[10px]">{pType}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={() => {
                          const next = { ...outputs };
                          delete next[key];
                          setOutputs(next);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome (ex: status)"
                    value={newOutputName}
                    onChange={(e) => setNewOutputName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addOutput()}
                  />
                  <Select value={newOutputType} onValueChange={(v) => setNewOutputType(v as ParamType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PARAM_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="secondary" onClick={addOutput} disabled={!newOutputName.trim()} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Output
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{editing ? 'Salvar' : 'Criar Definition'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
