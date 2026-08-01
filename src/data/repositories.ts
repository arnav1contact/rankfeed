import type { FeedPost } from '@/src/features/feed/types';
import type { CompletedPlay, CreateRankingInput, LocalComment } from '@/src/features/rankings/types';

export type CursorPage<T> = {
  items: readonly T[];
  nextCursor?: string;
};

export type AccountProfile = {
  id: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
};

export type AuthSession = {
  userId: string;
  email?: string;
};

export type FeedQuery = {
  cursor?: string;
  limit: number;
  mode: 'for-you' | 'following';
};

export type ReportInput = {
  targetId: string;
  targetType: 'post' | 'comment' | 'profile';
  reason: 'spam' | 'harassment' | 'hate' | 'sexual-content' | 'violence' | 'copyright' | 'other';
  details?: string;
};

export type SocialSnapshot = {
  followedCreatorIds: readonly string[];
  likedPostIds: readonly string[];
  savedPostIds: readonly string[];
};

export type ModerationSnapshot = {
  blockedCreatorIds: readonly string[];
  reportedPostIds: readonly string[];
};

export interface AuthRepository {
  getSession(): Promise<AuthSession | null>;
  signInWithEmail(email: string): Promise<void>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}

export interface ProfileRepository {
  getProfile(userId: string): Promise<AccountProfile | null>;
  updateProfile(input: Omit<AccountProfile, 'id'>): Promise<AccountProfile>;
  follow(profileId: string): Promise<void>;
  unfollow(profileId: string): Promise<void>;
  block(profileId: string): Promise<void>;
  unblock(profileId: string): Promise<void>;
}

export interface FeedRepository {
  getFeed(query: FeedQuery): Promise<CursorPage<FeedPost>>;
  getPost(postId: string): Promise<FeedPost | null>;
}

export interface RankingRepository {
  createPublished(input: CreateRankingInput): Promise<FeedPost>;
  completeSession(postId: string, rankedItems: readonly string[]): Promise<string>;
  listCompletedSessions(userId: string): Promise<CompletedPlay[]>;
  createDraft(input: CreateRankingInput): Promise<FeedPost>;
  updateDraft(postId: string, input: CreateRankingInput): Promise<FeedPost>;
  publish(postId: string): Promise<FeedPost>;
  remove(postId: string): Promise<void>;
}

export interface SocialRepository {
  getSnapshot(userId: string): Promise<SocialSnapshot>;
  like(userId: string, postId: string): Promise<void>;
  unlike(userId: string, postId: string): Promise<void>;
  save(userId: string, postId: string): Promise<void>;
  unsave(userId: string, postId: string): Promise<void>;
  follow(userId: string, profileId: string): Promise<void>;
  unfollow(userId: string, profileId: string): Promise<void>;
  listComments(postId: string, cursor?: string): Promise<CursorPage<LocalComment>>;
  addComment(userId: string, postId: string, text: string): Promise<LocalComment>;
  removeComment(commentId: string): Promise<void>;
}

export interface ModerationRepository {
  getSnapshot(userId: string): Promise<ModerationSnapshot>;
  report(input: ReportInput): Promise<void>;
}

export type AppRepositories = {
  auth: AuthRepository;
  profiles: ProfileRepository;
  feed: FeedRepository;
  rankings: RankingRepository;
  social: SocialRepository;
  moderation: ModerationRepository;
};
