export interface PluginFile {
  id: string;
  name: string;
  language: 'python' | 'javascript' | 'shell' | 'json';
  content: string;
  isEntry?: boolean; // main file
}

export interface PluginVersion {
  id: string;
  version: string;
  label?: string;
  createdAt: string;
  snapshot: PluginProject;
}

export interface PluginProject {
  id: string;
  name: string;
  description: string;
  category: 'trigger' | 'action' | 'filter';
  group?: string;
  icon: string;
  definition_id: string;
  inputs: PluginFieldDef[];
  outputs: PluginFieldDef[];
  files: PluginFile[];
  status: 'draft' | 'published';
  versions: PluginVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface PluginFieldDef {
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'json' | 'list';
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export interface TestRun {
  id: string;
  timestamp: string;
  inputs: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: 'success' | 'error' | 'running';
  duration?: number;
  logs: string[];
}
