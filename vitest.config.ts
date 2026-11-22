import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['tests/ui.test.tsx', 'jsdom'],
      ['tests/animation_and_audio.test.ts', 'jsdom'],
      ['tests/**/*.test.ts', 'node'],
    ],
    server: {
      deps: {
        external: ['node:sqlite'],
      },
    },
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
});
