import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenShell } from '@/src/components/screen-shell';
import { useActivity } from '@/src/features/activity/activity-provider';
import type { ActivityKind, ActivityNotification } from '@/src/features/activity/types';
import { useAuth } from '@/src/features/auth/auth-provider';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function HomeScreen() {
  const { user } = useAuth();
  return user ? <ActivityInbox /> : <DiscoveryHome />;
}

function DiscoveryHome() {
  const router = useRouter();
  const { followedCreatorIds, posts, selectFeedMode } = useRankingStore();
  const playablePosts = posts.filter((post) => post.kind !== 'completed-result');
  const followedPosts = playablePosts.filter((post) => followedCreatorIds.includes(post.creator.id));
  const activityPosts = followedPosts.length > 0 ? followedPosts : playablePosts;

  return (
    <ScreenShell eyebrow="Good to see you" title="What’s ranking">
      <Pressable onPress={() => { void selectFeedMode('for-you'); router.navigate('/rankings'); }} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
        <View style={styles.heroIcon}><Ionicons color="#13160D" name="play" size={22} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>For you · {playablePosts.length} games ready</Text>
          <Text style={styles.heroTitle}>Swipe through rankings you can play</Text>
        </View>
        <Ionicons color={colors.foreground} name="chevron-forward" size={22} />
      </Pressable>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{followedPosts.length > 0 ? 'Play from creators you follow' : 'Pick a ranking to play'}</Text>
        <Pressable onPress={() => { void selectFeedMode(followedPosts.length > 0 ? 'following' : 'for-you'); router.navigate('/rankings'); }}><Text style={styles.link}>See all</Text></Pressable>
      </View>
      {activityPosts.slice(0, 3).map((post) => (
        <Pressable key={post.id} onPress={() => router.push({ pathname: '/play/[sourceId]', params: { sourceId: post.id } })} style={({ pressed }) => [styles.activity, pressed && styles.pressed]}>
          <View style={[styles.avatar, { borderColor: post.visual.accentColor }]}><Text style={styles.avatarText}>{post.creator.avatarLabel}</Text></View>
          <View style={styles.activityCopy}>
            <Text style={styles.creator}>{post.creator.displayName} <Text style={styles.handle}>{post.creator.handle}</Text></Text>
            <Text numberOfLines={2} style={styles.prompt}>{post.title}</Text>
            <Text style={styles.topic}>{post.topic}</Text>
          </View>
          <Ionicons color="#777A84" name="chevron-forward" size={18} />
        </Pressable>
      ))}
    </ScreenShell>
  );
}

const activityIcons: Record<ActivityKind, React.ComponentProps<typeof Ionicons>['name']> = {
  comment: 'chatbubble-outline',
  follow: 'person-add-outline',
  like: 'heart-outline',
  moderation: 'shield-checkmark-outline',
  'ranking-complete': 'podium-outline',
};

function notificationMessage(notification: ActivityNotification) {
  const actor = notification.actor?.displayName ?? 'Someone';
  if (notification.kind === 'follow') return `${actor} started following you`;
  if (notification.kind === 'like') return `${actor} liked your ranking`;
  if (notification.kind === 'comment') return `${actor} commented on your ranking`;
  if (notification.kind === 'ranking-complete') return `${actor} completed your ranking`;
  return 'There is an update about your account';
}

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function ActivityInbox() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { error, hasMore, isLoading, isLoadingMore, loadMore, markAllRead, markRead, notifications, refresh, unreadCount } = useActivity();

  const openNotification = (notification: ActivityNotification) => {
    void markRead(notification.id).catch(() => undefined);
    if (notification.postId) router.push({ pathname: '/play/[sourceId]', params: { sourceId: notification.postId } });
  };

  const renderItem: ListRenderItem<ActivityNotification> = ({ item }) => (
    <Pressable
      accessibilityLabel={`${notificationMessage(item)}${item.readAt ? '' : ', unread'}`}
      onPress={() => openNotification(item)}
      style={({ pressed }) => [styles.notification, !item.readAt && styles.notificationUnread, pressed && styles.pressed]}>
      <View style={[styles.notificationIcon, !item.readAt && styles.notificationIconUnread]}>
        <Ionicons color={item.readAt ? '#9B9DA6' : '#C8FF64'} name={activityIcons[item.kind]} size={20} />
      </View>
      <View style={styles.notificationCopy}>
        <Text style={styles.notificationMessage}>{notificationMessage(item)}</Text>
        {item.postTitle ? <Text numberOfLines={1} style={styles.notificationPost}>{item.postTitle}</Text> : null}
        <Text style={styles.notificationTime}>{relativeTime(item.createdAt)}</Text>
      </View>
      {!item.readAt ? <View accessibilityLabel="Unread" style={styles.unreadDot} /> : <Ionicons color="#676A74" name="chevron-forward" size={17} />}
    </Pressable>
  );

  return (
    <FlatList
      contentContainerStyle={[styles.activityContent, { paddingTop: insets.top + spacing.xl }]}
      data={notifications}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={isLoading ? (
        <View style={styles.activityEmpty}><ActivityIndicator color="#C8FF64" /><Text style={styles.activityEmptyText}>Loading activity…</Text></View>
      ) : (
        <View style={styles.activityEmpty}>
          <Ionicons color="#C8FF64" name="notifications-outline" size={34} />
          <Text style={styles.activityEmptyTitle}>Your activity starts here</Text>
          <Text style={styles.activityEmptyText}>New followers and interactions with your rankings will show up here.</Text>
        </View>
      )}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#C8FF64" style={styles.activityFooter} /> : null}
      ListHeaderComponent={(
        <View>
          <Text style={styles.activityEyebrow}>Your community</Text>
          <Text style={styles.activityTitle}>Activity</Text>
          <View style={styles.activitySectionRow}>
            <Text style={styles.sectionTitle}>{unreadCount > 0 ? `${unreadCount} new` : 'Notifications'}</Text>
            {unreadCount > 0 ? <Pressable onPress={() => void markAllRead().catch(() => undefined)}><Text style={styles.link}>Mark all read</Text></Pressable> : null}
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.activityError}>{error}</Text> : null}
        </View>
      )}
      onEndReached={() => { if (hasMore && !isLoadingMore) void loadMore(); }}
      onEndReachedThreshold={0.6}
      onRefresh={() => void refresh()}
      refreshing={isLoading}
      renderItem={renderItem}
      style={styles.activityContainer}
    />
  );
}

const styles = StyleSheet.create({
  activityContainer: { backgroundColor: colors.background, flex: 1 },
  activityContent: { minHeight: '100%', paddingBottom: 118, paddingHorizontal: spacing.lg },
  activityEmpty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: 70 },
  activityEmptyText: { color: '#8F929C', fontSize: 13, lineHeight: 20, marginTop: spacing.sm, textAlign: 'center' },
  activityEmptyTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900', marginTop: spacing.md },
  activityError: { color: '#FF879A', fontSize: 13, marginBottom: spacing.md },
  activityEyebrow: { color: '#C8FF64', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  activityFooter: { marginVertical: spacing.xl },
  activitySectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: 30 },
  activityTitle: { color: colors.foreground, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: spacing.xs },
  hero: {
    alignItems: 'center', backgroundColor: '#1A2030', borderColor: '#30384D', borderRadius: radii.lg,
    borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl, padding: spacing.lg,
  },
  heroIcon: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 18, height: 44, justifyContent: 'center', width: 44 },
  heroCopy: { flex: 1 },
  heroKicker: { color: '#C8FF64', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  heroTitle: { color: colors.foreground, fontSize: 17, fontWeight: '800', lineHeight: 22, marginTop: 3 },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: 30 },
  sectionTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900' },
  link: { color: '#C8FF64', fontSize: 13, fontWeight: '800' },
  notification: {
    alignItems: 'center', borderBottomColor: '#24262D', borderBottomWidth: 1, flexDirection: 'row',
    gap: spacing.md, minHeight: 88, paddingHorizontal: spacing.sm, paddingVertical: spacing.md,
  },
  notificationCopy: { flex: 1 },
  notificationIcon: { alignItems: 'center', backgroundColor: '#181A20', borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  notificationIconUnread: { backgroundColor: 'rgba(200, 255, 100, 0.1)' },
  notificationMessage: { color: colors.foreground, fontSize: 14, fontWeight: '800', lineHeight: 19 },
  notificationPost: { color: '#B3B5BD', fontSize: 12, marginTop: 3 },
  notificationTime: { color: '#777A84', fontSize: 11, marginTop: 5 },
  notificationUnread: { backgroundColor: 'rgba(200, 255, 100, 0.035)' },
  unreadDot: { backgroundColor: '#C8FF64', borderRadius: 5, height: 8, width: 8 },
  activity: {
    alignItems: 'center', backgroundColor: '#12141A', borderBottomColor: '#24262D', borderBottomWidth: 1,
    flexDirection: 'row', gap: spacing.md, minHeight: 92, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  avatar: { alignItems: 'center', backgroundColor: '#20232B', borderRadius: 22, borderWidth: 2, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: colors.foreground, fontSize: 12, fontWeight: '900' },
  activityCopy: { flex: 1 },
  creator: { color: colors.foreground, fontSize: 13, fontWeight: '800' },
  handle: { color: '#888B95', fontWeight: '500' },
  prompt: { color: '#E7E8EB', fontSize: 14, fontWeight: '700', lineHeight: 19, marginTop: 3 },
  topic: { color: '#888B95', fontSize: 11, marginTop: 4 },
  pressed: { opacity: 0.7 },
});
