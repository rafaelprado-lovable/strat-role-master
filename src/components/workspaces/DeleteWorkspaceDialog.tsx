import { Workspace, workspaceService } from "@/services/workspaceService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace | null;
  onDeleted?: () => void;
}

export function DeleteWorkspaceDialog({ open, onOpenChange, workspace, onDeleted }: Props) {
  const { toast } = useToast();
  const handleConfirm = async () => {
    if (!workspace) return;
    await workspaceService.remove(workspace._id);
    toast({ title: "Workspace excluído" });
    onDeleted?.();
    onOpenChange(false);
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O workspace <strong>{workspace?.name}</strong> será removido.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
