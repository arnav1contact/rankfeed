import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useAuth } from '@/src/features/auth/auth-provider';
import { PostStage } from '@/src/features/feed/components/post-stage';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { templateToFeedPost } from '@/src/features/rankings/template-post';
import { mockRankingTemplates } from '@/src/mock-data';
import { colors, radii, spacing } from '@/src/theme/tokens';
import type { CompletedPlay, RankingOutcome } from '@/src/features/rankings/types';

export default function PlayRankingScreen() {
  const router = useRouter();
  const { isConfigured, user } = useAuth();
  const params = useLocalSearchParams<{ sourceId?: string | string[] }>();
  const sourceId = Array.isArray(params.sourceId) ? params.sourceId[0] : params.sourceId;
  const { posts, publishCompletedPlay, recordCompletion } = useRankingStore();
  const [completedPlay, setCompletedPlay] = useState<CompletedPlay>();
  const [isPublishingResult, setIsPublishingResult] = useState(false);
  const template = mockRankingTemplates.find((item) => item.id === sourceId);
  const existingPost = posts.find((post) => post.id === sourceId || post.templateId === sourceId);
  const post = useMemo(() => template ? templateToFeedPost(template) : existingPost, [existingPost, template]);
  const handleComplete = useCallback(async (outcome: RankingOutcome) => {
    if (!post) return;
    const completed = await recordCompletion(post, outcome);
    setCompletedPlay(completed);
  }, [post, recordCompletion]);

  const shareResult = useCallback(async () => {
    if (!completedPlay) return;
    const result = completedPlay.kind === 'bracket'
      ? `My champion: ${completedPlay.rankedItems[0]}`
      : completedPlay.rankedItems.map((item, index) => `${index + 1}. ${item}`).join('\n');
    await Share.share({ message: `${completedPlay.title}\n${result}\n\nMade with Rankfeed` });
  }, [completedPlay]);

  const postResult = useCallback(async () => {
    if (!completedPlay || completedPlay.publishedPostId || isPublishingResult) return;
    if (isConfigured && !user) {
      router.push('/sign-in');
      return;
    }
    setIsPublishingResult(true);
    try {
      const publishedPost = await publishCompletedPlay(completedPlay.id);
      setCompletedPlay((current) => current ? { ...current, publishedPostId: publishedPost.id } : current);
    } finally {
      setIsPublishingResult(false);
    }
  }, [completedPlay, isConfigured, isPublishingResult, publishCompletedPlay, router, user]);

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
        <PostStage onComplete={handleComplete} post={post} />
      </View>
      {completedPlay ? (
        <View style={styles.receipt}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptIcon}><Ionicons color="#13160D" name="checkmark" size={18} /></View>
            <View style={styles.receiptCopy}>
              <Text style={styles.receiptTitle}>Saved to your history</Text>
              <Text style={styles.receiptMeta}>{completedPlay.syncState === 'synced' ? 'Synced with your account' : completedPlay.syncState === 'error' ? 'Saved locally — cloud sync will need attention' : 'Available on this device'}</Text>
            </View>
          </View>
          {completedPlay.rankedItems.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.resultRow}>
              <Text style={styles.resultRank}>{completedPlay.kind === 'bracket' ? '🏆' : index + 1}</Text>
              <Text style={styles.resultItem}>{item}</Text>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(completedPlay.publishedPostId) || isPublishingResult }}
            disabled={Boolean(completedPlay.publishedPostId) || isPublishingResult}
            onPress={() => void postResult()}
            style={({ pressed }) => [styles.postButton, completedPlay.publishedPostId && styles.postButtonComplete, pressed && styles.pressed]}>
            <Ionicons color="#13160D" name={completedPlay.publishedPostId ? 'checkmark-circle-outline' : 'send-outline'} size={19} />
            <Text style={styles.postButtonText}>{completedPlay.publishedPostId ? 'Posted to Finished Lists' : isPublishingResult ? 'Posting result…' : 'Post this result'}</Text>
          </Pressable>
          <View style={styles.receiptActions}>
            <Pressable onPress={() => void shareResult()} style={({ pressed }) => [styles.receiptButton, pressed && styles.pressed]}><Ionicons color="#C8FF64" name="share-outline" size={18} /><Text style={styles.receiptButtonText}>Share</Text></Pressable>
            <Pressable onPress={() => completedPlay.publishedPostId ? router.push({ pathname: '/explore', params: { mode: 'results' } }) : router.push('/profile')} style={({ pressed }) => [styles.receiptButton, pressed && styles.pressed]}><Ionicons color="#C8FF64" name={completedPlay.publishedPostId ? 'people-outline' : 'time-outline'} size={18} /><Text style={styles.receiptButtonText}>{completedPlay.publishedPostId ? 'View lists' : 'History'}</Text></Pressable>
          </View>
        </View>
      ) : null}
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
  receipt: { backgroundColor: '#12151A', borderColor: '#343B2A', borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md },
  receiptHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  receiptIcon: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  receiptCopy: { flex: 1 },
  receiptTitle: { color: colors.foreground, fontSize: 14, fontWeight: '900' },
  receiptMeta: { color: '#8F929C', fontSize: 11, marginTop: 2 },
  resultRow: { alignItems: 'center', backgroundColor: '#1A1D24', borderRadius: radii.sm, flexDirection: 'row', gap: spacing.md, minHeight: 40, paddingHorizontal: spacing.md },
  resultRank: { color: '#C8FF64', fontSize: 15, fontWeight: '900', textAlign: 'center', width: 22 },
  resultItem: { color: colors.foreground, flex: 1, fontSize: 13, fontWeight: '700' },
  postButton: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xs, minHeight: 46 },
  postButtonComplete: { backgroundColor: '#A8D956' },
  postButtonText: { color: '#13160D', fontSize: 13, fontWeight: '900' },
  receiptActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  receiptButton: { alignItems: 'center', borderColor: '#3A422B', borderRadius: radii.pill, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', minHeight: 42 },
  receiptButtonText: { color: '#C8FF64', fontSize: 12, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', borderColor: '#3A422B', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.xl, minHeight: 50, paddingHorizontal: spacing.lg },
  secondaryText: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, justifyContent: 'center', marginTop: spacing.xl, minHeight: 50 },
  primaryText: { color: '#13160D', fontSize: 14, fontWeight: '900' },
  missingCopy: { color: '#9A9DA6', fontSize: 14, lineHeight: 21, marginTop: spacing.lg },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
