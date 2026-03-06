import { apiClient } from './apiClient';
import { Workflow, exportWorkflowJson } from '@/types/automations';

export interface WorkflowApiResponse {
  id?: string;
  [key: string]: unknown;
}

export const workflowService = {
  /** Create a new workflow on the backend */
  async create(workflow: Workflow): Promise<WorkflowApiResponse> {
    const payload = exportWorkflowJson(workflow);
    return apiClient.post<WorkflowApiResponse>('/v1/create/workflow', payload);
  },

  /** Update an existing workflow */
  async update(id: string, workflow: Workflow): Promise<WorkflowApiResponse> {
    const payload = exportWorkflowJson(workflow);
    return apiClient.patch<WorkflowApiResponse>(`/v1/update/workflow/${id}`, payload);
  },

  /** Delete a workflow */
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/v1/delete/workflow/${id}`);
  },

  /** List all workflows */
  async list(): Promise<WorkflowApiResponse[]> {
    return apiClient.get<WorkflowApiResponse[]>('/v1/list/workflows');
  },

  /** Get a single workflow */
  async get(id: string): Promise<WorkflowApiResponse> {
    return apiClient.get<WorkflowApiResponse>(`/v1/get/workflow/${id}`);
  },

  /** Run/execute a workflow */
  async run(id: string): Promise<WorkflowApiResponse> {
    return apiClient.post<WorkflowApiResponse>(`/v1/run/workflow/${id}`);
  },
};
