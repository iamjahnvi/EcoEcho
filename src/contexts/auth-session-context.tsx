import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { getSupabaseClient } from '@/lib/supabase';

type AuthSessionState = {
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<Session | null>;
};

const AuthSessionContext = createContext<AuthSessionState>({
  session: null,
  isLoading: true,
  refreshSession: async () => null,
});

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [supabase] = useState(() => {
    try {
      return getSupabaseClient();
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(supabase !== null);
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await getSupabaseClient().auth.getSession();
      const nextSession = error ? null : data.session;
      setSession(nextSession);
      setIsLoading(false);
      return nextSession;
    } catch {
      setSession(null);
      setIsLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;
    let authEventReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      authEventReceived = true;
      if (!isMounted) return;
      setSession(nextSession);
      setIsLoading(false);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted || authEventReceived) return;
      setSession(error ? null : data.session);
      setIsLoading(false);
    }).catch(() => {
      if (!isMounted || authEventReceived) return;
      setSession(null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(() => ({ session, isLoading, refreshSession }), [session, isLoading, refreshSession]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
