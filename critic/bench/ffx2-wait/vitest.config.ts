import { defineConfig } from 'vitest/config';

/**
 * The bench runs alone, same pattern as `critic/bench/leblanc` and
 * `critic/bench/ffx2-active`. `npm test`'s config includes only
 * `tests/unit/**`, so this file is what makes the forty-seed, three-chapter,
 * two-mode sweep runnable without it ever being picked up by the suite.
 */
export default defineConfig({
  test: {
    include: ['critic/bench/ffx2-wait/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 30 * 60_000,
    hookTimeout: 60_000,
  },
});
