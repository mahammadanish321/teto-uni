'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Task, TaskFilterOptions, TaskPriority, TaskStatus, TaskStats, User } from '@/types';
import { Navbar } from '@/components/Navbar';
import { StatsCards } from '@/components/StatsCards';
import { TaskFilterBar } from '@/components/TaskFilterBar';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskTable } from '@/components/TaskTable';
import { TaskModal } from '@/components/TaskModal';
import { NotificationToast, ToastMessage } from '@/components/NotificationToast';
import {
  CheckSquare,
  Sparkles,
  Mail,
  ShieldCheck,
  Users,
  Database,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function Home() {
  const { user, token, loading: authLoading, demoUsers, signInWithGoogle, switchDemoUser } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    assigned_to_me: 0,
    created_by_me: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filters, setFilters] = useState<TaskFilterOptions>({
    status: 'all',
    filter: 'all',
    priority: 'all',
    search: '',
    sortBy: 'created_at',
    order: 'desc',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch tasks and users
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.getTasks(token, filters),
        api.getUsers(token).catch(() => ({ users: [] })),
      ]);

      setTasks(tasksRes.tasks);
      setStats(tasksRes.stats);
      if (usersRes.users && usersRes.users.length > 0) {
        setUsers(usersRes.users);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      addToast('error', 'Error fetching data', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  // Handle task submission (create or update)
  const handleTaskSubmit = async (data: {
    title: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    assigned_to: string | null;
  }) => {
    if (!token) return;

    if (editingTask) {
      const res = await api.updateTask(token, editingTask.id, data);
      addToast('success', 'Task Updated', `"${res.task.title}" has been updated.`);
    } else {
      const res = await api.createTask(token, data);
      const assignee = users.find((u) => u.id === data.assigned_to);
      const emailMsg = assignee
        ? `Gmail notification sent to ${assignee.email}`
        : 'Task created without assignee';
      addToast('success', 'Task Created', emailMsg);
    }

    loadData();
  };

  // Handle quick status change
  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (!token) return;
    try {
      await api.updateTask(token, task.id, { status: newStatus });
      if (newStatus === 'completed') {
        addToast(
          'success',
          'Task Completed! 🎉',
          `Completion notification sent via Gmail.`
        );
      } else {
        addToast('info', 'Status Updated', `Task moved to ${newStatus.replace('_', ' ')}.`);
      }
      loadData();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async (id: string) => {
    if (!token) return;
    try {
      await api.deleteTask(token, id);
      addToast('success', 'Task Deleted', 'The task has been removed.');
      loadData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Open modal for new task
  const handleNewTask = (initialStatus?: TaskStatus) => {
    setEditingTask(initialStatus ? ({ status: initialStatus } as Task) : null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Loading TaskHub...</p>
        </div>
      </div>
    );
  }

  // Not logged in: Show Landing / Login Page
  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex flex-col justify-between">
        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">
              TaskHub
            </span>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Hairdrama Tech Assignment
          </span>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next.js + TypeScript + Flask + Supabase + Gmail</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight sm:leading-none mb-6">
            Collaborative Task Management <br />
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              with Automated Gmail Alerts
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create tasks, assign them to team members with instant Gmail notifications,
            and monitor task progress through dynamic Kanban boards and real-time updates.
          </p>

          {/* Login Actions */}
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl mb-12">
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center space-x-3 px-6 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 font-semibold text-sm shadow-sm transition-all hover:shadow active:scale-98"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google OAuth</span>
            </button>

            {/* Quick Reviewer Demo Switcher */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-semibold tracking-wider">
                  Reviewer Quick Demo Access
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-3 text-left">
              Select a test persona below to instantly experience user task assignment and notifications:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {demoUsers.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => switchDemoUser(demo)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 hover:border-blue-500 dark:hover:border-blue-500 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-left transition-all group"
                >
                  <div className="flex items-center space-x-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={demo.avatar_url}
                      alt={demo.full_name}
                      className="w-7 h-7 rounded-full border border-zinc-200 dark:border-zinc-700"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {demo.full_name}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {demo.email}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
              <h3 className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">
                Google OAuth
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Secure authentication handled by Supabase Auth with Google OAuth 2.0.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <Mail className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">
                Gmail Integration
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Asynchronous email notifications sent on task creation, assignment, and completion.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <Database className="w-5 h-5 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">
                Supabase & Flask
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                PostgreSQL database with Row Level Security, triggers, and modular Flask API backend.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <Users className="w-5 h-5 text-purple-600 mb-2" />
              <h3 className="font-semibold text-xs text-zinc-900 dark:text-white mb-1">
                User Assignment
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Assign tasks to colleagues with priority levels, deadlines, and real-time status tracking.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
          Hairdrama Tech Internship Assignment • Built with Next.js & Flask
        </footer>
      </div>
    );
  }

  // Logged in: Main Dashboard
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-900 dark:text-zinc-100">
      <Navbar onNewTask={() => handleNewTask()} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Welcome back, {user.full_name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage your tasks, assign work to team members, and monitor progress.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Tasks"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-2xs transition-all active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => handleNewTask()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
            >
              + Create Task
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <StatsCards
          stats={stats}
          activeFilter={filters.status || 'all'}
          onSelectFilter={(status) => {
            if (status === 'all') {
              setFilters((prev) => ({ ...prev, status: 'all', filter: 'all' }));
            } else if (status === 'assigned_to_me') {
              setFilters((prev) => ({ ...prev, filter: 'assigned_to_me', status: 'all' }));
            } else {
              setFilters((prev) => ({ ...prev, status: status as TaskStatus, filter: 'all' }));
            }
          }}
        />

        {/* Filter & Search Bar */}
        <TaskFilterBar
          filters={filters}
          viewMode={viewMode}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          onViewModeChange={setViewMode}
        />

        {/* View Component: Kanban Board or Table List */}
        {loading && tasks.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-zinc-500 font-medium">Fetching tasks...</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onNewTask={handleNewTask}
          />
        ) : (
          <TaskTable
            tasks={tasks}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        users={users.length > 0 ? users : demoUsers}
        currentUserId={user.id}
      />

      {/* Notification Toast Alert */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
