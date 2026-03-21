import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    environment: 'node',
    globals: true,
    // Pass EXPO_PUBLIC_* env vars into the test environment
    // In CI, these are injected by GitHub Actions secrets
    // Locally, they come from the .env file
    env: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    deps: {
      // Transform these packages that contain JSX/ESM syntax Vitest can't handle natively
      inline: [
        /@expo\/vector-icons/,
        /expo-modules-core/,
        /expo-symbols/,
        /expo-font/,
        /expo-asset/,
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Stub out native-only modules that can't run in Node/Vitest
      'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
      'expo-secure-store': path.resolve(__dirname, '__mocks__/expo-secure-store.ts'),
      'expo-router': path.resolve(__dirname, '__mocks__/expo-router.ts'),
      'expo-haptics': path.resolve(__dirname, '__mocks__/expo-haptics.ts'),
      'expo-image': path.resolve(__dirname, '__mocks__/expo-image.ts'),
      'expo-notifications': path.resolve(__dirname, '__mocks__/expo-notifications.ts'),
      'expo-constants': path.resolve(__dirname, '__mocks__/expo-constants.ts'),
      'react-native-safe-area-context': path.resolve(__dirname, '__mocks__/react-native-safe-area-context.ts'),
      'react-native-reanimated': path.resolve(__dirname, '__mocks__/react-native-reanimated.ts'),
      '@sentry/react-native': path.resolve(__dirname, '__mocks__/@sentry/react-native.ts'),
      'expo-modules-core': path.resolve(__dirname, '__mocks__/expo-modules-core.ts'),
      'expo-symbols': path.resolve(__dirname, '__mocks__/expo-symbols.ts'),
      '@expo/vector-icons': path.resolve(__dirname, '__mocks__/@expo/vector-icons.ts'),
      '@expo/vector-icons/MaterialIcons': path.resolve(__dirname, '__mocks__/@expo/vector-icons/MaterialIcons.ts'),
    },
    // Inject __DEV__ global for expo-modules-core
    conditions: ['node'],
  },
});
