import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi, organizationApi, userApi } from '@/services/mockApi';
import { Department } from '@/types';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
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
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  organization: z.string().min(1, 'Organização é obrigatória'),
  groupName: z.string().min(1, 'Grupo é obrigatória'),
  sysId: z.string().min(1, 'SysId é obrigatório'),
  manager: z.string().min(1, 'SysId é obrigatório'),
  coordinator: z.string().min(1, 'SysId é obrigatório'),
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

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: department?._id || '',
      name: department?.name || '',
      organization: department?.organization || '',
      groupName: department?.groupName || '',
      sysId: department?.sysId || '',
      manager: department?.manager || '',
      coordinator: department?.coordinator || '',
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
      updateMutation.mutate({ id: department._id, data });
    } else {
      createMutation.mutate(data as Omit<Department, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };


  useEffect(() => {
    if (department) {
      form.reset({
        id: department._id ?? '',
        name: department.name ?? '',
        organization: department.organization ?? '',
        groupName: department.groupName ?? '',
        sysId: department.sysId ?? '',
        manager: department.manager ?? '',
        coordinator: department.coordinator ?? '',
        
      });
    } else {
      form.reset({
        id: '',
        name: '',
        organization: '',
        groupName: '',
        sysId: '',
        coordinator: '',
        manager: '',
      });
    }
  }, [department, form]);


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
              name="sysId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SysId no Service Now</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: eabf34b2db10d1549c4087b304961909" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do grupo no Whatsapp</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: ENG Produção  - TIM" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gerente</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um Gerente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((manager) => (
                        <SelectItem key={manager._id} value={manager._id}>
                          {manager.name}
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
              name="coordinator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coordenador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um coordenador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name}
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
