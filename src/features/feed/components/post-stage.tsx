import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/theme/tokens';
import type { FeedPost } from '../types';

type PostStageProps = { post: FeedPost };

function BlindRankingStage({ post }: { post: Extract<FeedPost, { kind: 'blind-ranking' }> }) {
  const [selectedSlot, setSelectedSlot] = useState<number>();

  return (
    <View style={styles.stageContent}>
      <View style={[styles.eyebrow, { backgroundColor: post.visual.accentColor }]}>
        <Text style={styles.eyebrowText}>{post.progressLabel}</Text>
      </View>
      <Text style={styles.prompt}>Where does this go?</Text>
      <View style={styles.revealCard}>
        <Text style={styles.revealEmoji}>{post.visual.emoji}</Text>
        <Text style={styles.revealTitle}>{post.currentItem}</Text>
      </View>
      <View style={styles.slots}>
        {Array.from({ length: post.slotCount }, (_, index) => (
          <Pressable
            accessibilityLabel={`Place ${post.currentItem} at rank ${index + 1}`}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedSlot === index }}
            key={index}
            onPress={() => setSelectedSlot(index)}
            style={({ pressed }) => [
              styles.slot,
              selectedSlot === index && { backgroundColor: post.visual.accentColor, borderColor: post.visual.accentColor },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.slotNumber, selectedSlot === index && styles.selectedText]}>{index + 1}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.helperText}>{selectedSlot === undefined ? 'Tap a spot to rank it' : `Locked at #${selectedSlot + 1}`}</Text>
    </View>
  );
}

function BracketStage({ post }: { post: Extract<FeedPost, { kind: 'bracket' }> }) {
  const [winner, setWinner] = useState<string>();

  return (
    <View style={styles.stageContent}>
      <Text style={styles.roundLabel}>{post.roundLabel}</Text>
      <View style={styles.matchup}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: winner === post.matchup[0] }}
          onPress={() => setWinner(post.matchup[0])}
          style={({ pressed }) => [styles.competitor, winner === post.matchup[0] && styles.competitorSelected, pressed && styles.pressed]}>
          <Text style={styles.competitorEmoji}>🗡️</Text>
          <Text style={styles.competitorName}>{post.matchup[0]}</Text>
        </Pressable>
        <View style={[styles.versus, { backgroundColor: post.visual.accentColor }]}>
          <Text style={styles.versusText}>VS</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: winner === post.matchup[1] }}
          onPress={() => setWinner(post.matchup[1])}
          style={({ pressed }) => [styles.competitor, winner === post.matchup[1] && styles.competitorSelected, pressed && styles.pressed]}>
          <Text style={styles.competitorEmoji}>🔨</Text>
          <Text style={styles.competitorName}>{post.matchup[1]}</Text>
        </Pressable>
      </View>
      <Text style={styles.helperText}>{winner ? `${winner} advances` : 'Tap your winner'}</Text>
    </View>
  );
}

function CompletedResultStage({ post }: { post: Extract<FeedPost, { kind: 'completed-result' }> }) {
  return (
    <View style={styles.stageContent}>
      <Text style={styles.resultKicker}>NINA&apos;S FINAL TAKE</Text>
      <View style={styles.results}>
        {post.resultItems.map((item) => (
          <View key={item.rank} style={styles.resultRow}>
            <Text style={[styles.resultRank, { color: post.visual.accentColor }]}>{item.rank}</Text>
            <Text numberOfLines={1} style={styles.resultLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function PostStage({ post }: PostStageProps) {
  switch (post.kind) {
    case 'blind-ranking':
      return <BlindRankingStage post={post} />;
    case 'bracket':
      return <BracketStage post={post} />;
    case 'completed-result':
      return <CompletedResultStage post={post} />;
  }
}

const styles = StyleSheet.create({
  stageContent: { alignItems: 'center', gap: spacing.md, width: '100%' },
  eyebrow: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  eyebrowText: {
    color: '#151218', fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase',
  },
  prompt: { color: colors.foreground, fontSize: 15, fontWeight: '600' },
  revealCard: {
    alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.96)', borderRadius: radii.lg,
    gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, width: '86%',
  },
  revealEmoji: { fontSize: 46 },
  revealTitle: { color: '#17151A', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  slots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', width: '100%' },
  slot: {
    alignItems: 'center', backgroundColor: colors.surface, borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: radii.sm, borderWidth: 1, height: 45, justifyContent: 'center', width: 45,
  },
  slotNumber: { color: colors.foreground, fontSize: 17, fontWeight: '800' },
  selectedText: { color: '#17151A' },
  helperText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  roundLabel: {
    color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase',
  },
  matchup: { alignItems: 'center', gap: spacing.sm, width: '100%' },
  competitor: {
    alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.94)', borderRadius: radii.md,
    flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14, width: '88%',
  },
  competitorSelected: { borderColor: colors.foreground, borderWidth: 3 },
  competitorEmoji: { fontSize: 28 },
  competitorName: { color: '#191619', flex: 1, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  versus: {
    alignItems: 'center', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36, zIndex: 1,
  },
  versusText: { color: '#17151A', fontSize: 12, fontWeight: '900' },
  resultKicker: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  results: { gap: spacing.sm, width: '90%' },
  resultRow: {
    alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.94)', borderRadius: radii.sm,
    flexDirection: 'row', gap: spacing.md, minHeight: 46, paddingHorizontal: spacing.md,
  },
  resultRank: { fontSize: 21, fontWeight: '900', width: 24 },
  resultLabel: { color: '#17151A', flex: 1, fontSize: 16, fontWeight: '700' },
});
