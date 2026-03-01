import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
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
