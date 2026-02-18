import { apiClient } from './apiClient';

export interface SanityItem {
  name: string;
  disponibilidade: number;
  latencia_ms: number;
  status_disp: 'ok' | 'error';
  status_lat: 'ok' | 'error';
}

export const sanityService = {
  getMwDepartment: async (): Promise<SanityItem[]> => {
    return apiClient.get<SanityItem[]>('/v1/sanity/mw-departament');
  },
};
