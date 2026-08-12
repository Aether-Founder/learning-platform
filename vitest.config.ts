import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test-utils/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'UI-REFERENCE/**',
      'UI-REFERENCE-2/**',
      '_archive/**',
      'magister-extension-project/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**', 'app/api/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**', '**/__tests__/**', '**/test-utils/**'],
    },
    testTimeout: 15000,
    hookTimeout: 20000,
    restoreMocks: true,
    clearMocks: true,
  },
});
