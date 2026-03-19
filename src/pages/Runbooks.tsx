import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownRenderer } from "@/components/definitions/MarkdownRenderer";
import { BookOpen, Plus, Pencil, Trash2, Upload, Eye, Code, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ---------- Types ----------

interface Runbook {
  id: string;
  title: string;
  description: string;
  content: string; // markdown
  tags: string[];
  service: string;
  incident: string; // incidente ou sala de crise
  createdAt: Date;
  updatedAt: Date;
}

const EMPTY_RUNBOOK: Omit<Runbook, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  description: "",
  content: "",
  tags: [],
  service: "",
  incident: "",
};

// ---------- Mock data ----------

const MOCK_SERVICES = ["API Gateway", "Auth Service", "Payment Service", "Notification Service", "Database Cluster", "CDN"];
const MOCK_TAGS = ["critical", "network", "database", "kubernetes", "rollback", "security", "monitoring"];

const initialRunbooks: Runbook[] = [
  {
    id: "1",
    title: "Restart API Gateway",
    description: "Procedimento para reiniciar o API Gateway em caso de alta latência",
    content: "## Passos\n\n1. Verificar métricas no Grafana\n2. Executar `kubectl rollout restart deployment/api-gateway`\n3. Monitorar logs por 5 minutos",
    tags: ["critical", "kubernetes"],
    service: "API Gateway",
    incident: "INC-001",
    createdAt: new Date("2025-12-01"),
    updatedAt: new Date("2026-02-15"),
  },
  {
    id: "2",
    title: "Failover de Database",
    description: "Runbook de failover do cluster de banco de dados primário para réplica",
    content: "## Pré-requisitos\n\n- Acesso ao console AWS RDS\n- Credenciais de admin\n\n## Execução\n\n1. Promover réplica\n2. Atualizar DNS\n3. Validar conexões",
    tags: ["database", "critical"],
    service: "Database Cluster",
    incident: "CRISIS-042",
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-03-01"),
  },
];

// ---------- Runbook Dialog ----------

function RunbookDialog({
  open,
  onOpenChange,
  runbook,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runbook?: Runbook | null;
  onSave: (data: Omit<Runbook, "id" | "createdAt" | "updatedAt">) => void;
}) {
  const isEditing = !!runbook;
  const [form, setForm] = useState(EMPTY_RUNBOOK);
  const [tagInput, setTagInput] = useState("");
  const [previewMd, setPreviewMd] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        runbook
          ? { title: runbook.title, description: runbook.description, content: runbook.content, tags: [...runbook.tags], service: runbook.service, incident: runbook.incident }
          : { ...EMPTY_RUNBOOK, tags: [] }
      );
      setPreviewMd(false);
    }
    onOpenChange(v);
  };

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      update({ tags: [...form.tags, t] });
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => update({ tags: form.tags.filter((t) => t !== tag) });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => update({ content: evt.target?.result as string });
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Runbook" : "Novo Runbook"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="content">Conteúdo (MD)</TabsTrigger>
          </TabsList>

          {/* Info tab */}
          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Nome do runbook" />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Breve resumo do procedimento" rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Serviço Relacionado</Label>
                <Select value={form.service} onValueChange={(v) => update({ service: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_SERVICES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Incidente / Sala de Crise</Label>
                <Input value={form.incident} onChange={(e) => update({ incident: e.target.value })} placeholder="Ex: INC-001, CRISIS-042" />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="Adicionar tag e pressionar Enter"
                  className="flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {MOCK_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="cursor-pointer text-xs hover:bg-primary/10"
                    onClick={() => update({ tags: [...form.tags, t] })}
                  >
                    + {t}
                  </Badge>
                ))}
              </div>
              {/* Selected */}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((t) => (
                    <Badge key={t} className="gap-1">
                      {t}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(t)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Content tab */}
          <TabsContent value="content" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload .md
                </Button>
                <input ref={fileRef} type="file" accept=".md,.txt,.markdown" className="hidden" onChange={handleFileUpload} />
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreviewMd(!previewMd)}>
                {previewMd ? <><Code className="mr-1.5 h-3.5 w-3.5" /> Editar</> : <><Eye className="mr-1.5 h-3.5 w-3.5" /> Preview</>}
              </Button>
            </div>

            {previewMd ? (
              <div className="rounded-lg border border-border p-4 min-h-[300px]">
                {form.content ? <MarkdownRenderer content={form.content} /> : <p className="text-muted-foreground text-sm">Nenhum conteúdo</p>}
              </div>
            ) : (
              <Textarea
                value={form.content}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="# Título do Runbook&#10;&#10;## Passos&#10;&#10;1. Primeiro passo&#10;2. Segundo passo"
                className="min-h-[300px] font-mono text-sm"
              />
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{isEditing ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete Confirm ----------

function DeleteRunbookDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Runbook</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir <strong className="text-foreground">{title}</strong>? Esta ação não pode ser desfeita.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false); }}>Excluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main Page ----------

export default function Runbooks() {
  const [runbooks, setRunbooks] = useState<Runbook[]>(initialRunbooks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRunbook, setEditingRunbook] = useState<Runbook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Runbook | null>(null);
  const [search, setSearch] = useState("");
  const [viewRunbook, setViewRunbook] = useState<Runbook | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return runbooks;
    return runbooks.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q)) ||
        r.service.toLowerCase().includes(q) ||
        r.incident.toLowerCase().includes(q)
    );
  }, [runbooks, search]);

  const handleSave = (data: Omit<Runbook, "id" | "createdAt" | "updatedAt">) => {
    if (editingRunbook) {
      setRunbooks((prev) =>
        prev.map((r) => (r.id === editingRunbook.id ? { ...r, ...data, updatedAt: new Date() } : r))
      );
      toast({ title: "Runbook atualizado" });
    } else {
      const newRb: Runbook = { ...data, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() };
      setRunbooks((prev) => [newRb, ...prev]);
      toast({ title: "Runbook criado" });
    }
    setEditingRunbook(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRunbooks((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast({ title: "Runbook excluído" });
    setDeleteTarget(null);
  };

  const openEdit = (r: Runbook) => {
    setEditingRunbook(r);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingRunbook(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Runbooks</h1>
            <p className="text-sm text-muted-foreground">Procedimentos operacionais documentados</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo Runbook
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar runbooks..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Incidente / Crise</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum runbook encontrado
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setViewRunbook(r)}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{r.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.service && <Badge variant="outline">{r.service}</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.incident || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {r.updatedAt.toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View dialog */}
      {viewRunbook && (
        <Dialog open={!!viewRunbook} onOpenChange={(v) => !v && setViewRunbook(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {viewRunbook.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {viewRunbook.service && <Badge variant="outline">{viewRunbook.service}</Badge>}
              {viewRunbook.incident && <Badge variant="secondary">{viewRunbook.incident}</Badge>}
              {viewRunbook.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>

            {viewRunbook.description && (
              <p className="text-sm text-muted-foreground">{viewRunbook.description}</p>
            )}

            <div className="rounded-lg border border-border p-4">
              {viewRunbook.content ? (
                <MarkdownRenderer content={viewRunbook.content} />
              ) : (
                <p className="text-muted-foreground text-sm">Sem conteúdo documentado.</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setViewRunbook(null); openEdit(viewRunbook); }}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit dialog */}
      <RunbookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        runbook={editingRunbook}
        onSave={handleSave}
      />

      {/* Delete dialog */}
      {deleteTarget && (
        <DeleteRunbookDialog
          open={!!deleteTarget}
          onOpenChange={(v) => !v && setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={deleteTarget.title}
        />
      )}
    </div>
  );
}
