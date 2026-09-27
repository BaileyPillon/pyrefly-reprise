/**
 * The repo's vitest config plus PR-0179's arm switch (`aeon-arm-setup.ts`). Measurement only:
 *
 * ```
 * B1_AEON_ARM=a npx vitest run --config tests/unit/helpers/aeon-arm.vitest.config.ts tests/unit/chapters/natus-shipped-bench.test.ts
 * ```
 */
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import base from '../../../vitest.config.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));

export default mergeConfig(base, defineConfig({
  root,
  test: { setupFiles: [fileURLToPath(new URL('./aeon-arm-setup.ts', import.meta.url))] },
}));
