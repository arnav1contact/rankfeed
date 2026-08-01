import { Feed } from '@/src/features/feed/components/feed';
import { useRankingStore } from '@/src/features/rankings/ranking-store';

export default function RankingsScreen() {
  const { posts } = useRankingStore();
  const playablePosts = posts.filter((post) => post.kind !== 'completed-result');

  return <Feed posts={playablePosts} />;
}
