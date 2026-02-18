import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '@/services/mockApi';
import { Organization } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});

type FormValues = z.infer<typeof formSchema>;

interface OrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization?: Organization;
}

export function OrganizationDialog({ open, onOpenChange, organization }: OrganizationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!organization;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  // ✅ Atualiza o formulário quando muda a organização
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name ?? '',
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [organization, form]);

  const createMutation = useMutation({
    mutationFn: organizationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organização criada',
        description: 'A organização foi criada com sucesso.',
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: `Erro ao criar a organização: ${error}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ data }: { data: Partial<Organization> }) =>
      organizationApi.update(organization._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organização atualizada',
        description: 'A organização foi atualizada com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing && organization) {
      updateMutation.mutate({ data });
    } else {
      createMutation.mutate(data as Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Organização' : 'Nova Organização'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da organização'
              : 'Crie uma nova organização no sistema'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Eng Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
