/**
 * The voice-line inventory is current with the scripts.
 *
 * A recording is found by the hash of a line's speaker and text. Edit a spoken line and its recording silently stops matching, so
 * the inventory (ids, hashes, characters) has to be regenerated and the new line recorded: `node tools/audio/voice-inventory.mjs`.
 * This is the gate the design asks for (docs/audio/voice-integration-design.md section 9). Game case: both.
 */
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('docs/audio/voice-line-inventory.{json,md}', () => {
  it('are what tools/audio/voice-inventory.mjs writes from the scripts today', async () => {
    const r = await new Promise<{ code: number; out: string }>((resolve) =>
      execFile(process.execPath, [path.join(ROOT, 'tools/audio/voice-inventory.mjs'), '--check'], { cwd: ROOT, maxBuffer: 16 << 20 }, (err, stdout, stderr) => resolve({ code: err ? 1 : 0, out: `${stdout}${stderr}` })),
    );
    expect(r.out, 'a spoken line changed: run `node tools/audio/voice-inventory.mjs` and record the new line').toContain('voice inventory is current');
    expect(r.code).toBe(0);
  }, 120_000);
});
