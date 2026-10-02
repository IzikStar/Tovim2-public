import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';
import type { MatchMaker } from '../api/types';

interface AuthState {
  /** undefined while the stored token is being checked */
  me: MatchMaker | null | undefined;
  /** True after the user logged out on purpose (vs. an expired session) */
  signedOut: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MatchMaker | null | undefined>(tokenStore.get() ? undefined : null);
  const [signedOut, setSignedOut] = useState(false);

  const clear = useCallback(() => {
    tokenStore.set(null);
    setMe(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setMe(null);
      return;
    }
    try {
      setMe(await api.me());
    } catch {
      clear();
    }
  }, [clear]);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    void refresh();
  }, [clear, refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await api.login(email, password);
    tokenStore.set(token);
    setMe(await api.me());
    setSignedOut(false);
  }, []);

  const logout = useCallback(async () => {
    const revoke = api.logout().catch(() => undefined); // reads the token before clear()
    setSignedOut(true);
    clear();
    await revoke;
  }, [clear]);

  const value = useMemo(() => ({ me, signedOut, login, logout, refresh }), [me, signedOut, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** For pages behind RequireAuth, where `me` is guaranteed. */
export function useMe(): MatchMaker {
  const { me } = useAuth();
  if (!me) throw new Error('useMe used outside a logged-in route');
  return me;
}
