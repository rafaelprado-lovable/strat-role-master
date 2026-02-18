import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { scopeApi } from '@/services/mockApi';
import { Scope } from '@/types';
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
import { ScopeDialog } from '@/components/scopes/ScopeDialog';
import { DeleteScopeDialog } from '@/components/scopes/DeleteScopeDialog';

export default function Scopes() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<Scope | undefined>(undefined);
  const [scopeToDelete, setScopeToDelete] = useState<Scope | null>(null);

  const { data: scopes, isLoading } = useQuery({
    queryKey: ['scopes'],
    queryFn: scopeApi.getAll,
  });

  const handleCreate = () => {
    setSelectedScope(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (scope: Scope) => {
    setSelectedScope(scope);
    setDialogOpen(true);
  };

  const handleDelete = (scope: Scope) => {
    setScopeToDelete(scope);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Escopos</h2>
          <p className="text-muted-foreground">Gerencie os escopos do sistema</p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo Escopo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Escopos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os escopos cadastrados
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Icone</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Organização</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopes?.map((scope) => (
                  <TableRow key={scope._id}>
                    <TableCell className="font-medium">{scope.name}</TableCell>
                    <TableCell>{scope.type}</TableCell>
                    <TableCell>{scope.url}</TableCell>
                    <TableCell>{scope.icone}</TableCell>
                    <TableCell>{scope.menu}</TableCell>
                    <TableCell>{scope.organization}</TableCell>
                    <TableCell>{scope.departament}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(scope)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(scope)}
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

      <ScopeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        scope={selectedScope}
      />

      <DeleteScopeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        scope={scopeToDelete}
      />
    </div>
  );
}
