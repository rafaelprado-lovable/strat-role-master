import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  History, Tag, RotateCcw, GitCompare, Loader2, Plus, Check,
  ChevronRight, Circle, ArrowRight, Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  workflowVersionService,
  type WorkflowVersion,
  type VersionDiff,
} from '@/services/workflowVersionService';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  onRestore: (snapshot: Record<string, unknown>) => void;
}

type View = 'list' | 'compare';

export function VersionHistoryDialog({
  open, onOpenChange, workflowId, onRestore,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>('list');
  const [selectedA, setSelectedA] = useState<WorkflowVersion | null>(null);
  const [selectedB, setSelectedB] = useState<WorkflowVersion | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [taggingVersionId, setTaggingVersionId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!workflowId) return;
    setLoading(true);
    try {
      const data = await workflowVersionService.list(workflowId);
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    if (open) {
      fetchVersions();
      setView('list');
      setSelectedA(null);
      setSelectedB(null);
      setDiff(null);
    }
  }, [open, fetchVersions]);

  const handleCompare = () => {
    if (!selectedA || !selectedB) {
      toast.error('Selecione duas versões para comparar');
      return;
    }
    const result = workflowVersionService.compare(selectedA, selectedB);
    setDiff(result);
    setView('compare');
  };

  const handleRestore = async (version: WorkflowVersion) => {
    setRestoring(true);
    try {
      await workflowVersionService.restore(workflowId, version.id);
      onRestore(version.snapshot);
      toast.success(`Restaurado para v${version.version}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Erro ao restaurar: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const handleCreateTag = async (versionId: string) => {
    if (!labelInput.trim()) return;
    setCreatingTag(true);
    try {
      const version = versions.find(v => v.id === versionId);
      if (version) {
        await workflowVersionService.create(workflowId, version.snapshot, labelInput.trim());
        toast.success(`Tag "${labelInput.trim()}" criada`);
        setLabelInput('');
        setTaggingVersionId(null);
        fetchVersions();
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setCreatingTag(false);
    }
  };

  const toggleSelect = (v: WorkflowVersion) => {
    if (selectedA?.id === v.id) {
      setSelectedA(null);
    } else if (selectedB?.id === v.id) {
      setSelectedB(null);
    } else if (!selectedA) {
      setSelectedA(v);
    } else if (!selectedB) {
      setSelectedB(v);
    } else {
      setSelectedA(selectedB);
      setSelectedB(v);
    }
  };

  const totalChanges = diff
    ? diff.added_nodes.length + diff.removed_nodes.length + diff.modified_nodes.length +
      diff.added_edges.length + diff.removed_edges.length + diff.modified_edges.length
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Versões
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Actions bar */}
              <div className="flex items-center justify-between gap-2 pb-3">
                <p className="text-sm text-muted-foreground">
                  {selectedA && selectedB
                    ? 'Duas versões selecionadas — compare ou restaure'
                    : selectedA
                      ? 'Selecione mais uma versão para comparar'
                      : 'Selecione versões para comparar ou restaurar'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!selectedA || !selectedB}
                  onClick={handleCompare}
                  className="gap-1.5"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  Comparar
                </Button>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma versão registrada</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Versões são criadas automaticamente ao salvar/publicar
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border" />

                    {versions.map((v, i) => {
                      const isSelectedA = selectedA?.id === v.id;
                      const isSelectedB = selectedB?.id === v.id;
                      const isSelected = isSelectedA || isSelectedB;

                      return (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`relative flex items-start gap-3 py-3 px-2 rounded-lg cursor-pointer transition-colors
                            ${isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'}`}
                          onClick={() => toggleSelect(v)}
                        >
                          {/* Timeline dot */}
                          <div className="relative z-10 mt-1">
                            {isSelected ? (
                              <div className="w-[14px] h-[14px] rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            ) : v.label ? (
                              <Tag className="h-[14px] w-[14px] text-chart-4" />
                            ) : (
                              <Circle className="h-[14px] w-[14px] text-muted-foreground/50 fill-background" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                v{v.version}
                              </span>
                              {v.label && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 text-chart-4 border-chart-4/30">
                                  <Tag className="h-2.5 w-2.5" />
                                  {v.label}
                                </Badge>
                              )}
                              {v.auto && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-border/50">
                                  auto
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(v.created_at), "dd MMM yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              {v.created_by && <span className="ml-1.5">· {v.created_by}</span>}
                            </p>
                            <p className="text-[11px] text-muted-foreground/70 mt-0.5 font-mono">
                              {((v.snapshot.nodes as any[]) || []).length} nós · {((v.snapshot.edges as any[]) || []).length} arestas
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            {taggingVersionId === v.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={labelInput}
                                  onChange={e => setLabelInput(e.target.value)}
                                  placeholder="Nome da tag..."
                                  className="h-7 w-28 text-xs"
                                  onKeyDown={e => e.key === 'Enter' && handleCreateTag(v.id)}
                                  autoFocus
                                />
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7"
                                  disabled={creatingTag || !labelInput.trim()}
                                  onClick={() => handleCreateTag(v.id)}
                                >
                                  {creatingTag ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7"
                                  title="Criar tag nesta versão"
                                  onClick={() => { setTaggingVersionId(v.id); setLabelInput(''); }}
                                >
                                  <Tag className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7"
                                  title="Restaurar esta versão"
                                  disabled={restoring}
                                  onClick={() => handleRestore(v)}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          ) : (
            <motion.div
              key="compare"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Compare header */}
              <div className="flex items-center gap-2 pb-3">
                <Button variant="ghost" size="sm" onClick={() => setView('list')} className="gap-1">
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  Voltar
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">v{selectedA?.version}</Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">v{selectedB?.version}</Badge>
                </div>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {totalChanges} alteração{totalChanges !== 1 ? 'ões' : ''}
                </Badge>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                {diff && totalChanges === 0 ? (
                  <div className="text-center py-12">
                    <Check className="h-8 w-8 text-chart-2 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Versões idênticas</p>
                  </div>
                ) : diff && (
                  <div className="space-y-4">
                    {/* Nodes summary */}
                    {(diff.added_nodes.length > 0 || diff.removed_nodes.length > 0 || diff.modified_nodes.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nós</h4>
                        {diff.added_nodes.map(id => (
                          <div key={`add-${id}`} className="flex items-center gap-2 px-3 py-2 rounded-md bg-chart-2/5 border border-chart-2/20">
                            <Plus className="h-3.5 w-3.5 text-chart-2" />
                            <span className="text-sm font-mono text-foreground">{id}</span>
                            <Badge variant="outline" className="text-[10px] text-chart-2 border-chart-2/30 ml-auto">adicionado</Badge>
                          </div>
                        ))}
                        {diff.removed_nodes.map(id => (
                          <div key={`rem-${id}`} className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
                            <Minus className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-sm font-mono text-foreground">{id}</span>
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 ml-auto">removido</Badge>
                          </div>
                        ))}
                        {diff.modified_nodes.map(id => (
                          <div key={`mod-${id}`} className="space-y-1.5">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-chart-4/5 border border-chart-4/20">
                              <GitCompare className="h-3.5 w-3.5 text-chart-4" />
                              <span className="text-sm font-mono text-foreground">{id}</span>
                              <Badge variant="outline" className="text-[10px] text-chart-4 border-chart-4/30 ml-auto">modificado</Badge>
                            </div>
                            {diff.config_changes[id]?.map((change, ci) => (
                              <div key={ci} className="ml-8 px-3 py-1.5 rounded bg-muted/30 text-xs font-mono">
                                <span className="text-muted-foreground">{change.field}:</span>{' '}
                                <span className="text-destructive line-through">{JSON.stringify(change.from)}</span>
                                {' → '}
                                <span className="text-chart-2">{JSON.stringify(change.to)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Edges summary */}
                    {(diff.added_edges.length > 0 || diff.removed_edges.length > 0 || diff.modified_edges.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Arestas</h4>
                        {diff.added_edges.map(id => (
                          <div key={`ae-${id}`} className="flex items-center gap-2 px-3 py-2 rounded-md bg-chart-2/5 border border-chart-2/20">
                            <Plus className="h-3.5 w-3.5 text-chart-2" />
                            <span className="text-sm font-mono text-foreground">{id}</span>
                            <Badge variant="outline" className="text-[10px] text-chart-2 border-chart-2/30 ml-auto">adicionada</Badge>
                          </div>
                        ))}
                        {diff.removed_edges.map(id => (
                          <div key={`re-${id}`} className="flex items-center gap-2 px-3 py-2 rounded-md bg-destructive/5 border border-destructive/20">
                            <Minus className="h-3.5 w-3.5 text-destructive" />
                            <span className="text-sm font-mono text-foreground">{id}</span>
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 ml-auto">removida</Badge>
                          </div>
                        ))}
                        {diff.modified_edges.map(id => (
                          <div key={`me-${id}`} className="flex items-center gap-2 px-3 py-2 rounded-md bg-chart-4/5 border border-chart-4/20">
                            <GitCompare className="h-3.5 w-3.5 text-chart-4" />
                            <span className="text-sm font-mono text-foreground">{id}</span>
                            <Badge variant="outline" className="text-[10px] text-chart-4 border-chart-4/30 ml-auto">modificada</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Restore buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-3">
                <Button
                  variant="outline" size="sm"
                  disabled={restoring || !selectedA}
                  onClick={() => selectedA && handleRestore(selectedA)}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar v{selectedA?.version}
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={restoring || !selectedB}
                  onClick={() => selectedB && handleRestore(selectedB)}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar v{selectedB?.version}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
