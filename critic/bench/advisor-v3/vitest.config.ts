import { defineConfig } from 'vitest/config';

/**
 * The scorecard runs alone: `npm test` includes only `tests/unit/**`, so this config is
 * what makes the sweep runnable without the suite ever picking it up.
 */
export default defineConfig({
  test: {
    include: ['critic/bench/advisor-v3/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 60 * 60_000,
    hookTimeout: 60_000,
  },
});
