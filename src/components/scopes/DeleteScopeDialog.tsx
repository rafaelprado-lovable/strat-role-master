import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scopeApi } from '@/services/mockApi';
import { Scope } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface DeleteScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: Scope | null;
}

export function DeleteScopeDialog({ open, onOpenChange, scope }: DeleteScopeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: scopeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scopes'] });
      toast({
        title: 'Escopo excluído',
        description: 'O escopo foi excluído com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    console.log(scope)
    if (scope) {
      deleteMutation.mutate(scope._id);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o escopo <strong>{scope?.name}</strong>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
