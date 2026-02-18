import { apiClient } from './apiClient';

export interface ChangeTask {
  sys_id: string;
  number: string;
  description: string;
  type: string;
  state: string;
  departament?: string;
}

export const changeTaskService = {
  /** Get tasks for a specific change */
  getTasksByChange: async (changeNumber: string): Promise<ChangeTask[]> => {
    const data = await apiClient.patch<{ success?: ChangeTask[] } | ChangeTask[]>('/v1/ctasks', {
      userId: apiClient.getUserId(),
      changeNumber,
    });

    // API may return { success: [...] } or directly [...]
    if (data && 'success' in data) {
      return data.success ?? [];
    }
    return (data as ChangeTask[]) ?? [];
  },
};
