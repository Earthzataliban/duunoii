'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User, LoginData, RegisterData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = AuthService.getToken();
        if (token) {
          const userProfile = await AuthService.getProfile();
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        AuthService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(data);
      setUser(result.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const result = await AuthService.register(data);
      setUser(result.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}