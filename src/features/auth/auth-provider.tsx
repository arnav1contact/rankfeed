import { makeRedirectUri } from 'expo-auth-session';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { isBackendConfigured } from '@/src/config/environment';
import { getSupabaseClient } from '@/src/lib/supabase';

type AuthContextValue = {
  error: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  clearError: () => void;
  completeSessionFromUrl: (url: string) => Promise<boolean>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isBackendConfigured);
  const [error, setError] = useState<string | null>(null);

  const completeSessionFromUrl = useCallback(async (url: string) => {
    if (!isBackendConfigured) return false;
    const { params } = getQueryParams(url);
    const authError = params.error_description ?? params.error;
    if (authError) {
      setError(authError);
      return false;
    }

    try {
      const supabase = getSupabaseClient();
      if (params.code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) throw exchangeError;
        setSession(data.session);
        return Boolean(data.session);
      }

      if (!params.access_token || !params.refresh_token) return false;
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) throw sessionError;
      setSession(data.session);
      return Boolean(data.session);
    } catch (caught) {
      setError(messageFrom(caught));
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isBackendConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!isBackendConfigured) throw new Error('Connect Supabase in .env before signing in.');
    setError(null);
    try {
      const redirectTo = makeRedirectUri({ path: 'auth/callback', scheme: 'rankfeed' });
      const { error: signInError } = await getSupabaseClient().auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo },
      });
      if (signInError) throw signInError;
    } catch (caught) {
      const nextError = messageFrom(caught);
      setError(nextError);
      throw new Error(nextError);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!isBackendConfigured) return;
    setError(null);
    const { error: signOutError } = await getSupabaseClient().auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    clearError: () => setError(null),
    completeSessionFromUrl,
    error,
    isConfigured: isBackendConfigured,
    isLoading,
    sendMagicLink,
    session,
    signOut,
    user: session?.user ?? null,
  }), [completeSessionFromUrl, error, isLoading, sendMagicLink, session, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
