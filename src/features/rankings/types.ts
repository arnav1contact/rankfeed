import type { FeedPost } from '@/src/features/feed/types';

export type RankingFormat = FeedPost['kind'];

export type ReportReason = 'spam' | 'harassment' | 'hate' | 'sexual-content' | 'violence' | 'copyright' | 'other';

export type CreateRankingInput = {
  format: RankingFormat;
  title: string;
  topic: string;
  items: string[];
};

export type RankingDraft = CreateRankingInput & {
  id: string;
  updatedAt: string;
  ownerId?: string;
};

export type LocalComment = {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
  avatarLabel?: string;
  isOwn?: boolean;
};

export type RankingOutcome = {
  kind: Extract<RankingFormat, 'blind-ranking' | 'bracket'>;
  rankedItems: string[];
};

export type CompletedPlay = RankingOutcome & {
  id: string;
  sourceId: string;
  templateId: string;
  title: string;
  topic: string;
  completedAt: string;
  ownerId?: string;
  publishedPostId?: string;
  syncState: 'local' | 'synced' | 'error';
};
