import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, AlertTriangle, Square, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { workflowService } from '@/services/workflowService';
import { useNavigate } from 'react-router-dom';

type ExecState = 'running' | 'finished' | 'success' | 'error' | 'stopped';

const TERMINAL_STATES: ExecState[] = ['finished', 'success', 'error', 'stopped'];
const POLL_MS = 5000;

const stateConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  running: { label: 'Em execução', color: 'bg-primary/15 text-primary border-primary/30', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  finished: { label: 'Concluído', color: 'bg-chart-2/15 text-chart-2 border-chart-2/30', icon: <Zap className="h-3 w-3" /> },
  success: { label: 'Sucesso', color: 'bg-chart-2/15 text-chart-2 border-chart-2/30', icon: <Zap className="h-3 w-3" /> },
  error: { label: 'Erro', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
  stopped: { label: 'Parado', color: 'bg-muted text-muted-foreground border-border', icon: <Square className="h-3 w-3" /> },
};

interface ActiveExecInfo {
  executionId: string;
  state: ExecState;
  taskStates: Record<string, string>;
  totalNodes: number;
  startedAt?: string;
}

/** Small inline badge for workflow cards */
export function ExecutionStatusBadge({ workflowId }: { workflowId: string }) {
  const [exec, setExec] = useState<ActiveExecInfo | null>(null);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const executions = await workflowService.listExecutions(workflowId);
        if (cancelled) return;
        if (!Array.isArray(executions) || executions.length === 0) {
          setExec(null);
          setChecked(true);
          return;
        }

        const active = executions.find((ex: any) => {
          const ctrl = ex.execution_controller ?? ex;
          const state = ctrl.state ?? ex.state;
          return state && !TERMINAL_STATES.includes(state as ExecState);
        });

        if (!active) {
          setExec(null);
          setChecked(true);
          return;
        }

        const ctrl = (active as any).execution_controller ?? active;
        const taskStates = ctrl.task_states ?? {};
        const execId = ctrl.execution_id ?? (active as any)._id ?? '';

        setExec({
          executionId: execId,
          state: (ctrl.state ?? 'running') as ExecState,
          taskStates,
          totalNodes: Object.keys(taskStates).length,
          startedAt: (active as any).started_at,
        });
        setChecked(true);
      } catch {
        setChecked(true);
      }
    };

    check();
    pollRef.current = setInterval(check, POLL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [workflowId]);

  if (!checked) return null;

  if (!exec) {
    return (
      <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1 text-muted-foreground border-border/50">
        <Square className="h-3 w-3" />
        <span>Parado</span>
      </Badge>
    );
  }

  const cfg = stateConfig[exec.state] || stateConfig.running;
  const doneCount = Object.values(exec.taskStates).filter(
    (s) => s === 'finished' || s === 'error'
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/automations/execute/${workflowId}`);
      }}
    >
      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 gap-1 cursor-pointer hover:opacity-80 transition-opacity ${cfg.color}`}>
        {cfg.icon}
        <span>{cfg.label}</span>
        {exec.totalNodes > 0 && exec.state === 'running' && (
          <span className="font-mono ml-0.5">{doneCount}/{exec.totalNodes}</span>
        )}
      </Badge>
    </motion.div>
  );
}

/** Full banner for the FlowEditor toolbar area */
export function ExecutionStatusBar({ workflowId }: { workflowId: string }) {
  const [exec, setExec] = useState<ActiveExecInfo | null>(null);
  const navigate = useNavigate();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const executions = await workflowService.listExecutions(workflowId);
        if (cancelled || !Array.isArray(executions) || executions.length === 0) {
          setExec(null);
          return;
        }

        const active = executions.find((ex: any) => {
          const ctrl = ex.execution_controller ?? ex;
          const state = ctrl.state ?? ex.state;
          return state && !TERMINAL_STATES.includes(state as ExecState);
        });

        if (!active) {
          setExec(null);
          return;
        }

        const ctrl = (active as any).execution_controller ?? active;
        const taskStates = ctrl.task_states ?? {};
        const execId = ctrl.execution_id ?? (active as any)._id ?? '';

        setExec({
          executionId: execId,
          state: (ctrl.state ?? 'running') as ExecState,
          taskStates,
          totalNodes: Object.keys(taskStates).length,
          startedAt: (active as any).started_at,
        });
      } catch {
        setExec(null);
      }
    };

    check();
    pollRef.current = setInterval(check, POLL_MS);

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [workflowId]);

  if (!exec) return null;

  const cfg = stateConfig[exec.state] || stateConfig.running;
  const doneCount = Object.values(exec.taskStates).filter(
    (s) => s === 'finished' || s === 'error'
  ).length;

  const elapsedText = (() => {
    if (!exec.startedAt) return null;
    const diff = Math.max(0, Date.now() - new Date(exec.startedAt).getTime());
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ${secs % 60}s`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${cfg.color}`}
    >
      <div className="flex items-center gap-1.5 font-semibold text-xs">
        {cfg.icon}
        <span>{cfg.label}</span>
      </div>
      <div className="h-3 w-px bg-current opacity-20" />
      {elapsedText && (
        <span className="text-[11px] font-mono opacity-80">⏱ {elapsedText}</span>
      )}
      {exec.totalNodes > 0 && (
        <>
          <div className="h-3 w-px bg-current opacity-20" />
          <div className="flex items-center gap-1.5 flex-1 max-w-[160px]">
            <div className="h-1.5 flex-1 bg-current/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-current rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(doneCount / exec.totalNodes) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[11px] font-mono opacity-80">{doneCount}/{exec.totalNodes}</span>
          </div>
        </>
      )}
      <span className="text-[10px] font-mono opacity-50 ml-auto">{exec.executionId}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[11px] gap-1"
        onClick={() => navigate(`/automations/execute/${workflowId}`)}
      >
        <Eye className="h-3 w-3" /> Monitorar
      </Button>
    </motion.div>
  );
}
