import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scopeApi, organizationApi } from '@/services/mockApi';
import { Scope } from '@/types';
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
  organizationId: z.string().min(1, 'Organização é obrigatória'),
});

type FormValues = z.infer<typeof formSchema>;

interface ScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope?: Scope;
}

export function ScopeDialog({ open, onOpenChange, scope }: ScopeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!scope;

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationApi.getAll,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: scope?.name || '',
      description: scope?.description || '',
      organizationId: scope?.organizationId || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: scopeApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scopes'] });
      toast({
        title: 'Escopo criado',
        description: 'O escopo foi criado com sucesso.',
      });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Scope> }) =>
      scopeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scopes'] });
      toast({
        title: 'Escopo atualizado',
        description: 'O escopo foi atualizado com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing && scope) {
      updateMutation.mutate({ id: scope.id, data });
    } else {
      createMutation.mutate(data as Omit<Scope, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Escopo' : 'Novo Escopo'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do escopo'
              : 'Crie um novo escopo no sistema'}
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
                    <Input placeholder="Ex: Escopo Regional Sul" {...field} />
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
                      placeholder="Descreva o escopo"
                      {...field}
                    />
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
