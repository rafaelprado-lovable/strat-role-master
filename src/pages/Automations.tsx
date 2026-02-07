import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AutomationsTable } from '@/components/automations/AutomationsTable';
import { FlowEditor } from '@/components/automations/FlowEditor';
import { Workflow, Machine, TaskDefinition } from '@/types/automations';
import { toast } from 'sonner';

// Mock data
const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-1',
    name: 'Alerta de Alarme Crítico',
    description: 'Envia notificação no Slack quando um alarme crítico é disparado',
    status: 'active',
    schedule: { type: 'interval', value: '5', timezone: 'America/Sao_Paulo' },
    nodes: [],
    edges: [],
    inputs: {},
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    lastRunAt: '2024-01-28T08:30:00Z',
    runCount: 47,
  },
  {
    id: 'wf-2',
    name: 'Limpeza de Fila RabbitMQ',
    description: 'Executa script de limpeza quando a fila atinge 90%',
    status: 'active',
    schedule: { type: 'cron', value: '0 */2 * * *', timezone: 'America/Sao_Paulo' },
    nodes: [],
    edges: [],
    inputs: {},
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T16:20:00Z',
    lastRunAt: '2024-01-28T06:00:00Z',
    runCount: 156,
  },
  {
    id: 'wf-3',
    name: 'Relatório Diário de Incidentes',
    description: 'Gera e envia relatório de incidentes por email',
    status: 'inactive',
    schedule: { type: 'cron', value: '0 9 * * 1-5', timezone: 'America/Sao_Paulo' },
    nodes: [],
    edges: [],
    inputs: {},
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-18T10:15:00Z',
    lastRunAt: '2024-01-26T09:00:00Z',
    runCount: 23,
  },
  {
    id: 'wf-4',
    name: 'Backup de Configurações',
    description: 'Backup automático das configurações do sistema',
    status: 'draft',
    schedule: null,
    nodes: [],
    edges: [],
    inputs: {},
    createdAt: '2024-01-27T15:00:00Z',
    updatedAt: '2024-01-27T15:00:00Z',
    lastRunAt: null,
    runCount: 0,
  },
];

export default function Automations() {
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [customDefinitions, setCustomDefinitions] = useState<TaskDefinition[]>([]);
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
        w.id === id
          ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' }
          : w
      )
    );
    toast.success('Status atualizado');
  };

  const handleRun = (id: string) => {
    toast.info('Executando workflow...');
    setTimeout(() => {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, lastRunAt: new Date().toISOString(), runCount: w.runCount + 1 }
            : w
        )
      );
      toast.success('Workflow executado com sucesso');
    }, 2000);
  };

  const handleSave = (data: Partial<Workflow>) => {
    if (data.id) {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === data.id
            ? { ...w, ...data, updatedAt: new Date().toISOString() }
            : w
        )
      );
      toast.success('Workflow atualizado');
    } else {
      const newWf: Workflow = {
        id: `wf-${Date.now()}`,
        name: data.name || 'Novo Workflow',
        description: data.description || '',
        status: 'draft',
        schedule: data.schedule || null,
        nodes: data.nodes || [],
        edges: data.edges || [],
        inputs: data.inputs || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
        runCount: 0,
      };
      setWorkflows((prev) => [...prev, newWf]);
      setEditingWorkflow(newWf);
      toast.success('Workflow criado');
    }
  };

  const handleSaveMachine = (machine: Machine) => {
    setMachines((prev) => {
      const exists = prev.find((m) => m.id === machine.id);
      if (exists) return prev.map((m) => (m.id === machine.id ? machine : m));
      return [...prev, machine];
    });
    toast.success('Máquina salva');
  };

  const handleDeleteMachine = (id: string) => {
    setMachines((prev) => prev.filter((m) => m.id !== id));
    toast.success('Máquina removida');
  };

  const handleSaveDefinition = (def: TaskDefinition) => {
    setCustomDefinitions((prev) => {
      const exists = prev.find((d) => d.id === def.id);
      if (exists) return prev.map((d) => (d.id === def.id ? def : d));
      return [...prev, def];
    });
    toast.success('Task Definition salva');
  };

  const handleDeleteDefinition = (id: string) => {
    setCustomDefinitions((prev) => prev.filter((d) => d.id !== id));
    toast.success('Task Definition removida');
  };

  if (isEditorOpen) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {editingWorkflow ? 'Editar Workflow' : 'Novo Workflow'}
          </h2>
          <p className="text-muted-foreground">
            Arraste Task Definitions para criar instâncias no workflow
          </p>
        </div>

        <ReactFlowProvider>
          <FlowEditor
            workflow={editingWorkflow}
            machines={machines}
            customDefinitions={customDefinitions}
            onBack={() => setIsEditorOpen(false)}
            onSave={handleSave}
            onSaveMachine={handleSaveMachine}
            onDeleteMachine={handleDeleteMachine}
            onSaveDefinition={handleSaveDefinition}
            onDeleteDefinition={handleDeleteDefinition}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automações</h2>
        <p className="text-muted-foreground">
          Gerencie seus workflows e automações
        </p>
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
