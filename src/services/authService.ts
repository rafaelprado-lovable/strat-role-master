interface LoginResponse {
  userToken: string;
  userId: string;
  name: string;
  email: string;
  departament: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch('http://10.151.1.54:8000/v1/create/authorization/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || 'Falha ao autenticar');
    }

    // Persist auth data
    if (data.userToken) {
      localStorage.setItem('userToken', data.userToken);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userName', data.name);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('departaments', data.departament);
    }

    return data;
  },

  logout: () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('departaments');
    localStorage.removeItem('userFunction');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('userToken');
  },

  getUserName: (): string => {
    return localStorage.getItem('userName') || '';
  },

  getUserEmail: (): string => {
    return localStorage.getItem('userEmail') || '';
  },
};
