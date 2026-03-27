import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Play, Square, RotateCcw, Download, Zap,
  AlertTriangle, RefreshCw,
} from 'lucide-react';
import { ExecutionCanvas, type SelectedEdgeInfo } from '@/components/execution/ExecutionCanvas';
import { ExecutionPanel } from '@/components/execution/ExecutionPanel';
import { type ExecutionDTO, type ExecutionState, type TaskState } from '@/types/execution';
import { workflowService } from '@/services/workflowService';
import { parseWorkflowResponse } from '@/services/workflowParser';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES: ExecutionState[] = ['finished', 'success', 'error', 'stopped'];

/** Mapeia a resposta do GET /v1/execution para ExecutionDTO */
function mapApiResponseToDTO(raw: any, workflowDef: any): ExecutionDTO {
  const ctrl = raw.execution_controller ?? {};
  const workflowId = ctrl.workflow_id ?? workflowDef?.id ?? '';

  // task_states: o backend retorna { nodeId: 'running' | 'finished' | ... }
  const task_states: Record<string, TaskState> = ctrl.task_states ?? {};

  // task_outputs: o backend retorna o output diretamente (ex: { incidents: [] })
  // mas o frontend espera o formato TaskOutput { output: {...}, error?, duration_ms? }
  const rawOutputs: Record<string, any> = ctrl.task_outputs ?? {};
  const task_outputs: Record<string, any> = {};
  for (const [nodeId, val] of Object.entries(rawOutputs)) {
    if (val && typeof val === 'object' && ('output' in val || 'error' in val || 'duration_ms' in val)) {
      // Already in TaskOutput format
      task_outputs[nodeId] = val;
    } else {
      // Raw output from backend — wrap it
      task_outputs[nodeId] = { output: val };
    }
  }
  const inputs: Record<string, any> = ctrl.inputs ?? {};

  // Reconstruir nodes e edges a partir do workflowDef
  const nodes = workflowDef?.nodes ?? [];
  const edges = workflowDef?.edges ?? [];

  return {
    execution_controller: {
      execution_id: ctrl.execution_id ?? raw._id ?? '',
      state: (ctrl.state ?? 'running') as ExecutionState,
      task_states,
      task_outputs,
      loop_counters: ctrl.loop_counters ?? {},
      loop_not_before: ctrl.loop_not_before ?? {},
      for_each_tracker: ctrl.for_each_tracker ?? {},
      for_each_stream_tracker: ctrl.for_each_stream_tracker ?? {},
    },
    execution_data: {
      id: workflowId,
      name: workflowDef?.name ?? workflowId,
      description: workflowDef?.description,
      status: ctrl.state ?? 'running',
      nodes,
      edges,
      inputs,
    },
    logs: raw.logs ?? [],
    started_at: raw.started_at ?? new Date().toISOString(),
    finished_at: raw.finished_at,
  };
}

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
  const [selectedEdge, setSelectedEdge] = useState<SelectedEdgeInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [workflow, setWorkflow] = useState<any>(null);
  const [loadingWorkflow, setLoadingWorkflow] = useState(true);

  // Try sample workflows first, then fetch from API
  useEffect(() => {
    if (!id) { setLoadingWorkflow(false); return; }
    
    // Check samples first
    const sampleKey = Object.keys(SAMPLE_WORKFLOWS).find(k => k === id || k.includes(id));
    if (sampleKey) {
      setWorkflow(SAMPLE_WORKFLOWS[sampleKey]);
      setLoadingWorkflow(false);
      return;
    }

    // Fetch from API
    workflowService.get(id).then(data => {
      const parsed = parseWorkflowResponse(data);
      // Convert to execution-compatible format
      setWorkflow({
        id: parsed.id,
        name: parsed.name,
        description: parsed.description,
        status: parsed.status,
        nodes: (parsed.nodes || []).map((n: any) => ({
          id: n.id,
          definition_id: n.data?.definition_id || n.definition_id || 'api_call_v1',
          config: { label: n.data?.label || n.data?.config?.label || n.id },
          for_each: n.data?.for_each || n.for_each,
          position: n.position || { x: 0, y: 0 },
        })),
        edges: (parsed.edges || []).map((e: any) => ({
          id: e.id,
          from: e.source || e.from,
          to: e.target || e.to,
          condition: e.data?.condition || e.condition,
          loop: e.data?.loop || e.loop,
          max_iterations: e.data?.max_iterations || e.max_iterations,
          reopen_tasks: e.data?.reopen_tasks || e.reopen_tasks,
        })),
        inputs: parsed.inputs || {},
        schedule: parsed.schedule,
        start_date: parsed.start_date,
      });
    }).catch(err => {
      console.error('Erro ao buscar workflow:', err);
      toast.error('Erro ao carregar workflow');
    }).finally(() => setLoadingWorkflow(false));
  }, [id]);

  // On workflow load, check for active execution
  const [loadingActiveExec, setLoadingActiveExec] = useState(false);
  useEffect(() => {
    if (!workflow || !id) return;
    // Don't fetch if we already have an execution loaded
    if (execution || isRunning) return;

    let cancelled = false;
    setLoadingActiveExec(true);

    (async () => {
      try {
        // First, check the /v1/execution/running endpoint for active executions
        let execId: string | null = null;
        try {
          const runningData = await workflowService.listRunning();
          const runningWf = runningData?.workflows?.find(w => w.workflow_id === workflow.id);
          if (runningWf) {
            execId = runningWf.execution_id;
          }
        } catch {
          console.warn('listRunning failed, falling back to listExecutions');
        }

        // Fallback: check listExecutions if no running found
        if (!execId) {
          try {
            const executions = await workflowService.listExecutions(workflow.id);
            if (cancelled) return;
            if (Array.isArray(executions) && executions.length > 0) {
              const activeExec = executions.find((ex: any) => {
                const ctrl = ex.execution_controller ?? ex;
                const state = ctrl.state ?? ex.state;
                return state && !TERMINAL_STATES.includes(state as ExecutionState);
              });
              const targetExec = activeExec || executions[0];
              if (targetExec) {
                const ctrl = (targetExec as any).execution_controller ?? targetExec;
                execId = ctrl.execution_id ?? (targetExec as any)._id ?? '';
              }
            }
          } catch {
            console.warn('listExecutions also failed');
          }
        }

        if (cancelled || !execId) {
          setLoadingActiveExec(false);
          return;
        }

        // Fetch full execution details
        const raw = await workflowService.getExecution(execId);
        if (cancelled || !raw) {
          setLoadingActiveExec(false);
          return;
        }

        const dto = mapApiResponseToDTO(raw, workflow);
        executionIdRef.current = execId;
        setExecution(dto);

        // If still running, start polling
        if (!TERMINAL_STATES.includes(dto.execution_controller.state)) {
          setIsRunning(true);
          pollingRef.current = setInterval(fetchExecutionStatus, POLL_INTERVAL_MS);
        }
      } catch (err) {
        console.warn('Erro ao buscar execução ativa:', err);
      } finally {
        if (!cancelled) setLoadingActiveExec(false);
      }
    })();

    return () => { cancelled = true; };
  }, [workflow, id]); // intentionally limited deps


  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const executionIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchExecutionStatus = useCallback(async () => {
    if (!workflow || !executionIdRef.current) return;
    try {
      const raw = await workflowService.getExecution(executionIdRef.current) as any;
      console.log('[Polling] getExecution response:', raw);

      if (!raw) return;

      const dto = mapApiResponseToDTO(raw, workflow);
      setExecution(dto);

      if (TERMINAL_STATES.includes(dto.execution_controller.state)) {
        stopPolling();
        setIsRunning(false);
        if (dto.execution_controller.state === 'finished') {
          toast.success('Execução finalizada com sucesso');
        } else if (dto.execution_controller.state === 'error') {
          toast.error('Execução finalizada com erro');
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar status da execução:', err);
    }
  }, [workflow, stopPolling]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleExecute = useCallback(async () => {
    if (!workflow) return;

    setLoading(true);
    stopPolling();

    try {
      // Lock check: verify no active execution for this workflow or correlated workflows
      let lockBlocked = false;
      try {
        const executions = await workflowService.listExecutions(workflow.id);
        if (Array.isArray(executions) && executions.length > 0) {
          const idsToCheck = new Set([workflow.id]);
          if (workflow.correlated_workflow_ids && workflow.correlated_workflow_ids.length > 0) {
            workflow.correlated_workflow_ids.forEach((cid: string) => idsToCheck.add(cid));
          }

          const activeExec = executions.find((ex: any) => {
            const ctrl = ex.execution_controller ?? ex;
            const wfId = ctrl.workflow_id ?? ex.workflow_id;
            const state = ctrl.state ?? ex.state;
            return wfId && idsToCheck.has(wfId) && state && !TERMINAL_STATES.includes(state as ExecutionState);
          });

          if (activeExec) {
            const ctrl = (activeExec as any).execution_controller ?? activeExec;
            const execId = ctrl.execution_id ?? (activeExec as any)._id ?? '';
            const wfId = ctrl.workflow_id ?? (activeExec as any).workflow_id ?? '';
            const isCorrelated = wfId !== workflow.id;
            toast.error(
              isCorrelated
                ? `Workflow correlacionado (${wfId}) possui execução em andamento (${execId}). Aguarde a finalização.`
                : `Workflow já possui uma execução em andamento (${execId}). Aguarde a finalização.`
            );
            lockBlocked = true;
          }
        }
      } catch (lockErr) {
        console.warn('Lock check failed, proceeding with execution:', lockErr);
      }

      if (lockBlocked) {
        setLoading(false);
        return;
      }

      setIsRunning(true);
      const result = await workflowService.createExecution(workflow.id);
      toast.success('Execução iniciada');
      console.log('Execution create response:', result);
      const r = result as any;
      const execId = r?.execution_controller?.execution_id ?? r?.execution_id ?? r?.id ?? r?._id ?? null;
      executionIdRef.current = execId;
      console.log('Captured execution_id:', execId);

      // Exibir estado inicial com dados da resposta
      const initialDTO: ExecutionDTO = {
        execution_controller: {
          execution_id: execId ?? `exec-${Date.now()}`,
          state: 'running',
          task_states: {},
          task_outputs: {},
          loop_counters: {},
          loop_not_before: {},
          for_each_tracker: {},
          for_each_stream_tracker: {},
        },
        execution_data: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          status: 'running',
          nodes: workflow.nodes,
          edges: workflow.edges,
          inputs: workflow.inputs ?? {},
        },
        logs: [{ timestamp: new Date().toISOString(), type: 'execution_start', message: 'Execução iniciada' }],
        started_at: new Date().toISOString(),
      };
      setExecution(initialDTO);
      setLoading(false);

      // Buscar imediatamente e depois a cada POLL_INTERVAL_MS
      await fetchExecutionStatus();
      pollingRef.current = setInterval(fetchExecutionStatus, POLL_INTERVAL_MS);
    } catch (err: any) {
      console.error('Erro ao criar execução:', err);
      toast.error(`Erro ao criar execução: ${err.message}`);
      setLoading(false);
      setIsRunning(false);
    }
  }, [workflow, stopPolling, fetchExecutionStatus]);

  const handleStop = useCallback(() => {
    stopPolling();
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
  }, [stopPolling]);

  const handleRerun = useCallback(() => {
    stopPolling();
    setExecution(null);
    setSelectedNodeId(null);
    executionIdRef.current = null;
    setTimeout(() => handleExecute(), 100);
  }, [handleExecute, stopPolling]);

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

  if (loadingWorkflow) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

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

  // Elapsed time computation
  const elapsedText = (() => {
    if (!execution) return null;
    const start = new Date(execution.started_at).getTime();
    const end = execution.finished_at ? new Date(execution.finished_at).getTime() : Date.now();
    const diff = Math.max(0, end - start);
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}m ${remSecs}s`;
  })();

  const execState = execution?.execution_controller.state;
  const stateConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    running: { label: 'Em execução', color: 'bg-primary/15 text-primary border-primary/30', icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" /> },
    finished: { label: 'Concluído', color: 'bg-chart-2/15 text-chart-2 border-chart-2/30', icon: <Zap className="h-3.5 w-3.5" /> },
    success: { label: 'Sucesso', color: 'bg-chart-2/15 text-chart-2 border-chart-2/30', icon: <Zap className="h-3.5 w-3.5" /> },
    error: { label: 'Erro', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    stopped: { label: 'Parado', color: 'bg-muted text-muted-foreground border-border', icon: <Square className="h-3.5 w-3.5" /> },
  };

  // Progress: count finished/error/skipped nodes vs total
  const nodeProgress = (() => {
    if (!execution) return null;
    const totalNodes = execution.execution_data.nodes?.length || 0;
    if (totalNodes === 0) return null;
    const states = execution.execution_controller.task_states;
    let done = 0;
    for (const st of Object.values(states)) {
      if (st === 'finished' || st === 'error') done++;
    }
    // Count skipped from outputs
    const outputs = execution.execution_controller.task_outputs;
    for (const [nid, out] of Object.entries(outputs)) {
      if ((out as any)?.output?.skipped && states[nid] !== 'finished' && states[nid] !== 'error') done++;
    }
    return { done: Math.min(done, totalNodes), total: totalNodes };
  })();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3 md:gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/automations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base md:text-lg font-bold text-foreground truncate">{workflow.name}</h1>
              <Badge variant="outline" className="text-[10px] font-mono hidden sm:inline-flex">{workflow.id}</Badge>
              <Badge className={`text-[10px] ${workflow.status === 'active' ? 'bg-chart-2/20 text-chart-2' : 'bg-muted text-muted-foreground'}`}>
                {workflow.status}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{workflow.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!isRunning && !loadingActiveExec ? (
            <Button size="sm" onClick={handleExecute} className="gap-1.5" disabled={loadingActiveExec}>
              <Play className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Executar agora</span><span className="sm:hidden">Executar</span>
            </Button>
          ) : isRunning ? (
            <Button size="sm" variant="destructive" onClick={handleStop} className="gap-1.5">
              <Square className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Parar execução</span><span className="sm:hidden">Parar</span>
            </Button>
          ) : null}
          {execution && (
            <>
              <Button size="sm" variant="outline" onClick={fetchExecutionStatus} className="gap-1.5" disabled={!executionIdRef.current}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleRerun} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden md:inline">Reexecutar</span>
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportExecution} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> <span className="hidden md:inline">Exportar</span>
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Execution status bar */}
      {execution && execState && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-2.5 rounded-lg border ${stateConfig[execState]?.color || 'bg-muted text-muted-foreground border-border'}`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs md:text-sm">
            {stateConfig[execState]?.icon}
            <span>{stateConfig[execState]?.label || execState}</span>
          </div>
          <div className="h-4 w-px bg-current opacity-20 hidden sm:block" />
          {elapsedText && (
            <span className="text-[10px] md:text-xs font-mono opacity-80">⏱ {elapsedText}</span>
          )}
          {nodeProgress && (
            <>
              <div className="h-4 w-px bg-current opacity-20 hidden sm:block" />
              <div className="flex items-center gap-2 flex-1 min-w-[100px] max-w-[200px]">
                <div className="h-1.5 flex-1 bg-current/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-current rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(nodeProgress.done / nodeProgress.total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px] md:text-xs font-mono opacity-80">{nodeProgress.done}/{nodeProgress.total}</span>
              </div>
            </>
          )}
          {execution.execution_controller.execution_id && (
            <span className="text-[9px] md:text-[10px] font-mono opacity-60 ml-auto hidden md:block truncate max-w-[180px]">{execution.execution_controller.execution_id}</span>
          )}
        </motion.div>
      )}


      {/* Loading state */}
      {(loading || loadingActiveExec) && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <Skeleton className="rounded-xl min-h-[300px]" />
          <div className="space-y-3">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!execution && !loading && !loadingActiveExec && (
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
          className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 overflow-hidden min-h-0"
        >
          <ReactFlowProvider>
            <div className="min-h-[350px] lg:min-h-0">
              <ExecutionCanvas
                workflow={execution.execution_data}
                controller={execution.execution_controller}
                selectedNodeId={selectedNodeId}
                onNodeSelect={(id) => { setSelectedEdge(null); setSelectedNodeId(id); }}
                selectedEdge={selectedEdge}
                onEdgeSelect={setSelectedEdge}
              />
            </div>
          </ReactFlowProvider>
          <div className="min-h-[300px] lg:min-h-0">
            <ExecutionPanel
              execution={execution}
              selectedNodeId={selectedNodeId}
              selectedEdge={selectedEdge}
              onRerunNode={handleRerunNode}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
