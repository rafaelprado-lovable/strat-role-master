import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Trash2, Pencil, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  KB_CATEGORIES, KB_SEVERITIES, KB_SYSTEMS, knowledgeBaseService, KbArticle,
} from '@/services/knowledgeBaseService';

const severityColor: Record<string, string> = {
  baixa: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  media: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  alta: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critica: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function KnowledgeBaseOms() {
  const navigate = useNavigate();
  const [items, setItems] = useState<KbArticle[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSystem, setFilterSystem] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [toDelete, setToDelete] = useState<KbArticle | null>(null);

  const reload = () => setItems(knowledgeBaseService.list());

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (filterCategory !== 'all' && it.category !== filterCategory) return false;
      if (filterSystem !== 'all' && it.system !== filterSystem) return false;
      if (filterSeverity !== 'all' && it.severity !== filterSeverity) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, search, filterCategory, filterSystem, filterSeverity]);

  const handleDelete = () => {
    if (!toDelete) return;
    knowledgeBaseService.remove(toDelete.id);
    toast({ title: 'Artigo removido', description: toDelete.title });
    setToDelete(null);
    reload();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Base de Conhecimento — OMS
            </h1>
            <p className="text-sm text-muted-foreground">
              Documentação de arquitetura, componentes e troubleshooting do ambiente OMS
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/knowledge-base/oms/new')} className="gap-2">
          <Plus className="h-4 w-4" /> Novo artigo
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição ou tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {KB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sistema" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos sistemas</SelectItem>
              {KB_SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Severidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas severidades</SelectItem>
              {KB_SEVERITIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
            <BookOpen className="h-10 w-10 opacity-40" />
            <div>
              <div className="font-medium">Nenhum artigo encontrado</div>
              <div className="text-sm">Crie o primeiro artigo da base de conhecimento do OMS.</div>
            </div>
            <Button onClick={() => navigate('/knowledge-base/oms/new')} className="gap-2 mt-2">
              <Plus className="h-4 w-4" /> Novo artigo
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((it) => (
                <TableRow key={it.id} className="cursor-pointer" onClick={() => navigate(`/knowledge-base/oms/${it.id}`)}>
                  <TableCell>
                    <div className="font-medium">{it.title}</div>
                    {it.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">{it.description}</div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline">{it.category || '—'}</Badge></TableCell>
                  <TableCell className="text-sm">{it.system || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={severityColor[it.severity]}>
                      {KB_SEVERITIES.find((s) => s.value === it.severity)?.label || it.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {it.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                      {it.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{it.tags.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(it.updatedAt).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/knowledge-base/oms/${it.id}`)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(it)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{toDelete?.title}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
