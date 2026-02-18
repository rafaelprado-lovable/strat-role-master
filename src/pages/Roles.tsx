import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { roleApi } from '@/services/mockApi';
import { Role } from '@/types';
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
import { RoleDialog } from '@/components/roles/RoleDialog';
import { DeleteRoleDialog } from '@/components/roles/DeleteRoleDialog';

export default function Roles() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: roleApi.getAll,
  });

  const handleCreate = () => {
    setSelectedRole(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Funções</h2>
          <p className="text-muted-foreground">Gerencie as funções e seus privilégios</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova Função
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Funções</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as funções cadastradas
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
                  <TableHead>Permissões</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {(role as any).permission?.length ?? role.permissions?.length ?? 0} permissões
                      </Badge>
                    </TableCell>
                    <TableCell>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(role)}
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

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={selectedRole}
      />

      <DeleteRoleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        role={roleToDelete}
      />
    </div>
  );
}
