import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { useActivity } from '@/src/features/activity/activity-provider';
import { colors } from '@/src/theme/tokens';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ color, focused, name }: { color: string; focused: boolean; name: TabIconName }) {
  return <Ionicons color={color} name={focused ? name : `${name}-outline` as TabIconName} size={25} />;
}

function CreateIcon() {
  return (
    <View style={styles.createButton}>
      <Ionicons color="#111318" name="add" size={32} />
    </View>
  );
}

export default function TabLayout() {
  const { unreadCount } = useActivity();
  return (
    <Tabs
      initialRouteName="rankings"
      screenOptions={{
        headerShown: false,
        sceneStyle: styles.scene,
        tabBarActiveTintColor: colors.foreground,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: '#8B8D96',
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="home" />,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: 'Rankings',
          tabBarAccessibilityLabel: 'Rankings tab',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="podium" />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarAccessibilityLabel: 'Create a ranking',
          tabBarIcon: () => <CreateIcon />,
          tabBarLabelStyle: [styles.label, styles.createLabel],
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarAccessibilityLabel: 'Explore tab',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="compass" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="person" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: '#C8FF64', color: '#111318', fontSize: 9, fontWeight: '900' },
  scene: { backgroundColor: colors.background },
  tabBar: {
    backgroundColor: 'rgba(8, 9, 12, 0.96)',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: Platform.select({ ios: 86, default: 68 }),
    paddingBottom: Platform.select({ ios: 20, default: 8 }),
    paddingTop: 7,
    position: 'absolute',
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
  createLabel: { color: colors.foreground, marginTop: 2 },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#C8FF64',
    borderColor: '#F2FFD8',
    borderRadius: 19,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    shadowColor: '#C8FF64',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 9,
    transform: [{ translateY: -7 }],
    width: 54,
  },
});
