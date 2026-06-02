import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import {
  Sparkles, Plus, Pencil, Trash2, ArrowLeft, Save, Search, Wrench, Power, PowerOff, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Skill, skillService } from '@/services/skillService';
import { toolService, ChatTool } from '@/services/toolService';

// ---------- Custom node: a tool block ----------
type ToolNodeData = { toolName: string; toolId: string };

function ToolNode({ data, selected }: NodeProps) {
  const { toolName, toolId } = data as ToolNodeData;
  return (
    <div
      className={`group rounded-xl border bg-card px-4 py-3 shadow-sm min-w-[180px] transition-all ${
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
          <Wrench className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{toolName}</div>
          <div className="text-[10px] text-muted-foreground font-mono truncate">{toolId}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { tool: ToolNode };

// ---------- Editor ----------
interface SkillEditorProps {
  skill: Skill | null;
  tools: ChatTool[];
  onBack: () => void;
  onSaved: () => void;
}

function SkillEditor({ skill, tools, onBack, onSaved }: SkillEditorProps) {
  const [name, setName] = useState(skill?.name ?? '');
  const [description, setDescription] = useState(skill?.description ?? '');
  const [enabled, setEnabled] = useState(skill?.enabled ?? true);
  const [filter, setFilter] = useState('');

  const initialNodes: Node[] = useMemo(
    () =>
      (skill?.nodes ?? []).map(n => ({
        id: n.id,
        type: 'tool',
        position: n.position,
        data: { toolId: n.toolId, toolName: n.toolName },
      })),
    [skill?.id],
  );
  const initialEdges: Edge[] = useMemo(
    () => (skill?.edges ?? []).map(e => ({ id: e.id, source: e.source, target: e.target })),
    [skill?.id],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addTool = (tool: ChatTool) => {
    const id = `${tool.id}-${Date.now()}`;
    const offset = nodes.length * 40;
    setNodes(nds => [
      ...nds,
      {
        id,
        type: 'tool',
        position: { x: 200 + offset, y: 120 + offset },
        data: { toolId: tool.id, toolName: tool.name },
      },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Informe um nome para a habilidade');
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      enabled,
      nodes: nodes.map(n => ({
        id: n.id,
        toolId: (n.data as ToolNodeData).toolId,
        toolName: (n.data as ToolNodeData).toolName,
        position: n.position,
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
    };
    try {
      if (skill) {
        await skillService.update(skill.id, payload);
        toast.success('Habilidade atualizada');
      } else {
        await skillService.create(payload);
        toast.success('Habilidade criada');
      }
      onSaved();
    } catch {
      toast.error('Erro ao salvar habilidade');
    }
  };

  const filteredTools = tools.filter(
    t =>
      !filter ||
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.id.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex-1 min-w-[200px]">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome da habilidade"
            className="text-base font-medium border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <span className="text-sm text-muted-foreground">{enabled ? 'Ativa' : 'Inativa'}</span>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </div>

      <div className="px-1 py-3">
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descreva o que esta habilidade faz e quando o agente deve usá-la..."
          className="min-h-[60px] resize-none"
        />
      </div>

      {/* Canvas + tools palette */}
      <div className="flex-1 grid grid-cols-[280px_1fr] gap-4 min-h-0">
        <Card className="flex flex-col min-h-0">
          <div className="p-3 border-b border-border space-y-2">
            <div className="text-sm font-semibold text-foreground">Ferramentas</div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={filter}
                onChange={e => setFilter(e.target.value)}
                placeholder="Buscar..."
                className="pl-7 h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filteredTools.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6">
                Nenhuma ferramenta encontrada
              </div>
            ) : (
              filteredTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => addTool(tool)}
                  className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-colors p-2.5 group"
                >
                  <div className="flex items-start gap-2">
                    <div className="p-1 rounded-md bg-primary/10 mt-0.5">
                      <Wrench className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate">{tool.name}</div>
                      {tool.description && (
                        <div className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {tool.description}
                        </div>
                      )}
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls />
            <MiniMap pannable zoomable className="!bg-card !border-border" />
          </ReactFlow>
        </Card>
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [tools, setTools] = useState<ChatTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([skillService.list(), toolService.getAll()]);
      setSkills(s);
      setTools(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = () => { setEditing(null); setIsEditorOpen(true); };
  const handleEdit = (s: Skill) => { setEditing(s); setIsEditorOpen(true); };
  const handleBack = () => { setIsEditorOpen(false); load(); };

  const handleDelete = async () => {
    if (!deletingSkill) return;
    await skillService.delete(deletingSkill.id);
    toast.success('Habilidade removida');
    setDeletingSkill(null);
    load();
  };

  const handleToggle = async (s: Skill) => {
    await skillService.update(s.id, { enabled: !s.enabled });
    load();
  };

  if (isEditorOpen) {
    return (
      <ReactFlowProvider>
        <SkillEditor skill={editing} tools={tools} onBack={handleBack} onSaved={handleBack} />
      </ReactFlowProvider>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Habilidades</h2>
            <p className="text-muted-foreground text-sm">
              Compose ferramentas em habilidades que o agente pode invocar
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nova habilidade
        </Button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma habilidade cadastrada</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Crie uma habilidade combinando ferramentas em um canvas visual.
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Criar primeira habilidade
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
                  <TableHead>Descrição</TableHead>
                  <TableHead>Ferramentas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[320px] truncate">
                      {s.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.nodes.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.enabled ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggle(s)}
                      >
                        {s.enabled ? (
                          <><Power className="h-3 w-3 mr-1" /> Ativa</>
                        ) : (
                          <><PowerOff className="h-3 w-3 mr-1" /> Inativa</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingSkill(s)}
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

      <AlertDialog open={!!deletingSkill} onOpenChange={open => !open && setDeletingSkill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover habilidade</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deletingSkill?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
