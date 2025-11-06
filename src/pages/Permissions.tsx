import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { permissionApi } from '@/services/mockApi';
import { Permission } from '@/types';
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
import { PermissionDialog } from '@/components/permissions/PermissionDialog';
import { DeletePermissionDialog } from '@/components/permissions/DeletePermissionDialog';

export default function Permissions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionApi.getAll,
  });

  const handleCreate = () => {
    setDialogOpen(true);
  };

  const handleDelete = (permission: Permission) => {
    setPermissionToDelete(permission);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Permissões</h2>
          <p className="text-muted-foreground">Gerencie as permissões do sistema</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova Permissão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Permissões</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as permissões disponíveis
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions?.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{permission.resource}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{permission.action}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(permission)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PermissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <DeletePermissionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        permission={permissionToDelete}
      />
    </div>
  );
}
