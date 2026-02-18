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
import { useQueryClient } from '@tanstack/react-query';
import { plantaoApi } from '@/services/mockApi';
import { toast } from 'sonner';
import { Plantao } from '@/types';

interface DeletePlantaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantao: Plantao | null;
}

export function DeletePlantaoDialog({
  open,
  onOpenChange,
  plantao,
}: DeletePlantaoDialogProps) {
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!plantao) return;

    try {
      await plantaoApi.delete(plantao._id);
      toast.success('Plantão excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['plantoes'] });
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao excluir plantão.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este plantão? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
