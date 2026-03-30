// Mock CRUD service for AI Chat Tools
// Each tool is a configured instance of a plugin schema with filled inputs

import { PLUGIN_SCHEMAS } from '@/types/pluginSchemas';

export interface ChatTool {
  id: string;
  name: string;
  description: string;
  pluginKey: string; // key from PLUGIN_SCHEMAS
  inputs: Record<string, string>; // filled input values
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory mock storage
let tools: ChatTool[] = [];

const generateId = () => Math.random().toString(36).substring(2, 10);

export const toolService = {
  getAll: async (): Promise<ChatTool[]> => {
    return [...tools];
  },

  getById: async (id: string): Promise<ChatTool | undefined> => {
    return tools.find(t => t.id === id);
  },

  create: async (data: Omit<ChatTool, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatTool> => {
    const now = new Date().toISOString();
    const tool: ChatTool = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    tools.push(tool);
    return tool;
  },

  update: async (id: string, data: Partial<Omit<ChatTool, 'id' | 'createdAt'>>): Promise<ChatTool> => {
    const index = tools.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Tool not found');
    tools[index] = {
      ...tools[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return tools[index];
  },

  delete: async (id: string): Promise<void> => {
    tools = tools.filter(t => t.id !== id);
  },

  getAvailablePlugins: () => {
    return Object.entries(PLUGIN_SCHEMAS).map(([key, schema]) => ({
      key,
      name: schema.name,
      description: schema.description,
    }));
  },
};
