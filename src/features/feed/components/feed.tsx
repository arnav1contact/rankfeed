import { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ListRenderItem,
} from 'react-native';

import { colors } from '@/src/theme/tokens';
import type { FeedPost as FeedPostModel } from '../types';
import { FeedPost } from './feed-post';

type FeedProps = { posts: readonly FeedPostModel[] };

export function Feed({ posts }: FeedProps) {
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
        maxToRenderPerBatch={2}
        pagingEnabled
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={viewportHeight}
        windowSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
});
