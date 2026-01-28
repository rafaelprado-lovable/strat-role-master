import { useState } from 'react';
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
import { toast } from 'sonner';
import { Server, Terminal } from 'lucide-react';

export interface CustomBlock {
  id: string;
  name: string;
  description: string;
  machineId: string;
  scriptPath: string;
  icon: 'terminal' | 'server';
  color: string;
}

export interface Machine {
  id: string;
  name: string;
  host: string;
  port: string;
  description: string;
}

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
  const [name, setName] = useState(editingBlock?.name || '');
  const [description, setDescription] = useState(editingBlock?.description || '');
  const [machineId, setMachineId] = useState(editingBlock?.machineId || '');
  const [scriptPath, setScriptPath] = useState(editingBlock?.scriptPath || '');
  const [icon, setIcon] = useState<'terminal' | 'server'>(editingBlock?.icon || 'terminal');
  const [color, setColor] = useState(editingBlock?.color || 'bg-rose-500');

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
    });

    // Reset form
    setName('');
    setDescription('');
    setMachineId('');
    setScriptPath('');
    setIcon('terminal');
    setColor('bg-rose-500');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingBlock ? 'Editar Bloco' : 'Novo Bloco Customizado'}</DialogTitle>
          <DialogDescription>
            Crie um bloco que executa um script remotamente em uma máquina cadastrada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
        </div>

        <DialogFooter>
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
