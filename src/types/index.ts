// Types for the management system

export interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roleId: string;
  organizationId: string;
  departmentIds: string[];
  phoneNumber: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Scope {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
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
    entry_time: string[];
    out_time: string[];
    solved_by_eng: boolean;
    total_time: number;
    departaments: Array<{
      sysId?: string;
      name?: string;
      totalTime: number;
    }>;
  };
  escalation: {
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
}
