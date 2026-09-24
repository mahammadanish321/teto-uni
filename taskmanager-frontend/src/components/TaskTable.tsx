'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  User as UserIcon,
} from 'lucide-react';

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

const priorityBadges = {
  urgent: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200 dark:border-red-900',
  high: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  low: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
};

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No tasks found matching current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-300">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Task</th>
              <th className="px-5 py-3.5">Priority</th>
              <th className="px-5 py-3.5">Assignee</th>
              <th className="px-5 py-3.5">Due Date</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {tasks.map((task) => {
              const isOverdue =
                task.due_date &&
                task.status !== 'completed' &&
                new Date(task.due_date) < new Date();

              return (
                <tr
                  key={task.id}
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Status selector */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
                      className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="in_progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </td>

                  {/* Title & Description */}
                  <td className="px-5 py-4 max-w-xs">
                    <p
                      className={`font-semibold text-sm ${
                        task.status === 'completed'
                          ? 'line-through text-zinc-400 dark:text-zinc-500'
                          : 'text-zinc-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${
                        priorityBadges[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {task.assignee?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={task.assignee.avatar_url}
                          alt={task.assignee.full_name}
                          className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                          <UserIcon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {task.assignee ? task.assignee.full_name : 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {task.due_date ? (
                      <span
                        className={`inline-flex items-center space-x-1 ${
                          isOverdue
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : 'text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {new Date(task.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${task.title}"?`)) onDeleteTask(task.id);
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
