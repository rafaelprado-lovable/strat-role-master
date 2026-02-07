import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Edit2,
  MoreHorizontal,
  Play,
  Pause,
  Trash2,
  Copy,
  Clock,
  Search,
  Plus,
} from 'lucide-react';
import { Workflow } from '@/types/automations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomationsTableProps {
  automations: Workflow[];
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onDuplicate: (workflow: Workflow) => void;
  onToggleStatus: (id: string) => void;
  onRun: (id: string) => void;
  onCreate: () => void;
}

const statusConfig = {
  active: { label: 'Ativo', variant: 'default' as const, className: 'bg-green-500' },
  inactive: { label: 'Inativo', variant: 'secondary' as const, className: '' },
  draft: { label: 'Rascunho', variant: 'outline' as const, className: '' },
};

export function AutomationsTable({
  automations,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onRun,
  onCreate,
}: AutomationsTableProps) {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = automations.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSchedule = (schedule: Workflow['schedule']) => {
    if (!schedule) return 'Sem agendamento';
    switch (schedule.type) {
      case 'once':
        return `Uma vez em ${format(new Date(schedule.value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
      case 'interval': {
        const minutes = parseInt(schedule.value);
        if (minutes < 60) return `A cada ${minutes} minutos`;
        if (minutes < 1440) return `A cada ${Math.floor(minutes / 60)} horas`;
        return `A cada ${Math.floor(minutes / 1440)} dias`;
      }
      case 'cron':
        return `Cron: ${schedule.value}`;
      default:
        return 'Sem agendamento';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Workflow
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead>Última execução</TableHead>
              <TableHead className="text-right">Execuções</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search ? 'Nenhum workflow encontrado' : 'Nenhum workflow criado'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((wf) => {
                const status = statusConfig[wf.status];
                return (
                  <TableRow key={wf.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{wf.name}</p>
                        {wf.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {wf.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatSchedule(wf.schedule)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {wf.lastRunAt ? (
                        format(new Date(wf.lastRunAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      ) : (
                        <span className="text-muted-foreground">Nunca executado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{wf.runCount}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(wf)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRun(wf.id)}>
                            <Play className="h-4 w-4 mr-2" /> Executar agora
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onToggleStatus(wf.id)}>
                            {wf.status === 'active' ? (
                              <><Pause className="h-4 w-4 mr-2" /> Desativar</>
                            ) : (
                              <><Play className="h-4 w-4 mr-2" /> Ativar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(wf)}>
                            <Copy className="h-4 w-4 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(wf.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O workflow será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
