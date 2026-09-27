import { createContext, use, useCallback, useEffect, useState, type PropsWithChildren } from 'react';

import { useRepositories } from '@/core/di/provider';
import { LocalSession } from '@/domain/models/auth';

interface SessionContextValue {
  session: LocalSession | null;
  isLoading: boolean;
  signIn: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const { auth } = useRepositories();
  const [session, setSession] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    auth
      .getSession()
      .then((stored) => {
        if (active) setSession(stored);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth]);

  const signIn = useCallback(
    async (username: string) => {
      const next: LocalSession = { username, createdAt: new Date().toISOString() };
      await auth.saveSession(next);
      setSession(next);
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    await auth.clearSession();
    setSession(null);
  }, [auth]);

  return (
    <SessionContext value={{ session, isLoading, signIn, signOut }}>
      {children}
    </SessionContext>
  );
}

export function useSession(): SessionContextValue {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession debe usarse dentro de <SessionProvider />');
  }
  return value;
}
