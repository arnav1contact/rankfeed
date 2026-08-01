import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { PostStage } from '@/src/features/feed/components/post-stage';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { templateToFeedPost } from '@/src/features/rankings/template-post';
import { mockRankingTemplates } from '@/src/mock-data';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function PlayRankingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sourceId?: string | string[] }>();
  const sourceId = Array.isArray(params.sourceId) ? params.sourceId[0] : params.sourceId;
  const { posts } = useRankingStore();
  const template = mockRankingTemplates.find((item) => item.id === sourceId);
  const existingPost = posts.find((post) => post.id === sourceId || post.templateId === sourceId);
  const post = useMemo(() => template ? templateToFeedPost(template) : existingPost, [existingPost, template]);

  if (!post) {
    return (
      <ScreenShell eyebrow="Ranking session" title="Ranking not found">
        <Text style={styles.missingCopy}>This ranking may have been removed or is no longer available.</Text>
        <Pressable onPress={() => router.replace('/explore')} style={styles.primaryButton}><Text style={styles.primaryText}>Browse rankings</Text></Pressable>
      </ScreenShell>
    );
  }

  const possibilityCount = post.kind === 'bracket' ? post.participants.length : post.kind === 'blind-ranking' ? post.items.length : post.resultItems.length;
  const formatLabel = post.kind === 'blind-ranking' ? 'Blind ranking' : post.kind === 'bracket' ? 'Head-to-head bracket' : 'Finished list';

  return (
    <ScreenShell eyebrow="Play now" title={post.title}>
      <Pressable accessibilityLabel="Back to Explore" onPress={() => router.back()} style={styles.back}>
        <Ionicons color="#C8FF64" name="arrow-back" size={18} />
        <Text style={styles.backText}>Back to Explore</Text>
      </Pressable>
      <View style={styles.metaRow}>
        <View style={styles.badge}><Text style={styles.badgeText}>{formatLabel}</Text></View>
        <Text style={styles.poolCount}>{possibilityCount} possible items · randomized per game</Text>
      </View>
      <Text style={styles.instructions}>{post.kind === 'blind-ranking' ? 'Place each surprise item before the next one is revealed.' : post.kind === 'bracket' ? 'Choose one winner from every matchup until a champion remains.' : 'See how this creator ordered their favorites.'}</Text>
      <View style={[styles.gameCard, { borderColor: post.visual.accentColor }]}>
        <PostStage post={post} />
      </View>
      <Pressable onPress={() => router.push({ pathname: '/create', params: { templateId: post.templateId } })} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Ionicons color="#C8FF64" name="create-outline" size={19} />
        <Text style={styles.secondaryText}>Customize and publish your own</Text>
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, paddingVertical: spacing.sm },
  backText: { color: '#C8FF64', fontSize: 13, fontWeight: '800' },
  metaRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  badge: { backgroundColor: '#C8FF64', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  badgeText: { color: '#13160D', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  poolCount: { color: '#92959F', fontSize: 11 },
  instructions: { color: '#C6C8CE', fontSize: 14, lineHeight: 21, marginTop: spacing.md },
  gameCard: { backgroundColor: '#15171D', borderRadius: radii.lg, borderWidth: 1, marginTop: spacing.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.xl },
  secondaryButton: { alignItems: 'center', borderColor: '#3A422B', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, paddingHorizontal: spacing.lg },
  secondaryText: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, justifyContent: 'center', marginTop: spacing.xl, minHeight: 50 },
  primaryText: { color: '#13160D', fontSize: 14, fontWeight: '900' },
  missingCopy: { color: '#9A9DA6', fontSize: 14, lineHeight: 21, marginTop: spacing.lg },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
