'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  MoreVertical,
  Play,
  Trash2,
  Edit2,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

const priorityBadges = {
  urgent: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const isOverdue =
    task.due_date &&
    task.status !== 'completed' &&
    new Date(task.due_date) < new Date();

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs hover:shadow-md transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
      {/* Top Header: Priority badge + Actions */}
      <div className="flex items-center justify-between mb-2.5">
        <span
          className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${
            priorityBadges[task.priority] || priorityBadges.medium
          }`}
        >
          {task.priority}
        </span>

        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(task)}
            title="Edit Task"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Delete Task"
            className="p-1 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h3
        className={`font-semibold text-sm mb-1.5 leading-snug ${
          task.status === 'completed'
            ? 'line-through text-zinc-400 dark:text-zinc-500'
            : 'text-zinc-900 dark:text-white'
        }`}
      >
        {task.title}
      </h3>

      {/* Task Description */}
      {task.description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta Footer */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
        {/* Assignee */}
        <div className="flex items-center space-x-1.5" title={task.assignee ? `Assigned to ${task.assignee.full_name}` : 'Unassigned'}>
          {task.assignee?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={task.assignee.avatar_url}
              alt={task.assignee.full_name}
              className="w-5 h-5 rounded-full border border-zinc-200 dark:border-zinc-700"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
              <UserIcon className="w-3 h-3" />
            </div>
          )}
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-[90px]">
            {task.assignee ? task.assignee.full_name.split(' ')[0] : 'Unassigned'}
          </span>
        </div>

        {/* Due Date */}
        {formattedDate && (
          <div
            className={`flex items-center space-x-1 text-[11px] font-medium ${
              isOverdue
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-red-500" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Quick Status Action Footer */}
      <div className="mt-3 pt-2 flex items-center justify-end">
        {task.status === 'pending' && (
          <button
            onClick={() => onStatusChange(task, 'in_progress')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2 py-1 rounded-md transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>Start</span>
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            onClick={() => onStatusChange(task, 'completed')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 px-2 py-1 rounded-md transition-colors"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Complete</span>
          </button>
        )}
        {task.status === 'completed' && (
          <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Done</span>
          </span>
        )}
      </div>
    </div>
  );
};
