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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Plantoes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlantao, setSelectedPlantao] = useState<Plantao | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');

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

function getPlantaoDisplayName(plantao: Plantao, users: any[]) {
  // Se é nome manual
  if (plantao.name && !plantao.name) {
    return plantao.name;
  }

  // Se é name → buscar usuário
  if (plantao.name) {
    const user = users?.find(u => u._id === plantao.name);
    return user ? user.name : plantao.name;
  }

  return "Nome não informado";
}
  const getUserPhone = (userId?: string) => {
    if (!userId) return null;
    return users?.find((u) => u._id === userId)?.phoneNumber || '';
  };

  const getDepartmentName = (departmentId: string) => {
    return departments?.find((d) => d._id === departmentId)?.name || departmentId;
  };

  const getStatusBadge = (status: Plantao['departament']) => {
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

  // Filter plantões by selected department
  const filteredPlantoes = plantoes?.filter((plantao) => 
    selectedDepartmentId === 'all' || plantao.departament === selectedDepartmentId
  ) || [];

  // Group plantões by department
  const plantoesByDepartment = filteredPlantoes.reduce((acc, plantao) => {
    if (!acc[plantao.departament]) {
      acc[plantao.departament] = [];
    }
    acc[plantao.departament].push(plantao);
    return acc;
  }, {} as Record<string, Plantao[]>);

  // Sort plantões by start date within each department
  Object.keys(plantoesByDepartment).forEach((deptId) => {
    plantoesByDepartment[deptId].sort(
      (a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
    );
  });

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

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-foreground">
            Filtrar por Departamento:
          </label>
          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Departamentos</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept._id} value={dept._id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-6">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </Card>
      ) : filteredPlantoes.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            Nenhum plantão encontrado para o departamento selecionado.
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(plantoesByDepartment).map(([deptId, deptPlantoes]) => (
            <Card key={deptId} className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                {getDepartmentName(deptId)}
              </h2>
              
              <div className="relative pl-8 space-y-6">
                {/* Timeline line */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
                
                {deptPlantoes.map((plantao, index) => (
                  <div key={plantao._id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[29px] top-2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    
                    <div className="bg-accent/30 rounded-lg p-4 border border-border hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">
                                {format(new Date(plantao.startDatetime), 'dd/MM/yyyy HH:mm', {
                                  locale: ptBR,
                                })}{' '}
                                até{' '}
                                {format(new Date(plantao.endDatetime), 'dd/MM/yyyy HH:mm', {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">
                                {getPlantaoDisplayName(plantao, users)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {plantao.phoneNumber}
                              </span>
                            </div>
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
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

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
