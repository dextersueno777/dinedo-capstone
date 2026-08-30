'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getMe,
  login as loginRequest,
  register as registerRequest,
  type LoginPayload,
  type RegisterPayload,
} from '@/lib/auth-api';
import type { AuthUser } from '@/lib/api-types';
import {
  clearAccessToken,
  getAccessToken,
  saveAccessToken,
} from '@/lib/auth-storage';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = getAccessToken();

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    getMe(savedToken)
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        clearAccessToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function login(payload: LoginPayload) {
    const response = await loginRequest(payload);

    saveAccessToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);

    return response.user;
  }

  async function register(payload: RegisterPayload) {
    const response = await registerRequest(payload);

    saveAccessToken(response.accessToken);
    setToken(response.accessToken);
    setUser(response.user);

    return response.user;
  }

  function logout() {
    clearAccessToken();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
