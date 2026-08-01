import type { FeedPost } from '@/src/features/feed/types';
import type { CompletedPlay, CreateRankingInput, LocalComment } from '@/src/features/rankings/types';
import { getSupabaseClient } from '@/src/lib/supabase';
import type { CursorPage, FeedQuery, FeedRepository, SocialRepository, SocialSnapshot } from './repositories';

const palettes = [
  { backgroundColor: '#31245C', accentColor: '#A8F0C6' },
  { backgroundColor: '#3A1D22', accentColor: '#FFCB6B' },
  { backgroundColor: '#123E3B', accentColor: '#7FE3D5' },
  { backgroundColor: '#203051', accentColor: '#9CC5FF' },
  { backgroundColor: '#432B1E', accentColor: '#FFB36B' },
] as const;

type CountRelation = { count: number }[];
type ProfileRow = { id: string; handle: string; display_name: string };
type PostItemRow = { label: string; result_position: number | null; source_position: number };
type FeedRow = {
  id: string;
  template_id: string | null;
  creator_id: string;
  format: FeedPost['kind'];
  title: string;
  topic: string;
  caption: string | null;
  published_at: string;
  profiles: ProfileRow | ProfileRow[] | null;
  post_items: PostItemRow[] | null;
  likes: CountRelation | null;
  comments: CountRelation | null;
};

function stableNumber(value: string) {
  return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function initials(value: string) {
  return value.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'RF';
}

function singleProfile(value: FeedRow['profiles']): ProfileRow | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapFeedRow(row: FeedRow): FeedPost {
  const profile = singleProfile(row.profiles);
  const items = [...(row.post_items ?? [])].sort((left, right) => left.source_position - right.source_position);
  const palette = palettes[stableNumber(row.id) % palettes.length];
  const creatorName = profile?.display_name ?? 'Rankfeed creator';
  const shared = {
    id: row.id,
    templateId: row.template_id ?? row.id,
    creator: {
      id: row.creator_id,
      displayName: creatorName,
      handle: `@${profile?.handle ?? 'creator'}`,
      avatarLabel: initials(creatorName),
    },
    caption: row.caption ?? 'Freshly published on Rankfeed.',
    topic: `${row.topic} · ${row.format === 'blind-ranking' ? 'Blind ranking' : row.format === 'bracket' ? 'Bracket' : 'Completed ranking'}`,
    title: row.title,
    engagement: {
      likes: row.likes?.[0]?.count ?? 0,
      comments: row.comments?.[0]?.count ?? 0,
      saves: 0,
      shares: 0,
    },
    visual: { ...palette, emoji: '✨' },
  } as const;

  if (row.format === 'bracket') {
    const participants = items.map((item) => item.label);
    return {
      ...shared,
      kind: 'bracket',
      matchup: [participants[0] ?? 'First pick', participants[1] ?? 'Second pick'],
      participants,
      roundLabel: 'Opening round · Match 1',
    };
  }

  if (row.format === 'completed-result') {
    const ranked = [...items].sort((left, right) => (left.result_position ?? 100) - (right.result_position ?? 100));
    return {
      ...shared,
      kind: 'completed-result',
      resultItems: ranked.slice(0, 5).map((item, index) => ({ label: item.label, rank: item.result_position ?? index + 1 })),
    };
  }

  const labels = items.map((item) => item.label);
  return {
    ...shared,
    kind: 'blind-ranking',
    currentItem: labels[0] ?? 'First pick',
    items: labels,
    progressLabel: `Item 1 of ${Math.min(labels.length, 5) || 5}`,
    slotCount: Math.min(Math.max(labels.length, 2), 5),
  };
}

function normalizeItems(input: CreateRankingInput) {
  const clean = input.items.map((item) => item.trim()).filter(Boolean).slice(0, 24);
  if (input.format === 'bracket') {
    const size = clean.length <= 2 ? 2 : clean.length <= 4 ? 4 : clean.length <= 8 ? 8 : 16;
    const fallbacks = Array.from({ length: size }, (_, index) => `Wildcard ${index + 1}`);
    return [...clean, ...fallbacks].slice(0, size);
  }
  if (clean.length > 0) return clean;
  return input.format === 'completed-result'
    ? ['First place', 'Second place', 'Third place']
    : ['First pick', 'Second pick', 'Third pick', 'Fourth pick', 'Fifth pick'];
}

async function getPost(postId: string) {
  const { data, error } = await getSupabaseClient()
    .from('posts')
    .select('id, template_id, creator_id, format, title, topic, caption, published_at, profiles!posts_creator_id_fkey(id, handle, display_name), post_items(label, source_position, result_position), likes(count), comments(count)')
    .eq('id', postId)
    .single();
  if (error) throw error;
  return mapFeedRow(data as unknown as FeedRow);
}

export const supabaseFeedRepository = {
  async getFeed(query: FeedQuery): Promise<CursorPage<FeedPost>> {
    const client = getSupabaseClient();
    let creatorIds: string[] | undefined;
    if (query.mode === 'following') {
      const { data: follows, error: followsError } = await client.from('follows').select('followed_id');
      if (followsError) throw followsError;
      creatorIds = (follows ?? []).map((row) => row.followed_id as string);
      if (creatorIds.length === 0) return { items: [] };
    }

    let request = client
      .from('posts')
      .select('id, template_id, creator_id, format, title, topic, caption, published_at, profiles!posts_creator_id_fkey(id, handle, display_name), post_items(label, source_position, result_position), likes(count), comments(count)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(query.limit);
    if (query.cursor) request = request.lt('published_at', query.cursor);
    if (creatorIds) request = request.in('creator_id', creatorIds);
    const { data, error } = await request;
    if (error) throw error;
    const rows = (data ?? []) as unknown as FeedRow[];
    return {
      items: rows.map(mapFeedRow),
      nextCursor: rows.length === query.limit ? rows.at(-1)?.published_at : undefined,
    };
  },
  getPost,
} satisfies FeedRepository;

export const supabaseRankingRepository = {
  async createPublished(input: CreateRankingInput): Promise<FeedPost> {
    const { data, error } = await getSupabaseClient().rpc('create_published_ranking', {
      p_caption: 'Freshly published. How would you rank it?',
      p_format: input.format,
      p_items: normalizeItems(input),
      p_title: input.title.trim(),
      p_topic: input.topic.trim(),
    });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('The published ranking did not return an id.');
    return getPost(data);
  },
  async completeSession(postId: string, rankedItems: readonly string[]): Promise<string> {
    const { data, error } = await getSupabaseClient().rpc('complete_ranking_session', {
      p_post_id: postId,
      p_ranked_labels: [...rankedItems],
    });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('The completed ranking did not return a session id.');
    return data;
  },
  async listCompletedSessions(userId: string): Promise<CompletedPlay[]> {
    const { data, error } = await getSupabaseClient()
      .from('ranking_sessions')
      .select('id, post_id, completed_at, posts(id, template_id, format, title, topic), ranking_placements(rank, post_items(label))')
      .eq('player_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    type SessionRow = {
      id: string;
      post_id: string;
      completed_at: string;
      posts: { id: string; template_id: string | null; format: 'blind-ranking' | 'bracket'; title: string; topic: string } | { id: string; template_id: string | null; format: 'blind-ranking' | 'bracket'; title: string; topic: string }[];
      ranking_placements: { rank: number; post_items: { label: string } | { label: string }[] }[];
    };
    return ((data ?? []) as unknown as SessionRow[]).flatMap((row) => {
      const post = Array.isArray(row.posts) ? row.posts[0] : row.posts;
      if (!post) return [];
      const rankedItems = [...row.ranking_placements]
        .sort((left, right) => left.rank - right.rank)
        .map((placement) => Array.isArray(placement.post_items) ? placement.post_items[0]?.label : placement.post_items?.label)
        .filter((label): label is string => Boolean(label));
      return [{
        id: row.id,
        sourceId: row.post_id,
        templateId: post.template_id ?? row.post_id,
        title: post.title,
        topic: post.topic,
        kind: post.format,
        rankedItems,
        completedAt: row.completed_at,
        ownerId: userId,
        syncState: 'synced' as const,
      }];
    });
  },
  async remove(postId: string) {
    const { error } = await getSupabaseClient().from('posts').delete().eq('id', postId);
    if (error) throw error;
  },
};

export const supabaseSocialRepository = {
  async getSnapshot(userId: string): Promise<SocialSnapshot> {
    const client = getSupabaseClient();
    const [likes, saves, follows] = await Promise.all([
      client.from('likes').select('post_id').eq('user_id', userId),
      client.from('saves').select('post_id').eq('user_id', userId),
      client.from('follows').select('followed_id').eq('follower_id', userId),
    ]);
    if (likes.error) throw likes.error;
    if (saves.error) throw saves.error;
    if (follows.error) throw follows.error;
    return {
      likedPostIds: (likes.data ?? []).map((row) => row.post_id as string),
      savedPostIds: (saves.data ?? []).map((row) => row.post_id as string),
      followedCreatorIds: (follows.data ?? []).map((row) => row.followed_id as string),
    };
  },
  async like(userId: string, postId: string) {
    const { error } = await getSupabaseClient().from('likes').upsert({ post_id: postId, user_id: userId });
    if (error) throw error;
  },
  async unlike(userId: string, postId: string) {
    const { error } = await getSupabaseClient().from('likes').delete().eq('user_id', userId).eq('post_id', postId);
    if (error) throw error;
  },
  async save(userId: string, postId: string) {
    const { error } = await getSupabaseClient().from('saves').upsert({ post_id: postId, user_id: userId });
    if (error) throw error;
  },
  async unsave(userId: string, postId: string) {
    const { error } = await getSupabaseClient().from('saves').delete().eq('user_id', userId).eq('post_id', postId);
    if (error) throw error;
  },
  async follow(userId: string, profileId: string) {
    const { error } = await getSupabaseClient().from('follows').upsert({ followed_id: profileId, follower_id: userId });
    if (error) throw error;
  },
  async unfollow(userId: string, profileId: string) {
    const { error } = await getSupabaseClient().from('follows').delete().eq('follower_id', userId).eq('followed_id', profileId);
    if (error) throw error;
  },
  async listComments(postId: string): Promise<CursorPage<LocalComment>> {
    const client = getSupabaseClient();
    const { data: userData } = await client.auth.getUser();
    const { data, error } = await client.from('comments').select('id, body, created_at, author_id, profiles!comments_author_id_fkey(display_name)').eq('post_id', postId).is('deleted_at', null).order('created_at');
    if (error) throw error;
    const items = (data ?? []).map((row) => {
      const related = row.profiles as unknown as { display_name?: string } | { display_name?: string }[] | null;
      const authorName = (Array.isArray(related) ? related[0]?.display_name : related?.display_name) ?? 'Rankfeed creator';
      return {
        id: row.id as string,
        text: row.body as string,
        createdAt: row.created_at as string,
        authorName,
        avatarLabel: initials(authorName),
        isOwn: row.author_id === userData.user?.id,
      };
    });
    return { items };
  },
  async addComment(userId: string, postId: string, text: string): Promise<LocalComment> {
    const { data, error } = await getSupabaseClient().from('comments').insert({ author_id: userId, body: text, post_id: postId }).select('id, body, created_at').single();
    if (error) throw error;
    return { id: data.id as string, text: data.body as string, createdAt: data.created_at as string, authorName: 'You', avatarLabel: 'YO', isOwn: true };
  },
  async removeComment(commentId: string) {
    const { error } = await getSupabaseClient().from('comments').delete().eq('id', commentId);
    if (error) throw error;
  },
} satisfies SocialRepository;

export function isRemoteId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
