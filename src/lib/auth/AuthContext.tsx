import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken, setAccessToken } from '../api/authToken';
import { useCurrentUser, type ApiUser } from '../api/domains/auth';

interface AuthContextValue {
  user: ApiUser | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Adapted from vea-frontend/src/lib/auth/AuthContext.tsx. Same contract
 * and the same "a stored token can be stale — /auth/me failing is the
 * source of truth, not the mere presence of a token" principle, but the
 * initial token check can't happen synchronously in a useState
 * initializer like on web: expo-secure-store's read is async, so there's
 * an extra `checkingToken` beat on mount before hasToken is known.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    getAccessToken().then((token) => {
      setHasToken(token !== null);
      setCheckingToken(false);
    });
  }, []);

  const { data: user, isLoading, isError } = useCurrentUser({ enabled: hasToken });

  const isAuthenticated = hasToken && !isError && (isLoading || user !== undefined);

  async function login(accessToken: string) {
    await setAccessToken(accessToken);
    setHasToken(true);
  }

  async function logout() {
    await setAccessToken(null);
    setHasToken(false);
    queryClient.clear();
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading: checkingToken || (hasToken && isLoading), isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
