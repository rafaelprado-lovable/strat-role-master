import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarkdownRenderer } from "@/components/definitions/MarkdownRenderer";
import { Plus, Upload, Eye, Code, X, Image, FileText, Link, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Runbook, RunbookAttachment } from "@/types/runbooks";

const MOCK_SERVICES = ["API Gateway", "Auth Service", "Payment Service", "Notification Service", "Database Cluster", "CDN"];
const MOCK_TAGS = ["critical", "network", "database", "kubernetes", "rollback", "security", "monitoring"];

const RUNBOOK_TEMPLATE = `# Roteiro de análise / Troubleshooting

# Sistemas envolvidos: [SISTEMA]

# Procedimento de Validação/Atuação de health – Ambiente [SISTEMA]

# 1. Objetivo

Descreva aqui o objetivo deste runbook. Exemplo:
Este documento descreve o passo a passo para validação da saúde do ambiente, garantindo que todos os componentes críticos estejam operando corretamente antes, durante ou após intervenções técnicas.

# 2. Escopo

Este procedimento deve ser seguido sempre que houver necessidade de:

- Validação preventiva do ambiente
- Análise de incidentes
- Pós-manutenção ou pós-deploy
- Check de rotina operacional

# 3. Validação do Estado do Ambiente

## 3.1 Dashboard

Acessar: [URL do dashboard/Grafana]

Descreva os indicadores e métricas a serem observados.

# 4. Validações do Ambiente

## 4.1 Validação dos Nodes/Serviços

Descreva o procedimento de validação dos nodes e serviços.

## 4.2 Procedimento de Recuperação

Caso identificado problema, descreva os passos de recuperação:

1. Identificar o processo/serviço com problema
2. Efetuar a parada do serviço
3. Realizar o restart
4. Validar o retorno à normalidade

# 5. Validação Pós-Procedimento

Descreva como validar que o ambiente voltou ao normal após a intervenção.

# 6. Considerações Finais

Este procedimento garante uma visão clara da saúde do ambiente, ajudando na prevenção de incidentes e na rápida identificação de falhas.

# ✅ Conclusão Operacional

- Resumo do problema identificado
- Ações tomadas
- Validação realizada após intervenção
`;

const EMPTY_FORM = {
  title: "",
  description: "",
  content: "",
  tags: [] as string[],
  service: "",
  incident: "",
  sistemas: "",
  attachments: [] as RunbookAttachment[],
};

interface RunbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runbook?: Runbook | null;
  onSave: (data: Omit<Runbook, "id" | "createdAt" | "updatedAt">) => void;
}

export function RunbookDialog({ open, onOpenChange, runbook, onSave }: RunbookDialogProps) {
  const isEditing = !!runbook;
  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [previewMd, setPreviewMd] = useState(false);
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm(
        runbook
          ? { title: runbook.title, description: runbook.description, content: runbook.content, tags: [...runbook.tags], service: runbook.service, incident: runbook.incident, sistemas: runbook.sistemas || "", attachments: [...(runbook.attachments || [])] }
          : { ...EMPTY_FORM, tags: [], attachments: [] }
      );
      setPreviewMd(false);
    }
    onOpenChange(v);
  };

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) update({ tags: [...form.tags, t] });
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

  const applyTemplate = () => {
    const content = RUNBOOK_TEMPLATE.replace(/\[SISTEMA\]/g, form.sistemas || form.service || "Sistema");
    update({ content });
    toast({ title: "Template aplicado" });
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="content">Conteúdo (MD)</TabsTrigger>
            <TabsTrigger value="attachments">Anexos ({form.attachments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Ex: Procedimento de Validação - PFE" />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Breve resumo do procedimento operacional" rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sistemas Envolvidos</Label>
                <Input value={form.sistemas} onChange={(e) => update({ sistemas: e.target.value })} placeholder="Ex: PFE, NMWS, API Gateway" />
              </div>

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
            </div>

            <div className="space-y-2">
              <Label>Incidente / Sala de Crise</Label>
              <Input value={form.incident} onChange={(e) => update({ incident: e.target.value })} placeholder="Ex: INC-001, CRISIS-042" />
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
              <div className="flex flex-wrap gap-1.5 mt-1">
                {MOCK_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
                  <Badge key={t} variant="outline" className="cursor-pointer text-xs hover:bg-primary/10" onClick={() => update({ tags: [...form.tags, t] })}>
                    + {t}
                  </Badge>
                ))}
              </div>
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

          <TabsContent value="content" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload .md
                </Button>
                <input ref={fileRef} type="file" accept=".md,.txt,.markdown" className="hidden" onChange={handleFileUpload} />
                {!form.content && (
                  <Button size="sm" variant="secondary" onClick={applyTemplate}>
                    <Code className="mr-1.5 h-3.5 w-3.5" />
                    Usar Template Padrão
                  </Button>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPreviewMd(!previewMd)}>
                {previewMd ? <><Code className="mr-1.5 h-3.5 w-3.5" /> Editar</> : <><Eye className="mr-1.5 h-3.5 w-3.5" /> Preview</>}
              </Button>
            </div>

            {!form.content && !previewMd && (
              <div className="rounded-lg border border-dashed border-border p-4 bg-muted/30 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">📋 Estrutura padrão do runbook:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Objetivo</li>
                  <li>Escopo</li>
                  <li>Validação do Estado do Ambiente</li>
                  <li>Validações do Ambiente (nodes, serviços)</li>
                  <li>Validação Pós-Procedimento</li>
                  <li>Considerações Finais</li>
                  <li>✅ Conclusão Operacional</li>
                </ol>
                <p className="mt-2">Clique em <strong>"Usar Template Padrão"</strong> para preencher automaticamente.</p>
              </div>
            )}

            {previewMd ? (
              <div className="rounded-lg border border-border p-4 min-h-[300px]">
                {form.content ? <MarkdownRenderer content={form.content} attachmentMap={Object.fromEntries(form.attachments.map(a => [a.id, a.url]))} /> : <p className="text-muted-foreground text-sm">Nenhum conteúdo</p>}
              </div>
            ) : (
              <Textarea
                value={form.content}
                onChange={(e) => update({ content: e.target.value })}
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (const item of Array.from(items)) {
                    if (item.type.startsWith("image/")) {
                      e.preventDefault();
                      const file = item.getAsFile();
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const dataUri = evt.target?.result as string;
                        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
                        const name = `${form.title.trim() || "runbook"}-${timestamp}`;
                        const att: RunbookAttachment = { id: crypto.randomUUID(), name, url: dataUri, type: "image" };
                        const target = e.target as HTMLTextAreaElement;
                        const pos = target.selectionStart || form.content.length;
                        const imgMd = `![${name}](attachment:${att.id})\n`;
                        const newContent = form.content.slice(0, pos) + imgMd + form.content.slice(pos);
                        update({ content: newContent, attachments: [...form.attachments, att] });
                        toast({ title: "Imagem adicionada aos anexos" });
                      };
                      reader.readAsDataURL(file);
                      return;
                    }
                  }
                  const text = e.clipboardData.getData("text/plain").trim();
                  if (text && /^https?:\/\/.+/i.test(text)) {
                    e.preventDefault();
                    const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(text);
                    const target = e.target as HTMLTextAreaElement;
                    const pos = target.selectionStart || form.content.length;
                    if (isImage) {
                      const name = text.split("/").pop()?.split("?")[0] || "imagem";
                      const att: RunbookAttachment = { id: crypto.randomUUID(), name, url: text, type: "image" };
                      const imgMd = `![${name}](${text})\n`;
                      const newContent = form.content.slice(0, pos) + imgMd + form.content.slice(pos);
                      update({ content: newContent, attachments: [...form.attachments, att] });
                      toast({ title: "Imagem adicionada aos anexos" });
                    } else {
                      const md = `[${text.split("/").pop() || "arquivo"}](${text})\n`;
                      const newContent = form.content.slice(0, pos) + md + form.content.slice(pos);
                      update({ content: newContent });
                      toast({ title: "Link inserido" });
                    }
                  }
                }}
                placeholder="# Roteiro de análise / Troubleshooting&#10;&#10;# 1. Objetivo&#10;&#10;Descreva o objetivo...&#10;&#10;💡 Cole imagens ou URLs com Ctrl+V"
                className="min-h-[300px] font-mono text-sm"
              />
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Adicionar anexo por URL</Label>
              <div className="flex gap-2">
                <Input value={attachName} onChange={(e) => setAttachName(e.target.value)} placeholder="Nome do arquivo" className="flex-1" />
                <Input value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} placeholder="https://..." className="flex-[2]" />
                <Button type="button" size="sm" variant="outline" onClick={() => {
                  if (!attachUrl.trim()) { toast({ title: "URL obrigatória", variant: "destructive" }); return; }
                  const url = attachUrl.trim();
                  const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(url);
                  const name = attachName.trim() || url.split("/").pop() || "anexo";
                  const att: RunbookAttachment = { id: crypto.randomUUID(), name, url, type: isImage ? "image" : "file" };
                  update({ attachments: [...form.attachments, att] });
                  setAttachName(""); setAttachUrl("");
                }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {form.attachments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum anexo adicionado</p>
                <p className="text-xs mt-1">Cole a URL de imagens ou arquivos externos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {form.attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    {att.type === "image" ? (
                      <Image className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.name}</p>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary truncate block">{att.url}</a>
                    </div>
                    {att.type === "image" && (
                      <img src={att.url} alt={att.name} className="h-10 w-10 rounded object-cover border border-border" />
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => update({ attachments: form.attachments.filter((a) => a.id !== att.id) })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
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
