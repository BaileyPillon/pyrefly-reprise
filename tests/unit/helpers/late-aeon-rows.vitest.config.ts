/**
 * The repo's vitest config plus the Chapters II / III aeon-row switch (`late-aeon-rows-setup.ts`).
 * Measurement only:
 *
 * ```
 * LATE_AEON_ROWS=floor npx vitest run --config tests/unit/helpers/late-aeon-rows.vitest.config.ts tests/unit/strategy-chapter2.test.ts
 * ```
 */
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import base from '../../../vitest.config.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));

export default mergeConfig(base, defineConfig({
  root,
  test: { setupFiles: [fileURLToPath(new URL('./late-aeon-rows-setup.ts', import.meta.url))] },
}));
