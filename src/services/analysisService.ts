import { apiClient } from './apiClient';

export interface AnalysisResult {
  analise_log_api: {
    data_ocorrencia_aproximada: string;
    codigo_status_http_retornado: string;
    TID: string;
    mensagem_erro_principal: string;
    causa_raiz_sugerida: string;
    tipo_do_erro: string;
    endpoint_do_provedor: string;
    request_ao_provedor: string;
    response_do_provedor: string;
    Direcionar_para_fila: string;
    tagueamento_de_controle: string;
  };
}

export interface AssignmentGroup {
  sysId: string;
  name: string;
}

export const analysisService = {
  /** Analyse an incident ticket */
  analyseTicket: async (incidentNumber: string): Promise<AnalysisResult> => {
    return apiClient.post<AnalysisResult>('/v1/analyse/ticket', {
      userId: apiClient.getUserId(),
      incidentNumber,
    });
  },

  /** Resolve/close an incident */
  resolveIncident: async (data: {
    incidentNumber: string;
    closeCode: string;
    platform: string;
    cause: string;
    subCause: string;
    closeNotes: string;
  }): Promise<unknown> => {
    return apiClient.patch('/v1/resolve/incident', {
      userId: apiClient.getUserId(),
      ...data,
    });
  },

  /** Post a comment on an incident */
  postIncidentComment: async (incidentNumber: string, comment: string): Promise<unknown> => {
    return apiClient.post(
      '/v1/create/incident/comment',
      {
        userId: apiClient.getUserId(),
        incidentNumber,
        incidentComment: comment,
      },
      { baseUrl: apiClient.secondaryUrl }
    );
  },

  /** Change assignment group of an incident */
  changeAssignmentGroup: async (incidentNumber: string, assignmentGroup: string): Promise<unknown> => {
    return apiClient.post('/v1/change/incident/assignment/group', {
      userId: apiClient.getUserId(),
      incidentNumber,
      assignmentGroup,
    });
  },

  /** Get assignment groups (departments) */
  getAssignmentGroups: async (): Promise<AssignmentGroup[]> => {
    return apiClient.get<AssignmentGroup[]>('/v1/read/assignment/group', {
      baseUrl: apiClient.secondaryUrl,
    });
  },

  /** Search assignment groups by name */
  searchAssignmentGroups: async (searchString: string): Promise<AssignmentGroup[]> => {
    return apiClient.get<AssignmentGroup[]>(`/v1/read/assignment/group?string=${encodeURIComponent(searchString)}`, {
      baseUrl: apiClient.secondaryUrl,
    });
  },

  /** Analyse a TID in production */
  analyseTid: async (data: {
    platform: string;
    dateTime: string;
    messageId: string;
    uri?: string;
    method?: string;
  }): Promise<AnalysisResult> => {
    return apiClient.post<AnalysisResult>('/v1/request/analyse', {
      userId: apiClient.getUserId(),
      platform: data.platform,
      dateTime: data.dateTime,
      messageId: data.messageId,
      ...(data.uri ? { uri: data.uri } : {}),
      ...(data.method ? { method: data.method } : {}),
    }, { baseUrl: apiClient.secondaryUrl });
  },
};
