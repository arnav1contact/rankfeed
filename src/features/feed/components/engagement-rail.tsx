import { Ionicons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/src/theme/tokens';
import type { FeedPost } from '../types';

type IconName = ComponentProps<typeof Ionicons>['name'];

type EngagementRailProps = {
  engagement: FeedPost['engagement'];
  accentColor: string;
};

type ActionButtonProps = {
  accessibilityLabel: string;
  active?: boolean;
  activeColor?: string;
  count: number;
  icon: IconName;
  activeIcon?: IconName;
  onPress: () => void;
};

function compactCount(count: number) {
  if (count < 1000) return String(count);
  return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}K`;
}

function ActionButton({
  accessibilityLabel,
  active = false,
  activeColor = colors.foreground,
  count,
  icon,
  activeIcon = icon,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.iconShadow}>
        <Ionicons
          color={active ? activeColor : colors.foreground}
          name={active ? activeIcon : icon}
          size={30}
        />
      </View>
      <Text style={styles.count}>{compactCount(count)}</Text>
    </Pressable>
  );
}

export function EngagementRail({ engagement, accentColor }: EngagementRailProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <View accessibilityLabel="Post actions" style={styles.rail}>
      <ActionButton
        accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
        active={liked}
        activeColor="#FF5D7A"
        activeIcon="heart"
        count={engagement.likes + (liked ? 1 : 0)}
        icon="heart-outline"
        onPress={() => setLiked((value) => !value)}
      />
      <ActionButton
        accessibilityLabel="Open comments"
        count={engagement.comments}
        icon="chatbubble-outline"
        onPress={() => undefined}
      />
      <ActionButton
        accessibilityLabel={saved ? 'Remove saved post' : 'Save post'}
        active={saved}
        activeColor={accentColor}
        activeIcon="bookmark"
        count={engagement.saves + (saved ? 1 : 0)}
        icon="bookmark-outline"
        onPress={() => setSaved((value) => !value)}
      />
      <ActionButton
        accessibilityLabel="Share post"
        count={engagement.shares}
        icon="arrow-redo-outline"
        onPress={() => undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { alignItems: 'center', gap: spacing.lg, width: 52 },
  action: { alignItems: 'center', gap: spacing.xs, minHeight: 48, justifyContent: 'center' },
  pressed: { opacity: 0.62, transform: [{ scale: 0.94 }] },
  iconShadow: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  count: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
