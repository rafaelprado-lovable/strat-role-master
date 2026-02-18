import { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings, Rocket, Folder, Lock } from 'lucide-react';

// ✅ Schema dinâmico com zod
const formSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    url: z.string().optional(),
    organization: z.string().min(1, 'Organização é obrigatória'),
    type: z.string().min(1, 'Tipo é obrigatório'),
    icon: z.string().optional(),
    related_menu: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === 'guia_unica' || data.type === 'submenu') && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'A URL é obrigatória para este tipo de escopo',
      });
    }

    if (data.type === 'menu' && !data.icon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['icon'],
        message: 'O ícone é obrigatório para escopos do tipo menu',
      });
    }

    if (data.type === 'submenu' && !data.related_menu) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['related_menu'],
        message: 'O menu relacionado é obrigatório para submenus',
      });
    }
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

  // ✅ busca dos dados
  const { data: scopes } = useQuery({
    queryKey: ['scopes'],
    queryFn: scopeApi.getAll,
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationApi.getAll,
  });

  // ✅ configuração do formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      url: '',
      organization: '',
      type: '',
      icon: '',
      related_menu: '',
    },
  });

  // ✅ Atualiza valores quando "scope" é passado (edição)
  useEffect(() => {
    if (scope) {
      form.reset({
        name: scope.name || '',
        url: scope.url || '',
        organization: scope.organization || '',
        type: scope.type || '',
        icon: scope.icone || '',
        related_menu: scope.menu || '',
      });
    } else {
      form.reset({
        name: '',
        url: '',
        organization: '',
        type: '',
        icon: '',
        related_menu: '',
      });
    }
  }, [scope, form, open]); // <- reseta quando o modal abre

  const typeValue = form.watch('type');

  // ✅ Mutations
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
    onError: () => {
      toast({
        title: 'Erro ao criar escopo',
        description: 'Verifique os campos e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Scope> }) =>
      scopeApi.update(scope._id, data),
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
    console.log('🔹 Dados enviados:', data);
    if (isEditing && scope) {
      updateMutation.mutate({ id: scope._id, data });
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
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Tela de aplicação de changes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de escopo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo do escopo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="guia_unica">Guia única</SelectItem>
                      <SelectItem value="menu">Menu</SelectItem>
                      <SelectItem value="submenu">Submenu</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos condicionais */}
            {(typeValue === 'guia_unica' || typeValue === 'api' || typeValue === 'submenu') && (
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: /create/change" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {typeValue === 'submenu' && (
              <FormField
                control={form.control}
                name="related_menu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menu responsável</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um menu" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {scopes?.map(
                          (scope) =>
                            scope.type === 'menu' && (
                              <SelectItem key={scope._id} value={scope.name}>
                                {scope.name}
                              </SelectItem>
                            )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {typeValue === 'menu' && (
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um ícone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="settings">
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>Engrenagem</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rocket">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-4 w-4" />
                            <span>Foguete</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="folder">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4" />
                            <span>Pasta</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="lock">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span>Cadeado</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Organização */}
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organização</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma organização" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations?.map((organization) => (
                        <SelectItem key={organization._id} value={organization.name}>
                          {organization.name}
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
