import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/theme/tokens';

type ScreenShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
};

export function ScreenShell({ children, eyebrow, title }: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
      keyboardShouldPersistTaps="handled"
      style={styles.container}>
      <View style={styles.glow} />
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  content: { minHeight: '100%', paddingBottom: 118, paddingHorizontal: spacing.lg },
  glow: {
    backgroundColor: '#C8FF64', borderRadius: 999, height: 280, opacity: 0.05,
    position: 'absolute', right: -160, top: -80, width: 280,
  },
  eyebrow: { color: '#C8FF64', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: colors.foreground, fontSize: 32, fontWeight: '900', letterSpacing: -1, marginTop: spacing.xs },
});
