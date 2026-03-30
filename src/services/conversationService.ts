import { apiClient } from './apiClient';

export interface ConversationMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  participants: string[];
  status: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  messages?: ConversationMessage[];
  updatedAt?: string;
}

const BASE = '/v1';

export const conversationService = {
  async create(id: string, title: string): Promise<void> {
    const userId = apiClient.getUserId() || 'anonymous';
    await apiClient.post(`${BASE}/create/conversation`, {
      id,
      title,
      participants: [userId, 'agent-heimdall'],
      status: 'open',
      context: { channel: 'web' },
      metadata: {},
    });
  },

  async addMessages(conversationId: string, messages: ConversationMessage[]): Promise<void> {
    await apiClient.post(`${BASE}/update/conversation`, {
      id: conversationId,
      messages,
    });
  },

  async listAll(): Promise<Conversation[]> {
    try {
      const data = await apiClient.get<any>(`${BASE}/read/conversation?view=full`);
      const list = data?.conversations ?? data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async listNames(): Promise<Conversation[]> {
    try {
      const data = await apiClient.get<any>(`${BASE}/read/conversation?view=names`);
      const list = data?.conversations ?? data;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Conversation | null> {
    try {
      const data = await apiClient.get<any>(`${BASE}/read/conversation?id=${encodeURIComponent(id)}&view=full`);
      const list = data?.conversations ?? data;
      if (Array.isArray(list) && list.length > 0) return list[0];
      return list && !Array.isArray(list) ? list : null;
    } catch {
      return null;
    }
  },
};
