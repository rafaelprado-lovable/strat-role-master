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
import { toast } from 'sonner';
import { Server, Terminal, Settings, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { CustomBlock, Machine, StepConfigParam, StepInputValue, StepOutputValue } from '@/types/automations';
import { StepConfigParamsPanel } from './StepConfigParamsPanel';
import { StepInputValuesPanel } from './StepInputValuesPanel';
import { StepOutputValuesPanel } from './StepOutputValuesPanel';

interface CustomBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machines: Machine[];
  onSave: (block: CustomBlock) => void;
  editingBlock?: CustomBlock | null;
}

const COLORS = [
  { value: 'bg-rose-500', label: 'Rosa' },
  { value: 'bg-emerald-500', label: 'Verde' },
  { value: 'bg-violet-500', label: 'Violeta' },
  { value: 'bg-amber-500', label: 'Âmbar' },
  { value: 'bg-sky-500', label: 'Azul' },
  { value: 'bg-pink-500', label: 'Pink' },
];

export function CustomBlockDialog({
  open,
  onOpenChange,
  machines,
  onSave,
  editingBlock,
}: CustomBlockDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [machineId, setMachineId] = useState('');
  const [scriptPath, setScriptPath] = useState('');
  const [icon, setIcon] = useState<'terminal' | 'server'>('terminal');
  const [color, setColor] = useState('bg-rose-500');
  const [stepConfigParams, setStepConfigParams] = useState<StepConfigParam[]>([]);
  const [stepInputValue, setStepInputValue] = useState<StepInputValue[]>([]);
  const [stepOutputValue, setStepOutputValue] = useState<StepOutputValue[]>([]);

  // Reset form when editing block changes
  useEffect(() => {
    if (editingBlock) {
      setName(editingBlock.name);
      setDescription(editingBlock.description);
      setMachineId(editingBlock.machineId);
      setScriptPath(editingBlock.scriptPath);
      setIcon(editingBlock.icon);
      setColor(editingBlock.color);
      setStepConfigParams(editingBlock.stepConfigParams || []);
      setStepInputValue(editingBlock.stepInputValue || []);
      setStepOutputValue(editingBlock.stepOutputValue || []);
    } else {
      setName('');
      setDescription('');
      setMachineId('');
      setScriptPath('');
      setIcon('terminal');
      setColor('bg-rose-500');
      setStepConfigParams([]);
      setStepInputValue([]);
      setStepOutputValue([]);
    }
  }, [editingBlock, open]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!machineId) {
      toast.error('Selecione uma máquina');
      return;
    }
    if (!scriptPath.trim()) {
      toast.error('Caminho do script é obrigatório');
      return;
    }

    onSave({
      id: editingBlock?.id || `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      machineId,
      scriptPath: scriptPath.trim(),
      icon,
      color,
      stepConfigParams,
      stepInputValue,
      stepOutputValue,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingBlock ? 'Editar Bloco' : 'Novo Bloco Customizado'}</DialogTitle>
          <DialogDescription>
            Crie um bloco que executa um script remotamente em uma máquina cadastrada.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Config
            </TabsTrigger>
            <TabsTrigger value="inputs" className="text-xs">
              <ArrowDownToLine className="h-3 w-3 mr-1" />
              Inputs
            </TabsTrigger>
            <TabsTrigger value="outputs" className="text-xs">
              <ArrowUpFromLine className="h-3 w-3 mr-1" />
              Outputs
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[50vh] mt-4">
            <TabsContent value="basic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do bloco</Label>
                <Input
                  id="name"
                  placeholder="Ex: Restart Apache"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="O que este bloco faz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Máquina</Label>
                <Select value={machineId} onValueChange={setMachineId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhuma máquina cadastrada
                      </SelectItem>
                    ) : (
                      machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name} ({machine.host})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scriptPath">Caminho do script</Label>
                <Input
                  id="scriptPath"
                  placeholder="/opt/scripts/restart-service.sh"
                  value={scriptPath}
                  onChange={(e) => setScriptPath(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={icon} onValueChange={(v) => setIcon(v as 'terminal' | 'server')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="terminal">
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4" />
                          Terminal
                        </div>
                      </SelectItem>
                      <SelectItem value="server">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Servidor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
            </TabsContent>

            <TabsContent value="config" className="mt-0">
              <StepConfigParamsPanel
                params={stepConfigParams}
                onChange={setStepConfigParams}
              />
            </TabsContent>

            <TabsContent value="inputs" className="mt-0">
              <StepInputValuesPanel
                inputs={stepInputValue}
                onChange={setStepInputValue}
              />
            </TabsContent>

            <TabsContent value="outputs" className="mt-0">
              <StepOutputValuesPanel
                outputs={stepOutputValue}
                onChange={setStepOutputValue}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingBlock ? 'Salvar' : 'Criar Bloco'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
