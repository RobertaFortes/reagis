import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@reagis/shared': new URL('../../packages/shared/index.ts', import.meta.url).pathname,
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
