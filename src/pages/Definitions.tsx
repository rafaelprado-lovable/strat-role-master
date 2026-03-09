import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Zap, Cog, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { definitionService, type Definition } from "@/services/definitionService";
import { DefinitionDialog } from "@/components/definitions/DefinitionDialog";
import { DeleteDefinitionDialog } from "@/components/definitions/DeleteDefinitionDialog";

export default function Definitions() {
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<Definition | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDef, setDeletingDef] = useState<Definition | null>(null);

  const fetchDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await definitionService.list();
      setDefinitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar definições:', err);
      toast({ title: "Erro", description: "Falha ao carregar blocos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchDefinitions(); }, [fetchDefinitions]);

  const handleSave = async (def: Definition) => {
    setSaving(true);
    try {
      if (editingDef) {
        await definitionService.update(def);
        toast({ title: "Bloco atualizado" });
      } else {
        await definitionService.create(def);
        toast({ title: "Bloco criado" });
      }
      setDialogOpen(false);
      setEditingDef(null);
      fetchDefinitions();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDef) return;
    setSaving(true);
    try {
      await definitionService.delete(deletingDef.definition_id);
      toast({ title: "Bloco excluído" });
      setDeleteDialogOpen(false);
      setDeletingDef(null);
      fetchDefinitions();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (def: Definition) => {
    setEditingDef(def);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingDef(null);
    setDialogOpen(true);
  };

  const openDelete = (def: Definition) => {
    setDeletingDef(def);
    setDeleteDialogOpen(true);
  };

  const filtered = definitions.filter(d =>
    d.label.toLowerCase().includes(search.toLowerCase()) ||
    d.definition_id.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  const triggerCount = definitions.filter(d => d.category === 'trigger').length;
  const actionCount = definitions.filter(d => d.category === 'action').length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Blocos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{definitions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gatilhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent-foreground" />
              <p className="text-3xl font-bold text-foreground">{triggerCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-primary" />
              <p className="text-3xl font-bold text-foreground">{actionCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Blocos Disponíveis</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar bloco..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchDefinitions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Novo Bloco
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {search ? 'Nenhum bloco encontrado' : 'Nenhum bloco cadastrado'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Definition ID</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">Inputs</TableHead>
                  <TableHead className="text-center">Outputs</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((def) => (
                  <TableRow key={def.definition_id}>
                    <TableCell className="font-mono text-xs">{def.definition_id}</TableCell>
                    <TableCell className="font-medium">{def.label}</TableCell>
                    <TableCell>
                      <Badge variant={def.category === 'trigger' ? 'default' : 'secondary'}>
                        {def.category === 'trigger' ? 'Gatilho' : 'Ação'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                      {def.description || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{def.inputs?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{def.outputs?.length || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(def)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => openDelete(def)}>
                          <Trash2 className="h-3.5 w-3.5" />
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

      <DefinitionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        definition={editingDef}
        onSave={handleSave}
        loading={saving}
      />

      <DeleteDefinitionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        definitionLabel={deletingDef?.label || ''}
        onConfirm={handleDelete}
        loading={saving}
      />
    </div>
  );
}
