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
  value: string; // ISO date for 'once', interval in minutes for 'interval', cron expression for 'cron'
  timezone: string;
}

export interface Machine {
  id: string;
  name: string;
  host: string;
  port: string;
  description: string;
}

export interface CustomBlock {
  id: string;
  name: string;
  description: string;
  machineId: string;
  scriptPath: string;
  icon: 'terminal' | 'server';
  color: string;
}
