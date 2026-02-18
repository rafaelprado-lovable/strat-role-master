import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
  const [selectedPermission, setSelectedPermission] = useState<Permission | undefined>(undefined);
  const [permissionToDelete, setPermissionToDelete] = useState<Permission | null>(null);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: permissionApi.getAll,
  });

  const handleCreate = () => {
    setSelectedPermission(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setSelectedPermission(permission);
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
                  <TableHead>Ações</TableHead>
                  <TableHead>Escopos</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions?.map((permission) => {
                  
                  let actions: string[] = [];

                  try {
                    const normalized = permission.actions
                      ?.replace(/'/g, '"') // troca aspas simples por duplas
                      ?.trim();

                    actions = JSON.parse(normalized || '[]');
                  } catch {
                    actions = [];
                  }


                  let scopes: string[] = [];

                  try {
                    const normalized = permission.scopes
                      ?.replace(/'/g, '"') // troca aspas simples por duplas
                      ?.trim();

                    scopes = JSON.parse(normalized || '[]');
                  } catch {
                    scopes = [];
                  }

                  return (
                    <TableRow key={permission._id}>
                      <TableCell className="font-medium">{permission.name}</TableCell>

                      <TableCell>
                        {actions.length > 0 ? (
                          actions.map((action, index) => (
                            <Badge key={index} variant="outline" className="mr-1">
                              {action}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Nenhuma ação</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {scopes.length > 0 ? (
                          scopes.map((action, index) => (
                            <Badge key={index} variant="outline" className="mr-1">
                              {action}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Nenhuma ação</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(permission)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PermissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        permission={selectedPermission}
      />

      <DeletePermissionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        permission={permissionToDelete}
      />
    </div>
  );
}
