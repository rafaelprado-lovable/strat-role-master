import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, Wrench, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { toolService, ChatTool, HttpMethod, KeyValue } from '@/services/toolService';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const emptyKv = (): KeyValue => ({ id: `kv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, key: '', value: '' });

const Tools = () => {
  const { toast } = useToast();
  const [tools, setTools] = useState<ChatTool[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ChatTool | null>(null);
  const [deletingTool, setDeletingTool] = useState<ChatTool | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEndpoint, setFormEndpoint] = useState('');
  const [formMethod, setFormMethod] = useState<HttpMethod>('GET');
  const [formIgnoreSsl, setFormIgnoreSsl] = useState(false);
  const [formHeaders, setFormHeaders] = useState<KeyValue[]>([]);
  const [formBody, setFormBody] = useState<KeyValue[]>([]);
  const [formEnabled, setFormEnabled] = useState(true);

  const load = async () => setTools(await toolService.getAll());
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setFormName(''); setFormDescription(''); setFormEndpoint('');
    setFormMethod('GET'); setFormIgnoreSsl(false);
    setFormHeaders([]); setFormBody([]); setFormEnabled(true);
    setEditingTool(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (t: ChatTool) => {
    setEditingTool(t);
    setFormName(t.name);
    setFormDescription(t.description);
    setFormEndpoint(t.endpoint);
    setFormMethod(t.method);
    setFormIgnoreSsl(t.ignoreSsl);
    setFormHeaders(t.headers.map(h => ({ ...h })));
    setFormBody(t.body.map(b => ({ ...b })));
    setFormEnabled(t.enabled);
    setDialogOpen(true);
  };

  const updateKv = (
    list: KeyValue[],
    setList: (v: KeyValue[]) => void,
    id: string,
    field: 'key' | 'value',
    value: string,
  ) => setList(list.map(kv => (kv.id === id ? { ...kv, [field]: value } : kv)));

  const handleSave = async () => {
    if (!formName.trim() || !formEndpoint.trim()) {
      toast({ title: 'Erro', description: 'Nome e endpoint são obrigatórios.', variant: 'destructive' });
      return;
    }
    const cleanKvs = (list: KeyValue[]) => list.filter(kv => kv.key.trim() || kv.value.trim());
    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      endpoint: formEndpoint.trim(),
      method: formMethod,
      ignoreSsl: formIgnoreSsl,
      headers: cleanKvs(formHeaders),
      body: cleanKvs(formBody),
      enabled: formEnabled,
    };
    try {
      if (editingTool) {
        await toolService.update(editingTool.id, payload);
        toast({ title: 'Ferramenta atualizada' });
      } else {
        await toolService.create(payload);
        toast({ title: 'Ferramenta criada' });
      }
      setDialogOpen(false);
      resetForm();
      load();
    } catch {
      toast({ title: 'Erro ao salvar ferramenta', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletingTool) return;
    await toolService.delete(deletingTool.id);
    toast({ title: 'Ferramenta removida' });
    setDeleteDialogOpen(false);
    setDeletingTool(null);
    load();
  };

  const handleToggleEnabled = async (t: ChatTool) => {
    await toolService.update(t.id, { enabled: !t.enabled });
    load();
  };

  const methodColor = (m: HttpMethod) => ({
    GET: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
    DELETE: 'bg-red-500/15 text-red-500 border-red-500/30',
  }[m]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ferramentas</h1>
          <p className="text-muted-foreground">Cadastre endpoints HTTP que podem ser invocados pelo agente</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Ferramenta
        </Button>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma ferramenta cadastrada</h3>
            <p className="text-muted-foreground mb-4">Cadastre seu primeiro endpoint para começar.</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Cadastrar primeira ferramenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-[10px] ${methodColor(t.method)}`}>
                        {t.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[280px] truncate">
                      {t.endpoint}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[260px] truncate">{t.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.enabled ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleEnabled(t)}
                      >
                        {t.enabled
                          ? (<><Power className="h-3 w-3 mr-1" /> Ativo</>)
                          : (<><PowerOff className="h-3 w-3 mr-1" /> Inativo</>)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setDeletingTool(t); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Editar Ferramenta' : 'Nova Ferramenta'}</DialogTitle>
            <DialogDescription>
              Configure o endpoint HTTP, headers e body que esta ferramenta irá invocar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Consultar cliente" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
                  <span className="text-sm text-muted-foreground">{formEnabled ? 'Ativo' : 'Inativo'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Descreva o que esta ferramenta faz e quando o agente deve usá-la..."
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="space-y-2">
                <Label>Método</Label>
                <Select value={formMethod} onValueChange={v => setFormMethod(v as HttpMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Apontamento (endpoint)</Label>
                <Input
                  value={formEndpoint}
                  onChange={e => setFormEndpoint(e.target.value)}
                  placeholder="https://api.exemplo.com/v1/recurso"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label className="text-sm">Ignorar SSL</Label>
                <p className="text-xs text-muted-foreground">Desativa verificação de certificado HTTPS</p>
              </div>
              <Switch checked={formIgnoreSsl} onCheckedChange={setFormIgnoreSsl} />
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headers</Label>
                <Button
                  type="button" size="sm" variant="outline" className="h-7 gap-1"
                  onClick={() => setFormHeaders(prev => [...prev, emptyKv()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              {formHeaders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum header.</p>
              ) : (
                <div className="space-y-2">
                  {formHeaders.map(h => (
                    <div key={h.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        value={h.key}
                        onChange={e => updateKv(formHeaders, setFormHeaders, h.id, 'key', e.target.value)}
                        placeholder="Chave (ex: Authorization)"
                        className="font-mono text-xs"
                      />
                      <Input
                        value={h.value}
                        onChange={e => updateKv(formHeaders, setFormHeaders, h.id, 'value', e.target.value)}
                        placeholder="Valor"
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"
                        onClick={() => setFormHeaders(prev => prev.filter(x => x.id !== h.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Body</Label>
                <Button
                  type="button" size="sm" variant="outline" className="h-7 gap-1"
                  onClick={() => setFormBody(prev => [...prev, emptyKv()])}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              {formBody.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum campo no body.</p>
              ) : (
                <div className="space-y-2">
                  {formBody.map(b => (
                    <div key={b.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <Input
                        value={b.key}
                        onChange={e => updateKv(formBody, setFormBody, b.id, 'key', e.target.value)}
                        placeholder="Chave"
                        className="font-mono text-xs"
                      />
                      <Input
                        value={b.value}
                        onChange={e => updateKv(formBody, setFormBody, b.id, 'value', e.target.value)}
                        placeholder="Valor"
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"
                        onClick={() => setFormBody(prev => prev.filter(x => x.id !== b.id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingTool ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ferramenta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a ferramenta "{deletingTool?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTool(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Tools;
