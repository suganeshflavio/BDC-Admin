'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthResponse } from '@/lib/types';
import { api, getStoredToken, setStoredToken } from '@/lib/api';
import { useToast } from './toast-context';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (options?: boolean | unknown) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'church_admin_user_profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { errorToast, successToast } = useToast();

  const logout = useCallback((options?: boolean | unknown) => {
    setUser(null);
    setTokenState(null);
    setStoredToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    const shouldToast = options === false ? false : true;
    if (shouldToast) {
      successToast('You have been logged out.');
    }
  }, [successToast]);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const storedToken = getStoredToken();
      const storedUserJson = localStorage.getItem(USER_STORAGE_KEY);
      if (storedToken && storedUserJson) {
        const parsedUser = JSON.parse(storedUserJson);
        if (parsedUser?.role === 'admin') {
          setUser(parsedUser);
          setTokenState(storedToken);
        } else {
          logout(false);
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Listen for unauthorized 401 events dispatched from api.ts
  useEffect(() => {
    const handleUnauthorized = () => {
      if (getStoredToken()) {
        errorToast('Session expired. Please sign in again.');
        logout(false);
      }
    };

    window.addEventListener('church-auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('church-auth-unauthorized', handleUnauthorized);
  }, [errorToast, logout]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: AuthResponse = await api.auth.login(email, password);

      // Verify admin role requirement from API PDF:
      // "All /admin/* endpoints require Authorization: Bearer <jwt> for a user with role: 'admin'."
      if (res.user.role !== 'admin') {
        throw new Error('Access denied: User account is not an administrator.');
      }

      setUser(res.user);
      setTokenState(res.token);
      setStoredToken(res.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      successToast(`Welcome back, ${res.user.name || 'Admin'}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      errorToast(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        logout,
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
