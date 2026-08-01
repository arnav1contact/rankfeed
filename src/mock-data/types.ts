import type { FeedPost } from '@/src/features/feed/types';

export type RankingTemplate = {
  id: string;
  format: FeedPost['kind'];
  title: string;
  topic: string;
  description: string;
  items: readonly string[];
  uses: number;
};

export type CompletedRanking = {
  id: string;
  creatorId: string;
  templateId: string;
  title: string;
  topic: string;
  items: readonly { rank: number; label: string }[];
};
