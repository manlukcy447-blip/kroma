import React, { createContext, useContext, useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';
export type AuthUser = { id:string; email:string; status:string; kycStatus:string; createdAt:string };

const TOKEN_KEY = 'kroma_auth_token';
export const getStoredToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setStoredToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
};

export const authFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const token = getStoredToken();
  const headers = new Headers(init?.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email:string, password:string) => Promise<void>;
  signup: (email:string, password:string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const api = (p:string) => `${API}${p}`;

export const AuthProvider:React.FC<{children:React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<AuthUser|null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const r = await authFetch(api('/api/auth/me'));
      if (r.ok) {
        const d = await r.json();
        setUser(d.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email:string, password:string) => {
    const r = await fetch(api('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Unable to sign in');
    if (d.token) {
      setStoredToken(d.token);
    }
    setUser(d.user);
  };

  const signup = async (email:string, password:string) => {
    const r = await fetch(api('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Unable to create account');
    if (d.token) {
      setStoredToken(d.token);
    }
    setUser(d.user);
  };

  const logout = async () => {
    setStoredToken(null);
    await authFetch(api('/api/auth/logout'), { method: 'POST' }).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};

export const apiUrl = api;
