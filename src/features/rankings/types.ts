import type { FeedPost } from '@/src/features/feed/types';

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
  authorName?: string;
  avatarLabel?: string;
  isOwn?: boolean;
};
