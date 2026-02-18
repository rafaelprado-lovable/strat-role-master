// Types for the management system

export interface Organization {
  _id: string;
  name: string;
  organization: string;
}

export interface Department {
  _id: string;
  name: string;
  organization: string;
  sysId: string;
  groupName: string;
  manager: string;
  coordinator: string;
}

export interface Permission {
  _id: string;
  name: string;
  actions: string[];
  scopes: string[];
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  organization: string;
  departmentIds: string[];
  phoneNumber: string;
}


export interface Scope {
  _id: string;
  name: string;
  type: string;
  url: string;
  icone: string;
  menu: string;
  organization: string;
  departament: string;
}

interface HttpCodeGroup {
  code: string;
  total_count: number;
  avg_time: number;
}

interface ServiceTimelinePoint {
  timestamp: string;
  context_info: {
    application: string;
    service_name: string;
    route_path: string;
  };
  http_code_group: HttpCodeGroup[];
  avg_time: number;
}

interface ServiceTimelineDay {
  services: ServiceTimelinePoint[];
}

export interface PostChange {
  changeSystemData: {
      number: string,
      description: string,
      teams_involved_in_execution: string[],
      teams_involved_in_validation: string[],
      start_date: string,
      end_date: string,
      week_day: string,
      state: string
  };
  postChangeData: {
      applicationStatus: string
  },
  changeTestData: {
    fqa: string,
    uat: string,
    system_test: string,
    no_test: string,
  },
  changeAproovalData: {
    tecnology: string,
    restart_type: boolean,
    new_service: boolean,
    old_service: boolean,
    increase_volume: boolean,
    validation_time: string,
    validation_process: string,
    hdc_validation: boolean,
    validator_contact: string[],
    [key: string]: any,
  }
  changeHistory: {
    comments_work_notes: any[],
    comments: any[],
    timelineAprooval: any[],
    rejectionAprooval: any[]
  },
  changeServicesList: Array<{
    service_name: string,
    cf_production_version: string,
    implementation_version: string,
    pipeline_link: string,
    [key: string]: any,
  }>,
  serviceTimeline?: any;
  [key: string]: any;
}

export interface Insight {
  id: string;
  incident_data: {
    number: string;
    priority: string;
    state: string;
    assignment_team: string;
  };
  engineering_sla: {
    entry_time: any[];
    out_time: any[];
    solved_by_eng: boolean;
    total_time: number;
    departaments: Array<{
      sysId?: string;
      name?: string;
      totalTime: number;
    }>;
  };
  scalation: {
    '50_percent': boolean;
    '75_percent': boolean;
    '90_percent': boolean;
  };
  traceability: {
    organization: string;
  };
  heimdall_actuation: {
    change_criticity: boolean;
    close_by_analyse: boolean;
    close_by_automation: boolean;
    sla_management: boolean;
    omsActuation?: {
      RejectedByMask?: boolean;
      RejectedByIOP?: string;
    };
  };
  // Extended fields from incident history
  shortDescription?: string;
  description?: string;
  assignment_team?: string;
  departamentTrammit?: any[];
  comments?: any[];
  work_notes?: any[];
  closeNotes?: any[];
  [key: string]: any;
}

export { type ServiceDataPoint as ServiceTimelinePoint } from '@/components/changes/ServiceTimelineChart';

// Changes type alias used across pages
export type Changes = PostChange;

export interface Plantao {
  _id: string,
  name: string,
  departament: string,
  startDatetime: string,
  endDatetime: string,
  phoneNumber: string,
}


export interface CallResolution {
    "handlingRuleData": {
        "id": string,
        "created_by": string,
        "departament": string,
        "target_field": string,
        "match_description": string,
        "pendentManagerAprooval": boolean,
        "managerAprooved": boolean
    },
    "incidentResolutionData": {
        "close_code": string,
        "platform": string,
        "cause": string,
        "sub_cause": string,
        "resolution_notes": string
    },
    "managerAprooved": boolean,
    "pendentManagerAprooval": boolean
}


export interface CallResolutionCreate {
  created_by: string,
  departament: string,
  target_field: string,
  match_description: string,
  close_code: string,
  platform: string,
  cause: string,
  sub_cause: string,
  resolution_notes: string,
}