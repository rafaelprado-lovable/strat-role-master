import { useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit2, MoreVertical, Play, Pause, Trash2, Copy, Clock, Search, Plus,
  Zap, Activity, GitBranch, Calendar, Hash, Workflow as WorkflowIcon, MonitorPlay, RefreshCw,
} from 'lucide-react';
import { Workflow, WorkflowTag } from '@/types/automations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { TagBadge } from './TagBadge';
import { TagFilter } from './TagFilter';
import { ExecutionStatusBadge, useRunningContext } from './ExecutionStatusBanner';

interface AutomationsTableProps {
  automations: Workflow[];
  totalExecutions?: number;
  executionCounts?: Record<string, number>;
  lastRunDates?: Record<string, string>;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onDuplicate: (workflow: Workflow) => void;
  onToggleStatus: (id: string) => void;
  onRun: (id: string) => void;
  onCreate: () => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className: string; dotClass: string }> = {
  active: { label: 'Ativo', variant: 'default', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20', dotClass: 'bg-emerald-500' },
  draft: { label: 'Rascunho', variant: 'outline', className: 'bg-muted/50 text-muted-foreground border-border', dotClass: 'bg-muted-foreground' },
};

export function AutomationsTable({
  automations, totalExecutions, executionCounts = {}, lastRunDates = {}, onEdit, onDelete, onDuplicate, onToggleStatus, onRun, onCreate,
}: AutomationsTableProps) {
  const [search, setSearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Collect all unique tags from workflows (deduplicate by name)
  const allTags = useMemo(() => {
    const tagMap = new Map<string, WorkflowTag>();
    automations.forEach(wf => {
      wf.tags?.forEach(tag => {
        const key = tag.name.toLowerCase();
        if (!tagMap.has(key)) tagMap.set(key, tag);
      });
    });
    return Array.from(tagMap.values());
  }, [automations]);

  // Resolve selected tag IDs to names for matching
  const selectedTagNames = useMemo(() => {
    return selectedTagIds.map(id => {
      const tag = allTags.find(t => t.id === id);
      return tag ? tag.name.toLowerCase() : '';
    }).filter(Boolean);
  }, [selectedTagIds, allTags]);

  const { runningMap, ready: runningReady } = useRunningContext();

  const filtered = automations.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesTags = selectedTagNames.length === 0 || 
      selectedTagNames.every(name => a.tags?.some(t => t.name.toLowerCase() === name));
    return matchesSearch && matchesTags;
  });

  // Execuções em andamento (separate list, no reordering)
  const runningWorkflows = useMemo(() => {
    if (!runningReady) return [];
    return filtered
      .filter(w => runningMap[w.id])
      .sort((a, b) => {
        const aTime = runningMap[a.id]?.created_at || '';
        const bTime = runningMap[b.id]?.created_at || '';
        return bTime.localeCompare(aTime); // most recent first
      });
  }, [filtered, runningMap, runningReady]);

  // Registered workflows exclude running ones to avoid duplication/reordering
  const registeredWorkflows = useMemo(() => {
    const runningIds = new Set(runningWorkflows.map(w => w.id));
    return filtered.filter(w => !runningIds.has(w.id));
  }, [filtered, runningWorkflows]);

  // Split into active and draft groups, stable sort by name (no execution reordering)
  const activeWorkflows = useMemo(() => {
    return [...registeredWorkflows]
      .filter(w => w.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registeredWorkflows]);

  const draftWorkflows = useMemo(() => {
    return [...registeredWorkflows]
      .filter(w => w.status !== 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registeredWorkflows]);

  const formatSchedule = (schedule: Workflow['schedule']) => {
    if (!schedule) return 'Manual';
    switch (schedule.type) {
      case 'once':
        return `Uma vez`;
      case 'interval': {
        const minutes = parseInt(schedule.value);
        if (minutes < 60) return `${minutes}min`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
        return `${Math.floor(minutes / 1440)}d`;
      }
      case 'cron':
        return `Cron`;
      default:
        return 'Manual';
    }
  };

  const activeCount = automations.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Workflows', value: automations.length, icon: GitBranch, color: 'text-primary' },
          { label: 'Ativos', value: activeCount, icon: Zap, color: 'text-emerald-500' },
          { label: 'Execuções Totais', value: totalExecutions ?? 0, icon: Activity, color: 'text-accent' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter & Create */}
      <motion.div
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar workflows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-card/50 border-border/50"
            />
          </div>
          {allTags.length > 0 && (
            <TagFilter
              availableTags={allTags}
              selectedTags={selectedTagIds}
              onChange={setSelectedTagIds}
            />
          )}
        </div>
        <Button onClick={onCreate} className="h-10 gap-2 font-semibold shadow-sm">
          <Plus className="h-4 w-4" />
          Novo Workflow
        </Button>
      </motion.div>

      {/* Cards Grid */}
      <AnimatePresence mode="popLayout">
        {activeWorkflows.length === 0 && draftWorkflows.length === 0 && runningWorkflows.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
              <WorkflowIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {search ? 'Nenhum workflow encontrado' : 'Nenhum workflow criado'}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {search ? 'Tente outro termo de busca' : 'Clique em "Novo Workflow" para começar'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
            <motion.aside
              key="running-panel"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="min-w-0"
            >
              <Card className="p-4 border-primary/20 bg-card/80 backdrop-blur-sm min-h-[240px] xl:sticky xl:top-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium text-foreground">Execuções em andamento</span>
                  </div>
                  <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-primary border-primary/30">
                    {runningWorkflows.length}
                  </Badge>
                </div>

                {runningWorkflows.length > 0 ? (
                  <div className="space-y-3">
                    {runningWorkflows.map((wf, i) => {
                      const running = runningMap[wf.id];
                      const progress = running && running.total_nodes > 0
                        ? Math.round((running.executed_nodes / running.total_nodes) * 100)
                        : 0;

                      return (
                        <motion.div
                          key={`running-${wf.id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                        >
                          <Card
                            className="group relative overflow-hidden border-primary/30 bg-primary/[0.03] backdrop-blur-sm hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                            onClick={() => navigate(`/automations/execute/${wf.id}`)}
                          >
                            <div className="relative p-4 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground truncate">{wf.name}</h3>
                                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{running?.execution_id}</p>
                                </div>
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1 bg-primary/15 text-primary border-primary/30 shrink-0">
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                  Em execução
                                </Badge>
                              </div>

                              {running && running.total_nodes > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{running.executed_nodes} de {running.total_nodes} nós</span>
                                    <span className="font-mono">{progress}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                </div>
                              )}

                              {running?.created_at && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  Iniciado {format(new Date(running.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                </div>
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-[172px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 text-center">
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium text-foreground">Nenhuma execução em andamento</p>
                      <p className="text-xs text-muted-foreground">Quando um workflow iniciar, ele aparece aqui sem mover a lista principal.</p>
                    </div>
                  </div>
                )}
              </Card>
            </motion.aside>

            <div className="min-w-0 space-y-6">
              {(activeWorkflows.length > 0 || draftWorkflows.length > 0) ? (
                <>
                  {activeWorkflows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-foreground">Ativos</span>
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          {activeWorkflows.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {activeWorkflows.map((wf, i) => {
                          const status = statusConfig[wf.status];
                          return (
                            <motion.div
                              key={wf.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                              <Card
                                className="group relative overflow-hidden border-border/50 bg-card/90 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                                onClick={() => onEdit(wf)}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative p-5 space-y-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">{wf.name}</h3>
                                      {wf.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{wf.description}</p>}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(wf); }}><Edit2 className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(wf); }}><Copy className="h-4 w-4 mr-2" /> Duplicar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRun(wf.id); }}><Play className="h-4 w-4 mr-2" /> Executar agora</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(wf.id); }}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 gap-1.5 ${status.className}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} ${wf.status === 'active' ? 'animate-pulse' : ''}`} />
                                      {status.label}
                                    </Badge>
                                    <ExecutionStatusBadge workflowId={wf.id} />
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 gap-1 text-muted-foreground border-border/50"><Clock className="h-3 w-3" />{formatSchedule(wf.schedule)}</Badge>
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 gap-1 text-muted-foreground border-border/50"><GitBranch className="h-3 w-3" />{wf.nodes?.length || 0} nós</Badge>
                                  </div>
                                  {wf.tags && wf.tags.length > 0 && (
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      {wf.tags.slice(0, 3).map(tag => (<TagBadge key={tag.id} tag={tag} size="sm" />))}
                                      {wf.tags.length > 3 && (<Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">+{wf.tags.length - 3}</Badge>)}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{(lastRunDates[wf.id] || wf.lastRunAt) ? format(new Date(lastRunDates[wf.id] || wf.lastRunAt!), "dd MMM 'às' HH:mm", { locale: ptBR }) : 'Nunca executado'}</div>
                                    <div className="flex items-center gap-1.5"><Hash className="h-3 w-3" />{executionCounts[wf.id] ?? 0} execuções</div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeWorkflows.length > 0 && draftWorkflows.length > 0 && (
                    <Separator className="my-2" />
                  )}

                  {draftWorkflows.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Em desenvolvimento</span>
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-muted-foreground border-border/50">
                          {draftWorkflows.length}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {draftWorkflows.map((wf, i) => {
                          const status = statusConfig[wf.status];
                          return (
                            <motion.div
                              key={wf.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: i * 0.05, duration: 0.3 }}
                            >
                              <Card
                                className="group relative overflow-hidden border-border/50 bg-card/90 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                                onClick={() => onEdit(wf)}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="relative p-5 space-y-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">{wf.name}</h3>
                                      {wf.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{wf.description}</p>}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(wf); }}><Edit2 className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(wf); }}><Copy className="h-4 w-4 mr-2" /> Duplicar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRun(wf.id); }}><Play className="h-4 w-4 mr-2" /> Executar agora</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(wf.id); }}><Trash2 className="h-4 w-4 mr-2" /> Excluir</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 gap-1.5 ${status.className}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} ${wf.status === 'active' ? 'animate-pulse' : ''}`} />
                                      {status.label}
                                    </Badge>
                                    <ExecutionStatusBadge workflowId={wf.id} />
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 gap-1 text-muted-foreground border-border/50"><Clock className="h-3 w-3" />{formatSchedule(wf.schedule)}</Badge>
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 gap-1 text-muted-foreground border-border/50"><GitBranch className="h-3 w-3" />{wf.nodes?.length || 0} nós</Badge>
                                  </div>
                                  {wf.tags && wf.tags.length > 0 && (
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      {wf.tags.slice(0, 3).map(tag => (<TagBadge key={tag.id} tag={tag} size="sm" />))}
                                      {wf.tags.length > 3 && (<Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">+{wf.tags.length - 3}</Badge>)}
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{(lastRunDates[wf.id] || wf.lastRunAt) ? format(new Date(lastRunDates[wf.id] || wf.lastRunAt!), "dd MMM 'às' HH:mm", { locale: ptBR }) : 'Nunca executado'}</div>
                                    <div className="flex items-center gap-1.5"><Hash className="h-3 w-3" />{executionCounts[wf.id] ?? 0} execuções</div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-10 border-border/50 bg-card/80 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {search ? 'Nenhum workflow cadastrado corresponde ao filtro' : 'Nenhum workflow cadastrado fora de execução'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os workflows em andamento continuam isolados no painel ao lado.
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

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
