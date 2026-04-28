import { apiClient } from './apiClient';
import { definitionService, Definition } from './definitionService';

export interface ChatTool {
  id: string;
  name: string;
  description: string;
  toolType: string;
  pluginKey: string;
  scopes?: string[];
  inputs: Record<string, string>;
  outputs: Record<string, unknown>;
  enabled: boolean;
  waitForCompletion: boolean;
  waitTimeoutSeconds: number;
  pollIntervalSeconds: number;
}

export const toolService = {
  getAll: async (): Promise<ChatTool[]> => {
    const res = await apiClient.get<any>('/v1/read/tool');
    return Array.isArray(res) ? res : Array.isArray(res?.tools) ? res.tools : Array.isArray(res?.data) ? res.data : [];
  },

  getById: async (id: string): Promise<ChatTool> => {
    return apiClient.get<ChatTool>(`/v1/read/tool?id=${encodeURIComponent(id)}`);
  },

  create: async (data: ChatTool): Promise<ChatTool> => {
    return apiClient.post<ChatTool>('/v1/create/tool', data);
  },

  update: async (data: Partial<ChatTool> & { id: string }): Promise<ChatTool> => {
    return apiClient.post<ChatTool>('/v1/update/tool', data);
  },

  bulkUpdate: async (fields: Partial<ChatTool>, filter: Record<string, unknown>): Promise<unknown> => {
    return apiClient.post('/v1/update/tool/bulk', { fields, filter });
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/v1/delete/tool?id=${encodeURIComponent(id)}`);
  },

  getAvailablePlugins: async (): Promise<{ key: string; name: string; description: string; inputs: Definition['inputs']; outputs: Definition['outputs'] }[]> => {
    const definitions = await definitionService.list();
    const defs = Array.isArray(definitions) ? definitions : [];
    return defs.map(def => ({
      key: def.definition_id,
      name: def.label || def.definition_id,
      description: def.description || '',
      inputs: def.inputs || [],
      outputs: def.outputs || [],
    }));
  },
};
