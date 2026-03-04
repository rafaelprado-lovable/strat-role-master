import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AutomationsTable } from '@/components/automations/AutomationsTable';
import { FlowEditor } from '@/components/automations/FlowEditor';
import { Workflow } from '@/types/automations';
import { toast } from 'sonner';

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-simple',
    name: 'Fluxo Simples — SSH + WhatsApp',
    description: 'Executa SSH e notifica via WhatsApp',
    status: 'active',
    schedule: null,
    nodes: [
      { id: 'node-ssh', definition_id: 'ssh_execution', config: {}, position: { x: 250, y: 50 } },
      { id: 'node-whatsapp', definition_id: 'send_whatsapp_message_v1', config: {}, position: { x: 250, y: 200 } },
    ],
    edges: [
      { from: 'node-ssh', to: 'node-whatsapp' },
    ],
    inputs: {
      'node-ssh': { host: '192.168.1.10', command: 'uptime' },
      'node-whatsapp': { phone: '+5511999999999', message: 'Resultado: {{node-ssh.output.stdout}}' },
    },
    start_date: null,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    lastRunAt: '2024-01-28T08:30:00Z',
    runCount: 47,
  },
  {
    id: 'wf-conditional',
    name: 'Condicional — Verifica Status da API',
    description: 'Chama API e envia alerta condicional',
    status: 'active',
    schedule: { type: 'interval', value: '5', timezone: 'America/Sao_Paulo' },
    nodes: [
      { id: 'node-api', definition_id: 'api_call_v1', config: {}, position: { x: 250, y: 50 } },
      { id: 'node-alert', definition_id: 'send_whatsapp_message_v1', config: {}, position: { x: 250, y: 200 } },
    ],
    edges: [
      { from: 'node-api', to: 'node-alert', condition: 'node-api.output.status == 500' },
    ],
    inputs: {
      'node-api': { url: 'https://api.example.com/health', method: 'GET' },
      'node-alert': { phone: '+5511999999999', message: 'API fora! Status: {{node-api.output.status}}' },
    },
    start_date: '01/02/2025 10:00',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T16:20:00Z',
    lastRunAt: '2024-01-28T06:00:00Z',
    runCount: 156,
  },
  {
    id: 'wf-loop',
    name: 'While Loop — Retry até sucesso',
    description: 'Tenta chamar API em loop até status 200 ou max 5 tentativas',
    status: 'draft',
    schedule: null,
    nodes: [
      { id: 'node-retry', definition_id: 'api_call_v1', config: {}, position: { x: 250, y: 50 } },
      { id: 'node-done', definition_id: 'send_whatsapp_message_v1', config: {}, position: { x: 250, y: 200 } },
    ],
    edges: [
      { from: 'node-retry', to: 'node-retry', loop: true, max_iterations: 5, condition: 'node-retry.output.status != 200' },
      { from: 'node-retry', to: 'node-done', condition: 'node-retry.output.status == 200' },
    ],
    inputs: {
      'node-retry': { url: 'https://api.example.com/process', method: 'POST' },
      'node-done': { phone: '+5511999999999', message: 'Sucesso após retry!' },
    },
    start_date: null,
    createdAt: '2024-01-27T15:00:00Z',
    updatedAt: '2024-01-27T15:00:00Z',
    lastRunAt: null,
    runCount: 0,
  },
  {
    id: 'wf-foreach',
    name: 'For Each — Notifica lista de incidentes',
    description: 'Busca incidentes e envia WhatsApp para cada um',
    status: 'active',
    schedule: { type: 'cron', value: '0 9 * * 1-5', timezone: 'America/Sao_Paulo' },
    nodes: [
      { id: 'node-list', definition_id: 'api_call_v1', config: {}, position: { x: 250, y: 50 } },
      {
        id: 'node-notify',
        definition_id: 'send_whatsapp_message_v1',
        config: {},
        for_each: { items: '{{node-list.output.incidents}}', item_var: 'incident', index_var: 'idx' },
        position: { x: 250, y: 200 },
      },
    ],
    edges: [
      { from: 'node-list', to: 'node-notify' },
    ],
    inputs: {
      'node-list': { url: 'https://api.example.com/incidents', method: 'GET' },
      'node-notify': { phone: '+5511999999999', message: 'Incidente #{{idx}}: {{incident.title}} — {{incident.severity}}' },
    },
    start_date: '03/03/2025 09:00',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-18T10:15:00Z',
    lastRunAt: '2024-01-26T09:00:00Z',
    runCount: 23,
  },
];

export default function Automations() {
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleCreate = () => {
    setEditingWorkflow(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    toast.success('Workflow excluído');
  };

  const handleDuplicate = (workflow: Workflow) => {
    const newWf: Workflow = {
      ...workflow,
      id: `wf-${Date.now()}`,
      name: `${workflow.name} (Cópia)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: null,
      runCount: 0,
    };
    setWorkflows((prev) => [...prev, newWf]);
    toast.success('Workflow duplicado');
  };

  const handleToggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: w.status === 'active' ? ('draft' as const) : ('active' as const) } : w
      )
    );
    toast.success('Status atualizado');
  };

  const handleRun = (id: string) => {
    toast.info('Executando workflow...');
    setTimeout(() => {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, lastRunAt: new Date().toISOString(), runCount: (w.runCount || 0) + 1 } : w
        )
      );
      toast.success('Workflow executado com sucesso');
    }, 2000);
  };

  const handleSave = (data: Partial<Workflow>) => {
    if (data.id && workflows.some(w => w.id === data.id)) {
      setWorkflows((prev) =>
        prev.map((w) => (w.id === data.id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w))
      );
    } else {
      const newWf: Workflow = {
        id: data.id || `wf-${Date.now()}`,
        name: data.name || 'Novo Workflow',
        description: data.description || '',
        status: 'draft',
        schedule: data.schedule || null,
        nodes: data.nodes || [],
        edges: data.edges || [],
        inputs: data.inputs || {},
        start_date: data.start_date || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
        runCount: 0,
      };
      setWorkflows((prev) => [...prev, newWf]);
      setEditingWorkflow(newWf);
    }
  };

  if (isEditorOpen) {
    return (
      <div className="space-y-4">
        <ReactFlowProvider>
          <FlowEditor
            workflow={editingWorkflow}
            onBack={() => setIsEditorOpen(false)}
            onSave={handleSave}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automações</h2>
        <p className="text-muted-foreground">Gerencie seus workflows e automações</p>
      </div>
      <AutomationsTable
        automations={workflows}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onToggleStatus={handleToggleStatus}
        onRun={handleRun}
        onCreate={handleCreate}
      />
    </div>
  );
}
