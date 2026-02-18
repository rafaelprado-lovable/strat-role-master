import { apiClient } from './apiClient';

export type CepExecutionType = 'inclusion' | 'exclusion';

export const cepService = {
  /** Create an EventSource for CEP change pipeline (SSE) */
  createCepPipeline: (changeNumber: string, executionType: CepExecutionType): EventSource => {
    return apiClient.createEventSource('/v1/digibee-change-cep', {
      change_number: changeNumber,
      execution_type: executionType,
    });
  },
};
