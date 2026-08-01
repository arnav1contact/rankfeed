import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/auth-provider';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clearError, error, isConfigured, sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  const submit = async () => {
    if (!isEmailValid || isSending || !isConfigured) return;
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { paddingBottom: insets.bottom + spacing.lg, paddingTop: insets.top + spacing.md }]}>
      <Pressable accessibilityLabel="Close sign in" hitSlop={12} onPress={() => router.back()} style={styles.close}>
        <Ionicons color={colors.foreground} name="close" size={24} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.mark}><Ionicons color="#13160D" name="podium" size={30} /></View>
        <Text style={styles.eyebrow}>Your rankings, everywhere</Text>
        <Text style={styles.title}>{sent ? 'Check your inbox' : 'Sign in to Rankfeed'}</Text>
        <Text style={styles.copy}>{sent ? `We sent a secure sign-in link to ${email.trim()}. Open it on this device to continue.` : 'No password to remember. We’ll email you a secure link that signs you in or creates your account.'}</Text>

        {!sent ? (
          <>
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
            <Pressable disabled={!isEmailValid || isSending || !isConfigured} onPress={submit} style={({ pressed }) => [styles.button, (!isEmailValid || isSending || !isConfigured) && styles.buttonDisabled, pressed && styles.pressed]}>
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
