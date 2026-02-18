// Mock API service - Replace with actual microservice calls
import { Organization, Permission, Role, User, Scope, Department, Insight, PostChange as Changes, Plantao, CallResolution, CallResolutionCreate } from '@/types';

// API service functions - To be replaced with actual API calls
export const organizationApi = {
  getAll: async (): Promise<Organization[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/organization", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      return result;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  getById: async (id: string): Promise<Organization | undefined> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/organization", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      return result

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  create: async (data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      orgName: data.name
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/organization", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      if (response.status === 204) {
        return {
          ...data,
          _id: String(Date.now())
        } as Organization;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Organization>): Promise<Organization> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      orgId: id,
      orgName: data.name

    });

    const requestOptions: RequestInit = {
      method: "PATCH",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/update/organization", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      return result as any;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      orgId: id
    });

    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/organization", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      return result as any;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
};

export const permissionApi = {
  getAll: async (): Promise<Permission[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/permission", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      return result;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  create: async (data: Omit<Permission, 'id' | 'createdAt'>): Promise<Permission> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      name: data.name,
      scopes: data.scopes,
      actions: data.actions,
      organization: "TIM",
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/permission", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      if (response.status === 204) {
        return {
          ...data,
          name: String(Date.now())
        };
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Permission>): Promise<Permission> => {
    return Promise.resolve({ ...data } as Permission);
  },
  delete: async (id: string): Promise<void> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      permissionId: id
    });

    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/permission", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;


    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
};

export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/function", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      return result;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  create: async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      name: data.name,
      permission: data.permissions
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/function", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      if (response.status === 204) {
        return {
          ...data,
          name: String(Date.now())
        };
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Role>): Promise<Role> => {
    return Promise.resolve({ ...data } as Role);
  },
  delete: async (id: string): Promise<void> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    console.log(id)
    console.log(userId)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      functionId: id
    });

    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/function", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      if (response.status === 204) {
        return;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
};

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      authUserId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/user", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      return result;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        userId: userId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: (data as any).roleId || data.role,
        organization: (data as any).organizationId || data.organization,
        departament: `${data.departmentIds}`,
        phoneNumber: data.phoneNumber
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/user", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      if (response.status === 204) {
        return {
          ...data,
          name: String(Date.now())
        };
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return Promise.resolve({ ...data } as User);
  },
  delete: async (id: string): Promise<void> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    console.log(id)
    console.log(userId)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      authUserId: userId,
      userId: id
    });

    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/user", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      if (response.status === 204) {
        return;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
};

export const departmentApi = {
  getAll: async (): Promise<Department[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/departament", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      
      result.forEach((item) => {
        if (userId == item.manager){
          localStorage.setItem('userFunction', 'gerente')
          
        }
        //console.log(item.manager);
      });

      return result;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  create: async (data: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<Department> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    console.log(data.sysId)

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      name: data.name,
      organization: data.organization,
      groupName: data.groupName,
      sysId: data.sysId,
      manager: data.manager,
      coordinator: data.coordinator
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/departament", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      if (response.status === 204) {
        return {
          ...data,
          _id: String(Date.now())
        } as Department;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Department>): Promise<Department> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      departamentId: id,
      name: data.name,
      organization: data.organization,
      groupName: data.groupName,
      sysId: data.sysId,
      manager: data.manager,
      coordinator: data.coordinator
    });

    const requestOptions: RequestInit = {
      method: "PATCH",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/update/departament", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response;

      if (response.status === 204) {
        return {
          ...data,
          _id: String(Date.now())
        } as Department;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    console.log(id)
    console.log(userId)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      departamentId: id
    });

    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/departament", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      if (response.status === 204) {
        return;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
};

export const scopeApi = {
  getAll: async (): Promise<Scope[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/view", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      return result;

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  create: async (data): Promise<Scope> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    console.log(data)
    console.log(userId)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      name: data.name, // Nome do elemento
      type: data.type, // Tipo do elemento (menu ou submenu)
      url: data.url, // URL do elemento em caso do elemento ser submenu
      icone: (data as any).icon || data.icone,
      menu: (data as any).related_menu || data.menu,
      organization: data.organization,
      departament: "engineering"
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/view", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      if (response.status === 204) {
        return {
          ...data,
          _id: String(Date.now())
        } as Scope;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Scope>): Promise<Scope> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    console.log(data)
    console.log(userId)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      viewId: id,
      name: data.name, // Nome do elemento
      type: data.type, // Tipo do elemento (menu ou submenu)
      url: data.url, // URL do elemento em caso do elemento ser submenu
      icone: (data as any).icon || data.icone,
      menu: (data as any).related_menu || data.menu,
      organization: data.organization,
      departament: "engineering"
    });

    const requestOptions: RequestInit = {
      method: "PATCH",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/update/view", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      if (response.status === 204) {
        return {
          ...data,
          _id: String(Date.now())
        } as Scope;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
  delete: async (id: string): Promise<void> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    console.log(id)
    console.log(userId)
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      viewId: id
    });

    const requestOptions: RequestInit = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/view", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
      }

      if (response.status === 204) {
        return;
      };

    } catch (error) {
      console.error("Erro ao criar organização:", error);
      throw error;
    }
  },
};

const DEFAULT_ASSIGNMENT_TEAMS = [
  'ca40459e1b4af410e9162170f54bcb38',
  '09639958db5599149c4087b304961930',
  '34c482bb1b1b0290c8f487bbe54bcb7f',
  '8a40459e1b4af410e9162170f54bcb3a',
  'eabf34b2db10d1549c4087b304961909',
  'dfd7828ddb17a11c53f2e233149619b3',
  '0217401fdb9651189c4087b304961983',
  '4640459e1b4af410e9162170f54bcb59',
  '1647dd281b6b7490e9162170f54bcb4e',
  '7e4733991b07f4d0e9162170f54bcbd9',
  '276326441b993410b552da4be54bcb52',
  '0a40459e1b4af410e9162170f54bcb3e'
];

export const changesApi = {
  getPreChanges: async (): Promise<Changes[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${userToken}`);

    const end = new Date();
    const start = new Date();
    console.log(start)
    console.log(end)
    start.setDate(start.getDate() - 50);
    end.setDate(end.getDate() + 30);
    console.log(start)
    console.log(end)


    // Função para formatar dd/mm/yyyy HH:MM
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const raw = JSON.stringify({
      userId: userId,
      departament: "all",
      startDate: "02/12/2025 10:24",
      endDate: "20/02/2027 10:24",
      changeState: ['Novo', 'Autorizar', 'Avaliar', 'Agendado']
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    try {
      const response = await fetch('http://10.151.1.54:8000/v1/changes', requestOptions);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const result = await response.json();
      console.log(result)
      return result;
    } catch (error) {
      // console.error pode acontecer no ambiente cliente — manter simples
      console.error('Erro ao buscar insights:', error);
      return [];
    }
  },
  getExecutionChanges: async (): Promise<Changes[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${userToken}`);

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 50);
    end.setDate(end.getDate() + 30);

    // Função para formatar dd/mm/yyyy HH:MM
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const raw = JSON.stringify({
      userId: userId,
      departament: "all",
      startDate: formatDate(start),
      endDate: formatDate(end),
      changeState: ['Implementar']
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    try {
      const response = await fetch('http://10.151.1.54:8000/v1/changes', requestOptions);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const result = await response.json();
      console.log(result)
      return result;
    } catch (error) {
      // console.error pode acontecer no ambiente cliente — manter simples
      console.error('Erro ao buscar insights:', error);
      return [];
    }
  },
  getPostChanges: async (): Promise<Changes[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${userToken}`);

    const end = new Date();
    const start = new Date();
    console.log(start)
    console.log(end)
    start.setDate(start.getDate() - 50);
    end.setDate(end.getDate() + 30);
    console.log(start)
    console.log(end)


    // Função para formatar dd/mm/yyyy HH:MM
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const raw = JSON.stringify({
      userId: userId,
      departament: "all",
      startDate: "02/12/2025 10:24",
      endDate: "20/02/2026 10:24",
      changeState: ['Revisão', 'Agendado']
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    try {
      const response = await fetch('http://10.151.1.54:8000/v1/changes', requestOptions);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const result = await response.json();
      console.log(result)
      return result;
    } catch (error) {
      // console.error pode acontecer no ambiente cliente — manter simples
      console.error('Erro ao buscar insights:', error);
      return [];
    }
  },
  getRelatedTasks: async (changeNumber: String): Promise<Changes[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${userToken}`);

    const raw = JSON.stringify({
      userId: userId,
      changeNumber: changeNumber
    });

    const requestOptions: RequestInit = {
      method: 'PATCH',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    try {
      const response = await fetch('http://10.151.1.54:8000/v1/ctasks', requestOptions);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const result = await response.json();
      console.log(result)
      return result;
    } catch (error) {
      // console.error pode acontecer no ambiente cliente — manter simples
      console.error('Erro ao buscar insights:', error);
      return [];
    }
  },
};

export const incidentApi = {
  getAll: async (): Promise<Insight[]> => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 5);

    const raw = JSON.stringify({
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      assignmentTeams: DEFAULT_ASSIGNMENT_TEAMS,
    });

    const requestOptions: RequestInit = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    try {
      const response = await fetch('http://10.151.1.54:8000/v1/read/incident/information', requestOptions);
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      const result = await response.json();
      return result;
    } catch (error) {
      // console.error pode acontecer no ambiente cliente — manter simples
      console.error('Erro ao buscar insights:', error);
      return [];
    }
  },
  getIncidentHistory: async (insight, departments): Promise<Insight> => {
    try {
      const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
      const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${userToken}`);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({ userId: userId, incidentNumber: insight.incident_data.number });

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
      };

      const res = await fetch('http://10.151.1.54:8000/v1/read/incident/history', requestOptions);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro na API: ${res.status} - ${text}`);
      }

      const result = await res.json();

      const assignemnt_team = departments.find(d => d.sysId === insight.incident_data.assignment_team)?.name || "—"
      console.log('teste', departments)
      // merge seguro
      const merged: Insight = {
        ...insight,
        shortDescription: result.shortDescription || [],
        description: result.description || [],
        work_notes: result.workNotes || [],
        comments: result.comments || [],
        departamentTrammit: result.departamentTrammit || [],
        closeNotes: result.closeNotes || [],
        assignemnt_team: assignemnt_team || "-",
      };

      return merged;

    } catch (err) {
      console.error('❌ Erro:', err);
      throw err;
    }
  }
};


export const plantaoApi = {
  getAll: async (): Promise<Plantao[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: raw
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/plantao", requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result; // <<--- AGORA retorna para o React!!

    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
  create: async (data: Plantao): Promise<Plantao> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId,
      name: data.name,
      departament: data.departament,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      phoneNumber: data.phoneNumber
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/plantao", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      // Se for 204, não tem corpo
      if (response.status === 204) {
        return {
          message: "Plantão criado com sucesso, sem retorno."
        } as unknown as Plantao;
      }

      // Se for 200 ou 201, aí sim retorna JSON
      const result = await response.json();
      return result as Plantao;
    } catch (error) {
      console.error("Erro ao criar plantão:", error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<Plantao>): Promise<Plantao> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const payload = {
      userId: userId,
      plantaoId: id,
      name: data.name ?? undefined,
      departament: data.departament ?? undefined,
      startDatetime: data.startDatetime ? new Date(data.startDatetime).toISOString() : undefined,
      endDatetime: data.endDatetime ? new Date(data.endDatetime).toISOString() : undefined,
      phoneNumber: data.phoneNumber ?? undefined,
    };

    const options = {
      method: "PATCH",
      headers: myHeaders,
      body: JSON.stringify(payload),
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/update/plantao", options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errorText}`);
      }

      // Caso API retorne 204 (sem corpo)
      if (response.status === 204) {
        return {
          _id: id,
          ...data,
        } as Plantao;
      }

      const result = await response.json();
      return result as Plantao;

    } catch (err) {
      console.error("Erro ao atualizar plantão:", err);
      throw err;
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      const userToken = localStorage.getItem("userToken");
      const userId = localStorage.getItem("userId");

      if (!userToken || !userId) {
        throw new Error("Usuário não autenticado.");
      }

      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${userToken}`);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        userId: userId,
        plantaoId: id
      });

      const requestOptions: RequestInit = {
        method: "DELETE",
        headers: myHeaders,
        body: raw, // sua API exige body, então mantemos
      };

      const response = await fetch("http://10.151.1.54:8000/v1/delete/plantao", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro ao excluir: ${response.status}`);
      }

      // Alguns DELETE retornam 204 (sem conteúdo)
      if (response.status !== 204) {
        console.log("Resposta API:", await response.text());
      }

    } catch (error) {
      console.error("Erro ao deletar plantão:", error);
      throw error;
    }
  },
};

export const incidentResolutionApi = {
  getAll: async (): Promise<CallResolution[]> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      userId: userId
    });

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/read/incident/handling/rule", requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result; // <<--- AGORA retorna para o React!!

    } catch (error) {
      console.error("API error:", error);
      throw error;
    }
  },
  create: async (data: CallResolutionCreate): Promise<CallResolutionCreate> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      created_by: userId,
      departament: data.departament,
      target_field: data.target_field,
      match_description: data.match_description,
      close_code: data.close_code,
      platform: data.platform,
      cause: data.cause,
      sub_cause: data.sub_cause,
      resolution_notes: data.resolution_notes
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/create/incident/handling/rule", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      if (response.status === 204) {
        return;
      }
    } catch (error) {
      console.error("Erro ao criar plantão:", error);
      throw error;
    }
  },
  aprooveSolicitation: async (data: {id: string, aprooval: boolean}): Promise<{id: string, aprooval: boolean}> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        id: data.id,
        managerAprooved: data.aprooval
    });

    const requestOptions = {
      method: "PATCH",
      headers: myHeaders,
      body: raw
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/aproove/incident/handling/rule", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      if (response.status === 204) {
        return;
      }
    } catch (error) {
      console.error("Erro ao criar plantão:", error);
      throw error;
    }
  },
  delete: async (data: {id: string}): Promise<{id: string}> => {
    const userToken = localStorage.getItem("userToken"); // use a mesma chave que você usa no login
    const userId = localStorage.getItem("userId"); // use a mesma chave que você usa no login

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${userToken}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        id: data.id
    });

    const requestOptions = {
      method: "DELETE",
      headers: myHeaders,
      body: raw
    };

    try {
      const response = await fetch("http://10.151.1.54:8000/v1/delete/incident/handling/rule", requestOptions);

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      if (response.status === 204) {
        return;
      }
    } catch (error) {
      console.error("Erro ao criar plantão:", error);
      throw error;
    }
  },

};