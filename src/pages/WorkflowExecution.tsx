import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Play, Square, RotateCcw, Download, Zap,
  AlertTriangle,
} from 'lucide-react';
import { ExecutionCanvas } from '@/components/execution/ExecutionCanvas';
import { ExecutionPanel } from '@/components/execution/ExecutionPanel';
import { generateMockExecution, type ExecutionDTO, type ExecutionState } from '@/types/execution';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Sample workflows for demo
const SAMPLE_WORKFLOWS: Record<string, any> = {
  "wf-simple-linear": {
    id: "wf-simple-linear", name: "Simple Linear", status: "active", schedule: null,
    nodes: [
      { id: "node-a", definition_id: "api_call_v1", config: { label: "API Call" }, position: { x: 100, y: 150 } },
      { id: "node-b", definition_id: "send_whatsapp_message_v1", config: { label: "WhatsApp" }, position: { x: 420, y: 150 } },
    ],
    edges: [{ from: "node-a", to: "node-b", id: "edge-a-b" }],
    inputs: { "node-a": { url: "http://10.151.1.54:8000/health", method: "GET" }, "node-b": { phone: "5514996142542", message: "status={{node-a.output.status}}" } },
    start_date: null,
  },
  "wf-conditional-branch": {
    id: "wf-conditional-branch", name: "Conditional Branch", status: "active", schedule: null,
    nodes: [
      { id: "node-api", definition_id: "api_call_v1", config: { label: "Check Status" }, position: { x: 100, y: 180 } },
      { id: "node-ok", definition_id: "send_whatsapp_message_v1", config: { label: "OK Msg" }, position: { x: 450, y: 80 } },
      { id: "node-err", definition_id: "send_whatsapp_message_v1", config: { label: "Error Msg" }, position: { x: 450, y: 280 } },
    ],
    edges: [
      { from: "node-api", to: "node-ok", id: "edge-api-ok", condition: "node-api.output.status == 200" },
      { from: "node-api", to: "node-err", id: "edge-api-err", condition: "node-api.output.status == 500" },
    ],
    inputs: { "node-api": { url: "http://10.151.1.54:8000/job/status", method: "GET" }, "node-ok": { phone: "5514996142542", message: "OK {{node-api.output.status}}" }, "node-err": { phone: "5514996142542", message: "ERRO {{node-api.output.status}}" } },
    start_date: null,
  },
  "wf-while-delay": {
    id: "wf-while-delay", name: "While Loop With Delay", status: "active", schedule: null,
    nodes: [
      { id: "node-status", definition_id: "api_call_v1", config: { label: "Check Status" }, position: { x: 200, y: 150 } },
      { id: "node-final", definition_id: "send_whatsapp_message_v1", config: { label: "Final Msg" }, position: { x: 550, y: 150 } },
    ],
    edges: [
      { from: "node-status", to: "node-status", id: "loop-status", loop: true, max_iterations: 5, condition: "node-status.output.response.status == 'running'" },
      { from: "node-status", to: "node-final", id: "edge-status-final" },
    ],
    inputs: { "node-status": { url: "http://10.151.0.61:8090/machines/restart", method: "GET", loop_delay_seconds: 10 }, "node-final": { phone: "5514996142542", message: "final={{node-status.output.response.status}}" } },
    start_date: null,
  },
  "wf-loop-block": {
    id: "wf-loop-block", name: "Loop Block Reopen Tasks", status: "active", schedule: null,
    nodes: [
      { id: "node-status", definition_id: "api_call_v1", config: { label: "Status API" }, position: { x: 100, y: 150 } },
      { id: "node-progress-msg", definition_id: "send_whatsapp_message_v1", config: { label: "Progress Msg" }, position: { x: 450, y: 80 } },
      { id: "node-break-msg", definition_id: "send_whatsapp_message_v1", config: { label: "Break Msg" }, position: { x: 450, y: 260 } },
    ],
    edges: [
      { from: "node-status", to: "node-status", id: "loop-status", loop: true, max_iterations: 5, condition: "node-status.output.response.status == 'processando'", reopen_tasks: ["node-status", "node-progress-msg"] },
      { from: "node-status", to: "node-progress-msg", id: "edge-status-progress" },
      { from: "node-status", to: "node-break-msg", id: "edge-status-break" },
    ],
    inputs: { "node-status": { url: "http://10.151.1.54:8000/agentActions/v1/status?id=job_123", method: "GET", loop_delay_seconds: 7 }, "node-progress-msg": { phone: "5514996142542", message: "andamento={{node-status.output.response.status}}" }, "node-break-msg": { phone: "5514996142542", message: "fim={{node-status.output.response.status}}" } },
    start_date: null,
  },
  "wf-for-each-basic": {
    id: "wf-for-each-basic", name: "For Each Basic", status: "active", schedule: null,
    nodes: [
      { id: "node-list", definition_id: "api_call_v1", config: { label: "List API" }, position: { x: 100, y: 150 } },
      { id: "node-msg-each", definition_id: "send_whatsapp_message_v1", config: { label: "Msg Each" }, for_each: { items: "{{node-list.output.response.data.pendent_machines}}", item_var: "item", index_var: "index" }, position: { x: 450, y: 150 } },
    ],
    edges: [{ from: "node-list", to: "node-msg-each", id: "edge-list-msg" }],
    inputs: { "node-list": { url: "http://10.151.0.61:8090/machines/restart", method: "GET" }, "node-msg-each": { phone: "5514996142542", message: "maquina {{index}}={{item}}" } },
    start_date: null,
  },
  "wf-for-each-stream": {
    id: "wf-for-each-stream", name: "For Each Stream Fanout", status: "active", schedule: null,
    nodes: [
      { id: "node-collect", definition_id: "api_call_v1", config: { label: "Collect" }, position: { x: 50, y: 150 } },
      { id: "node-restart", definition_id: "api_call_v1", config: { label: "Restart" }, for_each: { items: "{{node-collect.output.response.data.machines}}", item_var: "item", index_var: "index" }, position: { x: 350, y: 80 } },
      { id: "node-status-each", definition_id: "api_call_v1", config: { label: "Status Each" }, for_each: { stream: true, item_var: "item", index_var: "index" }, position: { x: 650, y: 80 } },
      { id: "node-msg-each", definition_id: "send_whatsapp_message_v1", config: { label: "Msg Each" }, for_each: { items: "{{node-status-each.output.items}}", item_var: "item", index_var: "index" }, position: { x: 950, y: 80 } },
    ],
    edges: [
      { from: "node-collect", to: "node-restart", id: "edge-collect-restart" },
      { from: "node-restart", to: "node-status-each", id: "edge-restart-status-stream" },
      { from: "node-status-each", to: "node-msg-each", id: "edge-status-msg" },
    ],
    inputs: { "node-collect": { url: "http://10.151.1.54:8000/job/status", method: "GET" }, "node-restart": { url: "http://10.151.1.54:8000/agentActions/v1/exec", method: "POST", body: { server: "{{item}}", user: "nmws_app", command: "/nmws_app/cmd/valida_swap.sh" } }, "node-status-each": { url: "http://10.151.1.54:8000/agentActions/v1/status?id={{item.response.job_id}}", method: "GET" }, "node-msg-each": { phone: "5514996142542", message: "job={{item.response.job_id}} status={{item.response.status}}" } },
    start_date: null,
  },
  "wf-delay-native": {
    id: "wf-delay-native", name: "Delay Native Task", status: "active", schedule: null,
    nodes: [
      { id: "node-start", definition_id: "send_whatsapp_message_v1", config: { label: "Start Msg" }, position: { x: 100, y: 150 } },
      { id: "node-delay", definition_id: "delay_v1", config: { label: "Delay 5s" }, position: { x: 400, y: 150 } },
      { id: "node-end", definition_id: "send_whatsapp_message_v1", config: { label: "End Msg" }, position: { x: 700, y: 150 } },
    ],
    edges: [
      { from: "node-start", to: "node-delay", id: "edge-start-delay" },
      { from: "node-delay", to: "node-end", id: "edge-delay-end" },
    ],
    inputs: { "node-start": { phone: "5514996142542", message: "inicio" }, "node-delay": { seconds: 5 }, "node-end": { phone: "5514996142542", message: "fim apos delay" } },
    start_date: null,
  },
};

export default function WorkflowExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [execution, setExecution] = useState<ExecutionDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [payloadJson, setPayloadJson] = useState('{}');
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const workflow = useMemo(() => {
    if (id && SAMPLE_WORKFLOWS[id]) return SAMPLE_WORKFLOWS[id];
    // Try to find by partial match
    const key = Object.keys(SAMPLE_WORKFLOWS).find(k => k.includes(id || ''));
    return key ? SAMPLE_WORKFLOWS[key] : null;
  }, [id]);

  const validatePayload = useCallback((json: string) => {
    try {
      JSON.parse(json);
      setPayloadError(null);
      return true;
    } catch (e: any) {
      setPayloadError(e.message);
      return false;
    }
  }, []);

  const handleExecute = useCallback(() => {
    if (!workflow) return;
    if (!validatePayload(payloadJson)) {
      toast.error('JSON do payload é inválido');
      return;
    }

    setLoading(true);
    setIsRunning(true);

    // Simulate execution start
    setTimeout(() => {
      const exec = generateMockExecution(workflow);
      setExecution(exec);
      setLoading(false);
      toast.success('Execução iniciada');

      // Simulate completion after a few seconds
      setTimeout(() => {
        setExecution(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          updated.execution_controller = {
            ...updated.execution_controller,
            state: 'finished' as ExecutionState,
            task_states: Object.fromEntries(
              Object.entries(updated.execution_controller.task_states).map(([k]) => [k, 'finished' as const])
            ),
          };
          updated.finished_at = new Date().toISOString();
          updated.logs = [
            ...updated.logs,
            { timestamp: new Date().toISOString(), type: 'execution_finish' as const, message: 'Execução finalizada com sucesso' },
          ];
          return updated;
        });
        setIsRunning(false);
        toast.success('Execução finalizada');
      }, 5000);
    }, 1500);
  }, [workflow, payloadJson, validatePayload]);

  const handleStop = useCallback(() => {
    setIsRunning(false);
    setExecution(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        execution_controller: { ...prev.execution_controller, state: 'stopped' as ExecutionState },
        finished_at: new Date().toISOString(),
        logs: [...prev.logs, { timestamp: new Date().toISOString(), type: 'execution_error' as const, message: 'Execução parada pelo usuário' }],
      };
    });
    toast.info('Execução parada');
  }, []);

  const handleRerun = useCallback(() => {
    setExecution(null);
    setSelectedNodeId(null);
    setTimeout(() => handleExecute(), 100);
  }, [handleExecute]);

  const handleRerunNode = useCallback((nodeId: string) => {
    toast.info(`Reexecutando nó "${nodeId}"...`);
    // Simulate node re-execution
    setExecution(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        execution_controller: {
          ...prev.execution_controller,
          task_states: { ...prev.execution_controller.task_states, [nodeId]: 'running' as const },
        },
        logs: [...prev.logs, { timestamp: new Date().toISOString(), type: 'node_start' as const, node_id: nodeId, message: `Reexecução do nó "${nodeId}"` }],
      };
    });
    setTimeout(() => {
      setExecution(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          execution_controller: {
            ...prev.execution_controller,
            task_states: { ...prev.execution_controller.task_states, [nodeId]: 'finished' as const },
          },
          logs: [...prev.logs, { timestamp: new Date().toISOString(), type: 'node_finish' as const, node_id: nodeId, message: `Nó "${nodeId}" reexecutado com sucesso` }],
        };
      });
    }, 2000);
  }, []);

  const handleExportExecution = useCallback(() => {
    if (!execution) return;
    const blob = new Blob([JSON.stringify(execution, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${execution.execution_controller.execution_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Execution exportada');
  }, [execution]);

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Workflow não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/automations')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 pb-3 border-b border-border"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/automations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground">{workflow.name}</h1>
              <Badge variant="outline" className="text-[10px] font-mono">{workflow.id}</Badge>
              <Badge className={`text-[10px] ${workflow.status === 'active' ? 'bg-chart-2/20 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                {workflow.status}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{workflow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button size="sm" onClick={handleExecute} className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> Executar agora
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleStop} className="gap-1.5">
              <Square className="h-3.5 w-3.5" /> Parar execução
            </Button>
          )}
          {execution && (
            <>
              <Button size="sm" variant="outline" onClick={handleRerun} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Reexecutar
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportExecution} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Exportar
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Payload input */}
      {!execution && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Payload Inicial (opcional)</span>
          </div>
          <Textarea
            value={payloadJson}
            onChange={e => { setPayloadJson(e.target.value); validatePayload(e.target.value); }}
            placeholder='{"key": "value"}'
            className="font-mono text-xs h-20 resize-none"
          />
          {payloadError && (
            <p className="text-[11px] text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {payloadError}
            </p>
          )}
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex-1 grid grid-cols-[1fr_380px] gap-4">
          <Skeleton className="rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!execution && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Nenhuma execução ainda</h3>
              <p className="text-sm text-muted-foreground mt-1">Clique em "Executar agora" para iniciar o workflow</p>
            </div>
          </div>
        </div>
      )}

      {/* Main execution view */}
      {execution && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 overflow-hidden"
        >
          <ReactFlowProvider>
            <ExecutionCanvas
              workflow={execution.execution_data}
              controller={execution.execution_controller}
              selectedNodeId={selectedNodeId}
              onNodeSelect={setSelectedNodeId}
            />
          </ReactFlowProvider>
          <ExecutionPanel
            execution={execution}
            selectedNodeId={selectedNodeId}
            onRerunNode={handleRerunNode}
          />
        </motion.div>
      )}
    </div>
  );
}
