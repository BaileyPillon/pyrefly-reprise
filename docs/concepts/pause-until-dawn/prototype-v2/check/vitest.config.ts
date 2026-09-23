import { defineConfig } from 'vitest/config';

// The prototype's own checks (v3.2): run with
//   npx vitest run --config docs/concepts/pause-until-dawn/prototype-v2/check/vitest.config.ts
export default defineConfig({
  test: {
    include: ['docs/concepts/pause-until-dawn/prototype-v2/check/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
  },
});
