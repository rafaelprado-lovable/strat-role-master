import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Phone, Calendar, User } from 'lucide-react';
import { PlantaoDialog } from '@/components/plantoes/PlantaoDialog';
import { DeletePlantaoDialog } from '@/components/plantoes/DeletePlantaoDialog';
import { Plantao } from '@/types';
import { plantaoApi, userApi, departmentApi } from '@/services/mockApi';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Plantoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlantao, setSelectedPlantao] = useState<Plantao | null>(null);

  const { data: plantoes, isLoading } = useQuery({
    queryKey: ['plantoes'],
    queryFn: plantaoApi.getAll,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll,
  });

  const handleCreate = () => {
    setSelectedPlantao(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (plantao: Plantao) => {
    setSelectedPlantao(plantao);
    setIsDialogOpen(true);
  };

  const handleDelete = (plantao: Plantao) => {
    setSelectedPlantao(plantao);
    setIsDeleteDialogOpen(true);
  };

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    return users?.find((u) => u.id === userId)?.name || userId;
  };

  const getUserPhone = (userId?: string) => {
    if (!userId) return null;
    return users?.find((u) => u.id === userId)?.phoneNumber || '';
  };

  const getDepartmentName = (departmentId: string) => {
    return departments?.find((d) => d.id === departmentId)?.name || departmentId;
  };

  const getStatusBadge = (status: Plantao['status']) => {
    const variants = {
      active: 'default',
      scheduled: 'secondary',
      completed: 'outline',
    } as const;

    const labels = {
      active: 'Ativo',
      scheduled: 'Agendado',
      completed: 'Concluído',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plantões</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os plantões por departamento
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plantão
        </Button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {plantoes?.map((plantao) => (
              <div
                key={plantao.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-foreground">
                      {getDepartmentName(plantao.departmentId)}
                    </div>
                    {getStatusBadge(plantao.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {plantao.userId
                          ? getUserName(plantao.userId)
                          : plantao.customName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>
                        {plantao.userId
                          ? getUserPhone(plantao.userId)
                          : plantao.customPhone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(plantao.startDate), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}{' '}
                      até{' '}
                      {format(new Date(plantao.endDate), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(plantao)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(plantao)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PlantaoDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        plantao={selectedPlantao}
      />

      <DeletePlantaoDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        plantao={selectedPlantao}
      />
    </div>
  );
}
