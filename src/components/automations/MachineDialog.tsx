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
import { toast } from 'sonner';
import { Machine } from './CustomBlockDialog';

interface MachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (machine: Machine) => void;
  editingMachine?: Machine | null;
}

export function MachineDialog({
  open,
  onOpenChange,
  onSave,
  editingMachine,
}: MachineDialogProps) {
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingMachine) {
      setName(editingMachine.name);
      setHost(editingMachine.host);
      setPort(editingMachine.port);
      setDescription(editingMachine.description);
    } else {
      setName('');
      setHost('');
      setPort('22');
      setDescription('');
    }
  }, [editingMachine, open]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!host.trim()) {
      toast.error('Host é obrigatório');
      return;
    }

    onSave({
      id: editingMachine?.id || `machine-${Date.now()}`,
      name: name.trim(),
      host: host.trim(),
      port: port.trim() || '22',
      description: description.trim(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{editingMachine ? 'Editar Máquina' : 'Nova Máquina'}</DialogTitle>
          <DialogDescription>
            Cadastre uma máquina onde os scripts serão executados remotamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="machine-name">Nome</Label>
            <Input
              id="machine-name"
              placeholder="Ex: Servidor de Produção"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">Host / IP</Label>
              <Input
                id="host"
                placeholder="192.168.1.100 ou servidor.exemplo.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Porta</Label>
              <Input
                id="port"
                placeholder="22"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="machine-description">Descrição</Label>
            <Textarea
              id="machine-description"
              placeholder="Detalhes sobre esta máquina..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingMachine ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
