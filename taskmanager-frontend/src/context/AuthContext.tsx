'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  demoUsers: User[];
  isDemo: boolean;
  signInWithGoogle: () => Promise<void>;
  switchDemoUser: (user: User) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  // Fetch demo users for the reviewer switcher
  useEffect(() => {
    api.getDemoUsers()
      .then(res => {
        if (res && res.users) {
          setDemoUsers(res.users);
        }
      })
      .catch(err => console.log('Notice: Backend not yet connected or initializing demo users:', err.message));
  }, []);

  // Listen to Supabase Auth State
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const accessToken = session.access_token;
          setToken(accessToken);
          setIsDemo(false);

          // Get profile from backend or sync
          try {
            const profileRes = await api.getCurrentUser(accessToken);
            setUser(profileRes.user);
          } catch (e) {
            // Profile will be auto-created on next request
            const meta = session.user.user_metadata || {};
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'User',
              avatar_url: meta.avatar_url || meta.picture || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        const accessToken = session.access_token;
        setToken(accessToken);
        setIsDemo(false);
        try {
          const profileRes = await api.getCurrentUser(accessToken);
          setUser(profileRes.user);
        } catch (e) {
          const meta = session.user.user_metadata || {};
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: meta.full_name || meta.name || session.user.email?.split('@')[0] || 'User',
            avatar_url: meta.avatar_url || meta.picture || '',
          });
        }
      } else {
        // If not in demo mode, clear user
        if (!isDemo) {
          setUser(null);
          setToken(null);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemo]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      alert(`Google Sign-In notice: ${err.message || 'Could not connect to Google OAuth provider'}. You can also use Demo Reviewer Mode below!`);
      setLoading(false);
    }
  };

  const switchDemoUser = (selectedUser: User) => {
    setIsDemo(true);
    const demoToken = `demo:${selectedUser.email}:${selectedUser.full_name}`;
    setToken(demoToken);
    setUser(selectedUser);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    setIsDemo(false);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await api.getCurrentUser(token);
      setUser(res.user);
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoUsers,
        isDemo,
        signInWithGoogle,
        switchDemoUser,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
