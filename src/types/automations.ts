// ==========================================
// Workflow JSON Contract — Backend-compatible
// ==========================================

export interface WorkflowForEach {
  items: string;       // "{{node-x.output.items}}" or array literal
  item_var: string;    // e.g. "item"
  index_var: string;   // e.g. "index"
  stream?: boolean;    // fan-out: dispatches items one-by-one to downstream child nodes
  reopen_tasks?: string[];  // node IDs to re-execute per iteration
}

export interface WorkflowNode {
  id: string;
  definition_id: DefinitionId;
  config: Record<string, unknown>;
  for_each?: WorkflowForEach;
  position?: { x: number; y: number };  // UI-only
}

export interface WorkflowEdge {
  id?: string;
  from: string;
  to: string;
  condition?: string;   // "node-x.output.status == 200"
  loop?: boolean;
  max_iterations?: number;
  reopen_tasks?: string[];  // node IDs to re-execute in loop iterations
}

export interface AutomationSchedule {
  type: 'once' | 'interval' | 'cron';
  value: string;
  timezone: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'draft';
  schedule: AutomationSchedule | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  inputs: Record<string, Record<string, unknown>>;  // nodeId → input object
  start_date: string | null;  // DD/MM/YYYY HH:MM
  // UI-only metadata
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string | null;
  runCount?: number;
}

// Available definition IDs
export const DEFINITION_IDS = [
  // Gatilhos
  { value: 'get_specific_incident_v1', label: 'Get Incident', icon: 'alert-triangle', description: 'Busca incidente específico', category: 'trigger' },
  // Ações
  { value: 'ssh_execution', label: 'SSH Execution', icon: 'terminal', description: 'Executa comando via SSH', category: 'action' },
  { value: 'send_whatsapp_message_v1', label: 'WhatsApp Message', icon: 'message-circle', description: 'Envia mensagem via WhatsApp', category: 'action' },
  { value: 'api_call_v1', label: 'API Call', icon: 'globe', description: 'Chamada HTTP/API', category: 'action' },
  { value: 'delay_v1', label: 'Delay', icon: 'timer', description: 'Aguarda um tempo antes de continuar', category: 'action' },
] as const;

export type DefinitionId = typeof DEFINITION_IDS[number]['value'];

// Validation
export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateWorkflow(workflow: Partial<Workflow>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!workflow.id) errors.push({ path: 'id', message: 'ID do workflow é obrigatório', severity: 'error' });
  if (!workflow.name?.trim()) errors.push({ path: 'name', message: 'Nome do workflow é obrigatório', severity: 'error' });

  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const nodeIds = new Set(nodes.map(n => n.id));

  if (nodes.length === 0) errors.push({ path: 'nodes', message: 'Workflow precisa ter pelo menos 1 nó', severity: 'error' });

  nodes.forEach((node, i) => {
    if (!node.definition_id) {
      errors.push({ path: `nodes[${i}]`, message: `Nó "${node.id}" sem definition_id`, severity: 'error' });
    }
    if (node.for_each) {
      if (!node.for_each.items?.trim()) {
        errors.push({ path: `nodes[${i}].for_each.items`, message: `Nó "${node.id}": for_each sem items`, severity: 'error' });
      }
      if (!node.for_each.item_var?.trim()) {
        errors.push({ path: `nodes[${i}].for_each.item_var`, message: `Nó "${node.id}": for_each sem item_var`, severity: 'error' });
      }
      if (!node.for_each.index_var?.trim()) {
        errors.push({ path: `nodes[${i}].for_each.index_var`, message: `Nó "${node.id}": for_each sem index_var`, severity: 'error' });
      }
      if (node.for_each.item_var && node.for_each.index_var && node.for_each.item_var === node.for_each.index_var) {
        errors.push({ path: `nodes[${i}].for_each`, message: `Nó "${node.id}": item_var e index_var não podem ser iguais`, severity: 'error' });
      }
    }
  });

  edges.forEach((edge, i) => {
    if (!nodeIds.has(edge.from)) {
      errors.push({ path: `edges[${i}].from`, message: `Edge "${edge.from}" → "${edge.to}": origem não existe`, severity: 'error' });
    }
    if (!nodeIds.has(edge.to)) {
      errors.push({ path: `edges[${i}].to`, message: `Edge "${edge.from}" → "${edge.to}": destino não existe`, severity: 'error' });
    }
    // Block self-referencing edges without loop: true
    if (edge.from === edge.to && !edge.loop) {
      errors.push({ path: `edges[${i}]`, message: `Edge "${edge.from}" → "${edge.to}": ciclo sem loop=true não permitido`, severity: 'error' });
    }
    if (edge.loop && (!edge.max_iterations || edge.max_iterations < 1)) {
      errors.push({ path: `edges[${i}].max_iterations`, message: `Edge loop "${edge.from}" → "${edge.to}": max_iterations obrigatório`, severity: 'error' });
    }
    // Validate reopen_tasks references
    if (edge.loop && edge.reopen_tasks) {
      edge.reopen_tasks.forEach(taskId => {
        if (!nodeIds.has(taskId)) {
          errors.push({ path: `edges[${i}].reopen_tasks`, message: `reopen_tasks "${taskId}" referencia nó inexistente`, severity: 'error' });
        }
      });
    }
    if (edge.condition) {
      // Basic validation: must contain an operator
      const condPattern = /^[\w.\-{}\s]+\s*(==|!=|>|<|>=|<=)\s*.+$/;
      if (!condPattern.test(edge.condition.trim())) {
        errors.push({ path: `edges[${i}].condition`, message: `Edge "${edge.from}" → "${edge.to}": condição em formato inválido (use "left == right")`, severity: 'warning' });
      }
    }
  });

  // Detect cycles in non-loop edges (simple DFS)
  const normalAdj = new Map<string, string[]>();
  edges.filter(e => !e.loop && e.from !== e.to).forEach(e => {
    if (!normalAdj.has(e.from)) normalAdj.set(e.from, []);
    normalAdj.get(e.from)!.push(e.to);
  });
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const dfs = (nodeId: string): boolean => {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const next of (normalAdj.get(nodeId) || [])) {
      if (dfs(next)) {
        errors.push({ path: 'edges', message: `Ciclo detectado em edges normais envolvendo "${nodeId}" → "${next}". Use loop=true para ciclos intencionais.`, severity: 'error' });
        return true;
      }
    }
    inStack.delete(nodeId);
    return false;
  };
  for (const nid of nodeIds) {
    if (!visited.has(nid)) dfs(nid);
  }

  // Check inputs reference existing nodes + validate loop delay
  if (workflow.inputs) {
    Object.entries(workflow.inputs).forEach(([nodeId, inp]) => {
      if (!nodeIds.has(nodeId)) {
        errors.push({ path: `inputs.${nodeId}`, message: `inputs["${nodeId}"] referencia nó inexistente`, severity: 'error' });
      }
      const inputObj = inp as Record<string, unknown>;
      if (inputObj.loop_delay_seconds !== undefined) {
        const v = Number(inputObj.loop_delay_seconds);
        if (isNaN(v) || v < 0) {
          errors.push({ path: `inputs.${nodeId}.loop_delay_seconds`, message: `inputs["${nodeId}"].loop_delay_seconds deve ser ≥ 0`, severity: 'error' });
        }
      }
      if (inputObj.loop_delay_ms !== undefined) {
        const v = Number(inputObj.loop_delay_ms);
        if (isNaN(v) || v < 0) {
          errors.push({ path: `inputs.${nodeId}.loop_delay_ms`, message: `inputs["${nodeId}"].loop_delay_ms deve ser ≥ 0`, severity: 'error' });
        }
      }
    });
  }

  return errors;
}

export function exportWorkflowJson(workflow: Workflow): object {
  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description || '',
    status: workflow.status,
    schedule: workflow.schedule,
    nodes: workflow.nodes.map(n => {
      const node: any = {
        id: n.id,
        definition_id: n.definition_id,
        config: n.config || {},
      };
      if (n.for_each) node.for_each = n.for_each;
      return node;
    }),
    edges: workflow.edges.map(e => {
      const edge: any = { from: e.from, to: e.to };
      if (e.id) edge.id = e.id;
      if (e.condition) edge.condition = e.condition;
      if (e.loop) {
        edge.loop = true;
        edge.max_iterations = e.max_iterations;
        if (e.reopen_tasks && e.reopen_tasks.length > 0) {
          edge.reopen_tasks = e.reopen_tasks;
        }
      }
      return edge;
    }),
    inputs: workflow.inputs || {},
    start_date: workflow.start_date || null,
  };
}
