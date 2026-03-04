import { useCallback, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, Save, Zap, Database, Mail, Globe, Clock, Code, GitBranch, Repeat, RefreshCw,
} from 'lucide-react';
import { TaskNode } from './TaskNode';
import { WaypointEdge } from './WaypointEdge';
import { NodeConfigPanel } from './NodeConfigPanel';
import { Workflow, AutomationSchedule } from '@/types/automations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const TASK_DEFINITIONS = [
  { type: 'trigger', label: 'Trigger', icon: Zap, description: 'Inicia o workflow', category: 'Controle' },
  { type: 'condition', label: 'Condição', icon: GitBranch, description: 'If/Else lógico', category: 'Controle' },
  { type: 'forEach', label: 'For Each', icon: Repeat, description: 'Itera sobre uma lista', category: 'Loops' },
  { type: 'while', label: 'While', icon: RefreshCw, description: 'Repete enquanto condição', category: 'Loops' },
  { type: 'http', label: 'HTTP Request', icon: Globe, description: 'Chamada HTTP/API', category: 'Ações' },
  { type: 'database', label: 'Database', icon: Database, description: 'Consulta ao banco', category: 'Ações' },
  { type: 'email', label: 'Email', icon: Mail, description: 'Envio de email', category: 'Ações' },
  { type: 'delay', label: 'Delay', icon: Clock, description: 'Aguardar tempo', category: 'Ações' },
  { type: 'script', label: 'Script', icon: Code, description: 'Executar código', category: 'Ações' },
];

const nodeTypes = { task: TaskNode };
const edgeTypes = { waypoint: WaypointEdge };

interface FlowEditorProps {
  workflow: Workflow | null;
  onBack: () => void;
  onSave: (data: Partial<Workflow>) => void;
}

export function FlowEditor({ workflow, onBack, onSave }: FlowEditorProps) {
  const initialNodes: Node[] = workflow?.nodes?.map((n) => ({
    id: n.id,
    type: 'task',
    position: n.position,
    data: { label: n.config.label || n.definition_id, type: n.config.type || 'script', description: n.config.description || '', ...n.config },
  })) || [];

  const initialEdges: Edge[] = workflow?.edges?.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
    type: 'waypoint',
  })) || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [schedule, setSchedule] = useState<AutomationSchedule | null>(workflow?.schedule || null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'once' | 'interval' | 'cron'>(workflow?.schedule?.type || 'interval');
  const [scheduleValue, setScheduleValue] = useState(workflow?.schedule?.value || '5');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, type: 'waypoint' }, eds)
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const desc = event.dataTransfer.getData('application/reactflow-description');
      if (!type) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: event.clientX - bounds.left - 90,
        y: event.clientY - bounds.top - 25,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'task',
        position,
        data: { label, type, description: desc },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeDataUpdate = useCallback((id: string, data: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data } : n))
    );
  }, [setNodes]);

  const handleSave = () => {
    onSave({
      id: workflow?.id,
      name: name || 'Novo Workflow',
      description,
      schedule,
      nodes: nodes.map((n) => ({
        id: n.id,
        definition_id: (n.data as any).type,
        config: { ...(n.data as any) },
        position: n.position,
      })),
      edges: edges.map((e) => ({
        from: e.source,
        to: e.target,
        condition: e.sourceHandle || undefined,
      })),
    });
  };

  const handleSaveSchedule = () => {
    setSchedule({ type: scheduleType, value: scheduleValue, timezone: 'America/Sao_Paulo' });
    setScheduleDialogOpen(false);
  };

  const onDragStart = (event: React.DragEvent, task: typeof TASK_DEFINITIONS[0]) => {
    event.dataTransfer.setData('application/reactflow-type', task.type);
    event.dataTransfer.setData('application/reactflow-label', task.label);
    event.dataTransfer.setData('application/reactflow-description', task.description);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do workflow"
            className="max-w-[300px] font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(true)}>
            <Clock className="h-4 w-4 mr-2" />
            {schedule ? `Agendado: ${schedule.type}` : 'Agendar'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 mt-4 gap-4 overflow-hidden">
        {/* Sidebar – Blocos */}
        <div className="w-56 shrink-0 border rounded-lg bg-card p-3 overflow-y-auto space-y-2">
          <h3 className="font-semibold text-sm text-foreground mb-3">Blocos</h3>
          {(['Controle', 'Loops', 'Ações'] as const).map((category) => {
            const tasks = TASK_DEFINITIONS.filter((t) => t.category === category);
            if (tasks.length === 0) return null;
            return (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-2">{category}</p>
                {tasks.map((task) => (
                  <div
                    key={task.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, task)}
                    className="flex items-center gap-2 p-2 rounded-md border border-border bg-background cursor-grab hover:bg-muted transition-colors mb-1"
                  >
                    <task.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 border rounded-lg overflow-hidden bg-muted/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'waypoint' }}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} className="!bg-muted/20" />
            <Controls className="!bg-card !border-border !shadow-sm" />
            <MiniMap
              className="!bg-card !border-border"
              nodeColor="hsl(var(--primary))"
              maskColor="hsl(var(--muted) / 0.5)"
            />
            {nodes.length === 0 && (
              <Panel position="top-center">
                <div className="bg-card border border-border rounded-lg px-6 py-4 text-center mt-20 shadow-sm">
                  <p className="text-muted-foreground text-sm">
                    Arraste blocos do painel lateral para o canvas
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Config Panel */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleNodeDataUpdate}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendamento do Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Uma vez</SelectItem>
                  <SelectItem value="interval">Intervalo</SelectItem>
                  <SelectItem value="cron">Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {scheduleType === 'once' ? 'Data/Hora' : scheduleType === 'interval' ? 'Intervalo (minutos)' : 'Expressão Cron'}
              </Label>
              <Input
                value={scheduleValue}
                onChange={(e) => setScheduleValue(e.target.value)}
                placeholder={scheduleType === 'cron' ? '0 */2 * * *' : scheduleType === 'once' ? '2024-01-01T10:00' : '5'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSchedule(null); setScheduleDialogOpen(false); }}>
              Remover
            </Button>
            <Button onClick={handleSaveSchedule}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
