'use client';

import React from 'react';
import { TaskStats } from '@/types';
import { CheckCircle2, Clock, AlertCircle, ListTodo, UserCheck } from 'lucide-react';

interface StatsCardsProps {
  stats: TaskStats;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, activeFilter, onSelectFilter }) => {
  const cards = [
    {
      id: 'all',
      title: 'Total Tasks',
      value: stats.total,
      icon: ListTodo,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200 dark:border-blue-900',
    },
    {
      id: 'pending',
      title: 'To Do',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200 dark:border-amber-900',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      value: stats.in_progress,
      icon: AlertCircle,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderColor: 'border-indigo-200 dark:border-indigo-900',
    },
    {
      id: 'completed',
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
    },
    {
      id: 'assigned_to_me',
      title: 'Assigned to Me',
      value: stats.assigned_to_me,
      icon: UserCheck,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      borderColor: 'border-purple-200 dark:border-purple-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onSelectFilter && onSelectFilter(card.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md ${
              isSelected
                ? 'ring-2 ring-blue-500 border-transparent'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {card.value}
              </span>
              {stats.total > 0 && card.id !== 'all' && (
                <span className="text-xs text-zinc-400">
                  {Math.round((card.value / stats.total) * 100)}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
