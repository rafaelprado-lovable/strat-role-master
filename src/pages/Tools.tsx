import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toolService, ChatTool } from '@/services/toolService';
import { DefinitionField } from '@/services/definitionService';

interface PluginOption {
  key: string;
  name: string;
  description: string;
  inputs: DefinitionField[];
  outputs: DefinitionField[];
}

const Tools = () => {
  const { toast } = useToast();
  const [tools, setTools] = useState<ChatTool[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<PluginOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ChatTool | null>(null);
  const [deletingTool, setDeletingTool] = useState<ChatTool | null>(null);

  // Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPluginKey, setFormPluginKey] = useState('');
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [formEnabled, setFormEnabled] = useState(true);
  const [formToolType, setFormToolType] = useState('node');
  const [formWaitForCompletion, setFormWaitForCompletion] = useState(true);
  const [formWaitTimeout, setFormWaitTimeout] = useState(20);
  const [formPollInterval, setFormPollInterval] = useState(2);

  const loadTools = async () => {
    const data = await toolService.getAll();
    setTools(data);
  };

  const loadPlugins = async () => {
    const data = await toolService.getAvailablePlugins();
    setAvailablePlugins(data);
  };

  useEffect(() => {
    loadTools();
    loadPlugins();
  }, []);

  const resetForm = () => {
    setFormId('');
    setFormName('');
    setFormDescription('');
    setFormPluginKey('');
    setFormInputs({});
    setFormEnabled(true);
    setFormToolType('node');
    setFormWaitForCompletion(true);
    setFormWaitTimeout(20);
    setFormPollInterval(2);
    setEditingTool(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (tool: ChatTool) => {
    setEditingTool(tool);
    setFormId(tool.id);
    setFormName(tool.name);
    setFormDescription(tool.description);
    setFormPluginKey(tool.pluginKey);
    setFormInputs({ ...tool.inputs });
    setFormEnabled(tool.enabled);
    setFormToolType(tool.toolType || 'node');
    setFormWaitForCompletion(tool.waitForCompletion ?? true);
    setFormWaitTimeout(tool.waitTimeoutSeconds ?? 20);
    setFormPollInterval(tool.pollIntervalSeconds ?? 2);
    setDialogOpen(true);
  };

  const handlePluginChange = (key: string) => {
    setFormPluginKey(key);
    const schema = PLUGIN_SCHEMAS[key];
    if (schema) {
      const defaults: Record<string, string> = {};
      schema.inputs.forEach(input => {
        defaults[input.name] = formInputs[input.name] || '';
      });
      setFormInputs(defaults);
      if (!formName) setFormName(schema.name);
      if (!formDescription) setFormDescription(schema.description);
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPluginKey) {
      toast({ title: 'Erro', description: 'Nome e tipo do node são obrigatórios.', variant: 'destructive' });
      return;
    }

    try {
      const toolData = {
        id: formId || formName.toLowerCase().replace(/\s+/g, '_'),
        name: formName,
        description: formDescription,
        toolType: formToolType,
        pluginKey: formPluginKey,
        inputs: formInputs,
        outputs: {},
        enabled: formEnabled,
        waitForCompletion: formWaitForCompletion,
        waitTimeoutSeconds: formWaitTimeout,
        pollIntervalSeconds: formPollInterval,
      };

      if (editingTool) {
        await toolService.update(toolData);
        toast({ title: 'Ferramenta atualizada com sucesso' });
      } else {
        await toolService.create(toolData);
        toast({ title: 'Ferramenta criada com sucesso' });
      }
      setDialogOpen(false);
      resetForm();
      loadTools();
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
    loadTools();
  };

  const handleToggleEnabled = async (tool: ChatTool) => {
    await toolService.update({ id: tool.id, enabled: !tool.enabled });
    loadTools();
  };

  const currentSchema = formPluginKey ? PLUGIN_SCHEMAS[formPluginKey] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ferramentas do Chat</h1>
          <p className="text-muted-foreground">Gerencie as ferramentas disponíveis para o assistente de IA</p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Ferramenta
        </Button>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma ferramenta cadastrada</h3>
            <p className="text-muted-foreground mb-4">Cadastre ferramentas baseadas nos nodes disponíveis para uso no chat.</p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar primeira ferramenta
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
                  <TableHead>Tipo (Node)</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map(tool => {
                  const schema = PLUGIN_SCHEMAS[tool.pluginKey];
                  return (
                    <TableRow key={tool.id}>
                      <TableCell className="font-medium">{tool.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{schema?.name || tool.pluginKey}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {tool.description}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tool.enabled ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleToggleEnabled(tool)}
                        >
                          {tool.enabled ? (
                            <><Power className="h-3 w-3 mr-1" /> Ativo</>
                          ) : (
                            <><PowerOff className="h-3 w-3 mr-1" /> Inativo</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(tool)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setDeletingTool(tool); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
              {editingTool ? 'Atualize os dados da ferramenta.' : 'Selecione um node e preencha os inputs exigidos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tipo do Node</Label>
              <Select value={formPluginKey} onValueChange={handlePluginChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o node..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePlugins.map(p => (
                    <SelectItem key={p.key} value={p.key}>
                      {p.name} — {p.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID da ferramenta</Label>
                <Input
                  value={formId}
                  onChange={e => setFormId(e.target.value)}
                  placeholder="Ex: whatsapp_send_message"
                  disabled={!!editingTool}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome da ferramenta</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Verificar servidor" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formToolType} onValueChange={setFormToolType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="node">Node</SelectItem>
                    <SelectItem value="function">Function</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={formEnabled} onCheckedChange={setFormEnabled} />
                    <span className="text-sm text-muted-foreground">{formEnabled ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Descreva o que esta ferramenta faz..."
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Aguardar conclusão
                  <Switch checked={formWaitForCompletion} onCheckedChange={setFormWaitForCompletion} />
                </Label>
              </div>
              <div className="space-y-2">
                <Label>Timeout (s)</Label>
                <Input type="number" value={formWaitTimeout} onChange={e => setFormWaitTimeout(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Poll Interval (s)</Label>
                <Input type="number" value={formPollInterval} onChange={e => setFormPollInterval(Number(e.target.value))} />
              </div>
            </div>

            {currentSchema && currentSchema.inputs.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Inputs do Node: {currentSchema.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentSchema.inputs.map(input => (
                    <div key={input.name} className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        {input.label}
                        {input.required && <span className="text-destructive">*</span>}
                        <span className="text-muted-foreground font-normal">({input.type})</span>
                      </Label>
                      {input.type === 'json' || input.type === 'text' ? (
                        <Textarea
                          value={formInputs[input.name] || ''}
                          onChange={e => setFormInputs(prev => ({ ...prev, [input.name]: e.target.value }))}
                          placeholder={input.placeholder || ''}
                          className="min-h-[60px] font-mono text-xs"
                        />
                      ) : (
                        <Input
                          type={input.type === 'number' ? 'number' : 'text'}
                          value={formInputs[input.name] || ''}
                          onChange={e => setFormInputs(prev => ({ ...prev, [input.name]: e.target.value }))}
                          placeholder={input.placeholder || ''}
                        />
                      )}
                      {input.description && (
                        <p className="text-xs text-muted-foreground">{input.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTool ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
