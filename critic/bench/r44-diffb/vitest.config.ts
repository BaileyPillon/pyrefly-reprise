import { defineConfig } from 'vitest/config';

/**
 * The DIFF-B measurement runs alone: `npm test` includes only `tests/unit/**`, so this config is what
 * makes the sweep runnable without the suite ever picking it up.
 * Run:  node node_modules/vitest/vitest.mjs run --maxWorkers=2 --config critic/bench/r44-diffb/vitest.config.ts critic/bench/r44-diffb/<file>
 */
export default defineConfig({
  test: {
    include: ['critic/bench/r44-diffb/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 6 * 60 * 60_000,
    hookTimeout: 60_000,
  },
});
