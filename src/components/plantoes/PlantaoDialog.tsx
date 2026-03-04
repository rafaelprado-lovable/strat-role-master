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
      setDepartmentId(plantao.departament);
      setStartDate(plantao.startDatetime.slice(0, 16));
      setEndDate(plantao.endDatetime.slice(0, 16));
      
      if (plantao.name) {
        setMode('user');
        setUserId(plantao.name);
      } else {
        setMode('custom');
        setCustomName(plantao.name || '');
        setCustomPhone(plantao.phoneNumber || '');
      }
    } else {
      setMode('user');
      setDepartmentId('');
      setUserId('');
      setCustomName('');
      setCustomPhone('');
      setStartDate('');
      setEndDate('');
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
      // Se for modo USER → buscar dados do usuário selecionado
      let finalName = customName;
      let finalPhone = customPhone;

      if (mode === 'user') {
        const selectedUser = users?.find((u) => u._id === userId);
        if (!selectedUser) {
          toast.error('Usuário inválido selecionado.');
          return;
        }
        finalName = selectedUser._id;
        finalPhone = selectedUser.phoneNumber;
      }

      const payload = {
        name: finalName,
        departament: departmentId,
        phoneNumber: finalPhone,
        startDatetime: new Date(startDate).toISOString(),
        endDatetime: new Date(endDate).toISOString(),
      };

      if (plantao) {
        await plantaoApi.update(plantao._id, payload);
        toast.success("Plantão atualizado com sucesso!");
      } else {
        await plantaoApi.create(payload);
        toast.success("Plantão criado com sucesso!");
      }

      queryClient.invalidateQueries({ queryKey: ["plantoes"] });
      onOpenChange(false);

    } catch (error) {
      toast.error("Erro ao salvar plantão.");
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
                  <SelectItem key={dept._id} value={dept._id}>
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
                    <SelectItem key={user._id} value={user._id}>
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
                min={new Date().toISOString().slice(0,16)}  // bloqueia datas anteriores
                onChange={(e) => {
                  const newStart = e.target.value;

                  // valida se escolhida < agora
                  if (new Date(newStart) < new Date()) {
                    toast.error("A data/hora de início não pode ser no passado.");
                    return;
                  }

                  // se já existe fim e ele ficou inválido
                  if (endDate && new Date(endDate) <= new Date(newStart)) {
                    toast.error("A data/hora de fim deve ser maior que a de início.");
                    setEndDate(""); // limpa campo inválido
                  }

                  setStartDate(newStart);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Data/Hora Fim *</Label>
              <Input
                type="datetime-local"
                value={endDate}
                min={startDate || new Date().toISOString().slice(0,16)} // fim só pode ser ≥ início
                onChange={(e) => {
                  const newEnd = e.target.value;

                  // Se não escolheu início ainda
                  if (!startDate) {
                    toast.error("Escolha primeiro a data/hora de início.");
                    return;
                  }

                  // valida end > start
                  if (new Date(newEnd) <= new Date(startDate)) {
                    toast.error("A data/hora de fim deve ser maior que a de início.");
                    return;
                  }

                  setEndDate(newEnd);
                }}
              />
            </div>
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
