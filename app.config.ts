import type { ExpoConfig } from 'expo/config';

import appIdentity from './src/config/app.json';

const config: ExpoConfig = {
  name: appIdentity.displayName,
  slug: appIdentity.slug,
  scheme: appIdentity.scheme,
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  icon: './assets/images/icon.png',
  ios: { supportsTablet: false },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0A0A0C',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
        resizeMode: 'contain',
        backgroundColor: '#0A0A0C',
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
