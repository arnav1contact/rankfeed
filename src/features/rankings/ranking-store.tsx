import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { isRemoteId, supabaseFeedRepository, supabaseRankingRepository, supabaseSocialRepository } from '@/src/data/supabase-ranking-repositories';
import { supabaseModerationRepository } from '@/src/data/supabase-moderation-repository';
import { supabaseProfileRepository } from '@/src/data/supabase-profile-repository';
import type { FeedQuery } from '@/src/data/repositories';
import { useAuth } from '@/src/features/auth/auth-provider';
import type { Creator, FeedPost } from '@/src/features/feed/types';
import { mockFeedPosts } from '@/src/mock-data';
import { shuffleItems } from './random';
import type { CompletedPlay, CreateRankingInput, LocalComment, RankingDraft, RankingOutcome, ReportReason } from './types';

export type { CreateRankingInput, LocalComment, RankingDraft, RankingFormat } from './types';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'error';
export type FeedMode = FeedQuery['mode'];

type PersistedRankingState = {
  version: 4;
  createdPosts: FeedPost[];
  completedPlays: CompletedPlay[];
  drafts: RankingDraft[];
  blockedCreatorIds: string[];
  reportedPostIds: string[];
  likedPostIds: string[];
  savedPostIds: string[];
  followedCreatorIds: string[];
  commentsByPost: Record<string, LocalComment[]>;
};

type RankingStoreValue = {
  posts: readonly FeedPost[];
  rankingPosts: readonly FeedPost[];
  createdPosts: readonly FeedPost[];
  completedPlays: readonly CompletedPlay[];
  drafts: readonly RankingDraft[];
  blockedCreatorIds: readonly string[];
  blockedCreators: readonly Creator[];
  reportedPostIds: readonly string[];
  savedPosts: readonly FeedPost[];
  likedPostIds: readonly string[];
  savedPostIds: readonly string[];
  followedCreatorIds: readonly string[];
  commentsByPost: Readonly<Record<string, readonly LocalComment[]>>;
  isReady: boolean;
  storageError?: string;
  syncError?: string;
  syncStatus: SyncStatus;
  feedMode: FeedMode;
  hasMoreFeed: boolean;
  isLoadingMore: boolean;
  isSwitchingFeed: boolean;
  loadMoreFeed: () => Promise<void>;
  selectFeedMode: (mode: FeedMode) => Promise<void>;
  publishRanking: (input: CreateRankingInput) => Promise<FeedPost>;
  publishCompletedPlay: (playId: string) => Promise<FeedPost>;
  recordCompletion: (post: FeedPost, outcome: RankingOutcome) => Promise<CompletedPlay>;
  saveDraft: (draftId: string, input: CreateRankingInput) => RankingDraft;
  deleteDraft: (draftId: string) => void;
  blockCreator: (creatorId: string) => Promise<void>;
  unblockCreator: (creatorId: string) => Promise<void>;
  reportPost: (postId: string, reason: ReportReason) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  shuffleFeed: () => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (creatorId: string) => void;
  addComment: (postId: string, text: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
};

const STORAGE_KEY = '@rankfeed/app-state/v1';
const FEED_PAGE_SIZE = 20;
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

function appendUniquePosts(current: readonly FeedPost[], incoming: readonly FeedPost[]) {
  const currentIds = new Set(current.map((post) => post.id));
  return [...current, ...incoming.filter((post) => !currentIds.has(post.id))];
}

function uniquePosts(posts: readonly FeedPost[]) {
  return appendUniquePosts([], posts);
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
    if (![1, 2, 3, 4].includes(parsed.version ?? 0)) return null;
    return {
      version: 4,
      createdPosts: Array.isArray(parsed.createdPosts) ? parsed.createdPosts : [],
      completedPlays: Array.isArray(parsed.completedPlays) ? parsed.completedPlays : [],
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      blockedCreatorIds: Array.isArray(parsed.blockedCreatorIds) ? parsed.blockedCreatorIds : [],
      reportedPostIds: Array.isArray(parsed.reportedPostIds) ? parsed.reportedPostIds : [],
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
  const [followingFeedPosts, setFollowingFeedPosts] = useState<FeedPost[]>([]);
  const [createdPosts, setCreatedPosts] = useState<FeedPost[]>([]);
  const [completedPlays, setCompletedPlays] = useState<CompletedPlay[]>([]);
  const [drafts, setDrafts] = useState<RankingDraft[]>([]);
  const [blockedCreatorIds, setBlockedCreatorIds] = useState<string[]>([]);
  const [reportedPostIds, setReportedPostIds] = useState<string[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, LocalComment[]>>({});
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string>();
  const [syncError, setSyncError] = useState<string>();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [feedCursor, setFeedCursor] = useState<string>();
  const [followingFeedCursor, setFollowingFeedCursor] = useState<string>();
  const [feedMode, setFeedMode] = useState<FeedMode>('for-you');
  const [hasLoadedFollowingFeed, setHasLoadedFollowingFeed] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSwitchingFeed, setIsSwitchingFeed] = useState(false);
  const loadingMoreRef = useRef(false);
  const loadingFollowingRef = useRef(false);

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
        setBlockedCreatorIds(persisted.blockedCreatorIds);
        setReportedPostIds(persisted.reportedPostIds);
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
      version: 4,
      createdPosts,
      completedPlays,
      drafts,
      blockedCreatorIds,
      reportedPostIds,
      likedPostIds,
      savedPostIds,
      followedCreatorIds,
      commentsByPost,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
      .then(() => setStorageError(undefined))
      .catch(() => setStorageError('Changes could not be saved on this device.'));
  }, [blockedCreatorIds, commentsByPost, completedPlays, createdPosts, drafts, followedCreatorIds, isReady, likedPostIds, reportedPostIds, savedPostIds]);

  useEffect(() => {
    if (!isReady) return;
    if (!isConfigured || !user) {
      setFeedPosts([...mockFeedPosts]);
      setFollowingFeedPosts([]);
      setFeedCursor(undefined);
      setFollowingFeedCursor(undefined);
      setFeedMode('for-you');
      setHasLoadedFollowingFeed(false);
      setIsLoadingMore(false);
      setIsSwitchingFeed(false);
      loadingMoreRef.current = false;
      loadingFollowingRef.current = false;
      setCreatedPosts((current) => current.filter((post) => !isRemoteId(post.id)));
      setLikedPostIds((current) => current.filter((id) => !isRemoteId(id)));
      setSavedPostIds((current) => current.filter((id) => !isRemoteId(id)));
      setFollowedCreatorIds((current) => current.filter((id) => !isRemoteId(id)));
      setCompletedPlays((current) => current.filter((play) => !play.ownerId));
      setBlockedCreatorIds((current) => current.filter((id) => !isRemoteId(id)));
      setReportedPostIds((current) => current.filter((id) => !isRemoteId(id)));
      setSyncError(undefined);
      setSyncStatus('local');
      return;
    }

    let active = true;
    setSyncStatus('syncing');
    Promise.all([
      supabaseFeedRepository.getFeed({ limit: FEED_PAGE_SIZE, mode: 'for-you' }),
      supabaseSocialRepository.getSnapshot(user.id),
      supabaseRankingRepository.listCompletedSessions(user.id),
      supabaseModerationRepository.getSnapshot(user.id),
    ]).then(([feed, social, remoteCompletedPlays, moderation]) => {
      if (!active) return;
      const remotePosts = feed.items.map((post) => social.likedPostIds.includes(post.id)
        ? { ...post, engagement: { ...post.engagement, likes: Math.max(0, post.engagement.likes - 1) } }
        : post);
      const ownPosts = remotePosts.filter((post) => post.creator.id === user.id);
      const communityPosts = remotePosts.filter((post) => post.creator.id !== user.id);
      setCreatedPosts((current) => [...ownPosts, ...current.filter((post) => !isRemoteId(post.id))]);
      setFeedPosts(communityPosts.length > 0 || ownPosts.length > 0 ? communityPosts : [...mockFeedPosts]);
      setFeedCursor(feed.nextCursor);
      setFollowingFeedPosts([]);
      setFollowingFeedCursor(undefined);
      setFeedMode('for-you');
      setHasLoadedFollowingFeed(false);
      setLikedPostIds((current) => mergeIds(current, social.likedPostIds));
      setSavedPostIds((current) => mergeIds(current, social.savedPostIds));
      setFollowedCreatorIds((current) => mergeIds(current, social.followedCreatorIds));
      setCompletedPlays((current) => [...remoteCompletedPlays, ...current.filter((play) => !play.ownerId)]);
      setBlockedCreatorIds((current) => mergeIds(current, moderation.blockedCreatorIds));
      setReportedPostIds((current) => mergeIds(current, moderation.reportedPostIds));
      setSyncError(undefined);
      setSyncStatus('synced');
    }).catch((error: unknown) => {
      if (!active) return;
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    });
    return () => { active = false; };
  }, [isConfigured, isReady, user]);

  const allPosts = useMemo(() => uniquePosts([...createdPosts, ...feedPosts, ...followingFeedPosts]), [createdPosts, feedPosts, followingFeedPosts]);
  const posts = useMemo(() => allPosts.filter((post) => !blockedCreatorIds.includes(post.creator.id)), [allPosts, blockedCreatorIds]);
  const rankingPosts = useMemo(() => {
    const activePosts = feedMode === 'following'
      ? (user ? followingFeedPosts : feedPosts.filter((post) => followedCreatorIds.includes(post.creator.id)))
      : [...createdPosts, ...feedPosts];
    return uniquePosts(activePosts).filter((post) => !blockedCreatorIds.includes(post.creator.id));
  }, [blockedCreatorIds, createdPosts, feedMode, feedPosts, followedCreatorIds, followingFeedPosts, user]);
  const blockedCreators = useMemo(() => blockedCreatorIds.map((creatorId) => allPosts.find((post) => post.creator.id === creatorId)?.creator ?? {
    id: creatorId,
    displayName: 'Blocked creator',
    handle: 'Hidden account',
    avatarLabel: '—',
  }), [allPosts, blockedCreatorIds]);
  const visibleDrafts = useMemo(() => drafts.filter((draft) => !draft.ownerId || draft.ownerId === user?.id), [drafts, user?.id]);
  const savedPosts = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)), [posts, savedPostIds]);
  const hasMoreFeed = Boolean(feedMode === 'following' ? followingFeedCursor : feedCursor);
  const selectFeedMode = useCallback(async (mode: FeedMode) => {
    setFeedMode(mode);
    if (mode === 'for-you' || !user || hasLoadedFollowingFeed || loadingFollowingRef.current) return;
    loadingFollowingRef.current = true;
    setIsSwitchingFeed(true);
    try {
      const page = await supabaseFeedRepository.getFeed({ limit: FEED_PAGE_SIZE, mode: 'following' });
      const remotePosts = page.items.map((post) => likedPostIds.includes(post.id)
        ? { ...post, engagement: { ...post.engagement, likes: Math.max(0, post.engagement.likes - 1) } }
        : post);
      setFollowingFeedPosts(remotePosts.filter((post) => post.creator.id !== user.id));
      setFollowingFeedCursor(page.nextCursor);
      setHasLoadedFollowingFeed(true);
      setSyncError(undefined);
    } catch (error) {
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    } finally {
      loadingFollowingRef.current = false;
      setIsSwitchingFeed(false);
    }
  }, [hasLoadedFollowingFeed, likedPostIds, user]);
  const loadMoreFeed = useCallback(async () => {
    const cursor = feedMode === 'following' ? followingFeedCursor : feedCursor;
    if (!user || !cursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await supabaseFeedRepository.getFeed({ cursor, limit: FEED_PAGE_SIZE, mode: feedMode });
      const remotePosts = page.items.map((post) => likedPostIds.includes(post.id)
        ? { ...post, engagement: { ...post.engagement, likes: Math.max(0, post.engagement.likes - 1) } }
        : post);
      const ownPosts = remotePosts.filter((post) => post.creator.id === user.id);
      const communityPosts = remotePosts.filter((post) => post.creator.id !== user.id);
      setCreatedPosts((current) => appendUniquePosts(current, ownPosts));
      if (feedMode === 'following') {
        setFollowingFeedPosts((current) => appendUniquePosts(current, communityPosts));
        setFollowingFeedCursor(page.nextCursor);
      } else {
        setFeedPosts((current) => appendUniquePosts(current, communityPosts));
        setFeedCursor(page.nextCursor);
      }
      setSyncError(undefined);
    } catch (error) {
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [feedCursor, feedMode, followingFeedCursor, likedPostIds, user]);
  const shuffleFeed = useCallback(() => {
    if (feedMode === 'following' && user) setFollowingFeedPosts((current) => shuffleItems(current));
    else setFeedPosts((current) => shuffleItems(current));
  }, [feedMode, user]);
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
    void request.then(() => {
      if (wasFollowing) setFollowingFeedPosts((current) => current.filter((post) => post.creator.id !== creatorId));
      else setHasLoadedFollowingFeed(false);
      setSyncError(undefined);
      setSyncStatus('synced');
    }).catch((error: unknown) => {
      setFollowedCreatorIds((current) => toggleId(current, creatorId));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    });
  }, [followedCreatorIds, user]);
  const addComment = useCallback(async (postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (isConfigured && !user) throw new Error('Sign in before adding a comment.');
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
  }, [isConfigured, user]);
  const loadComments = useCallback(async (postId: string) => {
    if (!isRemoteId(postId)) return;
    try {
      const comments = await supabaseSocialRepository.listComments(postId);
      setCommentsByPost((current) => ({ ...current, [postId]: [...comments.items] }));
    } catch (error) {
      setSyncError(errorMessage(error));
      setSyncStatus('error');
    }
  }, []);
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
  const blockCreator = useCallback(async (creatorId: string) => {
    if (user?.id === creatorId || creatorId === 'creator-you') return;
    setBlockedCreatorIds((current) => current.includes(creatorId) ? current : [...current, creatorId]);
    setFollowedCreatorIds((current) => current.filter((id) => id !== creatorId));
    if (!user || !isRemoteId(creatorId)) return;
    setSyncStatus('syncing');
    try {
      await supabaseProfileRepository.block(creatorId);
      setSyncError(undefined);
      setSyncStatus('synced');
    } catch (error) {
      setBlockedCreatorIds((current) => current.filter((id) => id !== creatorId));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
      throw error;
    }
  }, [user]);
  const unblockCreator = useCallback(async (creatorId: string) => {
    setBlockedCreatorIds((current) => current.filter((id) => id !== creatorId));
    if (!user || !isRemoteId(creatorId)) return;
    setSyncStatus('syncing');
    try {
      await supabaseProfileRepository.unblock(creatorId);
      const feed = await supabaseFeedRepository.getFeed({ limit: FEED_PAGE_SIZE, mode: 'for-you' });
      setFeedPosts(feed.items.filter((post) => post.creator.id !== user.id));
      setFeedCursor(feed.nextCursor);
      setFollowingFeedPosts([]);
      setFollowingFeedCursor(undefined);
      setHasLoadedFollowingFeed(false);
      setSyncError(undefined);
      setSyncStatus('synced');
    } catch (error) {
      setBlockedCreatorIds((current) => current.includes(creatorId) ? current : [...current, creatorId]);
      setSyncError(errorMessage(error));
      setSyncStatus('error');
      throw error;
    }
  }, [user]);
  const reportPost = useCallback(async (postId: string, reason: ReportReason) => {
    setReportedPostIds((current) => current.includes(postId) ? current : [...current, postId]);
    if (!user || !isRemoteId(postId)) return;
    setSyncStatus('syncing');
    try {
      await supabaseModerationRepository.report({ reason, targetId: postId, targetType: 'post' });
      setSyncError(undefined);
      setSyncStatus('synced');
    } catch (error) {
      setReportedPostIds((current) => current.filter((id) => id !== postId));
      setSyncError(errorMessage(error));
      setSyncStatus('error');
      throw error;
    }
  }, [user]);
  const deletePost = useCallback(async (postId: string) => {
    const post = createdPosts.find((item) => item.id === postId);
    if (!post) throw new Error('This published ranking is no longer available.');
    if (user && isRemoteId(postId)) {
      setSyncStatus('syncing');
      try {
        await supabaseRankingRepository.remove(postId);
        setSyncError(undefined);
        setSyncStatus('synced');
      } catch (error) {
        setSyncError(errorMessage(error));
        setSyncStatus('error');
        throw error;
      }
    }
    setCreatedPosts((current) => current.filter((item) => item.id !== postId));
    setLikedPostIds((current) => current.filter((id) => id !== postId));
    setSavedPostIds((current) => current.filter((id) => id !== postId));
    setCommentsByPost((current) => {
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setCompletedPlays((current) => current.map((play) => play.publishedPostId === postId ? { ...play, publishedPostId: undefined } : play));
  }, [createdPosts, user]);
  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    const existing = commentsByPost[postId]?.find((comment) => comment.id === commentId);
    if (!existing?.isOwn) return;
    if (user && isRemoteId(commentId)) {
      setSyncStatus('syncing');
      try {
        await supabaseSocialRepository.removeComment(commentId);
        setSyncError(undefined);
        setSyncStatus('synced');
      } catch (error) {
        setSyncError(errorMessage(error));
        setSyncStatus('error');
        throw error;
      }
    }
    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] ?? []).filter((comment) => comment.id !== commentId),
    }));
  }, [commentsByPost, user]);

  const value = useMemo<RankingStoreValue>(() => ({
    posts,
    rankingPosts,
    createdPosts,
    completedPlays,
    drafts: visibleDrafts,
    blockedCreatorIds,
    blockedCreators,
    reportedPostIds,
    savedPosts,
    likedPostIds,
    savedPostIds,
    followedCreatorIds,
    commentsByPost,
    isReady,
    storageError,
    syncError,
    syncStatus,
    feedMode,
    hasMoreFeed,
    isLoadingMore,
    isSwitchingFeed,
    loadMoreFeed,
    selectFeedMode,
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
    blockCreator,
    unblockCreator,
    reportPost,
    deletePost,
    deleteComment,
  }), [addComment, blockCreator, blockedCreatorIds, blockedCreators, commentsByPost, completedPlays, createdPosts, deleteComment, deleteDraft, deletePost, feedMode, followedCreatorIds, hasMoreFeed, isLoadingMore, isReady, isSwitchingFeed, likedPostIds, loadComments, loadMoreFeed, posts, publishCompletedPlay, publishRanking, rankingPosts, recordCompletion, reportPost, reportedPostIds, saveDraft, savedPostIds, savedPosts, selectFeedMode, shuffleFeed, storageError, syncError, syncStatus, toggleFollow, toggleLike, toggleSave, unblockCreator, visibleDrafts]);

  return <RankingStoreContext.Provider value={value}>{children}</RankingStoreContext.Provider>;
}

export function useRankingStore() {
  const value = useContext(RankingStoreContext);
  if (!value) throw new Error('useRankingStore must be used within RankingStoreProvider');
  return value;
}
