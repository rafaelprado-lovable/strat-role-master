import { apiClient } from './apiClient';
import { PLUGIN_SCHEMAS } from '@/types/pluginSchemas';

export interface ChatTool {
  id: string;
  name: string;
  description: string;
  toolType: string;
  pluginKey: string;
  inputs: Record<string, string>;
  outputs: Record<string, unknown>;
  enabled: boolean;
  waitForCompletion: boolean;
  waitTimeoutSeconds: number;
  pollIntervalSeconds: number;
}

export const toolService = {
  getAll: async (): Promise<ChatTool[]> => {
    return apiClient.get<ChatTool[]>('/v1/read/tool');
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

  getAvailablePlugins: () => {
    return Object.entries(PLUGIN_SCHEMAS).map(([key, schema]) => ({
      key,
      name: schema.name,
      description: schema.description,
    }));
  },
};
