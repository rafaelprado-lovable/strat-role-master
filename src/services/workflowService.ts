import { apiClient } from './apiClient';
import { Workflow, exportWorkflowJson } from '@/types/automations';

export interface WorkflowApiResponse {
  id?: string;
  [key: string]: unknown;
}

const ORCHESTRATOR_HEADER = { orchestrator: 'lovable' };

async function postWithOrchestrator<T>(url: string, body?: unknown, additionalHeaders?: HeadersInit): Promise<T> {
  const response = await apiClient.rawFetch(url, {
    method: 'POST',
    headers: { ...ORCHESTRATOR_HEADER, ...additionalHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

async function patchWithOrchestrator<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.rawFetch(url, {
    method: 'PATCH',
    headers: ORCHESTRATOR_HEADER,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

async function deleteWithOrchestrator<T>(url: string): Promise<T> {
  const response = await apiClient.rawFetch(url, {
    method: 'DELETE',
    headers: ORCHESTRATOR_HEADER,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const workflowService = {
  async create(workflow: Workflow | object): Promise<WorkflowApiResponse> {
    const payload = 'nodes' in workflow && 'edges' in workflow && 'id' in workflow
      ? exportWorkflowJson(workflow as Workflow)
      : workflow;
    return postWithOrchestrator<WorkflowApiResponse>('/v1/create/workflow', payload);
  },

  async update(id: string, workflow: Workflow | object): Promise<WorkflowApiResponse> {
    const payload = 'nodes' in workflow && 'edges' in workflow && 'id' in workflow
      ? exportWorkflowJson(workflow as Workflow)
      : workflow;
    return patchWithOrchestrator<WorkflowApiResponse>('/v1/update/workflow', payload);
  },

  async delete(id: string): Promise<void> {
    return deleteWithOrchestrator(`/v1/delete/workflow?id=${id}`);
  },

  async list(): Promise<WorkflowApiResponse[]> {
    return apiClient.get<WorkflowApiResponse[]>('/v1/read/workflow');
  },

  async get(id: string): Promise<WorkflowApiResponse> {
    return apiClient.get<WorkflowApiResponse>(`/v1/read/workflow?id=${id}`);
  },

  async run(id: string): Promise<WorkflowApiResponse> {
    return postWithOrchestrator<WorkflowApiResponse>(`/v1/run/workflow/${id}`);
  },

  async createExecution(workflowId: string, payload?: any): Promise<WorkflowApiResponse> {
    const headers: Record<string, string> = {};
    if (payload?.messageid) headers['messageid'] = payload.messageid;
    else headers['messageid'] = `msg-${Date.now()}`;
    
    return postWithOrchestrator<WorkflowApiResponse>('/v1/create/execution', {
      workflow_id: workflowId,
      ...(payload && Object.keys(payload).length > 0 ? { inputs: payload } : {})
    }, headers);
  },

  async listExecutions(): Promise<WorkflowApiResponse[]> {
    const data = await apiClient.get<WorkflowApiResponse[]>('/v1/execution');
    return Array.isArray(data) ? data : [];
  },

  async getExecution(executionId: string): Promise<WorkflowApiResponse> {
    return apiClient.get<WorkflowApiResponse>(`/v1/execution?execution_id=${executionId}`);
  },
};
