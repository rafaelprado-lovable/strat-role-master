// Mock API service - Replace with actual microservice calls
import { Organization, Permission, Role, User } from '@/types';

// Mock data
export const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Eng Corporation',
    description: 'Empresa principal de engenharia',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Heimdall Tech',
    description: 'Divisão de tecnologia',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
];

export const mockPermissions: Permission[] = [
  {
    id: '1',
    name: 'Visualizar Organizações',
    description: 'Permite visualizar organizações',
    resource: 'organizations',
    action: 'read',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'Criar Organizações',
    description: 'Permite criar novas organizações',
    resource: 'organizations',
    action: 'create',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    name: 'Editar Usuários',
    description: 'Permite editar usuários',
    resource: 'users',
    action: 'update',
    createdAt: '2024-01-10T10:00:00Z',
  },
];

export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    permissions: ['1', '2', '3'],
    organizationId: '1',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'Operador',
    description: 'Acesso operacional básico',
    permissions: ['1'],
    organizationId: '1',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Rafael Prado',
    email: 'rafael.prado@eng.com',
    roleId: '1',
    organizationId: '1',
    status: 'active',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: '2',
    name: 'Maria Silva',
    email: 'maria.silva@eng.com',
    roleId: '2',
    organizationId: '1',
    status: 'active',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
];

// API service functions - To be replaced with actual API calls
export const organizationApi = {
  getAll: async (): Promise<Organization[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(mockOrganizations), 300));
  },
  getById: async (id: string): Promise<Organization | undefined> => {
    return new Promise((resolve) => 
      setTimeout(() => resolve(mockOrganizations.find(org => org.id === id)), 300)
    );
  },
  create: async (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...data,
      id: String(mockOrganizations.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }), 300));
  },
  update: async (id: string, data: Partial<Organization>): Promise<Organization> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...mockOrganizations.find(org => org.id === id)!,
      ...data,
      updatedAt: new Date().toISOString(),
    }), 300));
  },
  delete: async (id: string): Promise<void> => {
    return new Promise((resolve) => setTimeout(() => resolve(), 300));
  },
};

export const permissionApi = {
  getAll: async (): Promise<Permission[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(mockPermissions), 300));
  },
  create: async (data: Omit<Permission, 'id' | 'createdAt'>): Promise<Permission> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...data,
      id: String(mockPermissions.length + 1),
      createdAt: new Date().toISOString(),
    }), 300));
  },
  delete: async (id: string): Promise<void> => {
    return new Promise((resolve) => setTimeout(() => resolve(), 300));
  },
};

export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(mockRoles), 300));
  },
  create: async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...data,
      id: String(mockRoles.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }), 300));
  },
  update: async (id: string, data: Partial<Role>): Promise<Role> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...mockRoles.find(role => role.id === id)!,
      ...data,
      updatedAt: new Date().toISOString(),
    }), 300));
  },
  delete: async (id: string): Promise<void> => {
    return new Promise((resolve) => setTimeout(() => resolve(), 300));
  },
};

export const userApi = {
  getAll: async (): Promise<User[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(mockUsers), 300));
  },
  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...data,
      id: String(mockUsers.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }), 300));
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return new Promise((resolve) => setTimeout(() => resolve({
      ...mockUsers.find(user => user.id === id)!,
      ...data,
      updatedAt: new Date().toISOString(),
    }), 300));
  },
  delete: async (id: string): Promise<void> => {
    return new Promise((resolve) => setTimeout(() => resolve(), 300));
  },
};
