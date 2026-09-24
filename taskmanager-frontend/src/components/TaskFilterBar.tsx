'use client';

import React from 'react';
import { TaskFilterOptions, TaskPriority, TaskStatus } from '@/types';
import { Search, LayoutGrid, List, Filter } from 'lucide-react';

interface TaskFilterBarProps {
  filters: TaskFilterOptions;
  viewMode: 'kanban' | 'list';
  onFilterChange: (newFilters: Partial<TaskFilterOptions>) => void;
  onViewModeChange: (mode: 'kanban' | 'list') => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filters,
  viewMode,
  onFilterChange,
  onViewModeChange,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 mb-6 shadow-sm space-y-3.5">
      {/* Top row: Search + View Mode */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-lg self-end sm:self-auto">
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        {/* Ownership Filter */}
        <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-0.5 text-xs">
          {(['all', 'assigned_to_me', 'created_by_me'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onFilterChange({ filter: tab })}
              className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${
                (filters.filter || 'all') === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1.5 ml-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onFilterChange({ priority: e.target.value as TaskPriority | 'all' })}
            className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy || 'created_at'}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at">Date Created</option>
            <option value="due_date">Due Date</option>
            <option value="title">Task Title</option>
          </select>
        </div>
      </div>
    </div>
  );
};
