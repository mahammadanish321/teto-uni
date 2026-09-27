import { Task, TaskFilterOptions, TaskStats, User } from '@/types';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://teto-b.onrender.com';
  }
  return 'http://localhost:5000';
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function fetchWithAuth<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    return fetchWithAuth<{ status: string; service: string }>('/api/health');
  },

  // Auth & Users
  getDemoUsers: async (): Promise<{ users: User[] }> => {
    return fetchWithAuth<{ users: User[] }>('/api/auth/demo-users');
  },

  getCurrentUser: async (token: string): Promise<{ user: User }> => {
    return fetchWithAuth<{ user: User }>('/api/auth/me', { token });
  },

  syncProfile: async (token: string, data: { full_name?: string; avatar_url?: string }): Promise<{ user: User }> => {
    return fetchWithAuth<{ user: User }>('/api/auth/sync', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  getUsers: async (token: string): Promise<{ users: User[] }> => {
    return fetchWithAuth<{ users: User[] }>('/api/users', { token });
  },

  // Tasks
  getTasks: async (
    token: string,
    filters: TaskFilterOptions = {}
  ): Promise<{ tasks: Task[]; stats: TaskStats }> => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.filter && filters.filter !== 'all') params.append('filter', filters.filter);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.order) params.append('order', filters.order);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth<{ tasks: Task[]; stats: TaskStats }>(`/api/tasks${qs}`, { token });
  },

  getTask: async (token: string, id: string): Promise<{ task: Task }> => {
    return fetchWithAuth<{ task: Task }>(`/api/tasks/${id}`, { token });
  },

  createTask: async (
    token: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      status?: string;
      due_date?: string | null;
      assigned_to?: string | null;
    }
  ): Promise<{ message: string; task: Task }> => {
    return fetchWithAuth<{ message: string; task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  updateTask: async (
    token: string,
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      due_date?: string | null;
      assigned_to?: string | null;
    }
  ): Promise<{ message: string; task: Task }> => {
    return fetchWithAuth<{ message: string; task: Task }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },

  deleteTask: async (token: string, id: string): Promise<{ message: string; id: string }> => {
    return fetchWithAuth<{ message: string; id: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
      token,
    });
  },
};
