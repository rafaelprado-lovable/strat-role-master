export interface Automation {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  schedule: AutomationSchedule | null;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  runCount: number;
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

// Step parameter structure for config params (static configuration when block is created)
export interface StepConfigParam {
  paramName: string;
  paramType: 'string' | 'integer' | 'boolean' | 'array' | 'object';
  paramExample: string;
  paramValue: string;
}

// Step parameter structure for input values (dynamic, can come from previous steps)
export interface StepInputValue {
  paramName: string;
  paramType: 'string' | 'integer' | 'boolean' | 'array' | 'object';
  mandatory: boolean;
}

// Step parameter structure for output values (produced by the block)
export interface StepOutputValue {
  paramName: string;
  paramType: 'string' | 'integer' | 'boolean' | 'array' | 'object';
}

// Step function definition
export interface StepFunction {
  scriptName: string;
  scriptParams: {
    configParams: string; // reference to stepConfigParams
    inputParams: string; // reference to stepInputValue
  };
}

// Complete step definition following the provided schema
export interface StepDefinition {
  stepName: string;
  stepType: string;
  stepDescription: string;
  stepConfigParams: StepConfigParam[];
  stepInputValue: StepInputValue[];
  stepOutputValue: StepOutputValue[];
  stepFunction: StepFunction;
}

// Custom block now follows the step structure
export interface CustomBlock {
  id: string;
  name: string;
  description: string;
  machineId: string;
  scriptPath: string;
  icon: 'terminal' | 'server';
  color: string;
  // New step-based structure
  stepConfigParams: StepConfigParam[];
  stepInputValue: StepInputValue[];
  stepOutputValue: StepOutputValue[];
}

// Parameter types available
export const PARAM_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
] as const;

export type ParamType = typeof PARAM_TYPES[number]['value'];
