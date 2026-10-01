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
      include: [
        'src/components/Toast.tsx',
        'src/config/cors.ts',
        'src/config/env.ts',
        'src/routes/AdminRoute.tsx',
        'src/utils/filterSneakers.ts',
        'src/utils/roleUtils.ts',
      ],
      exclude: ['src/**/*.d.ts'],
      // Floors for the files the unit suite actually executes. Raise them as
      // payments, webhooks, and shipping gain direct tests.
      thresholds: {
        statements: 55,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
});
