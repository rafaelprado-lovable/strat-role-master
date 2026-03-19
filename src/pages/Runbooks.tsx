import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MarkdownRenderer } from "@/components/definitions/MarkdownRenderer";
import { Image, FileText } from "lucide-react";
import { RunbookDialog } from "@/components/runbooks/RunbookDialog";
import { DeleteRunbookDialog } from "@/components/runbooks/DeleteRunbookDialog";
import { BookOpen, Plus, Pencil, Trash2, Search, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Runbook } from "@/types/runbooks";

const initialRunbooks: Runbook[] = [
  {
    id: "1",
    title: "Procedimento de Validação - PFE Front End",
    description: "Passo a passo para validação da saúde do ambiente PFE e restart de nodes",
    content: "# Roteiro de análise / Troubleshooting\n\n# Sistemas envolvidos: PFE\n\n# 1. Objetivo\n\nEste documento descreve o passo a passo para validação da saúde do ambiente PFE.\n\n# 2. Escopo\n\n- Validação preventiva do ambiente\n- Análise de incidentes\n- Pós-manutenção ou pós-deploy\n\n# 3. Validação do Estado do Ambiente\n\n## 3.1 Dashboard\n\nAcessar Grafana e verificar métricas de `httpStatus (-40000)` para problemas de timeout.\n\n# 4. Validações do Ambiente\n\n## 4.1 Validar Health dos Nodes\n\nCaso identificado problema em algum dos nodes, efetuar shutdown e restart.\n\n## 4.2 Console Weblogic fora do Ar\n\nCaso a console esteja inacessível:\n\n```bash\nps -ef | grep -i admin\nkill -9 [PID]\ncd /MIPPapp/mippfe/Oracle/Middleware/user_projects/domains/Mipp2Domain/\nnohup ./startWebLogic.sh &\n```\n\n# 5. Validação Pós-Procedimento\n\nAcesse o Grafana para conferir a normalização do ambiente.\n\n# 6. Considerações Finais\n\nEste procedimento garante uma visão clara da saúde do ambiente.\n\n# ✅ Conclusão Operacional\n\n- Tempo alto/timeout com provedor PFE\n- Identificação de erros -40000\n- Restart na aplicação Front-End do PFE\n- Validação realizada via Grafana após subida dos processos",
    tags: ["critical", "kubernetes"],
    service: "API Gateway",
    incident: "INC-001",
    sistemas: "PFE",
    attachments: [],
    createdAt: new Date("2025-12-01"),
    updatedAt: new Date("2026-02-15"),
  },
  {
    id: "2",
    title: "Failover de Database",
    description: "Runbook de failover do cluster de banco de dados primário para réplica",
    content: "# Roteiro de análise / Troubleshooting\n\n# Sistemas envolvidos: Database Cluster\n\n# 1. Objetivo\n\nProcedimento de failover do cluster primário.\n\n# 2. Escopo\n\n- Falha do cluster primário\n- Manutenção programada\n\n# 3. Validação do Estado do Ambiente\n\n## 3.1 Console AWS RDS\n\nVerificar status das instâncias.\n\n# 4. Validações do Ambiente\n\n## 4.1 Promover Réplica\n\n1. Acessar console AWS RDS\n2. Promover réplica\n3. Atualizar DNS\n4. Validar conexões\n\n# 5. Validação Pós-Procedimento\n\nVerificar que todas as aplicações reconectaram.\n\n# 6. Considerações Finais\n\nManter documentação atualizada.\n\n# ✅ Conclusão Operacional\n\n- Failover executado com sucesso\n- Validação de conexões realizada",
    tags: ["database", "critical"],
    service: "Database Cluster",
    incident: "CRISIS-042",
    sistemas: "Database Cluster",
    attachments: [],
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-03-01"),
  },
];

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
        r.incident.toLowerCase().includes(q) ||
        r.sistemas.toLowerCase().includes(q)
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

  const openEdit = (r: Runbook) => { setEditingRunbook(r); setDialogOpen(true); };
  const openCreate = () => { setEditingRunbook(null); setDialogOpen(true); };

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
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar runbooks..." className="pl-9" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Sistemas</TableHead>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                    {r.sistemas && <Badge variant="outline" className="text-xs">{r.sistemas}</Badge>}
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
                      <Button size="sm" variant="ghost" onClick={() => setViewRunbook(r)} title="Visualizar">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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
              {viewRunbook.sistemas && <Badge variant="outline">{viewRunbook.sistemas}</Badge>}
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
                <MarkdownRenderer content={viewRunbook.content} attachmentMap={Object.fromEntries((viewRunbook.attachments || []).map(a => [a.id, a.url]))} />
              ) : (
                <p className="text-muted-foreground text-sm">Sem conteúdo documentado.</p>
              )}
            </div>

            {viewRunbook.attachments && viewRunbook.attachments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Anexos</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {viewRunbook.attachments.map((att) => (
                    <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                      {att.type === "image" ? (
                        <Image className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm truncate">{att.name}</span>
                      {att.type === "image" && (
                        <img src={att.url} alt={att.name} className="h-8 w-8 rounded object-cover border border-border ml-auto" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

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
      <RunbookDialog open={dialogOpen} onOpenChange={setDialogOpen} runbook={editingRunbook} onSave={handleSave} />

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
