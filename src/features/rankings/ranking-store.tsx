import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import type { FeedPost } from '@/src/features/feed/types';
import { mockFeedPosts } from '@/src/mock-data';
import { shuffleItems } from './random';

export type RankingFormat = FeedPost['kind'];

export type CreateRankingInput = {
  format: RankingFormat;
  title: string;
  topic: string;
  items: string[];
};

export type LocalComment = {
  id: string;
  text: string;
  createdAt: string;
};

type PersistedRankingState = {
  version: 1;
  createdPosts: FeedPost[];
  likedPostIds: string[];
  savedPostIds: string[];
  followedCreatorIds: string[];
  commentsByPost: Record<string, LocalComment[]>;
};

type RankingStoreValue = {
  posts: readonly FeedPost[];
  createdPosts: readonly FeedPost[];
  savedPosts: readonly FeedPost[];
  likedPostIds: readonly string[];
  savedPostIds: readonly string[];
  followedCreatorIds: readonly string[];
  commentsByPost: Readonly<Record<string, readonly LocalComment[]>>;
  isReady: boolean;
  storageError?: string;
  publishRanking: (input: CreateRankingInput) => void;
  shuffleFeed: () => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (creatorId: string) => void;
  addComment: (postId: string, text: string) => void;
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
    const parsed = JSON.parse(value) as Partial<PersistedRankingState>;
    if (parsed.version !== 1) return null;
    return {
      version: 1,
      createdPosts: Array.isArray(parsed.createdPosts) ? parsed.createdPosts : [],
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
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => [...mockFeedPosts]);
  const [createdPosts, setCreatedPosts] = useState<FeedPost[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [followedCreatorIds, setFollowedCreatorIds] = useState<string[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, LocalComment[]>>({});
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string>();

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active) return;
        const persisted = readPersistedState(value);
        if (!persisted) return;
        setCreatedPosts(persisted.createdPosts);
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
      version: 1,
      createdPosts,
      likedPostIds,
      savedPostIds,
      followedCreatorIds,
      commentsByPost,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
      .then(() => setStorageError(undefined))
      .catch(() => setStorageError('Changes could not be saved on this device.'));
  }, [commentsByPost, createdPosts, followedCreatorIds, isReady, likedPostIds, savedPostIds]);

  const posts = useMemo(() => [...createdPosts, ...feedPosts], [createdPosts, feedPosts]);
  const savedPosts = useMemo(() => posts.filter((post) => savedPostIds.includes(post.id)), [posts, savedPostIds]);
  const shuffleFeed = useCallback(() => setFeedPosts((current) => shuffleItems(current)), []);
  const toggleLike = useCallback((postId: string) => setLikedPostIds((current) => toggleId(current, postId)), []);
  const toggleSave = useCallback((postId: string) => setSavedPostIds((current) => toggleId(current, postId)), []);
  const toggleFollow = useCallback((creatorId: string) => setFollowedCreatorIds((current) => toggleId(current, creatorId)), []);
  const addComment = useCallback((postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const comment: LocalComment = { id: `comment-${Date.now()}`, text: trimmed, createdAt: new Date().toISOString() };
    setCommentsByPost((current) => ({ ...current, [postId]: [...(current[postId] ?? []), comment] }));
  }, []);

  const value = useMemo<RankingStoreValue>(() => ({
    posts,
    createdPosts,
    savedPosts,
    likedPostIds,
    savedPostIds,
    followedCreatorIds,
    commentsByPost,
    isReady,
    storageError,
    shuffleFeed,
    toggleLike,
    toggleSave,
    toggleFollow,
    addComment,
    publishRanking: (input) => setCreatedPosts((current) => [createPost(input), ...current]),
  }), [addComment, commentsByPost, createdPosts, followedCreatorIds, isReady, likedPostIds, posts, savedPostIds, savedPosts, shuffleFeed, storageError, toggleFollow, toggleLike, toggleSave]);

  return <RankingStoreContext.Provider value={value}>{children}</RankingStoreContext.Provider>;
}

export function useRankingStore() {
  const value = useContext(RankingStoreContext);
  if (!value) throw new Error('useRankingStore must be used within RankingStoreProvider');
  return value;
}
