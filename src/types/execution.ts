// ==========================================
// Execution DTOs — Runtime state tracking
// ==========================================

export type TaskState = 'waiting_start' | 'running' | 'finished' | 'error';
export type ExecutionState = 'pending' | 'running' | 'finished' | 'success' | 'error' | 'stopped';

export interface TaskOutput {
  output?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  // for_each consolidated
  items?: unknown[];
  count?: number;
}

export interface ForEachItemStatus {
  index: number;
  item: unknown;
  state: TaskState;
  output?: Record<string, unknown>;
  error?: string;
  started_at?: string;
  finished_at?: string;
}

export interface ForEachTracker {
  node_id: string;
  total: number;
  completed: number;
  items: ForEachItemStatus[];
}

export interface ForEachStreamTracker extends ForEachTracker {
  stream: true;
}

export interface ExecutionController {
  execution_id: string;
  state: ExecutionState;
  task_states: Record<string, TaskState>;
  task_outputs: Record<string, TaskOutput>;
  loop_counters: Record<string, number>;       // edgeId → current iteration
  loop_not_before: Record<string, string>;      // nodeId → ISO timestamp
  for_each_tracker: Record<string, ForEachTracker>;
  for_each_stream_tracker: Record<string, ForEachStreamTracker>;
}

export interface ExecutionLogEntry {
  timestamp: string;
  type: 'node_start' | 'node_finish' | 'node_error' | 'loop_iteration' | 'loop_reopen' | 'for_each_item_start' | 'for_each_item_finish' | 'for_each_stream_dispatch' | 'execution_start' | 'execution_finish' | 'execution_error';
  node_id?: string;
  edge_id?: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface ExecutionDTO {
  execution_controller: ExecutionController;
  execution_data: {
    id: string;
    name: string;
    description?: string;
    status: string;
    nodes: { id: string; definition_id: string; config: Record<string, unknown>; for_each?: any; position?: { x: number; y: number } }[];
    edges: { id?: string; from: string; to: string; condition?: string; loop?: boolean; max_iterations?: number; reopen_tasks?: string[] }[];
    inputs: Record<string, Record<string, unknown>>;
  };
  logs: ExecutionLogEntry[];
  started_at: string;
  finished_at?: string;
}

// ==========================================
// Mock execution generator
// ==========================================

export function generateMockExecution(workflow: any): ExecutionDTO {
  const now = new Date();
  const startedAt = new Date(now.getTime() - 45000).toISOString();
  
  const taskStates: Record<string, TaskState> = {};
  const taskOutputs: Record<string, TaskOutput> = {};
  const loopCounters: Record<string, number> = {};
  const loopNotBefore: Record<string, string> = {};
  const forEachTracker: Record<string, ForEachTracker> = {};
  const forEachStreamTracker: Record<string, ForEachStreamTracker> = {};
  const logs: ExecutionLogEntry[] = [];
  
  let logTime = new Date(startedAt);
  const addLog = (entry: Omit<ExecutionLogEntry, 'timestamp'>) => {
    logTime = new Date(logTime.getTime() + Math.random() * 3000 + 500);
    logs.push({ ...entry, timestamp: logTime.toISOString() });
  };

  addLog({ type: 'execution_start', message: `Execução iniciada: ${workflow.name}` });

  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];

  nodes.forEach((node: any, i: number) => {
    const isLast = i === nodes.length - 1;
    const state: TaskState = isLast ? 'running' : 'finished';
    taskStates[node.id] = state;

    addLog({ type: 'node_start', node_id: node.id, message: `Nó "${node.id}" iniciado` });

    if (state === 'finished') {
      const mockOutput: Record<string, unknown> = {};
      if (node.definition_id === 'api_call_v1') {
        mockOutput.status = 200;
        mockOutput.response = { status: 'ok', data: { machines: ['srv-01', 'srv-02', 'srv-03'], pendent_machines: ['srv-04', 'srv-05'] } };
      } else if (node.definition_id === 'ssh_execution') {
        mockOutput.stdout = '10:35:22 up 42 days, 3:15, 2 users, load average: 0.15, 0.10, 0.05';
        mockOutput.exit_code = 0;
      } else if (node.definition_id === 'send_whatsapp_message_v1') {
        mockOutput.message_id = `msg-${Math.random().toString(36).slice(2, 8)}`;
        mockOutput.delivered = true;
      } else if (node.definition_id === 'delay_v1') {
        mockOutput.waited_seconds = 5;
      }
      
      taskOutputs[node.id] = {
        output: mockOutput,
        started_at: new Date(logTime.getTime() - 2000).toISOString(),
        finished_at: logTime.toISOString(),
        duration_ms: 1500 + Math.floor(Math.random() * 3000),
      };

      addLog({ type: 'node_finish', node_id: node.id, message: `Nó "${node.id}" finalizado`, data: mockOutput });
    } else {
      taskOutputs[node.id] = {
        started_at: logTime.toISOString(),
      };
    }

    // Handle for_each
    if (node.for_each) {
      const mockItems = ['srv-01', 'srv-02', 'srv-03', 'srv-04', 'srv-05'];
      const isStream = !!node.for_each.stream;
      const completed = state === 'finished' ? mockItems.length : Math.floor(mockItems.length * 0.6);
      
      const tracker: ForEachTracker = {
        node_id: node.id,
        total: mockItems.length,
        completed,
        items: mockItems.map((item, idx) => {
          const itemState: TaskState = idx < completed ? 'finished' : (idx === completed ? 'running' : 'waiting_start');
          addLog({
            type: idx < completed ? 'for_each_item_finish' : 'for_each_item_start',
            node_id: node.id,
            message: `for_each "${node.id}" item[${idx}]="${item}" ${itemState}`,
            data: { item, index: idx },
          });
          return {
            index: idx,
            item,
            state: itemState,
            output: itemState === 'finished' ? { processed: true, result: `ok-${item}` } : undefined,
            started_at: new Date(logTime.getTime() - 1000).toISOString(),
            finished_at: itemState === 'finished' ? logTime.toISOString() : undefined,
          };
        }),
      };

      if (isStream) {
        forEachStreamTracker[node.id] = { ...tracker, stream: true };
        addLog({ type: 'for_each_stream_dispatch', node_id: node.id, message: `Stream fan-out "${node.id}": ${completed}/${mockItems.length}` });
      } else {
        forEachTracker[node.id] = tracker;
      }

      if (state === 'finished') {
        taskOutputs[node.id].items = mockItems.map(item => ({ processed: true, result: `ok-${item}` }));
        taskOutputs[node.id].count = mockItems.length;
      }
    }
  });

  // Handle loop edges
  edges.forEach((edge: any) => {
    if (edge.loop && edge.id) {
      const iterations = Math.min(edge.max_iterations || 5, 2 + Math.floor(Math.random() * 3));
      loopCounters[edge.id] = iterations;
      
      if (taskStates[edge.to] === 'running') {
        loopNotBefore[edge.to] = new Date(now.getTime() + 7000).toISOString();
      }

      for (let i = 0; i < iterations; i++) {
        addLog({ type: 'loop_iteration', edge_id: edge.id, node_id: edge.from, message: `Loop "${edge.id}" iteração ${i + 1}/${edge.max_iterations || '?'}` });
        if (edge.reopen_tasks) {
          edge.reopen_tasks.forEach((taskId: string) => {
            addLog({ type: 'loop_reopen', node_id: taskId, edge_id: edge.id, message: `reopen("${taskId}") por loop "${edge.id}"` });
          });
        }
      }
    }
  });

  const allFinished = Object.values(taskStates).every(s => s === 'finished');
  const hasError = Object.values(taskStates).some(s => s === 'error');
  const globalState: ExecutionState = hasError ? 'error' : allFinished ? 'finished' : 'running';

  if (globalState === 'finished') {
    addLog({ type: 'execution_finish', message: 'Execução finalizada com sucesso' });
  }

  return {
    execution_controller: {
      execution_id: `exec-${Date.now().toString(36)}`,
      state: globalState,
      task_states: taskStates,
      task_outputs: taskOutputs,
      loop_counters: loopCounters,
      loop_not_before: loopNotBefore,
      for_each_tracker: forEachTracker,
      for_each_stream_tracker: forEachStreamTracker,
    },
    execution_data: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      nodes: workflow.nodes,
      edges: workflow.edges,
      inputs: workflow.inputs,
    },
    logs: logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    started_at: startedAt,
    finished_at: globalState === 'finished' ? logTime.toISOString() : undefined,
  };
}
