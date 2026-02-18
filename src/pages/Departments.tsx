import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { departmentApi, userApi } from '@/services/mockApi';
import { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DepartmentDialog } from '@/components/departments/DepartmentDialog';
import { DeleteDepartmentDialog } from '@/components/departments/DeleteDepartmentDialog';

export default function Departments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>(undefined);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll,
  });
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  const usersById = useMemo(() => {
    if (!users) return {};
    return Object.fromEntries(users.map((u) => [u._id, u]));
  }, [users]);

  const handleCreate = () => {
    setSelectedDepartment(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setDialogOpen(true);
  };

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Departamentos</h2>
          <p className="text-muted-foreground">Gerencie os departamentos do sistema</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo Departamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Departamentos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os departamentos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>SysId</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Gerente</TableHead>
                  <TableHead>Coordenador</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments?.map((department) => (
                  <TableRow key={department._id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>
                      {department.organization}
                    </TableCell>
                    <TableCell>
                      {department.sysId}
                    </TableCell>
                    <TableCell>
                      {department.groupName}
                    </TableCell>
                    <TableCell>
                      {usersById[department.manager]?.name || "—"}
                    </TableCell>

                    <TableCell>
                      {usersById[department.coordinator]?.name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(department)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(department)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={selectedDepartment}
      />

      <DeleteDepartmentDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        department={departmentToDelete}
      />
    </div>
  );
}
