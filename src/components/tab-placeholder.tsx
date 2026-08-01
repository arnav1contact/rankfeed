import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabPlaceholderProps = {
  title: string;
  description: string;
  icon: IconName;
  eyebrow?: string;
};

export function TabPlaceholder({ description, eyebrow = 'Coming soon', icon, title }: TabPlaceholderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.glow} />
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <View style={styles.iconWrap}>
        <Ionicons color="#C8FF64" name={icon} size={34} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingBottom: 88,
    paddingHorizontal: spacing.xl,
  },
  glow: {
    backgroundColor: '#C8FF64',
    borderRadius: radii.pill,
    height: 260,
    opacity: 0.06,
    position: 'absolute',
    right: -130,
    top: 80,
    width: 260,
  },
  eyebrow: { color: '#C8FF64', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(200, 255, 100, 0.09)',
    borderColor: 'rgba(200, 255, 100, 0.2)',
    borderRadius: radii.lg,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
    width: 72,
  },
  title: { color: colors.foreground, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  description: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: spacing.sm, maxWidth: 330, textAlign: 'center' },
});
