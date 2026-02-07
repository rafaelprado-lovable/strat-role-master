import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  Play,
  Plus,
  Save,
  Server,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Bug,
  Database,
  Webhook,
  Mail,
  MessageSquare,
  Zap,
  Clock,
  GitBranch,
  Filter,
  Terminal,
  Cog,
} from 'lucide-react';
import TaskInstanceNode from './TaskInstanceNode';
import { TaskConfigPanel } from './TaskConfigPanel';
import { EdgeConditionDialog } from './EdgeConditionDialog';
import { TaskDefinitionDialog } from './TaskDefinitionDialog';
import { MachineDialog } from './MachineDialog';
import { MachinesSheet } from './MachinesSheet';
import { ScheduleDialog } from './ScheduleDialog';
import {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  AutomationSchedule,
  Machine,
  TaskDefinition,
} from '@/types/automations';
import {
  BUILTIN_TASK_DEFINITIONS,
  getDefinitionCategories,
  findDefinition,
} from './taskDefinitions';

const nodeTypes = {
  taskInstance: TaskInstanceNode,
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'alert-triangle': AlertTriangle,
  bug: Bug,
  database: Database,
  webhook: Webhook,
  mail: Mail,
  'message-square': MessageSquare,
  zap: Zap,
  clock: Clock,
  'git-branch': GitBranch,
  filter: Filter,
  server: Server,
  terminal: Terminal,
};

interface FlowEditorProps {
  workflow: Workflow | null;
  machines: Machine[];
  customDefinitions: TaskDefinition[];
  onBack: () => void;
  onSave: (workflow: Partial<Workflow>) => void;
  onSaveMachine: (machine: Machine) => void;
  onDeleteMachine: (id: string) => void;
  onSaveDefinition: (def: TaskDefinition) => void;
  onDeleteDefinition: (id: string) => void;
}

/** Convert WorkflowNode[] → ReactFlow Node[] */
function toRFNodes(
  workflowNodes: WorkflowNode[],
  allDefs: TaskDefinition[]
): Node[] {
  return workflowNodes.map((wn) => {
    const def = allDefs.find((d) => d.id === wn.definition_id);
    return {
      id: wn.id,
      type: 'taskInstance',
      position: wn.position,
      data: {
        label: def?.name || wn.definition_id,
        definitionId: wn.definition_id,
        category: def?.category,
        icon: def?.icon,
        color: def?.color,
        type: def?.type,
        config: wn.config,
      },
    };
  });
}

/** Convert WorkflowEdge[] → ReactFlow Edge[] */
function toRFEdges(workflowEdges: WorkflowEdge[]): Edge[] {
  return workflowEdges.map((we, i) => ({
    id: `e-${we.from}-${we.to}-${i}`,
    source: we.from,
    target: we.to,
    animated: true,
    style: { stroke: we.condition ? '#ef4444' : '#6366f1' },
    label: we.condition || undefined,
    labelStyle: { fontSize: 10, fill: '#ef4444' },
    data: { condition: we.condition },
  }));
}

export function FlowEditor({
  workflow,
  machines,
  customDefinitions,
  onBack,
  onSave,
  onSaveMachine,
  onDeleteMachine,
  onSaveDefinition,
  onDeleteDefinition,
}: FlowEditorProps) {
  const allDefs = [...BUILTIN_TASK_DEFINITIONS, ...customDefinitions];
  const categories = getDefinitionCategories(allDefs);

  const [nodes, setNodes] = useState<Node[]>(
    workflow ? toRFNodes(workflow.nodes, allDefs) : []
  );
  const [edges, setEdges] = useState<Edge[]>(
    workflow ? toRFEdges(workflow.edges) : []
  );
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Novo Workflow');
  const [workflowDescription] = useState(workflow?.description || '');
  const [schedule, setSchedule] = useState<AutomationSchedule | null>(
    workflow?.schedule || null
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // Dialog states
  const [isMachinesSheetOpen, setIsMachinesSheetOpen] = useState(false);
  const [isMachineDialogOpen, setIsMachineDialogOpen] = useState(false);
  const [isDefDialogOpen, setIsDefDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [selectedEdgeData, setSelectedEdgeData] = useState<{
    id: string;
    from: string;
    to: string;
    condition?: string;
  } | null>(null);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      const newEdge: Edge = {
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        animated: true,
        style: { stroke: '#6366f1' },
        data: { condition: undefined },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Open edge condition dialog
      setTimeout(() => {
        setSelectedEdgeData({
          id: newEdge.id,
          from: params.source!,
          to: params.target!,
        });
        setIsEdgeDialogOpen(true);
      }, 100);
    },
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsConfigOpen(true);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeData({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      condition: edge.data?.condition as string | undefined,
    });
    setIsEdgeDialogOpen(true);
  }, []);

  const handleSaveEdgeCondition = useCallback(
    (edgeId: string, condition: string | undefined) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                data: { ...e.data, condition },
                style: { stroke: condition ? '#ef4444' : '#6366f1' },
                label: condition || undefined,
                labelStyle: { fontSize: 10, fill: '#ef4444' },
              }
            : e
        )
      );
      toast.success('Edge atualizada');
    },
    []
  );

  const updateNodeLabel = useCallback(
    (label: string) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, label } }
            : n
        )
      );
    },
    [selectedNode]
  );

  const updateNodeConfig = useCallback(
    (key: string, value: unknown) => {
      if (!selectedNode) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  config: { ...((n.data.config as Record<string, unknown>) || {}), [key]: value },
                },
              }
            : n
        )
      );
    },
    [selectedNode]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setIsConfigOpen(false);
    setSelectedNode(null);
    toast.success('Bloco removido');
  }, [selectedNode]);

  // Drag & Drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const definitionId = event.dataTransfer.getData('application/task-definition-id');
      if (!definitionId) return;

      const def = findDefinition(definitionId, BUILTIN_TASK_DEFINITIONS, customDefinitions);
      if (!def) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'taskInstance',
        position,
        data: {
          label: def.name,
          definitionId: def.id,
          category: def.category,
          icon: def.icon,
          color: def.color,
          type: def.type,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, customDefinitions]
  );

  const onDragStart = (event: React.DragEvent, definitionId: string) => {
    event.dataTransfer.setData('application/task-definition-id', definitionId);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Save workflow
  const handleSave = () => {
    const workflowNodes: WorkflowNode[] = nodes.map((n) => ({
      id: n.id,
      definition_id: (n.data.definitionId as string) || '',
      config: (n.data.config as Record<string, unknown>) || {},
      position: n.position,
    }));

    const workflowEdges: WorkflowEdge[] = edges.map((e) => ({
      from: e.source,
      to: e.target,
      condition: (e.data?.condition as string) || undefined,
    }));

    onSave({
      id: workflow?.id,
      name: workflowName,
      description: workflowDescription,
      nodes: workflowNodes,
      edges: workflowEdges,
      schedule,
      status: workflow?.status || 'draft',
    });
  };

  const runWorkflow = () => {
    if (nodes.length === 0) {
      toast.error('Adicione pelo menos um bloco para executar');
      return;
    }
    toast.info('Execução iniciada...');
    setTimeout(() => toast.success('Workflow executado com sucesso'), 2000);
  };

  // Get selected node's definition
  const selectedDef = selectedNode
    ? findDefinition(
        selectedNode.data.definitionId as string,
        BUILTIN_TASK_DEFINITIONS,
        customDefinitions
      )
    : undefined;

  // Get source node label for edge dialog
  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return (node?.data.label as string) || nodeId;
  };

  const sourceDefForEdge = selectedEdgeData
    ? findDefinition(
        (nodes.find((n) => n.id === selectedEdgeData.from)?.data.definitionId as string) || '',
        BUILTIN_TASK_DEFINITIONS,
        customDefinitions
      )
    : undefined;

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-64 text-lg font-semibold"
          />
          <Badge variant="outline">
            {workflow?.status === 'active'
              ? 'Ativo'
              : workflow?.status === 'inactive'
              ? 'Inativo'
              : 'Rascunho'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScheduleDialogOpen(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Agendamento
          </Button>
          <Button variant="outline" onClick={() => setIsMachinesSheetOpen(true)}>
            <Server className="h-4 w-4 mr-2" />
            Máquinas
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button onClick={runWorkflow}>
            <Play className="h-4 w-4 mr-2" />
            Executar
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-full">
        {/* Task Definitions Sidebar */}
        <Card className="w-64 shrink-0 overflow-hidden">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Task Definitions</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsDefDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-3 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {categories.map((category) => {
              const defs = allDefs.filter((d) => (d.category || 'Outros') === category);
              if (defs.length === 0) return null;
              return (
                <div key={category}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                    {category}
                  </p>
                  <div className="space-y-1.5">
                    {defs.map((def) => {
                      const Icon = ICON_MAP[def.icon || ''] || Cog;
                      return (
                        <div
                          key={def.id}
                          className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted/50 transition-colors"
                          draggable
                          onDragStart={(e) => onDragStart(e, def.id)}
                          title={def.description}
                        >
                          <div className={`p-1.5 rounded ${def.color || 'bg-muted'}`}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{def.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Flow Canvas */}
        <div className="flex-1 border rounded-lg overflow-hidden" ref={useRef<HTMLDivElement>(null)}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            className="bg-background"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Config Side Sheet */}
      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurar Task Instance</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {selectedNode && (
              <TaskConfigPanel
                node={selectedNode}
                definition={selectedDef}
                nodes={nodes}
                edges={edges}
                onUpdateLabel={updateNodeLabel}
                onUpdateConfig={updateNodeConfig}
                onDelete={deleteSelectedNode}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edge Condition Dialog */}
      <EdgeConditionDialog
        open={isEdgeDialogOpen}
        onOpenChange={setIsEdgeDialogOpen}
        edge={selectedEdgeData}
        sourceLabel={selectedEdgeData ? getNodeLabel(selectedEdgeData.from) : ''}
        targetLabel={selectedEdgeData ? getNodeLabel(selectedEdgeData.to) : ''}
        sourceDefinition={sourceDefForEdge}
        onSave={handleSaveEdgeCondition}
      />

      {/* Task Definition Dialog */}
      <TaskDefinitionDialog
        open={isDefDialogOpen}
        onOpenChange={setIsDefDialogOpen}
        machines={machines}
        onSave={onSaveDefinition}
      />

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        schedule={schedule}
        onSave={(s) => {
          setSchedule(s);
          setIsScheduleDialogOpen(false);
        }}
      />

      {/* Machines Sheet */}
      <MachinesSheet
        open={isMachinesSheetOpen}
        onOpenChange={setIsMachinesSheetOpen}
        machines={machines}
        onAddMachine={() => {
          setEditingMachine(null);
          setIsMachineDialogOpen(true);
        }}
        onEditMachine={(m) => {
          setEditingMachine(m);
          setIsMachineDialogOpen(true);
        }}
        onDeleteMachine={onDeleteMachine}
      />

      {/* Machine Dialog */}
      <MachineDialog
        open={isMachineDialogOpen}
        onOpenChange={setIsMachineDialogOpen}
        onSave={onSaveMachine}
        editingMachine={editingMachine}
      />
    </div>
  );
}
