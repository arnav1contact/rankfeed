import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { colors, radii, spacing } from '@/src/theme/tokens';

const categories = ['All', 'Food', 'Gaming', 'Mythology'] as const;

export default function ExploreScreen() {
  const router = useRouter();
  const { posts } = useRankingStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const results = useMemo(() => posts.filter((post) => {
    const matchesCategory = category === 'All' || post.topic.toLowerCase().includes(category.toLowerCase());
    const normalizedQuery = query.trim().toLowerCase();
    return matchesCategory && (!normalizedQuery || `${post.title} ${post.topic} ${post.creator.displayName}`.toLowerCase().includes(normalizedQuery));
  }), [category, posts, query]);

  return (
    <ScreenShell eyebrow="Find your people" title="Explore">
      <View style={styles.search}>
        <Ionicons color="#858893" name="search" size={20} />
        <TextInput
          accessibilityLabel="Search rankings"
          onChangeText={setQuery}
          placeholder="Search rankings or creators"
          placeholderTextColor="#777A84"
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
        {query ? <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')}><Ionicons color="#9B9DA6" name="close-circle" size={20} /></Pressable> : null}
      </View>

      <View style={styles.categories}>
        {categories.map((item) => (
          <Pressable
            accessibilityState={{ selected: item === category }}
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.category, item === category && styles.categoryActive]}>
            <Text style={[styles.categoryText, item === category && styles.categoryTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{query ? 'Search results' : 'Trending now'}</Text>
        <Text style={styles.count}>{results.length} prompts</Text>
      </View>
      {results.length ? results.map((post, index) => (
        <Pressable key={post.id} onPress={() => router.navigate('/rankings')} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={[styles.rank, { backgroundColor: post.visual.accentColor }]}><Text style={styles.rankText}>{index + 1}</Text></View>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTopic}>{post.topic}</Text>
            <Text style={styles.cardTitle}>{post.title}</Text>
            <Text style={styles.cardCreator}>by {post.creator.displayName}</Text>
          </View>
          <Ionicons color="#777A84" name="arrow-forward" size={19} />
        </Pressable>
      )) : (
        <View style={styles.empty}>
          <Ionicons color="#676A74" name="search-outline" size={34} />
          <Text style={styles.emptyTitle}>No rankings found</Text>
          <Text style={styles.emptyText}>Try another word or category.</Text>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  search: {
    alignItems: 'center', backgroundColor: '#15171D', borderColor: '#2B2E37', borderRadius: radii.md,
    borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, paddingHorizontal: spacing.md,
  },
  searchInput: { color: colors.foreground, flex: 1, fontSize: 15, minHeight: 52 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  category: { backgroundColor: '#17191F', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  categoryActive: { backgroundColor: '#C8FF64' },
  categoryText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  categoryTextActive: { color: '#13160D' },
  sectionRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, marginTop: spacing.xl },
  sectionTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900' },
  count: { color: '#858893', fontSize: 12 },
  card: {
    alignItems: 'center', backgroundColor: '#12141A', borderColor: '#252831', borderRadius: radii.md,
    borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, minHeight: 98, padding: spacing.md,
  },
  rank: { alignItems: 'center', borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  rankText: { color: '#17151A', fontSize: 18, fontWeight: '900' },
  cardCopy: { flex: 1 },
  cardTopic: { color: '#90939D', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardTitle: { color: colors.foreground, fontSize: 16, fontWeight: '800', lineHeight: 20, marginTop: 3 },
  cardCreator: { color: '#90939D', fontSize: 12, marginTop: 5 },
  empty: { alignItems: 'center', paddingVertical: 70 },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: '800', marginTop: spacing.md },
  emptyText: { color: '#858893', fontSize: 13, marginTop: spacing.xs },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
});
