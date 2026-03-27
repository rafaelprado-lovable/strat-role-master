import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
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
  ArrowLeft, Save, Clock, Globe, History,
  FileJson, ShieldCheck, Upload, Zap, Cog, X, Loader2, Filter, icons,
} from 'lucide-react';
import { workflowVersionService } from '@/services/workflowVersionService';
import { VersionHistoryDialog } from './VersionHistoryDialog';
import { TaskNode } from './TaskNode';
import { WaypointEdge } from './WaypointEdge';
import { NodeConfigPanel } from './NodeConfigPanel';
import { EdgeConfigPanel } from './EdgeConfigPanel';
import { WorkflowValidator } from './WorkflowValidator';
import { workflowService } from '@/services/workflowService';
import { definitionService, type Definition } from '@/services/definitionService';
import {
  Workflow, AutomationSchedule, DEFINITION_IDS,
  validateWorkflow, exportWorkflowJson, type WorkflowNode, type WorkflowEdge as WfEdge,
  type WorkflowTag,
} from '@/types/automations';
import { TagInput } from './TagInput';
import { ExecutionStatusBar } from './ExecutionStatusBanner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const iconResolver = (icon: string): React.ComponentType<any> => {
  const pascal = icon
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return (icons as Record<string, React.ComponentType<any>>)[pascal] || Globe;
};

export type BlockDef = {
  value: string;
  label: string;
  icon: string;
  description: string;
  category: 'trigger' | 'action' | 'filter';
  Icon: React.ComponentType<any>;
};

function definitionsToBlocks(defs: Definition[]): BlockDef[] {
  return defs.map(d => ({
    value: d.definition_id,
    label: d.label,
    icon: d.icon,
    description: d.description || '',
    category: d.category,
    Icon: iconResolver(d.icon),
  }));
}

// Fallback from static list
const STATIC_BLOCKS: BlockDef[] = DEFINITION_IDS.map(d => ({
  ...d,
  Icon: iconResolver(d.icon),
}));

const nodeTypes = { task: TaskNode };
const edgeTypes = { waypoint: WaypointEdge };


function BlocksSidebarContent({ triggers, filters, actions, startDate, setStartDate, correlatedWorkflowIds, setCorrelatedWorkflowIds, availableWorkflows, currentWorkflowId, onDragStart }: {
  triggers: BlockDef[];
  filters: BlockDef[];
  actions: BlockDef[];
  startDate: string;
  setStartDate: (v: string) => void;
  correlatedWorkflowIds: string[];
  setCorrelatedWorkflowIds: (v: string[]) => void;
  availableWorkflows: { id: string; name: string }[];
  currentWorkflowId?: string;
  onDragStart: (e: React.DragEvent, block: BlockDef) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <FileJson className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="font-semibold text-sm text-foreground">Blocos Disponíveis</h3>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <Zap className="h-3 w-3 text-chart-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-chart-4">Gatilhos</span>
        </div>
        {triggers.map((block) => (
          <div
            key={block.value}
            draggable
            onDragStart={(e) => onDragStart(e, block)}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-background/50 cursor-grab hover:bg-muted/80 hover:border-chart-4/30 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
          >
            <div className="p-1.5 rounded-md bg-chart-4/10 shrink-0">
              <block.Icon className="h-3.5 w-3.5 text-chart-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{block.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{block.description}</p>
            </div>
          </div>
        ))}
      </div>
      {filters.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 px-1">
            <Filter className="h-3 w-3 text-chart-2" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-chart-2">Filtros</span>
          </div>
          {filters.map((block) => (
            <div
              key={block.value}
              draggable
              onDragStart={(e) => onDragStart(e, block)}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-background/50 cursor-grab hover:bg-muted/80 hover:border-chart-2/30 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
            >
              <div className="p-1.5 rounded-md bg-chart-2/10 shrink-0">
                <block.Icon className="h-3.5 w-3.5 text-chart-2" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{block.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{block.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 px-1">
          <Cog className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">Ações</span>
        </div>
        {actions.map((block) => (
          <div
            key={block.value}
            draggable
            onDragStart={(e) => onDragStart(e, block)}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-background/50 cursor-grab hover:bg-muted/80 hover:border-primary/20 hover:shadow-sm active:scale-[0.98] transition-all duration-200"
          >
            <div className="p-1.5 rounded-md bg-muted/80 shrink-0">
              <block.Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{block.label}</p>
              <p className="text-[11px] text-muted-foreground truncate">{block.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-4 pt-3 space-y-1.5">
        <Label className="text-xs">start_date (DD/MM/YYYY HH:MM)</Label>
        <Input
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="01/01/2025 10:00"
          className="h-8 text-sm font-mono"
        />
      </div>
      <div className="border-t border-border mt-4 pt-3 space-y-1.5">
        <Label className="text-xs">Workflows Correlacionados</Label>
        <div className="space-y-1">
          {availableWorkflows
            .filter(w => w.id !== currentWorkflowId)
            .map(w => {
              const isChecked = correlatedWorkflowIds.includes(w.id);
              return (
                <label key={w.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        setCorrelatedWorkflowIds(correlatedWorkflowIds.filter(id => id !== w.id));
                      } else {
                        setCorrelatedWorkflowIds([...correlatedWorkflowIds, w.id]);
                      }
                    }}
                    className="rounded border-border"
                  />
                  <span className="truncate text-foreground">{w.name || w.id}</span>
                </label>
              );
            })}
          {availableWorkflows.filter(w => w.id !== currentWorkflowId).length === 0 && (
            <p className="text-[11px] text-muted-foreground px-2">Nenhum outro workflow disponível</p>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">Impede execução simultânea com os workflows selecionados</p>
      </div>
    </>
  );
}

interface FlowEditorProps {
  workflow: Workflow | null;
  onBack: () => void;
  onSave: (data: Partial<Workflow>) => void;
}

export function FlowEditor({ workflow, onBack, onSave }: FlowEditorProps) {
  // Fetch definitions from API
  const [blockLibrary, setBlockLibrary] = useState<BlockDef[]>(STATIC_BLOCKS);
  const [apiDefinitions, setApiDefinitions] = useState<Definition[]>([]);

  useEffect(() => {
    definitionService.list().then(defs => {
      if (Array.isArray(defs) && defs.length > 0) {
        setBlockLibrary(definitionsToBlocks(defs));
        setApiDefinitions(defs);
      }
    }).catch(err => {
      console.warn('Falha ao carregar definições da API, usando fallback estático:', err);
    });
  }, []);

  const triggers = useMemo(() => blockLibrary.filter(b => b.category === 'trigger'), [blockLibrary]);
  const filters = useMemo(() => blockLibrary.filter(b => b.category === 'filter'), [blockLibrary]);
  const actions = useMemo(() => blockLibrary.filter(b => b.category === 'action'), [blockLibrary]);

  // Build initial nodes from workflow
  const selfLoopNodeIds = new Set(
    workflow?.edges?.filter(e => e.from === e.to && e.loop).map(e => e.from) || []
  );

  const initialNodes: Node[] = workflow?.nodes?.map((n, i) => ({
    id: n.id,
    type: 'task',
    position: (n as any).position || { x: i * 280, y: 150 },
    data: {
      label: (n.config as any)?.label || blockLibrary.find(d => d.value === n.definition_id)?.label || n.definition_id,
      definition_id: n.definition_id,
      icon: blockLibrary.find(d => d.value === n.definition_id)?.icon || '',
      description: (n.config as any)?.description || '',
      for_each: n.for_each,
      hasForEach: !!n.for_each,
      hasLoop: selfLoopNodeIds.has(n.id),
      isTrigger: blockLibrary.find(d => d.value === n.definition_id)?.category === 'trigger',
    },
  })) || [];

  const initialEdges: Edge[] = workflow?.edges?.map((e, i) => {
    const isSelfLoop = e.from === e.to;
    return {
      id: e.id || `e-${i}`,
      source: e.from,
      target: e.to,
      sourceHandle: isSelfLoop ? 'loop-out' : 'right',
      targetHandle: isSelfLoop ? 'loop-in' : 'left',
      type: 'waypoint',
      data: {
        condition: e.condition || '',
        loop: e.loop || false,
        max_iterations: e.max_iterations,
        reopen_tasks: e.reopen_tasks || [],
      },
    };
  }) || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [status, setStatus] = useState<'active' | 'draft'>(workflow?.status || 'draft');
  const [schedule, setSchedule] = useState<AutomationSchedule | null>(workflow?.schedule || null);
  const [startDate, setStartDate] = useState(() => {
    if (workflow?.start_date) return workflow.start_date;
    const d = new Date(Date.now() + 60_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [nodeInputs, setNodeInputs] = useState<Record<string, Record<string, unknown>>>(workflow?.inputs || {});
  const [tags, setTags] = useState<WorkflowTag[]>(workflow?.tags || []);
  const [correlatedWorkflowIds, setCorrelatedWorkflowIds] = useState<string[]>(workflow?.correlated_workflow_ids || []);
  const [availableWorkflows, setAvailableWorkflows] = useState<{ id: string; name: string }[]>([]);
  const [allAvailableTags, setAllAvailableTags] = useState<WorkflowTag[]>([]);

  useEffect(() => {
    workflowService.list().then(data => {
      const list = Array.isArray(data) ? data : [];
      setAvailableWorkflows(list.map((w: any) => ({ id: w.id, name: w.name || w.id })));
      // Collect all unique tags from existing workflows
      const tagMap = new Map<string, WorkflowTag>();
      list.forEach((w: any) => {
        const wTags = Array.isArray(w.tags) ? w.tags : [];
        wTags.forEach((t: any) => {
          if (t?.id && t?.name) tagMap.set(t.id, t as WorkflowTag);
        });
      });
      setAllAvailableTags(Array.from(tagMap.values()));
    }).catch(() => {});
  }, []);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'once' | 'interval' | 'cron'>(workflow?.schedule?.type || 'interval');
  const [scheduleValue, setScheduleValue] = useState(workflow?.schedule?.value || '5');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) || null : null;

  // Build current workflow object
  const buildWorkflow = useCallback((): Workflow => ({
    id: workflow?.id || `wf-${Date.now()}`,
    name: name || '',
    description,
    status,
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
        if (d.reopen_tasks && d.reopen_tasks.length > 0) {
          edge.reopen_tasks = d.reopen_tasks;
        }
      }
      return edge;
    }),
    inputs: nodeInputs,
    start_date: startDate || null,
    tags,
    correlated_workflow_ids: correlatedWorkflowIds.length > 0 ? correlatedWorkflowIds : undefined,
    createdAt: workflow?.createdAt,
    updatedAt: new Date().toISOString(),
    lastRunAt: workflow?.lastRunAt,
    runCount: workflow?.runCount,
  }), [nodes, edges, name, description, status, schedule, startDate, nodeInputs, tags, correlatedWorkflowIds, workflow]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const isSelfLoop = connection.source === connection.target;
      const newEdge = {
        ...connection,
        type: 'waypoint',
        data: {
          condition: '',
          loop: isSelfLoop,
          max_iterations: isSelfLoop ? 5 : undefined,
        },
      };
      if (isSelfLoop) {
        newEdge.sourceHandle = 'loop-out';
        newEdge.targetHandle = 'loop-in';
        // Mark the node as having a loop
        setNodes((nds) => nds.map((n) =>
          n.id === connection.source ? { ...n, data: { ...n.data, hasLoop: true } } : n
        ));
      }
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, setNodes]
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

      setNodes((nds) => {
        // Sanitize label to create node ID base
        const base = label
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
          .replace(/[^a-z0-9]+/g, '-')                      // special chars → dash
          .replace(/^-+|-+$/g, '');                          // trim dashes

        // Find next available index for this base
        const existing = nds.filter(n => n.id.startsWith(base)).map(n => {
          const suffix = n.id.slice(base.length);
          if (!suffix) return 1;
          const num = parseInt(suffix.replace(/^-/, ''), 10);
          return isNaN(num) ? 0 : num;
        });
        const nextIndex = existing.length > 0 ? Math.max(...existing) + 1 : 1;
        const nodeId = existing.length === 0 ? base : `${base}-${nextIndex}`;

        const isSwitch = defId === 'switch_v1';
        const newNode: Node = {
          id: nodeId,
          type: 'task',
          position,
          data: {
            label,
            definition_id: defId,
            icon: blockLibrary.find(d => d.value === defId)?.icon || '',
            description: '',
            hasForEach: false,
            isTrigger: blockLibrary.find(d => d.value === defId)?.category === 'trigger',
            ...(isSwitch ? { switchCases: ['Case 1', 'Case 2', 'Default'] } : {}),
          },
        };

        return [...nds, newNode];
      });
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

  const handleRenameNode = useCallback((oldId: string, newLabel: string) => {
    const base = newLabel
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setNodes((nds) => {
      const existing = nds.filter(n => n.id !== oldId && n.id.startsWith(base)).map(n => {
        const suffix = n.id.slice(base.length);
        if (!suffix) return 1;
        const num = parseInt(suffix.replace(/^-/, ''), 10);
        return isNaN(num) ? 0 : num;
      });
      const nextIndex = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      const newId = existing.length === 0 && !nds.some(n => n.id === base && n.id !== oldId) ? base : `${base}-${nextIndex}`;

      // Update edges
      setEdges((eds) => eds.map(e => ({
        ...e,
        id: e.id === `loop-${oldId}` ? `loop-${newId}` : e.id,
        source: e.source === oldId ? newId : e.source,
        target: e.target === oldId ? newId : e.target,
        data: e.data?.reopen_tasks
          ? { ...e.data, reopen_tasks: (e.data.reopen_tasks as string[]).map((t: string) => t === oldId ? newId : t) }
          : e.data,
      })));

      // Update inputs
      setNodeInputs((prev) => {
        const next = { ...prev };
        if (next[oldId] !== undefined) {
          next[newId] = next[oldId];
          delete next[oldId];
        }
        return next;
      });

      // Update selected node
      setSelectedNodeId((cur) => cur === oldId ? newId : cur);

      return nds.map(n => n.id === oldId ? { ...n, id: newId } : n);
    });
  }, [setNodes, setEdges]);

  const handleEdgeDataUpdate = useCallback((id: string, data: Partial<Edge['data']>) => {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data: { ...(e.data || {}), ...data } } : e)));
  }, [setEdges]);

  const handleCreateLoopEdge = useCallback((nodeId: string) => {
    setEdges((eds) => {
      const exists = eds.some(e => e.source === nodeId && e.target === nodeId);
      if (exists) return eds;
      const newEdge: Edge = {
        id: `loop-${nodeId}`,
        source: nodeId,
        target: nodeId,
        sourceHandle: 'loop-out',
        targetHandle: 'loop-in',
        type: 'waypoint',
        data: { condition: '', loop: true, loop_mode: 'while_true', max_iterations: 5, reopen_tasks: [nodeId] },
      };
      return [...eds, newEdge];
    });
  }, [setEdges]);

  const handleDeleteLoopEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter(e => e.id !== edgeId));
  }, [setEdges]);

  const handleUpdateInputs = useCallback((nodeId: string, inputs: Record<string, unknown>) => {
    setNodeInputs((prev) => ({ ...prev, [nodeId]: inputs }));
  }, []);

  const createAutoVersion = useCallback(async (wf: Workflow) => {
    if (!wf.id) return;
    try {
      await workflowVersionService.create(wf.id, exportWorkflowJson(wf) as Record<string, unknown>);
    } catch (err) {
      console.warn('Falha ao criar versão automática:', err);
    }
  }, []);

  const handleRestoreVersion = useCallback((snapshot: Record<string, unknown>) => {
    // Apply snapshot to current editor state
    const snapNodes = (snapshot.nodes as any[]) || [];
    const snapEdges = (snapshot.edges as any[]) || [];

    const restoredNodes = snapNodes.map((n: any, i: number) => ({
      id: n.id,
      type: 'task' as const,
      position: n.position || { x: i * 280, y: 150 },
      data: {
        label: n.config?.label || n.definition_id,
        definition_id: n.definition_id || '',
        icon: blockLibrary.find(d => d.value === n.definition_id)?.icon || '',
        description: n.config?.description || '',
        for_each: n.for_each,
        hasForEach: !!n.for_each,
        hasLoop: false,
        isTrigger: blockLibrary.find(d => d.value === n.definition_id)?.category === 'trigger',
      },
    }));

    const restoredEdges = snapEdges.map((e: any, i: number) => {
      const isSelfLoop = e.from === e.to;
      return {
        id: e.id || `e-${i}`,
        source: e.from,
        target: e.to,
        sourceHandle: isSelfLoop ? 'loop-out' : 'right',
        targetHandle: isSelfLoop ? 'loop-in' : 'left',
        type: 'waypoint' as const,
        data: {
          condition: e.condition || '',
          loop: e.loop || false,
          max_iterations: e.max_iterations,
          reopen_tasks: e.reopen_tasks || [],
        },
      };
    });

    setNodes(restoredNodes);
    setEdges(restoredEdges);

    // Restore inputs
    const restoredInputs: Record<string, Record<string, unknown>> = {};
    snapNodes.forEach((n: any) => {
      if (n.config) restoredInputs[n.id] = n.config;
    });
    setNodeInputs(restoredInputs);

    if (snapshot.name) setName(snapshot.name as string);
    if (snapshot.description !== undefined) setDescription((snapshot.description as string) || '');

    toast.success('Versão restaurada no editor');
  }, [blockLibrary, setNodes, setEdges]);

  const handleSave = () => {
    const wf = buildWorkflow();
    onSave(wf);
    createAutoVersion(wf);
    toast.success('Rascunho salvo');
  };

  const handleValidate = () => {
    setValidationDialogOpen(true);
  };

  const isExisting = !!(workflow?.createdAt && workflow?.updatedAt);

  const handlePublish = async () => {
    const wf = buildWorkflow();
    const errors = validateWorkflow(wf);
    const critical = errors.filter(e => e.severity === 'error');
    if (critical.length > 0) {
      toast.error(`${critical.length} erro(s) impedem a publicação. Valide primeiro.`);
      setValidationDialogOpen(true);
      return;
    }
    setIsPublishing(true);
    try {
      const exportData = exportWorkflowJson(wf);
      if (isExisting) {
        await workflowService.update(wf.id, exportData);
        toast.success('Workflow atualizado com sucesso');
      } else {
        await workflowService.create(exportData);
        toast.success('Workflow cadastrado com sucesso');
      }
      await createAutoVersion(wf);
      onSave(wf);
      onBack();
    } catch (err: any) {
      toast.error(`Erro ao ${isExisting ? 'atualizar' : 'cadastrar'}: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveSchedule = () => {
    setSchedule({ type: scheduleType, value: scheduleValue, timezone: 'America/Sao_Paulo' });
    setScheduleDialogOpen(false);
  };

  const onDragStart = (event: React.DragEvent, block: BlockDef) => {
    event.dataTransfer.setData('application/reactflow-defid', block.value);
    event.dataTransfer.setData('application/reactflow-label', block.label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const currentWorkflow = buildWorkflow();
  const validationErrors = validateWorkflow(currentWorkflow);
  const exportJson = exportWorkflowJson(currentWorkflow);

  const [blocksPanelOpen, setBlocksPanelOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do workflow"
            className="max-w-[200px] md:max-w-[300px] font-medium"
          />
          <div className="hidden lg:block">
            <TagInput tags={tags} onChange={setTags} availableTags={allAvailableTags} placeholder="Tag..." />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as 'active' | 'draft')}>
            <SelectTrigger className="w-[110px] md:w-[130px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Rascunho
                </span>
              </SelectItem>
              <SelectItem value="active">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ativo
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="md:hidden" onClick={() => setBlocksPanelOpen(!blocksPanelOpen)}>
            <FileJson className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setScheduleDialogOpen(true)}>
            <Clock className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{schedule ? `Agendado: ${schedule.type}` : 'Agendar'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleValidate}>
            <ShieldCheck className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Validar</span>
            {validationErrors.length > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground rounded-full text-[10px] px-1.5">
                {validationErrors.filter(e => e.severity === 'error').length}
              </span>
            )}
          </Button>
          {workflow?.id && (
            <Button variant="outline" size="sm" onClick={() => setVersionHistoryOpen(true)}>
              <History className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Versões</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Salvar Rascunho</span>
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={isPublishing}>
            {isPublishing ? (
              <Loader2 className="h-4 w-4 md:mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 md:mr-2" />
            )}
            <span className="hidden md:inline">{isExisting ? 'Atualizar' : 'Cadastrar'}</span>
          </Button>
        </div>
      </div>

      {/* Execution status banner */}
      {workflow?.id && <ExecutionStatusBar workflowId={workflow.id} />}

      {/* Editor */}
      <div className="flex flex-1 mt-4 gap-4 overflow-hidden relative">
        {/* Sidebar – Blocos (desktop) */}
        <div className="hidden md:block w-60 shrink-0 border border-border/50 rounded-xl bg-card/90 backdrop-blur-sm p-4 overflow-y-auto space-y-4">
          <BlocksSidebarContent
            triggers={triggers}
            filters={filters}
            actions={actions}
            startDate={startDate}
            setStartDate={setStartDate}
            correlatedWorkflowIds={correlatedWorkflowIds}
            setCorrelatedWorkflowIds={setCorrelatedWorkflowIds}
            availableWorkflows={availableWorkflows}
            currentWorkflowId={workflow?.id}
            onDragStart={onDragStart}
          />
        </div>

        {/* Sidebar – Blocos (mobile overlay) */}
        {blocksPanelOpen && (
          <div className="md:hidden absolute inset-0 z-20 flex">
            <div className="w-64 shrink-0 border border-border/50 rounded-xl bg-card backdrop-blur-sm p-4 overflow-y-auto space-y-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-foreground">Blocos</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBlocksPanelOpen(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <BlocksSidebarContent
                triggers={triggers}
                filters={filters}
                actions={actions}
                startDate={startDate}
                setStartDate={setStartDate}
                correlatedWorkflowIds={correlatedWorkflowIds}
                setCorrelatedWorkflowIds={setCorrelatedWorkflowIds}
                availableWorkflows={availableWorkflows}
                currentWorkflowId={workflow?.id}
                onDragStart={onDragStart}
              />
            </div>
            <div className="flex-1 bg-background/50" onClick={() => setBlocksPanelOpen(false)} />
          </div>
        )}

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 border rounded-lg overflow-hidden bg-muted/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={(changes) => {
              // Clean up inputs when nodes are deleted
              const removedIds = changes
                .filter(c => c.type === 'remove')
                .map(c => c.id);
              if (removedIds.length > 0) {
                setNodeInputs(prev => {
                  const next = { ...prev };
                  removedIds.forEach(id => delete next[id]);
                  return next;
                });
                setSelectedNodeId(prev => removedIds.includes(prev || '') ? null : prev);
              }
              onNodesChange(changes);
            }}
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
            key={selectedNode.id}
            node={selectedNode}
            inputs={nodeInputs[selectedNode.id] || {}}
            loopEdge={edges.find(e => e.source === selectedNode.id && e.target === selectedNode.id) || null}
            allNodes={nodes}
            definitions={blockLibrary}
            apiDefinitions={apiDefinitions}
            onUpdate={handleNodeDataUpdate}
            onUpdateInputs={handleUpdateInputs}
            onUpdateEdge={handleEdgeDataUpdate}
            onCreateLoopEdge={handleCreateLoopEdge}
            onDeleteLoopEdge={handleDeleteLoopEdge}
            onRenameNode={handleRenameNode}
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

      {/* Version History */}
      {workflow?.id && (
        <VersionHistoryDialog
          open={versionHistoryOpen}
          onOpenChange={setVersionHistoryOpen}
          workflowId={workflow.id}
          onRestore={handleRestoreVersion}
        />
      )}
    </div>
  );
}
