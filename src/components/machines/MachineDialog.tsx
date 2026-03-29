import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi, organizationApi, departmentApi } from '@/services/mockApi';
import { Machine } from '@/types';
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
  host: z.string().min(1, 'Host é obrigatório'),
  port: z.coerce.number().min(1, 'Porta é obrigatória').max(65535, 'Porta inválida'),
  description: z.string().optional(),
  organization: z.string().min(1, 'Organização é obrigatória'),
  department: z.string().min(1, 'Departamento é obrigatório'),
});

type FormValues = z.infer<typeof formSchema>;

interface MachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine?: Machine;
}

export function MachineDialog({ open, onOpenChange, machine }: MachineDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!machine;

  const { data: organizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationApi.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAll,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 22,
      description: '',
      organization: '',
      department: '',
    },
  });

  useEffect(() => {
    if (machine) {
      form.reset({
        name: machine.name ?? '',
        host: machine.host ?? '',
        port: machine.port ?? 22,
        description: machine.description ?? '',
        organization: machine.organization ?? '',
        department: machine.department ?? '',
      });
    } else {
      form.reset({
        name: '',
        host: '',
        port: 22,
        description: '',
        organization: '',
        department: '',
      });
    }
  }, [machine, form]);

  const createMutation = useMutation({
    mutationFn: machineApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast({ title: 'Máquina criada', description: 'A máquina foi criada com sucesso.' });
      onOpenChange(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Machine> }) =>
      machineApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      toast({ title: 'Máquina atualizada', description: 'A máquina foi atualizada com sucesso.' });
      onOpenChange(false);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (isEditing && machine) {
      updateMutation.mutate({ id: machine._id, data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Máquina' : 'Nova Máquina'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize as informações da máquina' : 'Cadastre uma nova máquina no sistema'}
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
                    <Input placeholder="Ex: prod-app-01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host / IP</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 10.0.1.10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="22" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da máquina..." {...field} />
                  </FormControl>
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

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept._id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
