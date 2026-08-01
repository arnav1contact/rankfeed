import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { isRemoteId, supabaseFeedRepository, supabaseRankingRepository, supabaseSocialRepository } from '@/src/data/supabase-ranking-repositories';
import { useAuth } from '@/src/features/auth/auth-provider';
import type { FeedPost } from '@/src/features/feed/types';
import { mockFeedPosts } from '@/src/mock-data';
import { shuffleItems } from './random';
import type { CompletedPlay, CreateRankingInput, LocalComment, RankingDraft, RankingOutcome } from './types';

export type { CreateRankingInput, LocalComment, RankingDraft, RankingFormat } from './types';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';

type PersistedRankingState = {
  version: 3;
  createdPosts: FeedPost[];
  completedPlays: CompletedPlay[];
  drafts: RankingDraft[];
  likedPostIds: string[];
  savedPostIds: string[];
  followedCreatorIds: string[];
  commentsByPost: Record<string, LocalComment[]>;
};

type RankingStoreValue = {
  posts: readonly FeedPost[];
  createdPosts: readonly FeedPost[];
  completedPlays: readonly CompletedPlay[];
  drafts: readonly RankingDraft[];
  savedPosts: readonly FeedPost[];
  likedPostIds: readonly string[];
  savedPostIds: readonly string[];
  followedCreatorIds: readonly string[];
  commentsByPost: Readonly<Record<string, readonly LocalComment[]>>;
  isReady: boolean;
  storageError?: string;
  syncError?: string;
  syncStatus: SyncStatus;
  publishRanking: (input: CreateRankingInput) => Promise<FeedPost>;
  publishCompletedPlay: (playId: string) => Promise<FeedPost>;
  recordCompletion: (post: FeedPost, outcome: RankingOutcome) => Promise<CompletedPlay>;
  saveDraft: (draftId: string, input: CreateRankingInput) => RankingDraft;
  deleteDraft: (draftId: string) => void;
  shuffleFeed: () => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (creatorId: string) => void;
  addComment: (postId: string, text: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
};

const STORAGE_KEY = '@rankfeed/app-state/v1';
const RankingStoreContext = createContext<RankingStoreValue | null>(null);

const profileCreator = {
  id: 'creator-you',
  displayName: 'You',
  handle: '@yourrankings',
  avatarLabel: 'YO',
} as const;

function fillItems(items: readonly string[], fallbacks: readonly string[], count: number) {
  return [...items, ...fallbacks].slice(0, count);
}

function toggleId(current: readonly string[], id: string) {
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
}

function mergeIds(localIds: readonly string[], remoteIds: readonly string[]) {
  return [...new Set([...localIds.filter((id) => !isRemoteId(id)), ...remoteIds])];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Cloud sync failed. Your local changes are still available.';
}

function createPost(input: CreateRankingInput): FeedPost {
  const createdAt = Date.now();
  const id = `post-created-${createdAt}`;
  const base = {
    id,
    templateId: `template-created-${createdAt}`,
    creator: profileCreator,
    caption: 'Freshly published. How would you rank it?',
    topic: `${input.topic} · ${input.format === 'blind-ranking' ? 'Blind ranking' : input.format === 'bracket' ? 'Bracket' : 'Completed ranking'}`,
    title: input.title,
    engagement: { likes: 0, comments: 0, saves: 0, shares: 0 },
    visual: { backgroundColor: '#18233C', accentColor: '#C8FF64', emoji: '✨' },
  } as const;

  if (input.format === 'bracket') {
    const participantCount = input.items.length <= 2 ? 2 : input.items.length <= 4 ? 4 : input.items.length <= 8 ? 8 : 16;
    const participants = fillItems(input.items, ['Wildcard one', 'Wildcard two', 'Wildcard three', 'Wildcard four', 'Wildcard five', 'Wildcard six'], participantCount);
    return { ...base, kind: 'bracket', matchup: [participants[0], participants[1]], participants, roundLabel: 'Opening round · Match 1' };
  }

  if (input.format === 'completed-result') {
    const items = input.items.length > 0 ? input.items : ['First place', 'Second place', 'Third place'];
    return { ...base, kind: 'completed-result', resultItems: items.slice(0, 5).map((label, index) => ({ label, rank: index + 1 })) };
  }

  const items = input.items.length > 0 ? input.items.slice(0, 24) : ['First pick', 'Second pick', 'Third pick', 'Fourth pick', 'Fifth pick'];
  return { ...base, kind: 'blind-ranking', currentItem: items[0], items, progressLabel: 'Item 1 of 5', slotCount: 5 };
}

function readPersistedState(value: string | null): PersistedRankingState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Omit<Partial<PersistedRankingState>, 'version'> & { version?: number };
    if (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== 3) return null;
    return {
      version: 3,
      createdPosts: Array.isArray(parsed.createdPosts) ? parsed.createdPosts : [],
      completedPlays: Array.isArray(parsed.completedPlays) ? parsed.completedPlays : [],
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      likedPostIds: Array.isArray(parsed.likedPostIds) ? parsed.likedPostIds : [],
      savedPostIds: Array.isArray(parsed.savedPostIds) ? parsed.savedPostIds : [],
      followedCreatorIds: Array.isArray(parsed.followedCreatorIds) ? parsed.followedCreatorIds : [],
      commentsByPost: parsed.commentsByPost && typeof parsed.commentsByPost === 'object' ? parsed.commentsByPost : {},
    };
  } catch {
    return null;
  }
}

export function RankingStoreProvider({ children }: PropsWithChildren) {
  const { isConfigured, user } = useAuth();
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => [...mockFeedPosts]);
  const [createdPosts, setCreatedPosts] = useState<FeedPost[]>([]);
  const [completedPlays, setCompletedPlays] = useState<CompletedPlay[]>([]);
  const [drafts, setDrafts] = useState<RankingDraft[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, LocalComment[]>>({});
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string>();
  const [syncError, setSyncError] = useState<string>();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        const persisted = readPersistedState(value);
        if (!persisted) return;
        setCreatedPosts(persisted.createdPosts);
        setCompletedPlays(persisted.completedPlays);
        setDrafts(persisted.drafts);
        setLikedPostIds(persisted.likedPostIds);
        setSavedPostIds(persisted.savedPostIds);
        setFollowedCreatorIds(persisted.followedCreatorIds);
        setCommentsByPost(persisted.commentsByPost);
      })
      .catch(() => active && setStorageError('Your local data could not be loaded.'))
      .finally(() => active && setIsReady(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const persisted: PersistedRankingState = {
      version: 3,
      createdPosts,
      completedPlays,
      drafts,
      likedPostIds,
      savedPostIds,
      followedCreatorIds,
      commentsByPost,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
      .then(() => setStorageError(undefined))
      .catch(() => setStorageError('Changes could not be saved on this device.'));
  }, [commentsByPost, completedPlays, createdPosts, drafts, followedCreatorIds, isReady, likedPostIds, savedPostIds]);

  useEffect(() => {
    if (!isReady) return;
    if (!isConfigured || !user) {
      setFeedPosts([...mockFeedPosts]);
      setCreatedPosts((current) => current.filter((post) => !isRemoteId(post.id)));
      setLikedPostIds((current) => current.filter((id) => !isRemoteId(id)));
      setSavedPostIds((current) => current.filter((id) => !isRemoteId(id)));
      setFollowedCreatorIds((current) => current.filter((id) => !isRemoteId(id)));
      setCompletedPlays((current) => current.filter((play) => !play.ownerId));
      setSyncError(undefined);
      setSyncStatus('local');
      return;
    }

    let active = true;
    setSyncStatus('syncing');
    Promise.all([
      supabaseFeedRepository.getFeed({ limit: 50, mode: 'for-you' }),
      supabaseSocialRepository.getSnapshot(user.id),
      supabaseRankingRepository.listCompletedSessions(user.id),
    ]).then(([feed, social, remoteCompletedPlays]) => {
      if (!active) return;
      const remotePosts = feed.items.map((post) => social.likedPostIds.includes(post.id)
        ? { ...post, engagement: { ...post.engagement, likes: Math.max(0, post.engagement.likes - 1) } }
        : post);
      const ownPosts = remotePosts.filter((post) => post.creator.id === user.id);
      const communityPosts = remotePosts.filter((post) => post.creator.id !== user.id);
      setCreatedPosts((current) => [...ownPosts, ...current.filter((post) => !isRemoteId(post.id))]);
      setFeedPosts(communityPosts.length > 0 || ownPosts.length > 0 ? communityPosts : [...mockFeedPosts]);
      setLikedPostIds((current) => mergeIds(current, social.likedPostIds));
      setSavedPostIds((current) => mergeIds(current, social.savedPostIds));
      setFollowedCreatorIds((current) => mergeIds(current, social.followedCreatorIds));
      setCompletedPlays((current) => [...remoteCompletedPlays, ...current.filter((play) => !play.ownerId)]);
      setSyncError(undefined);
      setSyncStatus('synced');
    }).catch((error: unknown) => {
      if (!active) return;
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    });
    return () => { active = false; };
  }, [isConfigured, isReady, user]);

  const posts = useMemo(() => [...createdPosts, ...feedPosts], [createdPosts, feedPosts]);
  const visibleDrafts = useMemo(() => drafts.filter((draft) => !draft.ownerId || draft.ownerId === user?.id), [drafts, user?.id]);
  const savedPosts = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)), [posts, savedPostIds]);
  const shuffleFeed = useCallback(() => setFeedPosts((current) => shuffleItems(current)), []);
  const toggleLike = useCallback((postId: string) => {
    const wasLiked = likedPostIds.includes(postId);
    setLikedPostIds((current) => toggleId(current, postId));
    if (!user || !isRemoteId(postId)) return;
    setSyncStatus('syncing');
    const request = wasLiked ? supabaseSocialRepository.unlike(user.id, postId) : supabaseSocialRepository.like(user.id, postId);
    void request.then(() => { setSyncError(undefined); setSyncStatus('synced'); }).catch((error: unknown) => {
      setLikedPostIds((current) => toggleId(current, postId));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    });
  }, [likedPostIds, user]);
  const toggleSave = useCallback((postId: string) => {
    const wasSaved = savedPostIds.includes(postId);
    setSavedPostIds((current) => toggleId(current, postId));
    if (!user || !isRemoteId(postId)) return;
    setSyncStatus('syncing');
    const request = wasSaved ? supabaseSocialRepository.unsave(user.id, postId) : supabaseSocialRepository.save(user.id, postId);
    void request.then(() => { setSyncError(undefined); setSyncStatus('synced'); }).catch((error: unknown) => {
      setSavedPostIds((current) => toggleId(current, postId));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    });
  }, [savedPostIds, user]);
  const toggleFollow = useCallback((creatorId: string) => {
    const wasFollowing = followedCreatorIds.includes(creatorId);
    setFollowedCreatorIds((current) => toggleId(current, creatorId));
    if (!user || !isRemoteId(creatorId) || creatorId === user.id) return;
    setSyncStatus('syncing');
    const request = wasFollowing ? supabaseSocialRepository.unfollow(user.id, creatorId) : supabaseSocialRepository.follow(user.id, creatorId);
    void request.then(() => { setSyncError(undefined); setSyncStatus('synced'); }).catch((error: unknown) => {
      setFollowedCreatorIds((current) => toggleId(current, creatorId));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    });
  }, [followedCreatorIds, user]);
  const addComment = useCallback(async (postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const comment: LocalComment = { id: `comment-${Date.now()}`, text: trimmed, createdAt: new Date().toISOString(), authorName: 'You', avatarLabel: 'YO', isOwn: true };
    setCommentsByPost((current) => ({ ...current, [postId]: [...(current[postId] ?? []), comment] }));
    if (!user || !isRemoteId(postId)) return;
    setSyncStatus('syncing');
    try {
      const remoteComment = await supabaseSocialRepository.addComment(user.id, postId, trimmed);
      setCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] ?? []).map((item) => item.id === comment.id ? remoteComment : item),
      }));
      setSyncError(undefined);
      setSyncStatus('synced');
    } catch (error) {
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    }
  }, [user]);
  const loadComments = useCallback(async (postId: string) => {
    if (!user || !isRemoteId(postId)) return;
    try {
      const comments = await supabaseSocialRepository.listComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: [...comments.items] }));
    } catch (error) {
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    }
  }, [user]);
  const publishRanking = useCallback(async (input: CreateRankingInput) => {
    const localPost = createPost(input);
    setCreatedPosts((current) => [localPost, ...current]);
    if (!user) return localPost;
    setSyncStatus('syncing');
    try {
      const remotePost = await supabaseRankingRepository.createPublished(input);
      setCreatedPosts((current) => current.map((post) => post.id === localPost.id ? remotePost : post));
      setSyncError(undefined);
      setSyncStatus('synced');
      return remotePost;
    } catch (error) {
      setSyncError(errorMessage(error));
      setSyncStatus('error');
      return localPost;
    }
  }, [user]);
  const recordCompletion = useCallback(async (post: FeedPost, outcome: RankingOutcome) => {
    const completedAt = new Date().toISOString();
    const completion: CompletedPlay = {
      id: `play-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceId: post.id,
      templateId: post.templateId,
      title: post.title,
      topic: post.topic,
      kind: outcome.kind,
      rankedItems: [...outcome.rankedItems],
      completedAt,
      ownerId: user?.id,
      syncState: 'local',
    };
    setCompletedPlays((current) => [completion, ...current].slice(0, 100));
    if (!user || !isRemoteId(post.id)) return completion;
    setSyncStatus('syncing');
    try {
      const sessionId = await supabaseRankingRepository.completeSession(post.id, outcome.rankedItems);
      const synced = { ...completion, id: sessionId, syncState: 'synced' as const };
      setCompletedPlays((current) => current.map((item) => item.id === completion.id ? synced : item));
      setSyncError(undefined);
      setSyncStatus('synced');
      return synced;
    } catch (error) {
      const failed = { ...completion, syncState: 'error' as const };
      setCompletedPlays((current) => current.map((item) => item.id === completion.id ? failed : item));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
      return failed;
    }
  }, [user]);
  const publishCompletedPlay = useCallback(async (playId: string) => {
    const play = completedPlays.find((item) => item.id === playId);
    if (!play) throw new Error('This completed ranking is no longer available.');
    const publishedPost = await publishRanking({
      format: 'completed-result',
      title: play.title,
      topic: play.topic.replace(/\s*[·•]\s*(Blind ranking|Bracket|Completed ranking)$/i, ''),
      items: play.rankedItems,
    });
    setCompletedPlays((current) => current.map((item) => item.id === playId ? { ...item, publishedPostId: publishedPost.id } : item));
    return publishedPost;
  }, [completedPlays, publishRanking]);
  const saveDraft = useCallback((draftId: string, input: CreateRankingInput) => {
    const draft: RankingDraft = {
      ...input,
      id: draftId,
      ownerId: user?.id,
      updatedAt: new Date().toISOString(),
    };
    setDrafts((current) => [draft, ...current.filter((item) => item.id !== draftId)].slice(0, 25));
    return draft;
  }, [user]);
  const deleteDraft = useCallback((draftId: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== draftId));
  }, []);

  const value = useMemo<RankingStoreValue>(() => ({
    posts,
    createdPosts,
    completedPlays,
    drafts: visibleDrafts,
    savedPosts,
    likedPostIds,
    savedPostIds,
    followedCreatorIds,
    commentsByPost,
    isReady,
    storageError,
    syncError,
    syncStatus,
    shuffleFeed,
    toggleLike,
    toggleSave,
    toggleFollow,
    addComment,
    loadComments,
    publishRanking,
    publishCompletedPlay,
    recordCompletion,
    saveDraft,
    deleteDraft,
  }), [addComment, commentsByPost, completedPlays, createdPosts, deleteDraft, followedCreatorIds, isReady, likedPostIds, loadComments, posts, publishCompletedPlay, publishRanking, recordCompletion, saveDraft, savedPostIds, savedPosts, shuffleFeed, storageError, syncError, syncStatus, toggleFollow, toggleLike, toggleSave, visibleDrafts]);

  return <RankingStoreContext.Provider value={value}>{children}</RankingStoreContext.Provider>;
}

export function useRankingStore() {
  const value = useContext(RankingStoreContext);
  if (!value) throw new Error('useRankingStore must be used within RankingStoreProvider');
  return value;
}
