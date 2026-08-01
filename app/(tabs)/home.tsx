import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function HomeScreen() {
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

const styles = StyleSheet.create({
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
