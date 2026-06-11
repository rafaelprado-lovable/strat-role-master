import { useEffect, useState } from "react";
import { Workspace, workspaceService } from "@/services/workspaceService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace?: Workspace;
  onSaved?: () => void;
}

export function WorkspaceDialog({ open, onOpenChange, workspace, onSaved }: Props) {
  const { toast } = useToast();
  const isEditing = !!workspace;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(workspace?.name || "");
      setDescription(workspace?.description || "");
      setColor(workspace?.color || "#3B82F6");
    }
  }, [open, workspace]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (isEditing && workspace) {
        await workspaceService.update(workspace._id, { name, description, color });
        toast({ title: "Workspace atualizado" });
      } else {
        await workspaceService.create({ name, description, color });
        toast({ title: "Workspace criado" });
      }
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Workspace" : "Novo Workspace"}</DialogTitle>
          <DialogDescription>
            Workspaces isolam dados (changes, automations, etc) por contexto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: TIM Produção" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 rounded border border-input bg-background cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="max-w-[140px]" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
