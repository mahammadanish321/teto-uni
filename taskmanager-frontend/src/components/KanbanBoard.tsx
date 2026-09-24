'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import { Clock, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onNewTask: (initialStatus?: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onNewTask,
}) => {
  const columns: {
    status: TaskStatus;
    title: string;
    icon: React.ElementType;
    color: string;
    badgeBg: string;
    headerBorder: string;
  }[] = [
    {
      status: 'pending',
      title: 'To Do',
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      headerBorder: 'border-t-4 border-amber-500',
    },
    {
      status: 'in_progress',
      title: 'In Progress',
      icon: AlertCircle,
      color: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      headerBorder: 'border-t-4 border-indigo-500',
    },
    {
      status: 'completed',
      title: 'Completed',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      headerBorder: 'border-t-4 border-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            className={`flex flex-col bg-zinc-50/70 dark:bg-zinc-900/40 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-2xs ${col.headerBorder}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <h2 className="font-bold text-sm text-zinc-900 dark:text-white">
                  {col.title}
                </h2>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${col.badgeBg}`}>
                  {columnTasks.length}
                </span>
              </div>

              <button
                onClick={() => onNewTask(col.status)}
                title={`Add task to ${col.title}`}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              {columnTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center p-4">
                  <p className="text-xs text-zinc-400">No tasks in this column</p>
                  <button
                    onClick={() => onNewTask(col.status)}
                    className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Add one
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
