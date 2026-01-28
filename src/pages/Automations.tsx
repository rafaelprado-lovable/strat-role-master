import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AutomationsTable } from '@/components/automations/AutomationsTable';
import { FlowEditor } from '@/components/automations/FlowEditor';
import { CustomBlockDialog } from '@/components/automations/CustomBlockDialog';
import { Automation, Machine, CustomBlock } from '@/types/automations';
import { toast } from 'sonner';

// Mock data for demonstration
const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: 'auto-1',
    name: 'Alerta de Alarme Crítico',
    description: 'Envia notificação no Slack quando um alarme crítico é disparado',
    status: 'active',
    schedule: { type: 'interval', value: '5', timezone: 'America/Sao_Paulo' },
    nodes: [],
    edges: [],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    lastRunAt: '2024-01-28T08:30:00Z',
    runCount: 47,
  },
  {
    id: 'auto-2',
    name: 'Limpeza de Fila RabbitMQ',
    description: 'Executa script de limpeza quando a fila atinge 90%',
    status: 'active',
    schedule: { type: 'cron', value: '0 */2 * * *', timezone: 'America/Sao_Paulo' },
    nodes: [],
    edges: [],
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T16:20:00Z',
    lastRunAt: '2024-01-28T06:00:00Z',
    runCount: 156,
  },
  {
    id: 'auto-3',
    name: 'Relatório Diário de Incidentes',
    description: 'Gera e envia relatório de incidentes por email',
    status: 'inactive',
    schedule: { type: 'cron', value: '0 9 * * 1-5', timezone: 'America/Sao_Paulo' },
    nodes: [],
    edges: [],
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-18T10:15:00Z',
    lastRunAt: '2024-01-26T09:00:00Z',
    runCount: 23,
  },
  {
    id: 'auto-4',
    name: 'Backup de Configurações',
    description: 'Backup automático das configurações do sistema',
    status: 'draft',
    schedule: null,
    nodes: [],
    edges: [],
    createdAt: '2024-01-27T15:00:00Z',
    updatedAt: '2024-01-27T15:00:00Z',
    lastRunAt: null,
    runCount: 0,
  },
];

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCustomBlockDialogOpen, setIsCustomBlockDialogOpen] = useState(false);

  const handleCreate = () => {
    setEditingAutomation(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    toast.success('Automação excluída');
  };

  const handleDuplicate = (automation: Automation) => {
    const newAutomation: Automation = {
      ...automation,
      id: `auto-${Date.now()}`,
      name: `${automation.name} (Cópia)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: null,
      runCount: 0,
    };
    setAutomations((prev) => [...prev, newAutomation]);
    toast.success('Automação duplicada');
  };

  const handleToggleStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
          : a
      )
    );
    toast.success('Status atualizado');
  };

  const handleRun = (id: string) => {
    toast.info('Executando automação...');
    setTimeout(() => {
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, lastRunAt: new Date().toISOString(), runCount: a.runCount + 1 }
            : a
        )
      );
      toast.success('Automação executada com sucesso');
    }, 2000);
  };

  const handleSave = (automationData: Partial<Automation>) => {
    if (automationData.id) {
      // Update existing
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automationData.id
            ? { ...a, ...automationData, updatedAt: new Date().toISOString() }
            : a
        )
      );
      toast.success('Automação atualizada');
    } else {
      // Create new
      const newAutomation: Automation = {
        id: `auto-${Date.now()}`,
        name: automationData.name || 'Nova Automação',
        description: automationData.description || '',
        status: 'draft',
        schedule: automationData.schedule || null,
        nodes: automationData.nodes || [],
        edges: automationData.edges || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
        runCount: 0,
      };
      setAutomations((prev) => [...prev, newAutomation]);
      setEditingAutomation(newAutomation);
      toast.success('Automação criada');
    }
  };

  const handleSaveMachine = (machine: Machine) => {
    setMachines((prev) => {
      const exists = prev.find((m) => m.id === machine.id);
      if (exists) {
        return prev.map((m) => (m.id === machine.id ? machine : m));
      }
      return [...prev, machine];
    });
    toast.success('Máquina salva');
  };

  const handleDeleteMachine = (id: string) => {
    setMachines((prev) => prev.filter((m) => m.id !== id));
    toast.success('Máquina removida');
  };

  const handleSaveCustomBlock = (block: CustomBlock) => {
    setCustomBlocks((prev) => {
      const exists = prev.find((b) => b.id === block.id);
      if (exists) {
        return prev.map((b) => (b.id === block.id ? block : b));
      }
      return [...prev, block];
    });
    setIsCustomBlockDialogOpen(false);
    toast.success('Bloco customizado salvo');
  };

  const handleDeleteCustomBlock = (id: string) => {
    setCustomBlocks((prev) => prev.filter((b) => b.id !== id));
    toast.success('Bloco removido');
  };

  if (isEditorOpen) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {editingAutomation ? 'Editar Automação' : 'Nova Automação'}
          </h2>
          <p className="text-muted-foreground">
            Arraste e conecte blocos para criar o fluxo de automação
          </p>
        </div>

        <ReactFlowProvider>
          <FlowEditor
            automation={editingAutomation}
            machines={machines}
            customBlocks={customBlocks}
            onBack={() => setIsEditorOpen(false)}
            onSave={handleSave}
            onSaveMachine={handleSaveMachine}
            onDeleteMachine={handleDeleteMachine}
            onSaveCustomBlock={handleSaveCustomBlock}
            onDeleteCustomBlock={handleDeleteCustomBlock}
          />
        </ReactFlowProvider>

        <CustomBlockDialog
          open={isCustomBlockDialogOpen}
          onOpenChange={setIsCustomBlockDialogOpen}
          machines={machines}
          onSave={handleSaveCustomBlock}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Automações</h2>
        <p className="text-muted-foreground">
          Gerencie suas automações e fluxos de trabalho
        </p>
      </div>

      <AutomationsTable
        automations={automations}
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
