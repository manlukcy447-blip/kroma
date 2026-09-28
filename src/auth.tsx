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

export interface ImpersonationInfo {
  userId: string;
  userEmail: string;
  adminEmail: string;
  startedAt: number;
}

const IMPERSONATE_KEY = 'kroma_impersonating';

export const getImpersonationData = (): ImpersonationInfo | null => {
  try {
    const raw = sessionStorage.getItem(IMPERSONATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setImpersonationSession = (token: string, user: AuthUser, adminEmail?: string) => {
  setStoredToken(token);
  try {
    sessionStorage.setItem(IMPERSONATE_KEY, JSON.stringify({
      userId: user.id,
      userEmail: user.email,
      adminEmail: adminEmail || 'admin@kroma.io',
      startedAt: Date.now()
    }));
  } catch {}
};

export const clearImpersonationSession = () => {
  try {
    sessionStorage.removeItem(IMPERSONATE_KEY);
  } catch {}
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  impersonation: ImpersonationInfo | null;
  login: (email:string, password:string) => Promise<void>;
  signup: (email:string, password:string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  loginAsUser: (token: string, user: AuthUser, adminEmail?: string) => void;
  exitImpersonation: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const api = (p:string) => `${API}${p}`;

export const AuthProvider:React.FC<{children:React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<AuthUser|null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonation, setImpersonation] = useState<ImpersonationInfo | null>(() => getImpersonationData());

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
      setImpersonation(getImpersonationData());
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
    clearImpersonationSession();
    setImpersonation(null);
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
    clearImpersonationSession();
    setImpersonation(null);
    setUser(d.user);
  };

  const loginAsUser = (token: string, targetUser: AuthUser, adminEmail?: string) => {
    setImpersonationSession(token, targetUser, adminEmail);
    setImpersonation(getImpersonationData());
    setUser(targetUser);
  };

  const exitImpersonation = async () => {
    clearImpersonationSession();
    setStoredToken(null);
    setImpersonation(null);
    await fetch(api('/api/admin/exit-impersonation'), { method: 'POST', credentials: 'include' }).catch(() => {});
    await authFetch(api('/api/auth/logout'), { method: 'POST' }).catch(() => {});
    setUser(null);
    // Navigate back to admin console
    window.location.href = '/admin';
  };

  const logout = async () => {
    clearImpersonationSession();
    setImpersonation(null);
    setStoredToken(null);
    await authFetch(api('/api/auth/logout'), { method: 'POST' }).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, impersonation, login, signup, logout, refresh, loginAsUser, exitImpersonation }}>
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
