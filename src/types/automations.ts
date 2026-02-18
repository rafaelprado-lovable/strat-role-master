// ==========================================
// Task Definition → Task Instance → Workflow
// ==========================================

/** Schema defining inputs and outputs for a task definition */
export interface TaskSchema {
  inputs: Record<string, ParamType>;   // paramName → paramType
  outputs: Record<string, ParamType>;  // paramName → paramType
}


/** Blueprint/template for a task type */
export interface TaskDefinition {
  id: string;
  name: string;
  type: string;
  description?: string;
  schema: TaskSchema;
  // UI metadata
  preConfig?: object;
  icon?: string;
  color?: string;
  category?: string;
  // For remote execution (custom blocks)
  machineId?: string;
  scriptPath?: string;
}

/** A node on the workflow canvas — an instance of a TaskDefinition */
export interface WorkflowNode {
  id: string;
  definition_id: string;
  config: Record<string, unknown>;     // filled input values or {{nodeId.output}} references
  position: { x: number; y: number };
}

/** An edge connecting two nodes, optionally with a condition */
export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: string;  // e.g. "task1.status == 200"
}

/** A complete workflow (formerly "Automation") */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  schedule: AutomationSchedule | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  inputs: Record<string, unknown>;     // workflow-level inputs
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  runCount: number;
  start_date?: string;
}

export interface AutomationSchedule {
  type: 'once' | 'interval' | 'cron';
  value: string;
  timezone: string;
}

export interface Machine {
  id: string;
  name: string;
  host: string;
  port: string;
  description: string;
}

// Parameter types available
export const PARAM_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
] as const;

export type ParamType = typeof PARAM_TYPES[number]['value'];
