// Tool service: ferramentas customizadas (desacopladas dos nodes do Automation).
// Persistido em localStorage. Cada ferramenta é um endpoint HTTP configurável.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface KeyValue {
  id: string;
  key: string;
  value: string;
}

export interface ChatTool {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: HttpMethod;
  ignoreSsl: boolean;
  headers: KeyValue[];
  body: KeyValue[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'heimdall:tools';

const read = (): ChatTool[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const write = (tools: ChatTool[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tools));
};

export const toolService = {
  getAll: async (): Promise<ChatTool[]> => read(),

  getById: async (id: string): Promise<ChatTool | null> =>
    read().find(t => t.id === id) ?? null,

  create: async (data: Omit<ChatTool, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChatTool> => {
    const now = new Date().toISOString();
    const tool: ChatTool = {
      ...data,
      id: `tool-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    write([...read(), tool]);
    return tool;
  },

  update: async (id: string, patch: Partial<ChatTool>): Promise<ChatTool | null> => {
    const all = read();
    const idx = all.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const updated: ChatTool = { ...all[idx], ...patch, id, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    write(all);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    write(read().filter(t => t.id !== id));
  },
};
