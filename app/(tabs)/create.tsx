import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useAuth } from '@/src/features/auth/auth-provider';
import { useRankingStore, type RankingFormat } from '@/src/features/rankings/ranking-store';
import { mockRankingTemplates } from '@/src/mock-data';
import { colors, radii, spacing } from '@/src/theme/tokens';

const formats: readonly { format: RankingFormat; icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { format: 'blind-ranking', icon: 'eye-off-outline', label: 'Blind' },
  { format: 'bracket', icon: 'git-network-outline', label: 'Bracket' },
  { format: 'completed-result', icon: 'list-outline', label: 'Top list' },
];

export default function CreateScreen() {
  const router = useRouter();
  const { isConfigured, user } = useAuth();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const { publishRanking } = useRankingStore();
  const initialTemplate = mockRankingTemplates.find((item) => item.id === templateId);
  const [format, setFormat] = useState<RankingFormat>(initialTemplate?.format ?? 'blind-ranking');
  const [title, setTitle] = useState(initialTemplate?.title ?? '');
  const [topic, setTopic] = useState(initialTemplate?.topic ?? '');
  const [items, setItems] = useState(initialTemplate?.items.join(', ') ?? '');
  const [attempted, setAttempted] = useState(false);
  const canPublish = title.trim().length >= 3 && topic.trim().length >= 2;
  const itemLabel = useMemo(() => format === 'bracket' ? 'First matchup' : format === 'completed-result' ? 'Ranked items' : 'First reveal', [format]);

  useEffect(() => {
    const template = mockRankingTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setFormat(template.format);
    setTitle(template.title);
    setTopic(template.topic);
    setItems(template.items.join(', '));
  }, [templateId]);

  const publish = () => {
    if (isConfigured && !user) {
      router.push('/sign-in');
      return;
    }
    setAttempted(true);
    if (!canPublish) return;
    publishRanking({
      format,
      items: items.split(',').map((item) => item.trim()).filter(Boolean),
      title: title.trim(),
      topic: topic.trim(),
    });
    setTitle('');
    setTopic('');
    setItems('');
    setAttempted(false);
    router.navigate('/rankings');
  };

  return (
    <ScreenShell eyebrow="Start something" title="Create a ranking">
      <Text style={styles.intro}>Choose a format, add a prompt, and publish it straight into the Rankings feed.</Text>

      {isConfigured && !user ? (
        <Pressable onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.accountBanner, pressed && styles.pressed]}>
          <Ionicons color="#C8FF64" name="person-circle-outline" size={24} />
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>Sign in to publish</Text>
            <Text style={styles.accountText}>Your drafts stay here while your published rankings sync to your account.</Text>
          </View>
          <Ionicons color="#8F929C" name="chevron-forward" size={19} />
        </Pressable>
      ) : null}

      <Text style={styles.label}>Format</Text>
      <View style={styles.formats}>
        {formats.map((option) => {
          const active = option.format === format;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={option.format}
              onPress={() => setFormat(option.format)}
              style={({ pressed }) => [styles.format, active && styles.formatActive, pressed && styles.pressed]}>
              <Ionicons color={active ? '#13160D' : colors.muted} name={option.icon} size={21} />
              <Text style={[styles.formatText, active && styles.formatTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          accessibilityLabel="Ranking title"
          maxLength={64}
          onChangeText={setTitle}
          placeholder="Best late-night snacks"
          placeholderTextColor="#777A84"
          style={[styles.input, attempted && title.trim().length < 3 && styles.inputError]}
          value={title}
        />
        {attempted && title.trim().length < 3 ? <Text style={styles.error}>Add a title with at least 3 characters.</Text> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Topic</Text>
        <TextInput
          accessibilityLabel="Ranking topic"
          maxLength={28}
          onChangeText={setTopic}
          placeholder="Food"
          placeholderTextColor="#777A84"
          style={[styles.input, attempted && topic.trim().length < 2 && styles.inputError]}
          value={topic}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{itemLabel}</Text>
        <TextInput
          accessibilityLabel={itemLabel}
          multiline
          onChangeText={setItems}
          placeholder={format === 'bracket' ? 'Pizza, Tacos' : 'Separate multiple items with commas'}
          placeholderTextColor="#777A84"
          style={[styles.input, styles.itemsInput]}
          value={items}
        />
        <Text style={styles.hint}>Comma-separated. You can refine the full template later.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={publish}
        style={({ pressed }) => [styles.publish, pressed && styles.pressed]}>
        <Text style={styles.publishText}>Publish ranking</Text>
        <Ionicons color="#13160D" name="arrow-forward" size={20} />
      </Pressable>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: spacing.xl, marginTop: spacing.sm, maxWidth: 430 },
  accountBanner: { alignItems: 'center', backgroundColor: '#171A1E', borderColor: '#3A422B', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl, marginTop: -spacing.sm, padding: spacing.md },
  accountCopy: { flex: 1 },
  accountTitle: { color: colors.foreground, fontSize: 14, fontWeight: '900' },
  accountText: { color: '#9DA0A8', fontSize: 12, lineHeight: 17, marginTop: 3 },
  label: { color: colors.foreground, fontSize: 13, fontWeight: '800', marginBottom: spacing.sm },
  formats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  format: {
    alignItems: 'center', backgroundColor: '#15171D', borderColor: '#2C2F38', borderRadius: radii.md,
    borderWidth: 1, flex: 1, gap: spacing.xs, minHeight: 70, justifyContent: 'center', padding: spacing.sm,
  },
  formatActive: { backgroundColor: '#C8FF64', borderColor: '#E8FFBE' },
  formatText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  formatTextActive: { color: '#13160D' },
  fieldGroup: { marginBottom: spacing.lg },
  input: {
    backgroundColor: '#14161C', borderColor: '#2B2E37', borderRadius: radii.md, borderWidth: 1,
    color: colors.foreground, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  inputError: { borderColor: '#FF7087' },
  itemsInput: { minHeight: 84, textAlignVertical: 'top' },
  hint: { color: '#858893', fontSize: 12, marginTop: spacing.sm },
  error: { color: '#FF879A', fontSize: 12, marginTop: spacing.xs },
  publish: {
    alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, flexDirection: 'row',
    gap: spacing.sm, justifyContent: 'center', marginTop: spacing.sm, minHeight: 54, paddingHorizontal: spacing.xl,
  },
  publishText: { color: '#13160D', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
