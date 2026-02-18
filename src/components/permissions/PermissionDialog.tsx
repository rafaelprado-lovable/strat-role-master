import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionApi } from '@/services/mockApi';
import { Permission } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox"
import { scopeApi } from '@/services/mockApi';
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
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    actions: z.array(z.string()).min(1, 'Selecione pelo menos uma ação'),
    scopes: z.array(z.string()).min(1, 'Selecione pelo menos um escopo'),
});

type FormValues = z.infer<typeof formSchema>;

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission;
}

const actions = ['create', 'read', 'update', 'delete'];

export function PermissionDialog({ open, onOpenChange, permission }: PermissionDialogProps) {
  const { toast } = useToast();
  const { data: scopes, isLoading } = useQuery({
    queryKey: ['scopes'],
    queryFn: scopeApi.getAll,
  });

  const queryClient = useQueryClient();
  const isEditing = !!permission;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      scopes: [],
      actions: [],
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
      updateMutation.mutate({ id: permission._id, data });
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

            <FormItem>
              <FormLabel>Escopos</FormLabel>
              <div className="space-y-2">
                {scopes?.filter((scope) =>
                  ["api", "submenu", "guia_unica"].includes(scope.type)
                )
                .map((scope) => (
                  <FormField
                    key={scope.url}
                    control={form.control}
                    name="scopes"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, scope.url]
                                  : field.value.filter((v: string) => v !== scope.url);
                                field.onChange(newValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {scope.url}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
            </FormItem>


            <FormItem>
              <FormLabel>Ações</FormLabel>
              <div className="space-y-2">
                {actions.map((action) => (
                  <FormField
                    key={action}
                    control={form.control}
                    name="actions"
                    render={({ field }) => {
                      const checked = field.value?.includes(action);
                      return (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...field.value, action]
                                  : field.value.filter((v: string) => v !== action);
                                field.onChange(newValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {action}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
            </FormItem>

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
