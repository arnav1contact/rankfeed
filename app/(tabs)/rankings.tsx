import { Feed } from '@/src/features/feed/components/feed';
import { useAuth } from '@/src/features/auth/auth-provider';
import { useRankingStore } from '@/src/features/rankings/ranking-store';

export default function RankingsScreen() {
  const { isConfigured, user } = useAuth();
  const { hasMoreFeed, isLoadingMore, loadMoreFeed, posts } = useRankingStore();
  const playablePosts = posts.filter((post) => post.kind !== 'completed-result');

  return (
    <Feed
      hasMore={hasMoreFeed}
      isLoadingMore={isLoadingMore}
      onLoadMore={() => void loadMoreFeed()}
      posts={playablePosts}
      showEndState={isConfigured && Boolean(user)}
    />
  );
}
