import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/auth-provider';
import { colors, radii, spacing } from '@/src/theme/tokens';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const url = Linking.useURL();
  const attemptedUrl = useRef<string | null>(null);
  const { completeSessionFromUrl, error, session } = useAuth();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  useEffect(() => {
    if (session) {
      router.replace('/profile');
      return;
    }
    if (!url || attemptedUrl.current === url) return;
    attemptedUrl.current = url;
    void completeSessionFromUrl(url);
  }, [completeSessionFromUrl, router, session, url]);

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + spacing.xl, paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.card}>
        {error ? <Ionicons color="#FF879A" name="alert-circle-outline" size={42} /> : <ActivityIndicator color="#C8FF64" size="large" />}
        <Text style={styles.title}>{error ? 'That link didn’t work' : 'Signing you in…'}</Text>
        <Text style={styles.copy}>{error ?? 'Securely restoring your Rankfeed account.'}</Text>
        {error ? (
          <Pressable onPress={() => router.replace('/sign-in')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>Request a new link</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', backgroundColor: colors.background, flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  card: { alignItems: 'center', backgroundColor: '#14161C', borderColor: '#2A2D35', borderRadius: radii.lg, borderWidth: 1, maxWidth: 420, padding: 30, width: '100%' },
  title: { color: colors.foreground, fontSize: 23, fontWeight: '900', marginTop: spacing.lg },
  copy: { color: '#A2A5AE', fontSize: 14, lineHeight: 21, marginTop: spacing.sm, textAlign: 'center' },
  button: { backgroundColor: '#C8FF64', borderRadius: radii.pill, marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  buttonText: { color: '#13160D', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
