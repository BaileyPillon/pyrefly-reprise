import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['critic/scratch/**/*.test.ts'],
    environment: 'node',
    testTimeout: 120_000,
    fsModuleCache: true,
  },
});
