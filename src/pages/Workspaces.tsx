import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Workspace, workspaceService } from "@/services/workspaceService";
import { WorkspaceDialog } from "@/components/workspaces/WorkspaceDialog";
import { DeleteWorkspaceDialog } from "@/components/workspaces/DeleteWorkspaceDialog";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Workspaces() {
  const [items, setItems] = useState<Workspace[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Workspace | undefined>();
  const [deleting, setDeleting] = useState<Workspace | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { current, setCurrent, refresh } = useWorkspace();

  const load = async () => {
    const list = await workspaceService.list();
    setItems(list);
  };

  useEffect(() => { load(); }, []);

  const onSaved = async () => { await load(); await refresh(); };
  const onDeleted = async () => { await load(); await refresh(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workspaces</h2>
          <p className="text-muted-foreground">Gerencie contextos de trabalho isolados</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo Workspace
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Workspaces</CardTitle>
          <CardDescription>Cadastre os workspaces disponíveis para vincular aos usuários</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((ws) => (
                <TableRow key={ws._id}>
                  <TableCell className="font-medium">{ws.name}</TableCell>
                  <TableCell className="text-muted-foreground">{ws.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border border-border" style={{ background: ws.color }} />
                      <span className="text-xs text-muted-foreground">{ws.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {current?._id === ws._id ? (
                      <Badge className="gap-1"><Check className="h-3 w-3" /> Ativo</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setCurrent(ws._id)}>Ativar</Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(ws); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setDeleting(ws); setDeleteOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum workspace cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <WorkspaceDialog open={dialogOpen} onOpenChange={setDialogOpen} workspace={editing} onSaved={onSaved} />
      <DeleteWorkspaceDialog open={deleteOpen} onOpenChange={setDeleteOpen} workspace={deleting} onDeleted={onDeleted} />
    </div>
  );
}
