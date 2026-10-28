/**
 * PORTABLE SAVES (ChatGPT point 9; the saves lane of 2026-10-28), the "today" proof: with the address word
 * `?saveport=on` OFF, which is the default, nothing about how a save is read, written or shown changes.
 *
 * The three fingerprints below were taken on the build BEFORE the portable-save code existed (origin/main
 * e50a2b22d) and are pinned here as SHA-256 hex strings:
 *
 *  1. a fixed sequence of the store's own writes (attempt, play time, clear, unlock, coaching, flag, settings)
 *     on a fake `localStorage` with a frozen clock: the exact string left in the slot;
 *  2. every fixture save under `tests/fixtures/saves/` loaded through the store: the snapshot it reads as;
 *  3. the pause screen's OPTIONS columns for an FFX, an FFX-2 and an FF7 chapter: the rows it prints.
 *
 * A change to any of them is a change to what a player's save does today, and fails here first. Re-pin only
 * on purpose, with the reason in the commit (and a deep review: this is the save-data class).
 *
 * Game case: both (shared plumbing). The rows are asserted per game because the list differs by game.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SAVE_KEY, SaveStore } from '../../src/app/SaveData.ts';
import { optionsColumns } from '../../src/app/screens/pause/panels.ts';
import { defaultSettings } from '../../src/app/SaveData.ts';

const sha = (text: string): string => createHash('sha256').update(text).digest('hex');

class Slot {
  readonly items = new Map<string, string>();
  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
  removeItem(key: string): void {
    this.items.delete(key);
  }
}

/** The fixed sequence: every public write path of the store, in an order a play session uses them. */
function sequenceJson(): string {
  const slot = new Slot();
  const store = new SaveStore(SAVE_KEY, slot);
  store.recordAttempt('seymour-flux');
  for (let i = 0; i < 6; i++) store.addPlayTime('seymour-flux', 1000);
  store.recordClear('seymour-flux', 91_500, 14);
  store.recordAttempt('ffx2-bahamut');
  store.addPlayTime('ffx2-bahamut', 700);
  store.flushPlayTime();
  store.unlock('bestiary-seymour');
  store.markCoachSeen('briefing');
  store.setFlag('seen-intro', true);
  store.setFlag('runs', 3);
  store.setSettings({ masterVolume: 0.5, ffx2Atb: 'active', textSpeed: 1.5 });
  return slot.getItem(SAVE_KEY) ?? '';
}

// Taken on origin/main e50a2b22d, before any portable-save code existed (SaveData.ts, panels.ts and PauseOverlays.ts untouched), on a frozen clock.
const GOLDEN_SEQUENCE = "4e2714578baf6c0b291a516c413042b224dcc8ad366c74862b7fbbafa74c7500";
const GOLDEN_FIXTURES: Record<string, string> = {
  "release-20": "a683ef6abd11e27311e987bec0fe4b4756b4f3d747d446d90b333beb3016ff4a",
  "release-25-main": "547bdb4f38c36b392a6747ebb0764222f910e407f01249ea83fd8ebd86b32601",
  "release-28-main": "f01fc104326436dd521fed8e5df91d366fb2b2b47157f226dc99c0011ee557e2",
  "release-29": "0277eaf404a4235ee7303e701eb9c2fd083f9015783b64807e2901483e40a2ec",
  "release-30-sfx-b": "c3e5b986b32a00a05e4ecf9183fa54f7bac24000ed0d147f84d5a479f015f6be",
  "release-30": "164486382c3414955184c3aa77d0468f396c262943b5487ec196501608088a55",
  "release-31a-sfx-b": "b451dd12ef1b8dd67bed57e4307ab209d258be8f2372006ce757ddabfdf05ca4",
  "release-31a": "e7dbb601917dfd4e4511ad0984c6e6cee5c5b46325b7c1675d99473975095903",
  "release-33": "24a8d3d3b90f2bacdf878a0a287937926bd8f20b3a8372c2cf3c405ca6edeba3",
  "release-34": "b3722df3b521b266ae9832e6758f7d17b1afa4430272d3a8f6ba52d6125a5346",
  "release-35": "b60779a6ec14d5ec5230c572b6a4db20ba42f3e1d548fb118ac62ffb62849033",
  "release-37.1": "280a479bf1db6a04029d6099cda181518ce1dbb1f5334cb0b8dc470b1625a876",
};
const GOLDEN_ROWS: Record<string, string> = {
  ffx: "c6e50c890015a83ad00baafb6ec7e59a90bc888ea5659ebe59d9bfdfa3c2983c",
  ffx2: "b7a071c9e0cd0b0395a6efc5ce945f81bbddaa45fd70b322ef40b5544520049d",
  ff7: "28be018ab146feab961cf3152151e8770a9f4872b3be1e59dfabca8d3f8cfa2a",
};

const FIXTURES = [
  'release-20',
  'release-25-main',
  'release-28-main',
  'release-29',
  'release-30-sfx-b',
  'release-30',
  'release-31a-sfx-b',
  'release-31a',
  'release-33',
  'release-34',
  'release-35',
  'release-37.1',
];

function fixtureSnapshot(name: string): string {
  const fixture = JSON.parse(readFileSync(join(__dirname, '..', 'fixtures', 'saves', `${name}.json`), 'utf8')) as {
    localStorage: Record<string, string>;
  };
  const slot = new Slot();
  slot.setItem(SAVE_KEY, fixture.localStorage[SAVE_KEY] ?? '');
  return JSON.stringify(new SaveStore(SAVE_KEY, slot).snapshot());
}

function rowsJson(game: 'ffx' | 'ffx2' | 'ff7'): string {
  return JSON.stringify(
    optionsColumns({
      settings: defaultSettings(),
      battleHelpOn: true,
      canRestart: true,
      canChapterSelect: true,
      canQuit: true,
      extraRows: [],
      game,
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-28T12:00:00.000Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('with ?saveport off, a save is read, written and listed exactly as before', () => {
  it('a session of writes leaves the same string in the slot', () => {
    expect(sha(sequenceJson())).toBe(GOLDEN_SEQUENCE);
  });

  for (const name of FIXTURES) {
    it(`the ${name} fixture reads as it did`, () => {
      expect(sha(fixtureSnapshot(name))).toBe(GOLDEN_FIXTURES[name]);
    });
  }

  for (const game of ['ffx', 'ffx2', 'ff7'] as const) {
    it(`the ${game} OPTIONS columns print the same rows`, () => {
      expect(sha(rowsJson(game))).toBe(GOLDEN_ROWS[game]);
    });
  }
});
