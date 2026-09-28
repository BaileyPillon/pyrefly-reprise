import { defineConfig } from 'vitest/config';

/** The v4 prototype bench runs alone (`npm test` includes only `tests/unit/**`). */
export default defineConfig({
  test: {
    include: ['critic/bench/advisor-v4/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 6 * 60 * 60_000,
    hookTimeout: 60_000,
  },
});
