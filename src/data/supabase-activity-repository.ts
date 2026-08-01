import type { ActivityKind, ActivityNotification } from '@/src/features/activity/types';
import { getSupabaseClient } from '@/src/lib/supabase';
import type { CursorPage } from './repositories';

type NotificationRow = {
  id: string;
  kind: ActivityKind;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  profiles: { id: string; display_name: string; handle: string } | null;
  posts: { id: string; title: string } | null;
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'RF';
}

function parseCursor(cursor: string): { createdAt: string; id?: string } {
  try {
    const parsed = JSON.parse(cursor) as { id?: string; createdAt?: string };
    if (parsed.id && parsed.createdAt) return parsed as { id: string; createdAt: string };
  } catch {
    // Timestamp-only cursors from development builds remain readable.
  }
  return { createdAt: cursor };
}

function mapNotification(row: NotificationRow): ActivityNotification {
  const actorName = row.profiles?.display_name;
  return {
    id: row.id,
    kind: row.kind,
    actor: row.profiles && actorName ? {
      avatarLabel: initials(actorName),
      displayName: actorName,
      handle: `@${row.profiles.handle}`,
      id: row.profiles.id,
    } : undefined,
    postId: row.post_id ?? undefined,
    postTitle: row.posts?.title ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  };
}

export const supabaseActivityRepository = {
  async countUnread() {
    const { count, error } = await getSupabaseClient().from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  },

  async list(limit: number, cursor?: string): Promise<CursorPage<ActivityNotification>> {
    let request = getSupabaseClient()
      .from('notifications')
      .select('id, kind, post_id, read_at, created_at, profiles!notifications_actor_id_fkey(id, display_name, handle), posts(id, title)')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);
    if (cursor) {
      const parsed = parseCursor(cursor);
      request = parsed.id
        ? request.or(`created_at.lt.${parsed.createdAt},and(created_at.eq.${parsed.createdAt},id.lt.${parsed.id})`)
        : request.lt('created_at', parsed.createdAt);
    }
    const { data, error } = await request;
    if (error) throw error;
    const rows = (data ?? []) as unknown as NotificationRow[];
    const last = rows.at(-1);
    return {
      items: rows.map(mapNotification),
      nextCursor: rows.length === limit && last ? JSON.stringify({ createdAt: last.created_at, id: last.id }) : undefined,
    };
  },

  async markRead(notificationId: string) {
    const { error } = await getSupabaseClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId);
    if (error) throw error;
  },

  async markAllRead() {
    const { error } = await getSupabaseClient().from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
    if (error) throw error;
  },
};
