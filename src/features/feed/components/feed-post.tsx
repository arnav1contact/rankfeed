import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_CONFIG } from '@/src/config/app';
import { colors, radii, spacing } from '@/src/theme/tokens';
import type { FeedPost as FeedPostModel } from '../types';
import { EngagementRail } from './engagement-rail';
import { PostStage } from './post-stage';

type FeedPostProps = { post: FeedPostModel; viewportHeight: number };

function callToAction(post: FeedPostModel) {
  switch (post.kind) {
    case 'blind-ranking': return 'Start ranking';
    case 'bracket': return 'Play bracket';
    case 'completed-result': return 'Try this template';
  }
}

export function FeedPost({ post, viewportHeight }: FeedPostProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View
      accessibilityLabel={`${post.creator.displayName}: ${post.title}`}
      style={[styles.container, { height: viewportHeight }]}>
      <View style={[styles.videoBackdrop, { backgroundColor: post.visual.backgroundColor }]}>
        <View style={styles.videoVignette} />
        <Ionicons color="rgba(255, 255, 255, 0.12)" name="videocam-outline" size={56} />
        <Text style={styles.videoLabel}>Creator video</Text>
      </View>
      <View style={[styles.orb, styles.orbTop, { backgroundColor: post.visual.accentColor }]} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.brand}>{APP_CONFIG.displayName}</Text>
        <View style={styles.feedTabs}>
          <Text style={styles.inactiveTab}>Following</Text>
          <View style={styles.activeTabWrap}>
            <Text style={styles.activeTab}>For You</Text>
            <View style={[styles.activeTabLine, { backgroundColor: post.visual.accentColor }]} />
          </View>
        </View>
        <Pressable accessibilityLabel="Search" accessibilityRole="button" hitSlop={10}>
          <Ionicons color={colors.foreground} name="search-outline" size={25} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.rankingOverlay}>
          <View style={styles.topicRow}>
            <View style={[styles.topicDot, { backgroundColor: post.visual.accentColor }]} />
            <Text style={styles.topic}>{post.topic}</Text>
          </View>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.stage}><PostStage post={post} /></View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: tabBarHeight + spacing.md }]}>
        <View style={styles.postDetails}>
          <View style={styles.creatorRow}>
            <View style={[styles.avatar, { borderColor: post.visual.accentColor }]}>
              <Text style={styles.avatarLabel}>{post.creator.avatarLabel}</Text>
            </View>
            <View style={styles.creatorText}>
              <Text style={styles.creatorName}>{post.creator.displayName}</Text>
              <Text style={styles.creatorHandle}>{post.creator.handle}</Text>
            </View>
            <Pressable
              accessibilityLabel={`Follow ${post.creator.displayName}`}
              accessibilityRole="button"
              style={({ pressed }) => [styles.followButton, pressed && styles.buttonPressed]}>
              <Text style={styles.followText}>Follow</Text>
            </Pressable>
          </View>
          <Text numberOfLines={2} style={styles.caption}>{post.caption}</Text>
          <Pressable
            accessibilityLabel={`${callToAction(post)}: ${post.title}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: post.visual.accentColor },
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.ctaText}>{callToAction(post)}</Text>
            <Ionicons color="#17151A" name="arrow-forward" size={18} />
          </Pressable>
        </View>
        <EngagementRail accentColor={post.visual.accentColor} engagement={post.engagement} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#07080B', overflow: 'hidden', width: '100%' },
  videoBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  videoVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  videoLabel: {
    color: 'rgba(255, 255, 255, 0.22)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  orb: { borderRadius: radii.pill, opacity: 0.14, pointerEvents: 'none', position: 'absolute' },
  orbTop: { height: 300, right: -120, top: 80, width: 300 },
  header: {
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, position: 'absolute', top: 0, width: '100%', zIndex: 2,
  },
  brand: { color: colors.foreground, fontSize: 17, fontWeight: '900', letterSpacing: -0.4, width: 78 },
  feedTabs: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  inactiveTab: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  activeTabWrap: { alignItems: 'center', gap: spacing.xs },
  activeTab: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  activeTabLine: { borderRadius: radii.pill, height: 3, width: 22 },
  content: {
    alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 230,
    paddingHorizontal: spacing.lg, paddingTop: 90, pointerEvents: 'box-none',
  },
  rankingOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 9, 12, 0.68)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radii.lg,
    borderWidth: 1,
    maxWidth: 430,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 24,
    width: '100%',
  },
  topicRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  topicDot: { borderRadius: radii.pill, height: 7, width: 7 },
  topic: {
    color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 0.45, textTransform: 'uppercase',
  },
  title: {
    color: colors.foreground, fontSize: 28, fontWeight: '900', letterSpacing: -0.8,
    lineHeight: 32, maxWidth: 340, textAlign: 'center',
  },
  stage: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, width: '100%' },
  footer: {
    alignItems: 'flex-end', bottom: 0, flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, position: 'absolute', width: '100%', zIndex: 2,
  },
  postDetails: { flex: 1, gap: spacing.md },
  creatorRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  avatar: {
    alignItems: 'center', backgroundColor: 'rgba(10, 10, 12, 0.72)', borderRadius: radii.pill,
    borderWidth: 2, height: 42, justifyContent: 'center', width: 42,
  },
  avatarLabel: { color: colors.foreground, fontSize: 12, fontWeight: '900' },
  creatorText: { flex: 1 },
  creatorName: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  creatorHandle: { color: colors.muted, fontSize: 12, marginTop: 1 },
  followButton: {
    borderColor: 'rgba(255, 255, 255, 0.7)', borderRadius: radii.pill, borderWidth: 1,
    paddingHorizontal: spacing.md, paddingVertical: 7,
  },
  followText: { color: colors.foreground, fontSize: 12, fontWeight: '800' },
  caption: {
    color: colors.foreground, fontSize: 14, lineHeight: 19, textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  cta: {
    alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.pill, flexDirection: 'row',
    gap: spacing.sm, minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  ctaText: { color: '#17151A', fontSize: 14, fontWeight: '900' },
  buttonPressed: { opacity: 0.68, transform: [{ scale: 0.97 }] },
});
