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
  ArrowLeft, Save, Clock, Terminal, MessageCircle, Globe, AlertTriangle,
  FileJson, ShieldCheck, FileDown,
} from 'lucide-react';
import { TaskNode } from './TaskNode';
import { WaypointEdge } from './WaypointEdge';
import { NodeConfigPanel } from './NodeConfigPanel';
import { EdgeConfigPanel } from './EdgeConfigPanel';
import { WorkflowValidator } from './WorkflowValidator';
import { JsonPreviewDialog } from './JsonPreviewDialog';
import {
  Workflow, AutomationSchedule, DEFINITION_IDS,
  validateWorkflow, exportWorkflowJson, type WorkflowNode, type WorkflowEdge as WfEdge,
} from '@/types/automations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BLOCK_LIBRARY = DEFINITION_IDS.map(d => ({
  ...d,
  Icon: d.icon === 'terminal' ? Terminal
    : d.icon === 'message-circle' ? MessageCircle
    : d.icon === 'alert-triangle' ? AlertTriangle
    : Globe,
}));

const nodeTypes = { task: TaskNode };
const edgeTypes = { waypoint: WaypointEdge };

interface FlowEditorProps {
  workflow: Workflow | null;
  onBack: () => void;
  onSave: (data: Partial<Workflow>) => void;
}

export function FlowEditor({ workflow, onBack, onSave }: FlowEditorProps) {
  // Build initial nodes from workflow
  const initialNodes: Node[] = workflow?.nodes?.map((n, i) => ({
    id: n.id,
    type: 'task',
    position: (n as any).position || { x: 250, y: i * 120 },
    data: {
      label: (n.config as any)?.label || DEFINITION_IDS.find(d => d.value === n.definition_id)?.label || n.definition_id,
      definition_id: n.definition_id,
      description: (n.config as any)?.description || '',
      for_each: n.for_each,
      hasForEach: !!n.for_each,
    },
  })) || [];

  const initialEdges: Edge[] = workflow?.edges?.map((e, i) => ({
    id: e.id || `e-${i}`,
    source: e.from,
    target: e.to,
    type: 'waypoint',
    data: {
      condition: e.condition || '',
      loop: e.loop || false,
      max_iterations: e.max_iterations,
    },
  })) || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [schedule, setSchedule] = useState<AutomationSchedule | null>(workflow?.schedule || null);
  const [startDate, setStartDate] = useState(workflow?.start_date || '');
  const [nodeInputs, setNodeInputs] = useState<Record<string, Record<string, unknown>>>(workflow?.inputs || {});
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'once' | 'interval' | 'cron'>(workflow?.schedule?.type || 'interval');
  const [scheduleValue, setScheduleValue] = useState(workflow?.schedule?.value || '5');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) || null : null;

  // Build current workflow object
  const buildWorkflow = useCallback((): Workflow => ({
    id: workflow?.id || `wf-${Date.now()}`,
    name: name || '',
    description,
    status: workflow?.status || 'draft',
    schedule,
    nodes: nodes.map((n) => {
      const d = n.data as Record<string, any>;
      const node: any = {
        id: n.id,
        definition_id: d.definition_id || '',
        config: {},
        position: n.position,
      };
      if (d.for_each) node.for_each = d.for_each;
      return node as WorkflowNode & { position: { x: number; y: number } };
    }),
    edges: edges.map((e) => {
      const d = (e.data || {}) as Record<string, any>;
      const edge: WfEdge = { from: e.source, to: e.target };
      if (e.id) edge.id = e.id;
      if (d.condition) edge.condition = d.condition;
      if (d.loop) {
        edge.loop = true;
        edge.max_iterations = d.max_iterations;
      }
      return edge;
    }),
    inputs: nodeInputs,
    start_date: startDate || null,
    createdAt: workflow?.createdAt,
    updatedAt: new Date().toISOString(),
    lastRunAt: workflow?.lastRunAt,
    runCount: workflow?.runCount,
  }), [nodes, edges, name, description, schedule, startDate, nodeInputs, workflow]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, type: 'waypoint', data: { condition: '', loop: false } }, eds)
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
      const defId = event.dataTransfer.getData('application/reactflow-defid');
      const label = event.dataTransfer.getData('application/reactflow-label');
      if (!defId) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = { x: event.clientX - bounds.left - 90, y: event.clientY - bounds.top - 25 };

      const newNode: Node = {
        id: `node-${crypto.randomUUID().slice(0, 8)}`,
        type: 'task',
        position,
        data: { label, definition_id: defId, description: '', hasForEach: false },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const handleNodeDataUpdate = useCallback((id: string, data: Record<string, unknown>) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data } : n)));
  }, [setNodes]);

  const handleEdgeDataUpdate = useCallback((id: string, data: Partial<Edge['data']>) => {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data: { ...(e.data || {}), ...data } } : e)));
  }, [setEdges]);

  const handleUpdateInputs = useCallback((nodeId: string, inputs: Record<string, unknown>) => {
    setNodeInputs((prev) => ({ ...prev, [nodeId]: inputs }));
  }, []);

  const handleSave = () => {
    const wf = buildWorkflow();
    onSave(wf);
    toast.success('Rascunho salvo');
  };

  const handleValidate = () => {
    setValidationDialogOpen(true);
  };

  const handleExport = () => {
    const wf = buildWorkflow();
    const errors = validateWorkflow(wf);
    const critical = errors.filter(e => e.severity === 'error');
    if (critical.length > 0) {
      toast.error(`${critical.length} erro(s) impedem a exportação. Valide primeiro.`);
      setValidationDialogOpen(true);
      return;
    }
    setJsonPreviewOpen(true);
  };

  const handleSaveSchedule = () => {
    setSchedule({ type: scheduleType, value: scheduleValue, timezone: 'America/Sao_Paulo' });
    setScheduleDialogOpen(false);
  };

  const onDragStart = (event: React.DragEvent, block: typeof BLOCK_LIBRARY[0]) => {
    event.dataTransfer.setData('application/reactflow-defid', block.value);
    event.dataTransfer.setData('application/reactflow-label', block.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const currentWorkflow = buildWorkflow();
  const validationErrors = validateWorkflow(currentWorkflow);
  const exportJson = exportWorkflowJson(currentWorkflow);

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
          <Button variant="outline" size="sm" onClick={handleValidate}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Validar
            {validationErrors.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground rounded-full text-[10px] px-1.5">
                {validationErrors.filter(e => e.severity === 'error').length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button size="sm" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 mt-4 gap-4 overflow-hidden">
        {/* Sidebar – Blocos */}
        <div className="w-56 shrink-0 border rounded-lg bg-card p-3 overflow-y-auto space-y-1">
          <h3 className="font-semibold text-sm text-foreground mb-3">Blocos Disponíveis</h3>
          {BLOCK_LIBRARY.map((block) => (
            <div
              key={block.value}
              draggable
              onDragStart={(e) => onDragStart(e, block)}
              className="flex items-center gap-2 p-2 rounded-md border border-border bg-background cursor-grab hover:bg-muted transition-colors"
            >
              <block.Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{block.label}</p>
                <p className="text-xs text-muted-foreground truncate">{block.description}</p>
              </div>
            </div>
          ))}

          {/* start_date */}
          <div className="border-t border-border mt-4 pt-3 space-y-1.5">
            <Label className="text-xs">start_date (DD/MM/YYYY HH:MM)</Label>
            <Input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="01/01/2025 10:00"
              className="h-8 text-sm font-mono"
            />
          </div>
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
            onEdgeClick={handleEdgeClick}
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

        {/* Config Panels */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            inputs={nodeInputs[selectedNode.id] || {}}
            onUpdate={handleNodeDataUpdate}
            onUpdateInputs={handleUpdateInputs}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
        {selectedEdge && (
          <EdgeConfigPanel
            edge={selectedEdge}
            onUpdate={handleEdgeDataUpdate}
            onClose={() => setSelectedEdgeId(null)}
          />
        )}
      </div>

      {/* Validation Dialog */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Validação do Workflow</DialogTitle>
          </DialogHeader>
          <WorkflowValidator errors={validationErrors} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidationDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON Preview */}
      <JsonPreviewDialog
        open={jsonPreviewOpen}
        onOpenChange={setJsonPreviewOpen}
        json={exportJson}
      />

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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
