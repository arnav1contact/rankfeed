import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth, type OAuthProvider } from '@/src/features/auth/auth-provider';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearError, error, isConfigured, sendMagicLink, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeProvider, setActiveProvider] = useState<OAuthProvider>();
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  const submit = async () => {
    if (!isEmailValid || isSending || activeProvider || !isConfigured) return;
    setIsSending(true);
    clearError();
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch {
      // The provider exposes a friendly error below the form.
    } finally {
      setIsSending(false);
    }
  };

  const continueWith = async (provider: OAuthProvider) => {
    if (!isConfigured || isSending || activeProvider) return;
    setActiveProvider(provider);
    clearError();
    try {
      const signedIn = await signInWithProvider(provider);
      if (signedIn) router.replace('/profile');
    } catch {
      // The provider exposes a friendly error below the form.
    } finally {
      setActiveProvider(undefined);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { paddingBottom: insets.bottom + spacing.lg, paddingTop: insets.top + spacing.md }]}>
      <Pressable accessibilityLabel="Close sign in" hitSlop={12} onPress={() => router.back()} style={styles.close}>
        <Ionicons color={colors.foreground} name="close" size={24} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.mark}><Ionicons color="#13160D" name="podium" size={30} /></View>
        <Text style={styles.eyebrow}>Your rankings, everywhere</Text>
        <Text style={styles.title}>{sent ? 'Check your inbox' : 'Sign in to Rankfeed'}</Text>
        <Text style={styles.copy}>{sent ? `We sent a secure sign-in link to ${email.trim()}. Open it on this device to continue.` : 'Continue with Apple, Google, or a secure email link. New accounts are created automatically.'}</Text>

        {!sent ? (
          <>
            <View style={styles.providerButtons}>
              <Pressable disabled={!isConfigured || Boolean(activeProvider) || isSending} onPress={() => void continueWith('apple')} style={({ pressed }) => [styles.appleButton, !isConfigured && styles.buttonDisabled, pressed && styles.pressed]}>
                <Ionicons color="#111111" name="logo-apple" size={20} />
                <Text style={styles.appleButtonText}>{activeProvider === 'apple' ? 'Connecting…' : 'Continue with Apple'}</Text>
              </Pressable>
              <Pressable disabled={!isConfigured || Boolean(activeProvider) || isSending} onPress={() => void continueWith('google')} style={({ pressed }) => [styles.googleButton, !isConfigured && styles.buttonDisabled, pressed && styles.pressed]}>
                <Ionicons color={colors.foreground} name="logo-google" size={19} />
                <Text style={styles.googleButtonText}>{activeProvider === 'google' ? 'Connecting…' : 'Continue with Google'}</Text>
              </Pressable>
            </View>
            <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>or continue with email</Text><View style={styles.divider} /></View>
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={(value) => { setEmail(value); clearError(); }}
              onSubmitEditing={submit}
              placeholder="you@example.com"
              placeholderTextColor="#747781"
              returnKeyType="send"
              style={styles.input}
              value={email}
            />
            <Pressable disabled={!isEmailValid || isSending || Boolean(activeProvider) || !isConfigured} onPress={submit} style={({ pressed }) => [styles.button, (!isEmailValid || isSending || Boolean(activeProvider) || !isConfigured) && styles.buttonDisabled, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>{isSending ? 'Sending…' : 'Email me a sign-in link'}</Text>
              <Ionicons color="#13160D" name="arrow-forward" size={19} />
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => setSent(false)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Use a different email</Text>
          </Pressable>
        )}

        {!isConfigured ? <Text style={styles.notice}>Developer mode is active. Add the two Supabase values from .env.example to enable real accounts.</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1, paddingHorizontal: spacing.lg },
  close: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#1A1C22', borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  content: { flex: 1, justifyContent: 'center', marginHorizontal: 'auto', maxWidth: 440, width: '100%' },
  mark: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: 25, height: 50, justifyContent: 'center', marginBottom: spacing.xl, width: 50 },
  eyebrow: { color: '#C8FF64', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.foreground, fontSize: 34, fontWeight: '900', letterSpacing: -1.2, marginTop: spacing.sm },
  copy: { color: '#A6A9B2', fontSize: 15, lineHeight: 23, marginBottom: spacing.xl, marginTop: spacing.md },
  providerButtons: { gap: spacing.sm },
  appleButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 },
  appleButtonText: { color: '#111111', fontSize: 15, fontWeight: '900' },
  googleButton: { alignItems: 'center', backgroundColor: '#17191F', borderColor: '#3B3E47', borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 54 },
  googleButtonText: { color: colors.foreground, fontSize: 15, fontWeight: '900' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.lg },
  divider: { backgroundColor: '#30333C', flex: 1, height: 1 },
  dividerText: { color: '#7F828C', fontSize: 11, fontWeight: '700' },
  input: { backgroundColor: '#15171D', borderColor: '#30333C', borderRadius: radii.md, borderWidth: 1, color: colors.foreground, fontSize: 16, minHeight: 56, paddingHorizontal: spacing.lg },
  button: { alignItems: 'center', backgroundColor: '#C8FF64', borderRadius: radii.pill, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.md, minHeight: 54 },
  buttonDisabled: { opacity: 0.42 },
  buttonText: { color: '#13160D', fontSize: 15, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderColor: '#343741', borderRadius: radii.pill, borderWidth: 1, justifyContent: 'center', minHeight: 52 },
  secondaryText: { color: colors.foreground, fontSize: 14, fontWeight: '800' },
  notice: { backgroundColor: '#17191F', borderRadius: radii.md, color: '#B7BAC2', fontSize: 12, lineHeight: 18, marginTop: spacing.lg, padding: spacing.md },
  error: { color: '#FF879A', fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
