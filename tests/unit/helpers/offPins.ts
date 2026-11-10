/**
 * The OFF pins of the FFX-2 Special look (step A, FFX-2 only in what is pinned; the helper is plain plumbing).
 *
 * A pin is a JSON file under `tests/fixtures/specials/off-pins/`, written by a one-off run (`PYREFLY_WRITE_PINS=1`) at the head the
 * look steps start from and compared on every run after. The Special look is a switch that is OFF in every shipped chapter; these
 * files hold what the party rows, the face stacks and the mounted HUD column are today, so a later step that changes one byte of
 * them with the switch off fails here.
 *
 * To regenerate (only when a change to these surfaces is meant and approved):
 *   PYREFLY_WRITE_PINS=1 node node_modules/vitest/vitest.mjs run tests/unit/party-rows-off-pin.test.ts tests/unit/special-off-pins.test.ts
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';

const DIR = resolve(__dirname, '..', '..', 'fixtures', 'specials', 'off-pins');

/** True in the one-off run that writes the pins. */
export const WRITING_PINS = process.env['PYREFLY_WRITE_PINS'] === '1';

/** Compare `actual` with the pin file `<name>.json` (or write it, in the one-off run). A missing file fails: a pin is never created by a normal run. */
export function expectPinned(name: string, actual: unknown): void {
  const file = resolve(DIR, `${name}.json`);
  const text = `${JSON.stringify(actual, null, 1)}\n`;
  if (WRITING_PINS) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(file, text);
    return;
  }
  if (!existsSync(file)) throw new Error(`pin ${name}.json is missing: run once with PYREFLY_WRITE_PINS=1 at the head the pins are taken from`);
  expect(JSON.parse(text)).toEqual(JSON.parse(readFileSync(file, 'utf8')));
}
