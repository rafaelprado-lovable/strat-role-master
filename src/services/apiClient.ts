const API_BASE_URL = 'http://10.151.1.54:8000';
const API_SECONDARY_URL = 'http://10.151.1.33:8000';

function getAuthHeaders(): HeadersInit {
  const userToken = localStorage.getItem('userToken');
  return {
    'Content-Type': 'application/json',
    ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
  };
}

function getUserId(): string | null {
  return localStorage.getItem('userId');
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const apiClient = {
  /** Primary API base */
  baseUrl: API_BASE_URL,

  /** Secondary API base (10.151.1.33) */
  secondaryUrl: API_SECONDARY_URL,

  /** Get current user ID from localStorage */
  getUserId,

  /** Build authenticated headers */
  getAuthHeaders,

  /** GET request */
  async get<T>(url: string, options?: { baseUrl?: string }): Promise<T> {
    const base = options?.baseUrl ?? API_BASE_URL;
    const response = await fetch(`${base}${url}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },

  /** POST request */
  async post<T>(url: string, body?: unknown, options?: { baseUrl?: string }): Promise<T> {
    const base = options?.baseUrl ?? API_BASE_URL;
    const response = await fetch(`${base}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  /** PATCH request */
  async patch<T>(url: string, body?: unknown, options?: { baseUrl?: string }): Promise<T> {
    const base = options?.baseUrl ?? API_BASE_URL;
    const response = await fetch(`${base}${url}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  /** DELETE request */
  async delete<T>(url: string, body?: unknown, options?: { baseUrl?: string }): Promise<T> {
    const base = options?.baseUrl ?? API_BASE_URL;
    const response = await fetch(`${base}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  /** Raw fetch with auth headers (for non-standard cases) */
  async rawFetch(url: string, options: RequestInit & { baseUrl?: string } = {}): Promise<Response> {
    const base = options.baseUrl ?? API_BASE_URL;
    const { baseUrl: _, ...fetchOptions } = options;
    return fetch(`${base}${url}`, {
      ...fetchOptions,
      headers: {
        ...getAuthHeaders(),
        ...(fetchOptions.headers || {}),
      },
    });
  },

  /** Create an EventSource for SSE */
  createEventSource(path: string, params?: Record<string, string>): EventSource {
    const url = new URL(`${API_BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    }
    return new EventSource(url.toString());
  },
};
