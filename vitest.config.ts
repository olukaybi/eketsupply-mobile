import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Stub out native-only modules that can't run in Node/Vitest
      'react-native': path.resolve(__dirname, '__mocks__/react-native.ts'),
      'expo-secure-store': path.resolve(__dirname, '__mocks__/expo-secure-store.ts'),
    },
  },
});
