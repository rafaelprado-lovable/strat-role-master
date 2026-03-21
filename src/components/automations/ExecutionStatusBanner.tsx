import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, AlertTriangle, Square, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { workflowService } from '@/services/workflowService';
import { useNavigate } from 'react-router-dom';

type ExecState = 'running' | 'finished' | 'success' | 'error' | 'stopped';

const POLL_MS = 5000;

const stateConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  running: { label: 'Em execução', color: 'bg-primary/15 text-primary border-primary/30', icon: <RefreshCw className="h-3 w-3 animate-spin" /> },
  finished: { label: 'Concluído', color: 'bg-chart-2/15 text-chart-2 border-chart-2/30', icon: <Zap className="h-3 w-3" /> },
  success: { label: 'Sucesso', color: 'bg-chart-2/15 text-chart-2 border-chart-2/30', icon: <Zap className="h-3 w-3" /> },
  error: { label: 'Erro', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: <AlertTriangle className="h-3 w-3" /> },
  stopped: { label: 'Parado', color: 'bg-muted text-muted-foreground border-border', icon: <Square className="h-3 w-3" /> },
};

interface RunningWorkflow {
  execution_id: string;
  workflow_id: string;
  state: string;
  created_at: string;
  executed_nodes: number;
  total_nodes: number;
}

// ── Shared context to avoid N+1 polling ──

interface RunningContextValue {
  runningMap: Record<string, RunningWorkflow>;
  ready: boolean;
}

const RunningContext = createContext<RunningContextValue>({ runningMap: {}, ready: false });

export function RunningExecutionsProvider({ children }: { children: React.ReactNode }) {
  const [runningMap, setRunningMap] = useState<Record<string, RunningWorkflow>>({});
  const [ready, setReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRunning = useCallback(async () => {
    try {
      const data = await workflowService.listRunning();
      const map: Record<string, RunningWorkflow> = {};
      if (data?.workflows) {
        data.workflows.forEach((w) => {
          map[w.workflow_id] = w;
        });
      }
      setRunningMap(map);
    } catch {
      setRunningMap({});
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    fetchRunning();
    pollRef.current = setInterval(fetchRunning, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchRunning]);

  return (
    <RunningContext.Provider value={{ runningMap, ready }}>
      {children}
    </RunningContext.Provider>
  );
}

// ── Badge for workflow cards ──

export function ExecutionStatusBadge({ workflowId }: { workflowId: string }) {
  const { runningMap, ready } = useContext(RunningContext);
  const navigate = useNavigate();

  if (!ready) return null;

  const running = runningMap[workflowId];

  if (!running) {
    return (
      <Badge variant="outline" className="text-[10px] px-2 py-0.5 gap-1 text-muted-foreground border-border/50">
        <Square className="h-3 w-3" />
        <span>Parado</span>
      </Badge>
    );
  }

  const cfg = stateConfig[running.state] || stateConfig.running;

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
        {running.total_nodes > 0 && running.state === 'running' && (
          <span className="font-mono ml-0.5">{running.executed_nodes}/{running.total_nodes}</span>
        )}
      </Badge>
    </motion.div>
  );
}

// ── Full banner for FlowEditor ──

export function ExecutionStatusBar({ workflowId }: { workflowId: string }) {
  const { runningMap } = useContext(RunningContext);
  const navigate = useNavigate();

  const running = runningMap[workflowId];
  if (!running) return null;

  const cfg = stateConfig[running.state] || stateConfig.running;

  const elapsedText = (() => {
    if (!running.created_at) return null;
    const diff = Math.max(0, Date.now() - new Date(running.created_at).getTime());
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
      {running.total_nodes > 0 && (
        <>
          <div className="h-3 w-px bg-current opacity-20" />
          <div className="flex items-center gap-1.5 flex-1 max-w-[160px]">
            <div className="h-1.5 flex-1 bg-current/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-current rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(running.executed_nodes / running.total_nodes) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[11px] font-mono opacity-80">{running.executed_nodes}/{running.total_nodes}</span>
          </div>
        </>
      )}
      <span className="text-[10px] font-mono opacity-50 ml-auto">{running.execution_id}</span>
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
