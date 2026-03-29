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

const BASE = '/heimdall-management-api/v1';

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
      const data = await apiClient.get<Conversation[]>(`${BASE}/read/conversation?view=full`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async listNames(): Promise<Conversation[]> {
    try {
      const data = await apiClient.get<Conversation[]>(`${BASE}/read/conversation?view=names`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Conversation | null> {
    try {
      const data = await apiClient.get<Conversation>(`${BASE}/read/conversation?id=${encodeURIComponent(id)}&view=full`);
      return data || null;
    } catch {
      return null;
    }
  },
};
