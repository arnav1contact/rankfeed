import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/src/theme/tokens';
import { sampleItems } from '@/src/features/rankings/random';
import type { RankingOutcome } from '@/src/features/rankings/types';
import type { FeedPost } from '../types';

type PostStageProps = { post: FeedPost; onComplete?: (outcome: RankingOutcome) => void };

function BlindRankingStage({ onComplete, post }: { post: Extract<FeedPost, { kind: 'blind-ranking' }>; onComplete?: (outcome: RankingOutcome) => void }) {
  const [draw, setDraw] = useState(() => post.items.slice(0, post.slotCount));
  const [itemIndex, setItemIndex] = useState(0);
  const [slots, setSlots] = useState<(string | null)[]>(() => Array.from({ length: post.slotCount }, () => null));
  const currentItem = draw[itemIndex];
  const complete = itemIndex >= draw.length;

  useEffect(() => {
    setDraw(sampleItems(post.items, Math.min(post.slotCount, post.items.length)));
    setItemIndex(0);
    setSlots(Array.from({ length: post.slotCount }, () => null));
  }, [post]);

  const placeItem = (slotIndex: number) => {
    if (complete || slots[slotIndex] || !currentItem) return;
    const nextSlots = slots.map((item, index) => index === slotIndex ? currentItem : item);
    setSlots(nextSlots);
    setItemIndex((current) => current + 1);
    if (itemIndex + 1 === draw.length) {
      onComplete?.({ kind: 'blind-ranking', rankedItems: nextSlots.filter((item): item is string => Boolean(item)) });
    }
  };

  const reset = () => {
    setDraw(sampleItems(post.items, Math.min(post.slotCount, post.items.length)));
    setItemIndex(0);
    setSlots(Array.from({ length: post.slotCount }, () => null));
  };

  return (
    <View style={styles.stageContent}>
      <View style={[styles.eyebrow, { backgroundColor: post.visual.accentColor }]}>
        <Text style={styles.eyebrowText}>{complete ? 'Ranking complete' : `Item ${itemIndex + 1} of ${draw.length}`}</Text>
      </View>
      <Text style={styles.prompt}>{complete ? 'Your final ranking' : 'Where does this go?'}</Text>
      <View style={styles.revealCard}>
        <Text style={styles.revealEmoji}>{complete ? '🏆' : post.visual.emoji}</Text>
        <Text style={styles.revealTitle}>{complete ? 'Locked in!' : currentItem}</Text>
      </View>
      <View style={styles.slots}>
        {slots.map((item, index) => (
          <Pressable
            accessibilityLabel={item ? `Rank ${index + 1}: ${item}` : `Place ${currentItem} at rank ${index + 1}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(item) || complete }}
            key={index}
            onPress={() => placeItem(index)}
            style={({ pressed }) => [
              styles.slot,
              item && { backgroundColor: post.visual.accentColor, borderColor: post.visual.accentColor },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.slotNumber, item && styles.selectedText]}>{index + 1}</Text>
            {item ? <Text numberOfLines={2} style={styles.slotItem}>{item}</Text> : null}
          </Pressable>
        ))}
      </View>
      {complete ? (
        <Pressable accessibilityRole="button" onPress={reset} style={styles.resetButton}>
          <Text style={styles.resetText}>Play again</Text>
        </Pressable>
      ) : <Text style={styles.helperText}>Random draw from {post.items.length} possibilities</Text>}
    </View>
  );
}

function BracketStage({ onComplete, post }: { post: Extract<FeedPost, { kind: 'bracket' }>; onComplete?: (outcome: RankingOutcome) => void }) {
  const drawSize = post.participants.length >= 8 ? 8 : post.participants.length >= 4 ? 4 : 2;
  const createDraw = () => sampleItems(post.participants.length >= 2 ? post.participants : post.matchup, drawSize);
  const [initialParticipants, setInitialParticipants] = useState(() => post.participants.slice(0, drawSize));
  const [round, setRound] = useState<string[]>(initialParticipants);
  const [pairIndex, setPairIndex] = useState(0);
  const [advanced, setAdvanced] = useState<string[]>([]);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [champion, setChampion] = useState<string>();
  const matchup = [round[pairIndex], round[pairIndex + 1]] as const;
  const matchNumber = Math.floor(pairIndex / 2) + 1;
  const totalMatches = Math.ceil(round.length / 2);
  const roundName = round.length <= 2 ? 'Final' : round.length <= 4 ? 'Semifinal' : round.length <= 8 ? 'Quarterfinal' : `Round of ${round.length}`;

  useEffect(() => {
    const nextParticipants = sampleItems(post.participants.length >= 2 ? post.participants : post.matchup, drawSize);
    setInitialParticipants(nextParticipants);
    setRound(nextParticipants);
    setPairIndex(0);
    setAdvanced([]);
    setEliminated([]);
    setChampion(undefined);
  }, [drawSize, post]);

  const pickWinner = (winner: string) => {
    const loser = matchup[0] === winner ? matchup[1] : matchup[0];
    const nextEliminated = loser ? [...eliminated, loser] : eliminated;
    setEliminated(nextEliminated);
    const winners = [...advanced, winner];
    if (pairIndex + 2 < round.length) {
      setAdvanced(winners);
      setPairIndex((current) => current + 2);
      return;
    }
    if (winners.length === 1) {
      setChampion(winners[0]);
      onComplete?.({ kind: 'bracket', rankedItems: [winners[0], ...[...nextEliminated].reverse()] });
      return;
    }
    setRound(winners);
    setAdvanced([]);
    setEliminated([]);
    setPairIndex(0);
  };

  const reset = () => {
    const nextParticipants = createDraw();
    setInitialParticipants(nextParticipants);
    setRound(nextParticipants);
    setPairIndex(0);
    setAdvanced([]);
    setChampion(undefined);
  };

  return (
    <View style={styles.stageContent}>
      <Text style={styles.roundLabel}>{champion ? 'Bracket complete' : `${roundName} · Match ${matchNumber} of ${totalMatches}`}</Text>
      {champion ? (
        <View style={styles.championCard}>
          <Text style={styles.championEmoji}>🏆</Text>
          <Text style={styles.championLabel}>Your champion</Text>
          <Text style={styles.championName}>{champion}</Text>
        </View>
      ) : <View style={styles.matchup}>
        <Pressable
          accessibilityLabel={`Choose ${matchup[0]}`}
          accessibilityRole="button"
          onPress={() => pickWinner(matchup[0])}
          style={({ pressed }) => [styles.competitor, pressed && styles.pressed]}>
          <Text style={styles.competitorEmoji}>🗡️</Text>
          <Text style={styles.competitorName}>{matchup[0]}</Text>
        </Pressable>
        <View style={[styles.versus, { backgroundColor: post.visual.accentColor }]}>
          <Text style={styles.versusText}>VS</Text>
        </View>
        <Pressable
          accessibilityLabel={`Choose ${matchup[1]}`}
          accessibilityRole="button"
          onPress={() => pickWinner(matchup[1])}
          style={({ pressed }) => [styles.competitor, pressed && styles.pressed]}>
          <Text style={styles.competitorEmoji}>🔨</Text>
          <Text style={styles.competitorName}>{matchup[1]}</Text>
        </Pressable>
      </View>}
      {champion ? (
        <Pressable accessibilityRole="button" onPress={reset} style={styles.resetButton}><Text style={styles.resetText}>Run it back</Text></Pressable>
      ) : <Text style={styles.helperText}>Random field from {post.participants.length} contenders</Text>}
    </View>
  );
}

function CompletedResultStage({ post }: { post: Extract<FeedPost, { kind: 'completed-result' }> }) {
  const [favoriteRank, setFavoriteRank] = useState<number>();

  return (
    <View style={styles.stageContent}>
      <Text style={styles.resultKicker}>CREATOR&apos;S FINAL TAKE</Text>
      <View style={styles.results}>
        {post.resultItems.map((item) => (
          <Pressable
            accessibilityLabel={`Vote for ${item.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: favoriteRank === item.rank }}
            key={item.rank}
            onPress={() => setFavoriteRank(item.rank)}
            style={({ pressed }) => [styles.resultRow, favoriteRank === item.rank && styles.resultRowSelected, pressed && styles.pressed]}>
            <Text style={[styles.resultRank, { color: post.visual.accentColor }]}>{item.rank}</Text>
            <Text numberOfLines={1} style={styles.resultLabel}>{item.label}</Text>
            {favoriteRank === item.rank ? <Text style={styles.yourPick}>Your pick</Text> : null}
          </Pressable>
        ))}
      </View>
      <Text style={styles.helperText}>{favoriteRank ? `You voted for #${favoriteRank}` : 'Tap the item you would put at #1'}</Text>
    </View>
  );
}

export function PostStage({ onComplete, post }: PostStageProps) {
  switch (post.kind) {
    case 'blind-ranking':
      return <BlindRankingStage onComplete={onComplete} post={post} />;
    case 'bracket':
      return <BracketStage onComplete={onComplete} post={post} />;
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
  slots: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', width: '100%' },
  slot: {
    alignItems: 'center', backgroundColor: colors.surface, borderColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: radii.sm, borderWidth: 1, height: 58, justifyContent: 'center', paddingHorizontal: 2, width: 54,
  },
  slotNumber: { color: colors.foreground, fontSize: 17, fontWeight: '800' },
  slotItem: { color: '#17151A', fontSize: 8, fontWeight: '800', lineHeight: 9, marginTop: 2, textAlign: 'center' },
  selectedText: { color: '#17151A' },
  helperText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  resetButton: { borderColor: 'rgba(255, 255, 255, 0.5)', borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: 8 },
  resetText: { color: colors.foreground, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  roundLabel: {
    color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase',
  },
  matchup: { alignItems: 'center', gap: spacing.sm, width: '100%' },
  competitor: {
    alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.94)', borderRadius: radii.md,
    flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14, width: '88%',
  },
  competitorEmoji: { fontSize: 28 },
  competitorName: { color: '#191619', flex: 1, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  versus: {
    alignItems: 'center', borderRadius: radii.pill, height: 36, justifyContent: 'center', width: 36, zIndex: 1,
  },
  versusText: { color: '#17151A', fontSize: 12, fontWeight: '900' },
  championCard: { alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.96)', borderRadius: radii.lg, padding: spacing.lg, width: '88%' },
  championEmoji: { fontSize: 42 },
  championLabel: { color: '#66626B', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: spacing.xs, textTransform: 'uppercase' },
  championName: { color: '#17151A', fontSize: 22, fontWeight: '900', marginTop: spacing.xs, textAlign: 'center' },
  resultKicker: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  results: { gap: spacing.sm, width: '90%' },
  resultRow: {
    alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.94)', borderRadius: radii.sm,
    flexDirection: 'row', gap: spacing.md, minHeight: 46, paddingHorizontal: spacing.md,
  },
  resultRowSelected: { borderColor: colors.foreground, borderWidth: 2 },
  resultRank: { fontSize: 21, fontWeight: '900', width: 24 },
  resultLabel: { color: '#17151A', flex: 1, fontSize: 16, fontWeight: '700' },
  yourPick: { color: '#57515B', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
});
