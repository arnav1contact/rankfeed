import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { seedPosts } from '@/src/features/feed/data/seed-posts';
import type { FeedPost } from '@/src/features/feed/types';

export type RankingFormat = FeedPost['kind'];

export type CreateRankingInput = {
  format: RankingFormat;
  title: string;
  topic: string;
  items: string[];
};

type RankingStoreValue = {
  posts: readonly FeedPost[];
  createdCount: number;
  publishRanking: (input: CreateRankingInput) => void;
};

const RankingStoreContext = createContext<RankingStoreValue | null>(null);

const profileCreator = {
  id: 'creator-you',
  displayName: 'You',
  handle: '@yourrankings',
  avatarLabel: 'YO',
} as const;

function createPost(input: CreateRankingInput): FeedPost {
  const id = `post-created-${Date.now()}`;
  const base = {
    id,
    templateId: `template-created-${Date.now()}`,
    creator: profileCreator,
    caption: 'Freshly published. How would you rank it?',
    topic: `${input.topic} · ${input.format === 'blind-ranking' ? 'Blind ranking' : input.format === 'bracket' ? 'Bracket' : 'Completed ranking'}`,
    title: input.title,
    engagement: { likes: 0, comments: 0, saves: 0, shares: 0 },
    visual: { backgroundColor: '#18233C', accentColor: '#C8FF64', emoji: '✨' },
  } as const;

  if (input.format === 'bracket') {
    return {
      ...base,
      kind: 'bracket',
      matchup: [input.items[0] || 'Option one', input.items[1] || 'Option two'],
      roundLabel: 'Opening round · Match 1',
    };
  }

  if (input.format === 'completed-result') {
    const items = input.items.length > 0 ? input.items : ['First place', 'Second place', 'Third place'];
    return {
      ...base,
      kind: 'completed-result',
      resultItems: items.slice(0, 5).map((label, index) => ({ label, rank: index + 1 })),
    };
  }

  return {
    ...base,
    kind: 'blind-ranking',
    currentItem: input.items[0] || 'Your first pick',
    progressLabel: 'Item 1 of 5',
    slotCount: 5,
  };
}

export function RankingStoreProvider({ children }: PropsWithChildren) {
  const [posts, setPosts] = useState<FeedPost[]>(() => [...seedPosts]);
  const [createdCount, setCreatedCount] = useState(0);

  const value = useMemo<RankingStoreValue>(() => ({
    createdCount,
    posts,
    publishRanking: (input) => {
      setPosts((current) => [createPost(input), ...current]);
      setCreatedCount((current) => current + 1);
    },
  }), [createdCount, posts]);

  return <RankingStoreContext.Provider value={value}>{children}</RankingStoreContext.Provider>;
}

export function useRankingStore() {
  const value = useContext(RankingStoreContext);
  if (!value) throw new Error('useRankingStore must be used within RankingStoreProvider');
  return value;
}
