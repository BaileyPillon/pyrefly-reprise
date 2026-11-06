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
     *
     * 60s since the r76b review (2026-11-06): the same reasoning one step on. The full run on a
     * machine with other work taking ~96 percent of the CPU (three workers) put 17 tests over 15s
     * that pass in 2 to 8s alone and that no change touched (`advisor-floor`, `advisor-menu`,
     * `advisor-note`, `pause-restart-checkpoint`, `tourist-trap-bench`, three door loops). The door
     * suites' loops and pairs carry their own, door-scaled allowances (`tests/unit/helpers/doorWords.ts`);
     * every bench with a long run names its own. A hang still fails, a minute in.
     */
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
