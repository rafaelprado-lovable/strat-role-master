import { useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi } from '@/services/mockApi';
import { Machine } from '@/types';
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

interface DeleteMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
}

export function DeleteMachineDialog({ open, onOpenChange, machine }: DeleteMachineDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: machineApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast({
        title: 'Máquina excluída',
        description: 'A máquina foi excluída com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const handleDelete = () => {
    if (machine) {
      deleteMutation.mutate(machine._id);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a máquina <strong>{machine?.name}</strong> ({machine?.host})?
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
