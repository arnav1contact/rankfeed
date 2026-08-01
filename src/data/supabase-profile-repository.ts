import type { AccountProfile, ProfileRepository } from './repositories';
import { getSupabaseClient } from '@/src/lib/supabase';

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
};

function mapProfile(row: ProfileRow): AccountProfile {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_path ?? undefined,
  };
}

export const supabaseProfileRepository: ProfileRepository = {
  async getProfile(userId) {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('id, handle, display_name, bio, avatar_path')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProfile(data as ProfileRow) : null;
  },
  async updateProfile(input) {
    const client = getSupabaseClient();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Sign in before updating your profile.');
    const { data, error } = await client
      .from('profiles')
      .update({
        avatar_path: input.avatarUrl ?? null,
        bio: input.bio?.trim() || null,
        display_name: input.displayName.trim(),
        handle: input.handle.trim().toLowerCase(),
      })
      .eq('id', authData.user.id)
      .select('id, handle, display_name, bio, avatar_path')
      .single();
    if (error) throw error;
    return mapProfile(data as ProfileRow);
  },
  async follow(profileId) {
    const client = getSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error('Sign in before following a creator.');
    const { error } = await client.from('follows').upsert({ followed_id: profileId, follower_id: data.user.id });
    if (error) throw error;
  },
  async unfollow(profileId) {
    const client = getSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error('Sign in before changing follows.');
    const { error } = await client.from('follows').delete().eq('followed_id', profileId).eq('follower_id', data.user.id);
    if (error) throw error;
  },
  async block(profileId) {
    const client = getSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error('Sign in before blocking a creator.');
    const { error } = await client.from('blocks').upsert({ blocked_id: profileId, blocker_id: data.user.id });
    if (error) throw error;
  },
  async unblock(profileId) {
    const client = getSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error('Sign in before changing blocks.');
    const { error } = await client.from('blocks').delete().eq('blocked_id', profileId).eq('blocker_id', data.user.id);
    if (error) throw error;
  },
};
