import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi, organizationApi } from '@/services/mockApi';
import { Department } from '@/types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  organizationId: z.string().min(1, 'Organização é obrigatória'),
});

type FormValues = z.infer<typeof formSchema>;

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department;
}

export function DepartmentDialog({ open, onOpenChange, department }: DepartmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!department;

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationApi.getAll,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: department?.name || '',
      organizationId: department?.organizationId || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: departmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Departamento criado',
        description: 'O departamento foi criado com sucesso.',
      });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      departmentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: 'Departamento atualizado',
        description: 'O departamento foi atualizado com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing && department) {
      updateMutation.mutate({ id: department.id, data });
    } else {
      createMutation.mutate(data as Omit<Department, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do departamento'
              : 'Crie um novo departamento no sistema'}
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
                    <Input placeholder="Ex: CTIO IT - INTEGRATION SOLUTIONS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organização</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma organização" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
