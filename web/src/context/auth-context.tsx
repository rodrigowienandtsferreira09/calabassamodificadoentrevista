'use client';

import api, { setBearer } from '@/lib/api';
import type { AuthResponse, User } from '@/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

async function restoreSession(): Promise<User | null> {
  try {
    const { data } = await api.post<{ token?: string }>('/auth/refresh');
    if (!data.token) return null;
    setBearer(data.token);
    const me = await api.get<User>('/users/me');
    return me.data;
  } catch {
    setBearer(null);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession().then((restored) => {
      setUser(restored);
      setLoading(false);
    });
  }, []);

  async function signIn(email: string, password: string) {
    const { data } = await api.post<AuthResponse>('/login', { email, password });
    if (!data.token || !data.user) throw new Error('Resposta do servidor sem sessão válida.');
    setBearer(data.token);
    setUser(data.user);
  }

  async function refreshUser() {
    const { data } = await api.get<User>('/users/me').catch(() => ({ data: user }));
    setUser(data);
  }

  async function signOut() {
    await api.post('/auth/logout').catch(() => undefined);
    setBearer(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
