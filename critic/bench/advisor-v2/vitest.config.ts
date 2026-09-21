import { defineConfig } from 'vitest/config';

/**
 * The bench runs alone. `npm test`'s config includes only `tests/unit/**`, so
 * this file is what makes the forty-seed sweep runnable without it ever being
 * picked up by the suite [docs/plans/advisor-v2-review.md §5].
 */
export default defineConfig({
  test: {
    include: ['critic/bench/advisor-v2/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 30 * 60_000,
    hookTimeout: 60_000,
  },
});
