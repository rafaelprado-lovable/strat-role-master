import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, organizationApi, roleApi, departmentApi } from '@/services/mockApi';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { useEffect } from "react";
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  organizationId: z.string().min(1, 'Organização é obrigatória'),
  roleId: z.string().min(1, 'Função é obrigatória'),
  password: z.string().min(8, 'Minimo de 8 caracteres'),
  departmentIds: z.array(z.string()).min(1, 'Selecione pelo menos um departamento'),
  phoneNumber: z.string().min(1, 'Telefone é obrigatório'),
  status: z.enum(['active', 'inactive']),
});

type FormValues = z.infer<typeof formSchema>;

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationApi.getAll,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: roleApi.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      organizationId: user?.organization || '',
      roleId: user?.role || '',
      departmentIds: user?.departmentIds || [],
      phoneNumber: user?.phoneNumber || ''
    },
  });

  useEffect(() => {
    if (user) {
      // transforma a string separada por vírgula em array de IDs
      const departmentIds = (user as any).departament
        ? (user as any).departament.split(',').map((id: string) => id.trim())
        : [];

      form.reset({
        name: user.name || '',
        email: user.email || '',
        organizationId: (user.organization as any)?._id || user.organization || '',
        roleId: (user.role as any)?._id || user.role || '',
        departmentIds, // 👈 agora o react-hook-form entende os checkboxes
        phoneNumber: user.phoneNumber || '',
        password: user.password
      });
    } else {
      form.reset({
        name: '',
        email: '',
        organizationId: '',
        roleId: '',
        departmentIds: [],
        phoneNumber: '',
        password: '',
        status: 'active',
      });
    }
  }, [user, form]);


  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário criado',
        description: 'O usuário foi criado com sucesso.',
      });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuário atualizado',
        description: 'O usuário foi atualizado com sucesso.',
      });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing && user) {
      updateMutation.mutate({ id: user._id, data });
    } else {
      createMutation.mutate(data as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do usuário'
              : 'Crie um novo usuário no sistema'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="joao@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
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
                            <SelectItem key={org._id} value={org.name}>
                              {org.name}
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
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles?.map((role) => (
                            <SelectItem key={role._id} value={role._id}>
                              {role.name}
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
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5511981289919" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

            </div>

            <FormField
              control={form.control}
              name="departmentIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Departamentos</FormLabel>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {departments?.map((dept) => (
                      <FormField
                        key={dept._id}
                        control={form.control}
                        name="departmentIds"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={dept._id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(dept._id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, dept._id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== dept._id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {dept.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
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
