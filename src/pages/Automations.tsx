import { useState, useCallback, useRef, useMemo } from 'react';
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
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Bug,
  Database,
  Play,
  Plus,
  Save,
  Trash2,
  Zap,
  Mail,
  MessageSquare,
  Webhook,
  Clock,
  Filter,
  GitBranch,
} from 'lucide-react';
import TriggerNode from '@/components/automations/TriggerNode';
import ActionNode from '@/components/automations/ActionNode';
import ConditionNode from '@/components/automations/ConditionNode';

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
};

type TriggerType = 'alarm' | 'incident' | 'rabbit_full';
type ActionType = 'webhook' | 'email' | 'slack' | 'script' | 'delay';
type ConditionType = 'if' | 'switch' | 'filter';

interface NodeData extends Record<string, unknown> {
  label: string;
  type: TriggerType | ActionType | ConditionType;
  config?: Record<string, unknown>;
}

const TRIGGER_BLOCKS = [
  { type: 'alarm', label: 'Alarme', icon: AlertTriangle, color: 'bg-orange-500' },
  { type: 'incident', label: 'Incidente', icon: Bug, color: 'bg-red-500' },
  { type: 'rabbit_full', label: 'Rabbit Cheio', icon: Database, color: 'bg-purple-500' },
];

const ACTION_BLOCKS = [
  { type: 'webhook', label: 'Webhook', icon: Webhook, color: 'bg-blue-500' },
  { type: 'email', label: 'Enviar Email', icon: Mail, color: 'bg-green-500' },
  { type: 'slack', label: 'Slack', icon: MessageSquare, color: 'bg-indigo-500' },
  { type: 'script', label: 'Script', icon: Zap, color: 'bg-yellow-500' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'bg-gray-500' },
];

const CONDITION_BLOCKS = [
  { type: 'if', label: 'Condição IF', icon: GitBranch, color: 'bg-cyan-500' },
  { type: 'filter', label: 'Filtro', icon: Filter, color: 'bg-teal-500' },
];

const initialNodes: Node<NodeData>[] = [];
const initialEdges: Edge[] = [];

function FlowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [automationName, setAutomationName] = useState('Nova Automação');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange: OnNodesChange<Node<NodeData>> = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<NodeData>[]),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
    []
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNode(node);
    setIsConfigOpen(true);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow-type');
      const nodeType = event.dataTransfer.getData('application/reactflow-nodeType');
      const label = event.dataTransfer.getData('application/reactflow-label');

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node<NodeData> = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { label, type: type as TriggerType | ActionType | ConditionType, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  const onDragStart = (event: React.DragEvent, type: string, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.setData('application/reactflow-nodeType', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const updateNodeConfig = (key: string, value: unknown) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...(node.data.config || {}),
                [key]: value,
              },
            },
          };
        }
        return node;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setIsConfigOpen(false);
    setSelectedNode(null);
    toast.success('Bloco removido');
  };

  const saveAutomation = () => {
    const automation = {
      name: automationName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
    };
    console.log('Saving automation:', automation);
    toast.success('Automação salva com sucesso');
  };

  const runAutomation = () => {
    if (nodes.length === 0) {
      toast.error('Adicione pelo menos um bloco para executar');
      return;
    }
    toast.info('Execução iniciada...');
    setTimeout(() => {
      toast.success('Automação executada com sucesso');
    }, 2000);
  };

  const renderConfigPanel = () => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.data.type;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Nome do bloco</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => {
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === selectedNode.id
                    ? { ...node, data: { ...node.data, label: e.target.value } }
                    : node
                )
              );
            }}
          />
        </div>

        {nodeType === 'alarm' && (
          <>
            <div className="space-y-2">
              <Label>Tipo de alarme</Label>
              <Select
                value={(selectedNode.data.config?.alarmType as string) || ''}
                onValueChange={(value) => updateNodeConfig('alarmType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="info">Informativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Input
                placeholder="Nome do serviço"
                value={(selectedNode.data.config?.service as string) || ''}
                onChange={(e) => updateNodeConfig('service', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'incident' && (
          <>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={(selectedNode.data.config?.priority as string) || ''}
                onValueChange={(value) => updateNodeConfig('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1">P1 - Crítico</SelectItem>
                  <SelectItem value="P2">P2 - Alto</SelectItem>
                  <SelectItem value="P3">P3 - Médio</SelectItem>
                  <SelectItem value="P4">P4 - Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Equipe</Label>
              <Input
                placeholder="Nome da equipe"
                value={(selectedNode.data.config?.team as string) || ''}
                onChange={(e) => updateNodeConfig('team', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'rabbit_full' && (
          <>
            <div className="space-y-2">
              <Label>Threshold (%)</Label>
              <Input
                type="number"
                placeholder="90"
                value={(selectedNode.data.config?.threshold as string) || ''}
                onChange={(e) => updateNodeConfig('threshold', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fila</Label>
              <Input
                placeholder="Nome da fila"
                value={(selectedNode.data.config?.queue as string) || ''}
                onChange={(e) => updateNodeConfig('queue', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'webhook' && (
          <>
            <div className="space-y-2">
              <Label>URL do Webhook</Label>
              <Input
                placeholder="https://api.exemplo.com/webhook"
                value={(selectedNode.data.config?.url as string) || ''}
                onChange={(e) => updateNodeConfig('url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select
                value={(selectedNode.data.config?.method as string) || 'POST'}
                onValueChange={(value) => updateNodeConfig('method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer ..."}'
                value={(selectedNode.data.config?.headers as string) || ''}
                onChange={(e) => updateNodeConfig('headers', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Body (JSON)</Label>
              <Textarea
                placeholder='{"key": "value"}'
                value={(selectedNode.data.config?.body as string) || ''}
                onChange={(e) => updateNodeConfig('body', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'email' && (
          <>
            <div className="space-y-2">
              <Label>Destinatário</Label>
              <Input
                placeholder="email@exemplo.com"
                value={(selectedNode.data.config?.to as string) || ''}
                onChange={(e) => updateNodeConfig('to', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                placeholder="Assunto do email"
                value={(selectedNode.data.config?.subject as string) || ''}
                onChange={(e) => updateNodeConfig('subject', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Corpo do email</Label>
              <Textarea
                placeholder="Mensagem..."
                value={(selectedNode.data.config?.body as string) || ''}
                onChange={(e) => updateNodeConfig('body', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'slack' && (
          <>
            <div className="space-y-2">
              <Label>Webhook URL do Slack</Label>
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={(selectedNode.data.config?.webhookUrl as string) || ''}
                onChange={(e) => updateNodeConfig('webhookUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Canal</Label>
              <Input
                placeholder="#alertas"
                value={(selectedNode.data.config?.channel as string) || ''}
                onChange={(e) => updateNodeConfig('channel', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                placeholder="Mensagem para o Slack..."
                value={(selectedNode.data.config?.message as string) || ''}
                onChange={(e) => updateNodeConfig('message', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'script' && (
          <>
            <div className="space-y-2">
              <Label>Script (JavaScript)</Label>
              <Textarea
                className="font-mono min-h-[200px]"
                placeholder="// Seu código aqui&#10;return { success: true };"
                value={(selectedNode.data.config?.code as string) || ''}
                onChange={(e) => updateNodeConfig('code', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'delay' && (
          <>
            <div className="space-y-2">
              <Label>Tempo de espera</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="5"
                  value={(selectedNode.data.config?.duration as string) || ''}
                  onChange={(e) => updateNodeConfig('duration', e.target.value)}
                />
                <Select
                  value={(selectedNode.data.config?.unit as string) || 'seconds'}
                  onValueChange={(value) => updateNodeConfig('unit', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Segundos</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="hours">Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {nodeType === 'if' && (
          <>
            <div className="space-y-2">
              <Label>Campo</Label>
              <Input
                placeholder="data.status"
                value={(selectedNode.data.config?.field as string) || ''}
                onChange={(e) => updateNodeConfig('field', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <Select
                value={(selectedNode.data.config?.operator as string) || 'equals'}
                onValueChange={(value) => updateNodeConfig('operator', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Igual a</SelectItem>
                  <SelectItem value="not_equals">Diferente de</SelectItem>
                  <SelectItem value="contains">Contém</SelectItem>
                  <SelectItem value="greater_than">Maior que</SelectItem>
                  <SelectItem value="less_than">Menor que</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                placeholder="Valor esperado"
                value={(selectedNode.data.config?.value as string) || ''}
                onChange={(e) => updateNodeConfig('value', e.target.value)}
              />
            </div>
          </>
        )}

        {nodeType === 'filter' && (
          <>
            <div className="space-y-2">
              <Label>Expressão de filtro</Label>
              <Textarea
                placeholder="data.priority === 'P1'"
                value={(selectedNode.data.config?.expression as string) || ''}
                onChange={(e) => updateNodeConfig('expression', e.target.value)}
              />
            </div>
          </>
        )}

        <Button variant="destructive" className="w-full mt-4" onClick={deleteSelectedNode}>
          <Trash2 className="h-4 w-4 mr-2" />
          Remover bloco
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={automationName}
            onChange={(e) => setAutomationName(e.target.value)}
            className="w-64 text-lg font-semibold"
          />
          <Badge variant="outline">Rascunho</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveAutomation}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button onClick={runAutomation}>
            <Play className="h-4 w-4 mr-2" />
            Executar
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-full">
        {/* Blocks Panel */}
        <Card className="w-64 shrink-0">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Blocos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">GATILHOS</p>
              <div className="space-y-2">
                {TRIGGER_BLOCKS.map((block) => (
                  <div
                    key={block.type}
                    className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted/50 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, block.type, 'trigger', block.label)}
                  >
                    <div className={`p-1.5 rounded ${block.color}`}>
                      <block.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm">{block.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">AÇÕES</p>
              <div className="space-y-2">
                {ACTION_BLOCKS.map((block) => (
                  <div
                    key={block.type}
                    className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted/50 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, block.type, 'action', block.label)}
                  >
                    <div className={`p-1.5 rounded ${block.color}`}>
                      <block.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm">{block.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">CONDIÇÕES</p>
              <div className="space-y-2">
                {CONDITION_BLOCKS.map((block) => (
                  <div
                    key={block.type}
                    className="flex items-center gap-2 p-2 rounded-md border cursor-grab hover:bg-muted/50 transition-colors"
                    draggable
                    onDragStart={(e) => onDragStart(e, block.type, 'condition', block.label)}
                  >
                    <div className={`p-1.5 rounded ${block.color}`}>
                      <block.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm">{block.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1 border rounded-lg overflow-hidden bg-background">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/30"
          >
            <Controls />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>

      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Configurar Bloco</SheetTitle>
            <SheetDescription>Configure as propriedades do bloco selecionado</SheetDescription>
          </SheetHeader>
          <div className="mt-6">{renderConfigPanel()}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Automations() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automações</h2>
        <p className="text-muted-foreground">
          Crie fluxos de automação arrastando e conectando blocos
        </p>
      </div>

      <ReactFlowProvider>
        <FlowEditor />
      </ReactFlowProvider>
    </div>
  );
}
