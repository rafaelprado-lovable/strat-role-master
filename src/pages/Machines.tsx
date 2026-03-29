import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { machineApi, departmentApi, organizationApi } from '@/services/mockApi';
import { Machine } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { MachineDialog } from '@/components/machines/MachineDialog';
import { DeleteMachineDialog } from '@/components/machines/DeleteMachineDialog';

export default function Machines() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | undefined>(undefined);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);

  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: machineApi.getAll,
  });

  const handleCreate = () => {
    setSelectedMachine(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (machine: Machine) => {
    setSelectedMachine(machine);
    setDialogOpen(true);
  };

  const handleDelete = (machine: Machine) => {
    setMachineToDelete(machine);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Máquinas</h2>
          <p className="text-muted-foreground">Gerencie as máquinas cadastradas no sistema</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova Máquina
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Máquinas</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as máquinas cadastradas
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
                  <TableHead>Host</TableHead>
                  <TableHead>Porta</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines?.map((machine) => (
                  <TableRow key={machine._id}>
                    <TableCell className="font-medium">{machine.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{machine.host}</Badge>
                    </TableCell>
                    <TableCell>{machine.port}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{machine.description}</TableCell>
                    <TableCell>{machine.organization}</TableCell>
                    <TableCell>{machine.department}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(machine)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(machine)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!machines || machines.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhuma máquina cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MachineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        machine={selectedMachine}
      />

      <DeleteMachineDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        machine={machineToDelete}
      />
    </div>
  );
}
