import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefinitionFieldsEditor } from "./DefinitionFieldsEditor";
import type { Definition, DefinitionField } from "@/services/definitionService";

const ICON_OPTIONS = [
  'alert-triangle', 'terminal', 'message-circle', 'globe', 'timer',
  'brain', 'mail', 'database', 'code', 'zap', 'shield', 'server',
  'file-text', 'search', 'cpu', 'cloud', 'lock', 'key', 'webhook',
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

  const [form, setForm] = useState<Definition>({
    definition_id: '',
    label: '',
    icon: 'zap',
    description: '',
    category: 'action',
    inputs: [],
    outputs: [],
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
      });
    }
  }, [definition, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const update = (patch: Partial<Definition>) => setForm(prev => ({ ...prev, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Bloco' : 'Novo Bloco'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="inputs">Inputs ({form.inputs.length})</TabsTrigger>
              <TabsTrigger value="outputs">Outputs ({form.outputs.length})</TabsTrigger>
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
                  <Select value={form.category} onValueChange={(v) => update({ category: v as 'trigger' | 'action' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trigger">Gatilho (Trigger)</SelectItem>
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
