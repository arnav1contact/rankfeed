import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { Feed } from '@/src/features/feed/components/feed';
import { useRankingStore } from '@/src/features/rankings/ranking-store';

export default function RankingsScreen() {
  const { posts, shuffleFeed } = useRankingStore();
  useFocusEffect(useCallback(() => {
    shuffleFeed();
  }, [shuffleFeed]));

  return <Feed posts={posts} />;
}
