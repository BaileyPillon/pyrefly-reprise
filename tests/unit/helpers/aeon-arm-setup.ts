/**
 * PR-0179's bench switch: run any FFX bench under one arm of the Gagazet aeon rows without editing
 * it. `B1_AEON_ARM=a|b|c` (default `shipped`), passed as a setup file:
 *
 * ```
 * B1_AEON_ARM=a npx vitest run tests/unit/chapters/natus-shipped-bench.test.ts --setupFiles tests/unit/helpers/aeon-arm-setup.ts
 * ```
 *
 * The builds read `GAGAZET_AEON_ARM` when their modules load, so the mock must be in place first.
 * FFX only. Measurement only: nothing here is shipped.
 */
import { vi } from 'vitest';

vi.mock('../../../src/data/ffx/builds/gagazet-aeon-arms.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/data/ffx/builds/gagazet-aeon-arms.ts')>()),
  GAGAZET_AEON_ARM: process.env['B1_AEON_ARM'] ?? 'shipped',
}));
