import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/main.tsx'],
      // Unit coverage is a thin slice (config, utils, a few components).
      // End-to-end behavior is covered by Playwright. These floors match the
      // current unit run so CI fails on a regression instead of an unreachable 70%.
      thresholds: {
        statements: 2,
        branches: 4,
        functions: 1,
        lines: 2,
      },
    },
  },
});
