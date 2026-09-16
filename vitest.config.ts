import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    reporters: ['default'],
    /**
     * 15s, not vitest's 5s default.
     *
     * Several suites are statistical rather than unit-sized — `rng.test.ts`
     * draws tens of thousands of samples to assert uniformity, and the audio
     * suites render real buffers. They finish in ~2-3s alone, but the runner
     * spawns a worker per file (~440ms of startup each, 45+ files), so under
     * full-suite load they were crossing 5s and failing *only* in a full run.
     * A test that passes alone and fails in the suite trains everyone to
     * ignore red, which is worse than a slow test.
     *
     * If a test ever genuinely hangs, it still fails here — just later.
     */
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
