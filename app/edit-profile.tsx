import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/src/components/screen-shell';
import { useAuth } from '@/src/features/auth/auth-provider';
import { useAccountProfile } from '@/src/features/profile/profile-provider';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { clearError, deleteAccount, error, isDeleting, isLoading, isSaving, profile, updateProfile } = useAccountProfile();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleValid = /^[a-z0-9_]{3,24}$/.test(handle);
  const canSave = displayName.trim().length >= 1 && displayName.trim().length <= 50 && handleValid && bio.trim().length <= 280;

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setHandle(profile.handle);
    setBio(profile.bio ?? '');
  }, [profile]);

  const save = async () => {
    setAttempted(true);
    if (!canSave || isSaving) return;
    try {
      await updateProfile({ bio: bio.trim() || undefined, displayName: displayName.trim(), handle, avatarUrl: profile?.avatarUrl });
      router.back();
    } catch {
      // The profile provider exposes the actionable message below.
    }
  };

  const removeAccount = async () => {
    if (isDeleting) return;
    try {
      await deleteAccount();
      router.replace('/profile');
    } catch {
      // The profile provider exposes the actionable message below.
    }
  };

  if (!user) {
    return (
      <ScreenShell eyebrow="Account settings" title="Edit profile">
        <View style={styles.empty}>
          <Ionicons color="#C8FF64" name="person-circle-outline" size={34} />
          <Text style={styles.emptyTitle}>Sign in to edit your profile</Text>
          <Pressable onPress={() => router.replace('/sign-in')} style={styles.primary}><Text style={styles.primaryText}>Continue to sign in</Text></Pressable>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell eyebrow="Account settings" title="Edit profile">
      <Text style={styles.intro}>{isLoading ? 'Loading your profile…' : user.email}</Text>

      <Text style={styles.label}>Display name</Text>
      <TextInput accessibilityLabel="Display name" maxLength={50} onChangeText={(value) => { setDisplayName(value); clearError(); }} placeholder="Your name" placeholderTextColor="#777A84" style={[styles.input, attempted && !displayName.trim() && styles.inputError]} value={displayName} />

      <Text style={styles.label}>Username</Text>
      <View style={[styles.handleField, attempted && !handleValid && styles.inputError]}>
        <Text style={styles.at}>@</Text>
        <TextInput accessibilityLabel="Username" autoCapitalize="none" autoCorrect={false} maxLength={24} onChangeText={(value) => { setHandle(value.toLowerCase().replace(/[^a-z0-9_]/g, '')); clearError(); }} placeholder="your_username" placeholderTextColor="#777A84" style={styles.handleInput} value={handle} />
      </View>
      <Text style={styles.hint}>3–24 lowercase letters, numbers, or underscores.</Text>

      <Text style={styles.label}>Bio</Text>
      <TextInput accessibilityLabel="Bio" maxLength={280} multiline onChangeText={(value) => { setBio(value); clearError(); }} placeholder="What do you love ranking?" placeholderTextColor="#777A84" style={[styles.input, styles.bio]} textAlignVertical="top" value={bio} />
      <Text style={styles.counter}>{bio.length}/280</Text>

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable disabled={!canSave || isSaving || isLoading} onPress={() => void save()} style={({ pressed }) => [styles.primary, (!canSave || isSaving || isLoading) && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.primaryText}>{isSaving ? 'Saving…' : 'Save profile'}</Text>
      </Pressable>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.dangerCopy}>Permanently removes your account, published rankings, comments, follows, likes, and saves. This cannot be undone.</Text>
        {!confirmDelete ? (
          <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteOutline}><Text style={styles.deleteText}>Delete my account</Text></Pressable>
        ) : (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Are you absolutely sure?</Text>
            <View style={styles.confirmActions}>
              <Pressable disabled={isDeleting} onPress={() => setConfirmDelete(false)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
              <Pressable disabled={isDeleting} onPress={() => void removeAccount()} style={[styles.delete, isDeleting && styles.disabled]}><Text style={styles.deleteButtonText}>{isDeleting ? 'Deleting…' : 'Delete forever'}</Text></Pressable>
            </View>
          </View>
        )}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  intro: { color: '#92959F', fontSize: 13, marginBottom: spacing.xl, marginTop: spacing.sm },
  label: { color: colors.foreground, fontSize: 13, fontWeight: '800', marginBottom: spacing.sm, marginTop: spacing.lg },
  input: { backgroundColor: '#15171D', borderColor: '#2D3038', borderRadius: radii.md, borderWidth: 1, color: colors.foreground, fontSize: 16, minHeight: 52, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  inputError: { borderColor: '#FF7087' },
  handleField: { alignItems: 'center', backgroundColor: '#15171D', borderColor: '#2D3038', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', minHeight: 52, paddingHorizontal: spacing.lg },
  at: { color: '#858893', fontSize: 16 },
  handleInput: { color: colors.foreground, flex: 1, fontSize: 16, minHeight: 50, paddingHorizontal: spacing.xs },
  hint: { color: '#81848D', fontSize: 11, marginTop: spacing.xs },
  bio: { minHeight: 108 },
  counter: { color: '#777A84', fontSize: 11, marginTop: spacing.xs, textAlign: 'right' },
  error: { color: '#FF879A', fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  primary: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, justifyContent: 'center', marginTop: spacing.xl, minHeight: 52, paddingHorizontal: spacing.xl },
  primaryText: { color: '#13160D', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.42 },
  dangerZone: { borderTopColor: '#2B2D35', borderTopWidth: 1, marginTop: 44, paddingTop: spacing.xl },
  dangerTitle: { color: '#FF879A', fontSize: 17, fontWeight: '900' },
  dangerCopy: { color: '#999CA5', fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  deleteOutline: { alignItems: 'center', borderColor: '#6A303B', borderRadius: radii.pill, borderWidth: 1, marginTop: spacing.lg, minHeight: 48, justifyContent: 'center' },
  deleteText: { color: '#FF879A', fontSize: 14, fontWeight: '800' },
  confirmBox: { backgroundColor: '#211418', borderRadius: radii.md, marginTop: spacing.lg, padding: spacing.md },
  confirmTitle: { color: colors.foreground, fontSize: 14, fontWeight: '900' },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancel: { alignItems: 'center', borderColor: '#454852', borderRadius: radii.pill, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44 },
  cancelText: { color: colors.foreground, fontSize: 13, fontWeight: '800' },
  delete: { alignItems: 'center', backgroundColor: '#FF647D', borderRadius: radii.pill, flex: 1, justifyContent: 'center', minHeight: 44 },
  deleteButtonText: { color: '#21070C', fontSize: 13, fontWeight: '900' },
  empty: { alignItems: 'center', backgroundColor: '#15171D', borderRadius: radii.lg, marginTop: spacing.xl, padding: spacing.xl },
  emptyTitle: { color: colors.foreground, fontSize: 17, fontWeight: '900', marginTop: spacing.md },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
