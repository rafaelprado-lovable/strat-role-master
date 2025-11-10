import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi } from '@/services/mockApi';
import { Permission } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
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
  description: z.string().min(1, 'Descrição é obrigatória'),
  resource: z.string().min(1, 'Recurso é obrigatório'),
  action: z.string().min(1, 'Ação é obrigatória'),
});

type FormValues = z.infer<typeof formSchema>;

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission;
}

const resources = ['organizations', 'users', 'roles', 'permissions'];
const actions = ['create', 'read', 'update', 'delete'];

export function PermissionDialog({ open, onOpenChange, permission }: PermissionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!permission;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: permission?.name || '',
      description: permission?.description || '',
      resource: permission?.resource || '',
      action: permission?.action || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: permissionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Permissão criada',
        description: 'A permissão foi criada com sucesso.',
      });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Permission> }) =>
      permissionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: 'Permissão atualizada',
        description: 'A permissão foi atualizada com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing && permission) {
      updateMutation.mutate({ id: permission.id, data });
    } else {
      createMutation.mutate(data as Omit<Permission, 'id' | 'createdAt'>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Permissão' : 'Nova Permissão'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações da permissão' : 'Crie uma nova permissão no sistema'}
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
                    <Input placeholder="Ex: Criar Usuários" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a permissão"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurso</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um recurso" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resources.map((resource) => (
                        <SelectItem key={resource} value={resource}>
                          {resource}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma ação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
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
