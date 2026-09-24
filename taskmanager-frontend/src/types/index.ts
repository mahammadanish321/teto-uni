export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string;
  creator?: User;
  assigned_to: string | null;
  assignee?: User | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  assigned_to_me: number;
  created_by_me: number;
}

export interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  filter?: 'all' | 'assigned_to_me' | 'created_by_me';
  priority?: TaskPriority | 'all';
  search?: string;
  sortBy?: 'created_at' | 'due_date' | 'priority' | 'title';
  order?: 'asc' | 'desc';
}
