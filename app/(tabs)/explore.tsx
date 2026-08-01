import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { mockRankingTemplates } from '@/src/mock-data';
import { colors, radii, spacing } from '@/src/theme/tokens';

const categories = ['All', 'Food', 'Music', 'Gaming', 'Games', 'Travel', 'TV', 'Movies', 'Culture', 'Mythology', 'Nature', 'Style'] as const;
type ExploreMode = 'play' | 'results';

export default function ExploreScreen() {
  const router = useRouter();
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const { posts } = useRankingStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [mode, setMode] = useState<ExploreMode>('play');
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (requestedMode === 'results' || requestedMode === 'play') setMode(requestedMode);
  }, [requestedMode]);

  const playableTemplates = useMemo(() => mockRankingTemplates.filter((template) => {
    const matchesType = template.format !== 'completed-result';
    const matchesCategory = category === 'All' || template.topic === category;
    const matchesQuery = !normalizedQuery || `${template.title} ${template.topic} ${template.description} ${template.items.join(' ')}`.toLowerCase().includes(normalizedQuery);
    return matchesType && matchesCategory && matchesQuery;
  }), [category, normalizedQuery]);

  const finishedLists = useMemo(() => {
    const matchingPosts = posts.filter((post) => {
      const matchesType = post.kind === 'completed-result';
      const matchesCategory = category === 'All' || post.topic.toLowerCase().includes(category.toLowerCase());
      const matchesQuery = !normalizedQuery || `${post.title} ${post.topic} ${post.creator.displayName}`.toLowerCase().includes(normalizedQuery);
      return matchesType && matchesCategory && matchesQuery;
    });
    return [...new Map(matchingPosts.map((post) => [post.templateId, post])).values()];
  }, [category, normalizedQuery, posts]);

  const count = mode === 'play' ? playableTemplates.length : finishedLists.length;

  return (
    <ScreenShell eyebrow="Choose your experience" title="Explore">
      <Text style={styles.intro}>Start a ranking yourself, or browse lists other people have already finished.</Text>

      <View accessibilityRole="tablist" style={styles.modeSwitch}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'play' }} onPress={() => setMode('play')} style={[styles.modeButton, mode === 'play' && styles.modeButtonActive]}>
          <Ionicons color={mode === 'play' ? '#13160D' : '#A6A9B2'} name="play-circle-outline" size={20} />
          <View><Text style={[styles.modeTitle, mode === 'play' && styles.modeTitleActive]}>Play rankings</Text><Text style={[styles.modeHint, mode === 'play' && styles.modeHintActive]}>You make the choices</Text></View>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'results' }} onPress={() => setMode('results')} style={[styles.modeButton, mode === 'results' && styles.modeButtonActive]}>
          <Ionicons color={mode === 'results' ? '#13160D' : '#A6A9B2'} name="list-outline" size={20} />
          <View><Text style={[styles.modeTitle, mode === 'results' && styles.modeTitleActive]}>Finished lists</Text><Text style={[styles.modeHint, mode === 'results' && styles.modeHintActive]}>See creator results</Text></View>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons color="#858893" name="search" size={20} />
        <TextInput accessibilityLabel="Search rankings" onChangeText={setQuery} placeholder={mode === 'play' ? 'Search ranking games' : 'Search finished lists'} placeholderTextColor="#777A84" returnKeyType="search" style={styles.searchInput} value={query} />
        {query ? <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons color="#9B9DA6" name="close-circle" size={20} /></Pressable> : null}
      </View>

      <ScrollView contentContainerStyle={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((item) => (
          <Pressable accessibilityState={{ selected: item === category }} key={item} onPress={() => setCategory(item)} style={[styles.category, item === category && styles.categoryActive]}>
            <Text style={[styles.categoryText, item === category && styles.categoryTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{mode === 'play' ? 'Pick one to play' : 'Latest finished lists'}</Text>
        <Text style={styles.count}>{count}</Text>
      </View>

      {mode === 'play' ? playableTemplates.map((template) => (
        <Pressable key={template.id} onPress={() => router.push({ pathname: '/play/[sourceId]', params: { sourceId: template.id } })} style={({ pressed }) => [styles.playCard, pressed && styles.pressed]}>
          <View style={styles.playTopRow}>
            <View style={styles.templateIcon}><Ionicons color="#C8FF64" name={template.format === 'bracket' ? 'git-network-outline' : 'eye-off-outline'} size={22} /></View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardKicker}>{template.topic} · {template.format === 'bracket' ? 'Bracket' : 'Blind ranking'}</Text>
              <Text style={styles.cardTitle}>{template.title}</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>{template.description}</Text>
          <View style={styles.playBottomRow}>
            <Text style={styles.poolCount}>{template.items.length} possible items</Text>
            <View style={styles.playCta}><Text style={styles.playCtaText}>Play now</Text><Ionicons color="#13160D" name="arrow-forward" size={17} /></View>
          </View>
        </Pressable>
      )) : finishedLists.map((post) => {
        if (post.kind !== 'completed-result') return null;
        return (
          <View key={post.id} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={[styles.avatar, { borderColor: post.visual.accentColor }]}><Text style={styles.avatarText}>{post.creator.avatarLabel}</Text></View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardKicker}>{post.topic}</Text>
                <Text style={styles.cardTitle}>{post.title}</Text>
                <Text style={styles.creator}>by {post.creator.displayName}</Text>
              </View>
            </View>
            <View style={styles.resultItems}>
              {post.resultItems.map((item) => (
                <View key={item.rank} style={styles.resultRow}>
                  <Text style={[styles.resultRank, { color: post.visual.accentColor }]}>{item.rank}</Text>
                  <Text numberOfLines={1} style={styles.resultLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {count === 0 ? (
        <View style={styles.empty}>
          <Ionicons color="#676A74" name={mode === 'play' ? 'game-controller-outline' : 'list-outline'} size={34} />
          <Text style={styles.emptyTitle}>Nothing found here</Text>
          <Text style={styles.emptyText}>Try another search or category.</Text>
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: { color: '#A4A7B0', fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 440 },
  modeSwitch: { backgroundColor: '#13151A', borderRadius: radii.lg, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.xs },
  modeButton: { alignItems: 'center', borderRadius: radii.md, flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md },
  modeButtonActive: { backgroundColor: '#C8FF64' },
  modeTitle: { color: colors.foreground, fontSize: 13, fontWeight: '900' },
  modeTitleActive: { color: '#13160D' },
  modeHint: { color: '#7F828C', fontSize: 10, marginTop: 2 },
  modeHintActive: { color: '#4C572F' },
  search: { alignItems: 'center', backgroundColor: '#15171D', borderColor: '#2B2E37', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, paddingHorizontal: spacing.md },
  searchInput: { color: colors.foreground, flex: 1, fontSize: 15, minHeight: 50 },
  categories: { gap: spacing.sm, paddingRight: spacing.lg, paddingVertical: spacing.md },
  category: { backgroundColor: '#17191F', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  categoryActive: { backgroundColor: '#C8FF64' },
  categoryText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  categoryTextActive: { color: '#13160D' },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.md },
  sectionTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900' },
  count: { color: '#858893', fontSize: 12 },
  playCard: { backgroundColor: '#12141A', borderColor: '#292C34', borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.md, padding: spacing.lg },
  playTopRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  templateIcon: { alignItems: 'center', backgroundColor: 'rgba(200, 255, 100, 0.1)', borderRadius: 16, height: 46, justifyContent: 'center', width: 46 },
  cardCopy: { flex: 1 },
  cardKicker: { color: '#92959F', fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  cardTitle: { color: colors.foreground, fontSize: 17, fontWeight: '900', lineHeight: 21, marginTop: 3 },
  cardDescription: { color: '#A5A8B0', fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  playBottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  poolCount: { color: '#858893', fontSize: 11, fontWeight: '700' },
  playCta: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 9 },
  playCtaText: { color: '#13160D', fontSize: 12, fontWeight: '900' },
  resultCard: { backgroundColor: '#12141A', borderColor: '#292C34', borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.md, padding: spacing.lg },
  resultHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  avatar: { alignItems: 'center', backgroundColor: '#20232B', borderRadius: 22, borderWidth: 2, height: 44, justifyContent: 'center', width: 44 },
  avatarText: { color: colors.foreground, fontSize: 11, fontWeight: '900' },
  creator: { color: '#8E919A', fontSize: 11, marginTop: 4 },
  resultItems: { gap: spacing.xs, marginTop: spacing.lg },
  resultRow: { alignItems: 'center', backgroundColor: '#1B1D24', borderRadius: radii.sm, flexDirection: 'row', minHeight: 38, paddingHorizontal: spacing.md },
  resultRank: { fontSize: 16, fontWeight: '900', width: 28 },
  resultLabel: { color: '#E7E8EB', flex: 1, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 70 },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: '800', marginTop: spacing.md },
  emptyText: { color: '#858893', fontSize: 13, marginTop: spacing.xs },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
