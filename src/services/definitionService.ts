import { apiClient } from './apiClient';

export interface DefinitionField {
  name: string;
  label: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'json' | 'list';
  required?: boolean;
  placeholder?: string;
  description?: string;
}

export interface Definition {
  _id?: string;
  id?: string;
  definition_id: string;
  label: string;
  icon: string;
  description: string;
  category: 'trigger' | 'action' | 'filter';
  group?: string;
  inputs: DefinitionField[];
  outputs: DefinitionField[];
  documentation?: string;
  createdAt?: string;
  updatedAt?: string;
}

const ORCHESTRATOR_HEADER = { orchestrator: 'lovable' };

async function fetchWithOrchestrator<T>(url: string, options: RequestInit): Promise<T> {
  const response = await apiClient.rawFetch(url, {
    ...options,
    headers: { ...ORCHESTRATOR_HEADER, ...(options.headers || {}) },
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const definitionService = {
  async list(): Promise<Definition[]> {
    return apiClient.get<Definition[]>('/v1/read/node');
  },

  async get(id: string): Promise<Definition> {
    return apiClient.get<Definition>(`/v1/read/node?id=${id}`);
  },

  async create(definition: Definition): Promise<Definition> {
    return fetchWithOrchestrator<Definition>('/v1/create/node', {
      method: 'POST',
      body: JSON.stringify(definition),
    });
  },

  async update(definition: Definition): Promise<Definition> {
    return fetchWithOrchestrator<Definition>('/v1/update/node', {
      method: 'PATCH',
      body: JSON.stringify(definition),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchWithOrchestrator<void>(`/v1/delete/node?id=${id}`, {
      method: 'DELETE',
    });
  },
};
