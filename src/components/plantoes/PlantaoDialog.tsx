import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plantao } from '@/types';
import { plantaoApi, userApi, departmentApi } from '@/services/mockApi';
import { toast } from 'sonner';

interface PlantaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantao: Plantao | null;
}

export function PlantaoDialog({ open, onOpenChange, plantao }: PlantaoDialogProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'user' | 'custom'>('user');
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<Plantao['status']>('scheduled');

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll,
  });

  useEffect(() => {
    if (plantao) {
      setDepartmentId(plantao.departmentId);
      setStartDate(plantao.startDate.slice(0, 16));
      setEndDate(plantao.endDate.slice(0, 16));
      setStatus(plantao.status);
      
      if (plantao.userId) {
        setMode('user');
        setUserId(plantao.userId);
      } else {
        setMode('custom');
        setCustomName(plantao.customName || '');
        setCustomPhone(plantao.customPhone || '');
      }
    } else {
      setMode('user');
      setDepartmentId('');
      setUserId('');
      setCustomName('');
      setCustomPhone('');
      setStartDate('');
      setEndDate('');
      setStatus('scheduled');
    }
  }, [plantao, open]);

  const handleSubmit = async () => {
    if (!departmentId || !startDate || !endDate) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'user' && !userId) {
      toast.error('Por favor, selecione um usuário.');
      return;
    }

    if (mode === 'custom' && (!customName || !customPhone)) {
      toast.error('Por favor, preencha nome e telefone.');
      return;
    }

    try {
      const data = {
        departmentId,
        userId: mode === 'user' ? userId : undefined,
        customName: mode === 'custom' ? customName : undefined,
        customPhone: mode === 'custom' ? customPhone : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status,
      };

      if (plantao) {
        await plantaoApi.update(plantao.id, data);
        toast.success('Plantão atualizado com sucesso!');
      } else {
        await plantaoApi.create(data);
        toast.success('Plantão criado com sucesso!');
      }

      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar plantão.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {plantao ? 'Editar Plantão' : 'Novo Plantão'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Departamento */}
          <div className="space-y-2">
            <Label>Departamento *</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um departamento" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modo de seleção */}
          <div className="space-y-4">
            <Label>Tipo de Registro</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'user' | 'custom')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="font-normal cursor-pointer">
                  Selecionar usuário cadastrado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Definir nome e telefone manualmente
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campos condicionais */}
          {mode === 'user' ? (
            <div className="space-y-2">
              <Label>Usuário *</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.phoneNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Nome do plantonista"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="Telefone de contato"
                />
              </div>
            </>
          )}

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data/Hora Início *</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data/Hora Fim *</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Plantao['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {plantao ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
