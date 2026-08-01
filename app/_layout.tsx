import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/src/features/auth/auth-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ contentStyle: { backgroundColor: '#08090C' }, headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/callback" />
        </Stack>
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
