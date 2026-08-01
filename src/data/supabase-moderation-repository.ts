import { getSupabaseClient } from '@/src/lib/supabase';
import type { ModerationRepository, ModerationSnapshot, ReportInput } from './repositories';

export const supabaseModerationRepository: ModerationRepository = {
  async getSnapshot(userId: string): Promise<ModerationSnapshot> {
    const client = getSupabaseClient();
    const [blocks, reports] = await Promise.all([
      client.from('blocks').select('blocked_id').eq('blocker_id', userId),
      client.from('reports').select('target_id').eq('reporter_id', userId).eq('target_type', 'post'),
    ]);
    if (blocks.error) throw blocks.error;
    if (reports.error) throw reports.error;
    return {
      blockedCreatorIds: (blocks.data ?? []).map((row) => row.blocked_id as string),
      reportedPostIds: (reports.data ?? []).map((row) => row.target_id as string),
    };
  },
  async report(input: ReportInput) {
    const client = getSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) throw new Error('Sign in before reporting content.');
    const { error } = await client.from('reports').insert({
      details: input.details?.trim() || null,
      reason: input.reason,
      reporter_id: data.user.id,
      target_id: input.targetId,
      target_type: input.targetType,
    });
    if (error && error.code !== '23505') throw error;
  },
};
