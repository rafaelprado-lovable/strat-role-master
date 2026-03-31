import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefinitionFieldsEditor } from "./DefinitionFieldsEditor";
import { Upload, FileText, X, Eye, Code } from "lucide-react";
import { MarkdownRenderer } from "@/components/definitions/MarkdownRenderer";
import type { Definition, DefinitionField } from "@/services/definitionService";

const ICON_OPTIONS = [
  'alert-triangle', 'terminal', 'message-circle', 'globe', 'timer',
  'brain', 'mail', 'database', 'code', 'zap', 'shield', 'server',
  'file-text', 'search', 'cpu', 'cloud', 'lock', 'key', 'webhook',
  'git-branch', 'split', 'filter',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition?: Definition | null;
  onSave: (definition: Definition) => void;
  loading?: boolean;
}

export function DefinitionDialog({ open, onOpenChange, definition, onSave, loading }: Props) {
  const isEditing = !!definition;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mdPreview, setMdPreview] = useState(false);

  const [form, setForm] = useState<Definition>({
    definition_id: '',
    label: '',
    icon: 'zap',
    description: '',
    category: 'action',
    group: '',
    inputs: [],
    outputs: [],
    documentation: '',
  });

  useEffect(() => {
    if (definition) {
      setForm({ ...definition });
    } else {
      setForm({
        definition_id: '',
        label: '',
        icon: 'zap',
        description: '',
        category: 'action',
        inputs: [],
        outputs: [],
        documentation: '',
      });
    }
    setMdPreview(false);
  }, [definition, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const update = (patch: Partial<Definition>) => setForm(prev => ({ ...prev, ...patch }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      update({ documentation: text });
    };
    reader.readAsText(file);
    // reset input so same file can be re-uploaded
    e.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Bloco' : 'Novo Bloco'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="inputs">Inputs ({form.inputs.length})</TabsTrigger>
              <TabsTrigger value="outputs">Outputs ({form.outputs.length})</TabsTrigger>
              <TabsTrigger value="docs" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Docs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Definition ID <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.definition_id}
                    onChange={(e) => update({ definition_id: e.target.value })}
                    placeholder="ssh_execution"
                    required
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Label <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.label}
                    onChange={(e) => update({ label: e.target.value })}
                    placeholder="SSH Execution"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria <span className="text-destructive">*</span></Label>
                  <Select value={form.category} onValueChange={(v) => update({ category: v as 'trigger' | 'action' | 'filter' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trigger">Gatilho (Trigger)</SelectItem>
                      <SelectItem value="filter">Filtro (Filter)</SelectItem>
                      <SelectItem value="action">Ação (Action)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select value={form.icon} onValueChange={(v) => update({ icon: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(icon => (
                        <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Descreva o que este bloco faz..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="inputs" className="mt-4">
              <DefinitionFieldsEditor
                label="Campos de Entrada (Inputs)"
                fields={form.inputs}
                onChange={(inputs) => update({ inputs })}
              />
            </TabsContent>

            <TabsContent value="outputs" className="mt-4">
              <DefinitionFieldsEditor
                label="Campos de Saída (Outputs)"
                fields={form.outputs}
                onChange={(outputs) => update({ outputs })}
              />
            </TabsContent>

            <TabsContent value="docs" className="mt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Documentação (Markdown)</Label>
                  <div className="flex items-center gap-2">
                    {form.documentation && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setMdPreview(!mdPreview)}
                        >
                          {mdPreview ? <Code className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {mdPreview ? 'Editar' : 'Preview'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive gap-1"
                          onClick={() => update({ documentation: '' })}
                        >
                          <X className="h-3 w-3" /> Limpar
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3 w-3" /> Upload .md
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md,.markdown,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {mdPreview && form.documentation ? (
                  <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto bg-card">
                    <MarkdownRenderer content={form.documentation} />
                  </div>
                ) : (
                  <Textarea
                    value={form.documentation || ''}
                    onChange={(e) => update({ documentation: e.target.value })}
                    placeholder="Cole ou faça upload de um arquivo .md com a documentação do node..."
                    rows={14}
                    className="font-mono text-xs"
                  />
                )}

                {!form.documentation && (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Arraste ou clique para fazer upload de um arquivo <strong>.md</strong>
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      O conteúdo será salvo como documentação do node
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.definition_id || !form.label}>
              {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
