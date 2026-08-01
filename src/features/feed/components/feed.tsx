import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
} from 'react-native';

import { colors } from '@/src/theme/tokens';
import type { FeedPost as FeedPostModel } from '../types';
import { FeedPost } from './feed-post';

type FeedProps = {
  posts: readonly FeedPostModel[];
  emptyMessage?: string;
  emptyTitle?: string;
  hasMore?: boolean;
  isInitialLoading?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  showEndState?: boolean;
};

export function Feed({ emptyMessage, emptyTitle, hasMore = false, isInitialLoading = false, isLoadingMore = false, onLoadMore, posts, showEndState = false }: FeedProps) {
  const window = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(window.height);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setViewportHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  const renderItem = useCallback<ListRenderItem<FeedPostModel>>(
    ({ item }) => <FeedPost post={item} viewportHeight={viewportHeight} />,
    [viewportHeight],
  );

  return (
    <View onLayout={handleLayout} style={styles.container}>
      <FlatList
        data={posts}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({ index, length: viewportHeight, offset: viewportHeight * index })}
        initialNumToRender={2}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={(
          <View style={[styles.empty, { height: viewportHeight }]}>
            {isInitialLoading ? <ActivityIndicator color={colors.foreground} size="large" /> : null}
            <Text style={styles.emptyTitle}>{isInitialLoading ? 'Loading your feed…' : emptyTitle ?? 'No rankings yet'}</Text>
            {!isInitialLoading && emptyMessage ? <Text style={styles.emptyMessage}>{emptyMessage}</Text> : null}
          </View>
        )}
        maxToRenderPerBatch={2}
        onEndReached={() => {
          if (hasMore && !isLoadingMore) onLoadMore?.();
        }}
        onEndReachedThreshold={0.7}
        pagingEnabled
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={viewportHeight}
        windowSize={3}
        ListFooterComponent={isLoadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.foreground} />
            <Text style={styles.footerText}>Loading more rankings…</Text>
          </View>
        ) : showEndState && !hasMore && posts.length > 0 ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>You’re all caught up</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  emptyMessage: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 300, textAlign: 'center' },
  emptyTitle: { color: colors.foreground, fontSize: 20, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 10, height: 64, justifyContent: 'center' },
  footerText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
});
