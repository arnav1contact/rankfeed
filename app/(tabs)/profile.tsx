import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useAuth } from '@/src/features/auth/auth-provider';
import { useAccountProfile } from '@/src/features/profile/profile-provider';
import { useRankingStore } from '@/src/features/rankings/ranking-store';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { error: authError, isConfigured, isLoading: isAuthLoading, signOut, user } = useAuth();
  const { error: profileError, profile } = useAccountProfile();
  const { createdPosts, followedCreatorIds, isReady, savedPosts, storageError, syncError, syncStatus } = useRankingStore();
  const displayEmail = user?.email ?? null;
  const avatarLabel = profile?.displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || (displayEmail ? displayEmail.slice(0, 2).toUpperCase() : 'YO');

  return (
    <ScreenShell eyebrow="Your corner" title="Profile">
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{avatarLabel}</Text></View>
        <View style={styles.identityCopy}>
          <Text style={styles.name}>{profile?.displayName ?? (displayEmail ? 'Rankfeed account' : 'Your Rankings')}</Text>
          <Text numberOfLines={1} style={styles.handle}>{profile ? `@${profile.handle}` : displayEmail ?? (isConfigured ? 'Sign in to sync your profile' : 'Local developer profile')}</Text>
          {profile?.bio ? <Text numberOfLines={2} style={styles.bio}>{profile.bio}</Text> : null}
        </View>
        <View accessibilityLabel={syncStatus === 'synced' ? 'Cloud data synchronized' : isReady ? 'Local data loaded' : 'Loading local data'} style={styles.settings}>
          <Ionicons color={storageError || syncError ? '#FF879A' : '#C8FF64'} name={storageError || syncError ? 'cloud-offline-outline' : syncStatus === 'syncing' ? 'cloud-upload-outline' : isReady ? 'cloud-done-outline' : 'cloud-outline'} size={20} />
        </View>
      </View>

      {isConfigured ? (
        user ? (
          <View style={styles.accountActions}>
            <Pressable onPress={() => router.push('/edit-profile')} style={({ pressed }) => [styles.editAction, pressed && styles.pressed]}>
              <Ionicons color="#13160D" name="create-outline" size={19} />
              <Text style={styles.editActionText}>Edit profile</Text>
            </Pressable>
            <Pressable disabled={isAuthLoading} onPress={() => void signOut().catch(() => undefined)} style={({ pressed }) => [styles.accountAction, pressed && styles.pressed]}>
              <Ionicons color="#C8FF64" name="log-out-outline" size={19} />
              <Text style={styles.accountActionText}>Sign out</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.signInAction, pressed && styles.pressed]}>
            <Ionicons color="#13160D" name="person-outline" size={20} />
            <Text style={styles.signInText}>Sign in or create an account</Text>
          </Pressable>
        )
      ) : (
        <View style={styles.devMode}>
          <Ionicons color="#C8FF64" name="construct-outline" size={19} />
          <View style={styles.actionCopy}>
            <Text style={styles.devModeTitle}>Local developer mode</Text>
            <Text style={styles.devModeText}>The app remains fully testable before Supabase credentials are connected.</Text>
          </View>
        </View>
      )}
      {authError || profileError ? <Text accessibilityRole="alert" style={styles.authError}>{authError ?? profileError}</Text> : null}

      <View style={styles.stats}>
        <View style={styles.stat}><Text style={styles.statValue}>{createdPosts.length}</Text><Text style={styles.statLabel}>Published</Text></View>
        <View style={styles.divider} />
        <View style={styles.stat}><Text style={styles.statValue}>{followedCreatorIds.length}</Text><Text style={styles.statLabel}>Following</Text></View>
        <View style={styles.divider} />
        <View style={styles.stat}><Text style={styles.statValue}>{savedPosts.length}</Text><Text style={styles.statLabel}>Saved</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Your studio</Text>
      <Pressable onPress={() => router.navigate('/create')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <View style={styles.actionIcon}><Ionicons color="#13160D" name="add" size={23} /></View>
        <View style={styles.actionCopy}><Text style={styles.actionTitle}>Create a new ranking</Text><Text style={styles.actionText}>Blind lists, brackets, and top picks</Text></View>
        <Ionicons color="#777A84" name="chevron-forward" size={19} />
      </Pressable>
      <Pressable onPress={() => router.navigate('/rankings')} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <View style={[styles.actionIcon, styles.secondaryIcon]}><Ionicons color="#C8FF64" name="podium-outline" size={21} /></View>
        <View style={styles.actionCopy}><Text style={styles.actionTitle}>View the live feed</Text><Text style={styles.actionText}>See your posts alongside the community</Text></View>
        <Ionicons color="#777A84" name="chevron-forward" size={19} />
      </Pressable>

      <View style={styles.savedHeader}>
        <Text style={styles.sectionTitle}>Saved rankings</Text>
        <Text style={styles.savedCount}>{savedPosts.length}</Text>
      </View>
      {savedPosts.length === 0 ? (
        <View style={styles.savedEmpty}>
          <Ionicons color="#6F727C" name="bookmark-outline" size={26} />
          <Text style={styles.savedEmptyText}>Rankings you save will appear here.</Text>
        </View>
      ) : savedPosts.slice(0, 5).map((post) => (
        <Pressable key={post.id} onPress={() => router.navigate('/rankings')} style={({ pressed }) => [styles.savedRow, pressed && styles.pressed]}>
          <View style={[styles.savedAccent, { backgroundColor: post.visual.accentColor }]} />
          <View style={styles.actionCopy}>
            <Text numberOfLines={1} style={styles.actionTitle}>{post.title}</Text>
            <Text style={styles.actionText}>{post.creator.displayName} · {post.topic}</Text>
          </View>
          <Ionicons color="#777A84" name="chevron-forward" size={18} />
        </Pressable>
      ))}

      <View style={styles.note}>
        <Ionicons color={storageError || syncError ? '#FF879A' : '#9EA1AA'} name={storageError || syncError ? 'warning-outline' : user ? 'cloud-done-outline' : 'phone-portrait-outline'} size={19} />
        <Text style={styles.noteText}>{storageError ?? syncError ?? (user && syncStatus === 'synced' ? 'Rankings and social activity are synchronized with your account. Local storage remains available for fast startup and mock content.' : 'Rankings, likes, saves, follows, and comments are currently stored on this device.')}</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  avatar: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 31, height: 62, justifyContent: 'center', width: 62 },
  avatarText: { color: '#13160D', fontSize: 17, fontWeight: '900' },
  identityCopy: { flex: 1 },
  name: { color: colors.foreground, fontSize: 20, fontWeight: '900' },
  handle: { color: '#8F929C', fontSize: 13, marginTop: 3 },
  bio: { color: '#AEB1B8', fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  settings: { alignItems: 'center', backgroundColor: '#191B22', borderRadius: 19, height: 38, justifyContent: 'center', width: 38 },
  accountActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  accountAction: { alignItems: 'center', borderColor: '#39412C', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  accountActionText: { color: colors.foreground, fontSize: 13, fontWeight: '800' },
  editAction: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  editActionText: { color: '#13160D', fontSize: 13, fontWeight: '900' },
  signInAction: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, minHeight: 50, paddingHorizontal: spacing.lg },
  signInText: { color: '#13160D', fontSize: 14, fontWeight: '900' },
  devMode: { alignItems: 'center', backgroundColor: '#15181B', borderColor: '#333A2A', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, padding: spacing.md },
  devModeTitle: { color: colors.foreground, fontSize: 13, fontWeight: '900' },
  devModeText: { color: '#999CA5', fontSize: 11, lineHeight: 16, marginTop: 2 },
  authError: { color: '#FF879A', fontSize: 12, marginTop: spacing.sm },
  stats: {
    alignItems: 'center', backgroundColor: '#13151B', borderColor: '#292C35', borderRadius: radii.lg,
    borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xl, paddingVertical: spacing.lg,
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.foreground, fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#8F929C', fontSize: 11, marginTop: 3 },
  divider: { backgroundColor: '#2E313A', height: 28, width: 1 },
  sectionTitle: { color: colors.foreground, fontSize: 18, fontWeight: '900', marginBottom: spacing.md, marginTop: 30 },
  savedHeader: { alignItems: 'baseline', flexDirection: 'row', gap: spacing.sm },
  savedCount: { color: '#858893', fontSize: 12, fontWeight: '800' },
  savedEmpty: { alignItems: 'center', backgroundColor: '#12141A', borderRadius: radii.md, gap: spacing.sm, padding: spacing.xl },
  savedEmptyText: { color: '#8F929C', fontSize: 13 },
  savedRow: { alignItems: 'center', borderBottomColor: '#272A32', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, minHeight: 64, paddingVertical: spacing.sm },
  savedAccent: { borderRadius: radii.pill, height: 38, width: 5 },
  action: {
    alignItems: 'center', backgroundColor: '#12141A', borderBottomColor: '#272A32', borderBottomWidth: 1,
    flexDirection: 'row', gap: spacing.md, minHeight: 76, paddingHorizontal: spacing.sm,
  },
  actionIcon: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 16, height: 42, justifyContent: 'center', width: 42 },
  secondaryIcon: { backgroundColor: 'rgba(200, 255, 100, 0.1)' },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  actionText: { color: '#8F929C', fontSize: 12, marginTop: 3 },
  note: { alignItems: 'flex-start', backgroundColor: '#15171D', borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, padding: spacing.md },
  noteText: { color: '#9EA1AA', flex: 1, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.7 },
});
