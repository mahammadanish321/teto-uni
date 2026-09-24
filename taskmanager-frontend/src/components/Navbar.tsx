'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { CheckSquare, LogOut, Plus, User as UserIcon, Users } from 'lucide-react';

interface NavbarProps {
  onNewTask: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewTask }) => {
  const { user, isDemo, demoUsers, switchDemoUser, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight">
                TaskHub
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Hairdrama Tech
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {user && (
              <>
                {/* Demo User Switcher */}
                <div className="relative flex items-center">
                  <span className="hidden md:flex items-center text-xs font-medium text-zinc-500 mr-2">
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Switch User:
                  </span>
                  <select
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
                    value={user.email}
                    onChange={(e) => {
                      const selected = demoUsers.find((u) => u.email === e.target.value);
                      if (selected) switchDemoUser(selected);
                    }}
                  >
                    <option value={user.email} disabled>
                      {user.full_name} ({user.email})
                    </option>
                    {demoUsers.map((u) => (
                      <option key={u.id} value={u.email}>
                        {u.full_name} ({u.email.split('@')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Create Task Button */}
                <button
                  onClick={onNewTask}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Task</span>
                </button>

                {/* User Profile Card */}
                <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-zinc-200 dark:border-zinc-800">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}

                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">
                      {user.full_name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none truncate max-w-[120px]">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
