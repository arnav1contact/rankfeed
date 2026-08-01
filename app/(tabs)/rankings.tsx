import { Feed } from '@/src/features/feed/components/feed';
import { useAuth } from '@/src/features/auth/auth-provider';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RankingsScreen() {
  const insets = useSafeAreaInsets();
  const { isConfigured, user } = useAuth();
  const { feedMode, hasMoreFeed, isLoadingMore, isSwitchingFeed, loadMoreFeed, rankingPosts, selectFeedMode } = useRankingStore();
  const playablePosts = rankingPosts.filter((post) => post.kind !== 'completed-result');

  return (
    <View style={styles.container}>
      <Feed
        emptyMessage={isConfigured && !user ? 'Sign in and follow creators to build a personal feed.' : 'Follow creators from For You and their rankings will appear here.'}
        emptyTitle={feedMode === 'following' ? 'Your Following feed is empty' : 'No playable rankings yet'}
        hasMore={hasMoreFeed}
        isInitialLoading={isSwitchingFeed}
        isLoadingMore={isLoadingMore}
        onLoadMore={() => void loadMoreFeed()}
        posts={playablePosts}
        showEndState={isConfigured && Boolean(user)}
      />
      <View accessibilityRole="tablist" style={[styles.feedSwitcher, { top: insets.top + 42 }]}>
        {(['for-you', 'following'] as const).map((mode) => {
          const selected = feedMode === mode;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={mode}
              onPress={() => void selectFeedMode(mode)}
              style={[styles.feedOption, selected && styles.feedOptionSelected]}>
              <Text style={[styles.feedOptionText, selected && styles.feedOptionTextSelected]}>{mode === 'for-you' ? 'For You' : 'Following'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#0A0A0C', flex: 1 },
  feedOption: { alignItems: 'center', borderRadius: 16, justifyContent: 'center', minHeight: 32, paddingHorizontal: 14 },
  feedOptionSelected: { backgroundColor: 'rgba(255, 255, 255, 0.16)' },
  feedOptionText: { color: '#9B9DA6', fontSize: 12, fontWeight: '800' },
  feedOptionTextSelected: { color: '#FFFFFF' },
  feedSwitcher: {
    alignSelf: 'center', backgroundColor: 'rgba(8, 9, 12, 0.8)', borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20, borderWidth: 1, flexDirection: 'row', padding: 3, position: 'absolute', zIndex: 5,
  },
});
