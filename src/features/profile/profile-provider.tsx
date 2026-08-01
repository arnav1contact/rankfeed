import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabaseProfileRepository } from '@/src/data/supabase-profile-repository';
import type { AccountProfile } from '@/src/data/repositories';
import { useAuth } from '@/src/features/auth/auth-provider';
import { getSupabaseClient } from '@/src/lib/supabase';

type EditableProfile = Omit<AccountProfile, 'id'>;

type ProfileContextValue = {
  error?: string;
  isDeleting: boolean;
  isLoading: boolean;
  isSaving: boolean;
  profile: AccountProfile | null;
  clearError: () => void;
  deleteAccount: () => Promise<void>;
  updateProfile: (input: EditableProfile) => Promise<AccountProfile>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function messageFrom(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return 'That username is already taken. Try another one.';
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function ProfileProvider({ children }: PropsWithChildren) {
  const { isConfigured, user } = useAuth();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!isConfigured || !user) {
      setProfile(null);
      setIsLoading(false);
      setError(undefined);
      return;
    }
    let active = true;
    setIsLoading(true);
    supabaseProfileRepository.getProfile(user.id)
      .then((nextProfile) => { if (active) setProfile(nextProfile); })
      .catch((caught: unknown) => { if (active) setError(messageFrom(caught)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isConfigured, user]);

  const updateProfile = useCallback(async (input: EditableProfile) => {
    setIsSaving(true);
    setError(undefined);
    try {
      const updated = await supabaseProfileRepository.updateProfile(input);
      setProfile(updated);
      return updated;
    } catch (caught) {
      const nextError = messageFrom(caught);
      setError(nextError);
      throw new Error(nextError);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) throw new Error('No signed-in account to delete.');
    setIsDeleting(true);
    setError(undefined);
    try {
      const client = getSupabaseClient();
      const { error: functionError } = await client.functions.invoke('delete-account', { method: 'DELETE' });
      if (functionError) throw functionError;
      await client.auth.signOut({ scope: 'local' });
      setProfile(null);
    } catch (caught) {
      const nextError = messageFrom(caught);
      setError(nextError);
      throw new Error(nextError);
    } finally {
      setIsDeleting(false);
    }
  }, [user]);

  const value = useMemo<ProfileContextValue>(() => ({
    clearError: () => setError(undefined),
    deleteAccount,
    error,
    isDeleting,
    isLoading,
    isSaving,
    profile,
    updateProfile,
  }), [deleteAccount, error, isDeleting, isLoading, isSaving, profile, updateProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useAccountProfile() {
  const value = useContext(ProfileContext);
  if (!value) throw new Error('useAccountProfile must be used inside ProfileProvider.');
  return value;
}
