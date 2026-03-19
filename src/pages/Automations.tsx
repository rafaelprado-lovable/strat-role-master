import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { AutomationsTable } from '@/components/automations/AutomationsTable';
import { FlowEditor } from '@/components/automations/FlowEditor';
import { Workflow } from '@/types/automations';
import { workflowService } from '@/services/workflowService';
import { parseWorkflowResponse } from '@/services/workflowParser';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Workflow as WorkflowIcon, Loader2 } from 'lucide-react';

export default function Automations() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExecutions, setTotalExecutions] = useState(0);
  const [executionCounts, setExecutionCounts] = useState<Record<string, number>>({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workflowService.list();
      const list = Array.isArray(data) ? data : [];
      const parsed = list.map(parseWorkflowResponse);
      setWorkflows(parsed);

      // Fetch all executions in a single call
      try {
        const execCounts = await workflowService.listExecutions();
        if (Array.isArray(execCounts)) {
          const countsMap: Record<string, number> = {};
          let total = 0;
          execCounts.forEach((e: any) => {
            countsMap[e.workflow_id] = e.total_executions || 0;
            total += e.total_executions || 0;
          });
          setExecutionCounts(countsMap);
          setTotalExecutions(total);
        } else {
          setExecutionCounts({});
          setTotalExecutions(0);
        }
      } catch {
        setExecutionCounts({});
        setTotalExecutions(0);
      }
    } catch (err: any) {
      console.error('Erro ao buscar workflows:', err);
      toast.error(`Erro ao carregar workflows: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreate = () => {
    setEditingWorkflow(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setIsEditorOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await workflowService.delete(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast.success('Workflow excluído');
    } catch (err: any) {
      toast.error(`Erro ao excluir: ${err.message}`);
    }
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
    // Add locally, user can then publish via JSON dialog
    setWorkflows((prev) => [...prev, newWf]);
    toast.success('Workflow duplicado (salve para persistir)');
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
    navigate(`/automations/execute/${id}`);
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

  const handleBackFromEditor = () => {
    setIsEditorOpen(false);
    fetchWorkflows(); // Refresh list after editing
  };

  if (isEditorOpen) {
    return (
      <div className="space-y-4">
        <ReactFlowProvider>
          <FlowEditor
            workflow={editingWorkflow}
            onBack={handleBackFromEditor}
            onSave={handleSave}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="p-2.5 rounded-xl bg-primary/10">
          <WorkflowIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Automações</h2>
          <p className="text-muted-foreground text-sm">Gerencie seus workflows e automações</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AutomationsTable
          automations={workflows}
          totalExecutions={totalExecutions}
          executionCounts={executionCounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onToggleStatus={handleToggleStatus}
          onRun={handleRun}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
