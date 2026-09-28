/**
 * The Chapters II / III aeon-row switch for measurement (`src/data/ffx/builds/late-aeon-rows.ts`):
 * run any FFX test or bench with the rows shipped until 2026-09-28 without editing it.
 * `LATE_AEON_ROWS=floor` (default `sourced`), through the config beside this file:
 *
 * ```
 * LATE_AEON_ROWS=floor npx vitest run --config tests/unit/helpers/late-aeon-rows.vitest.config.ts <file>
 * ```
 *
 * The builds read `LATE_AEON_ROWS` when their modules load, so the mock must be in place first.
 * FFX only. Measurement only: nothing here is shipped.
 */
import { vi } from 'vitest';

vi.mock('../../../src/data/ffx/builds/late-aeon-rows.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/data/ffx/builds/late-aeon-rows.ts')>()),
  LATE_AEON_ROWS: process.env['LATE_AEON_ROWS'] ?? 'sourced',
}));
