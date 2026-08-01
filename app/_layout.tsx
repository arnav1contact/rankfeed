import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/src/features/auth/auth-provider';
import { ProfileProvider } from '@/src/features/profile/profile-provider';
import { RankingStoreProvider } from '@/src/features/rankings/ranking-store';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <RankingStoreProvider>
            <Stack screenOptions={{ contentStyle: { backgroundColor: '#08090C' }, headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="play/[sourceId]" />
              <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
              <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
              <Stack.Screen name="auth/callback" />
            </Stack>
            <StatusBar style="light" />
          </RankingStoreProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
