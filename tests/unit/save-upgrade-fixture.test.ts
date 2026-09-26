/**
 * CHK-024, the upgrade matrix's unit half (PR-0195, round 13): a save written by
 * the previous live build (release 20, `tests/fixtures/saves/release-20.json`,
 * exported from that build's own SaveStore) loads on this build with its clears,
 * best times and settings intact, and truncated or invalid storage boots to a
 * fresh save without throwing. The browser half is `tests/e2e/save-upgrade.spec.ts`.
 *
 * Both games: shared plumbing (`src/app/SaveData.ts`); the fixture carries an FFX
 * and an FFX-2 clear and the FFX-2 ATB setting.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SAVE_KEY, SaveStore, defaultSettings } from '../../src/app/SaveData.ts';

interface Fixture {
  localStorage: Record<string, string>;
  expect: {
    cleared: string[];
    notCleared: string[];
    bestTimeMs: Record<string, number>;
    settings: Record<string, unknown>;
  };
}

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'fixtures', 'saves', 'release-20.json'), 'utf8'),
) as Fixture;

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

const slotWith = (raw: string | undefined): Slot => {
  const slot = new Slot();
  if (raw !== undefined) slot.setItem(SAVE_KEY, raw);
  return slot;
};

describe('a release-20 save upgrades to this build (CHK-024)', () => {
  it('the fixture is a real release-20 blob under the save key', () => {
    expect(Object.keys(fixture.localStorage)).toContain(SAVE_KEY);
  });

  it('keeps every clear, best time and non-default setting', () => {
    const store = new SaveStore(SAVE_KEY, slotWith(fixture.localStorage[SAVE_KEY]));
    for (const id of fixture.expect.cleared) expect(store.isCleared(id)).toBe(true);
    for (const id of fixture.expect.notCleared) expect(store.isCleared(id)).toBe(false);
    for (const [id, ms] of Object.entries(fixture.expect.bestTimeMs)) expect(store.chapter(id).bestTimeMs).toBe(ms);
    expect(store.settings).toMatchObject(fixture.expect.settings);
    expect(store.value.seenCoach).toContain('briefing');
  });

  it('survives a save and a reload on this build unchanged', () => {
    const slot = slotWith(fixture.localStorage[SAVE_KEY]);
    new SaveStore(SAVE_KEY, slot).save();
    const again = new SaveStore(SAVE_KEY, slot);
    expect(again.settings).toMatchObject(fixture.expect.settings);
    for (const id of fixture.expect.cleared) expect(again.isCleared(id)).toBe(true);
  });

  it('truncated JSON, a non-object and garbage boot to a fresh save without throwing', () => {
    const raw = fixture.localStorage[SAVE_KEY] ?? '';
    for (const bad of [raw.slice(0, Math.floor(raw.length / 2)), 'null', '42', '{"version":1,"chapters":', '\u0000\u0001']) {
      let store: SaveStore | null = null;
      expect(() => {
        store = new SaveStore(SAVE_KEY, slotWith(bad));
      }).not.toThrow();
      const s = store as unknown as SaveStore;
      expect(Object.keys(s.value.chapters)).toEqual([]);
      expect(s.settings.masterVolume).toBe(defaultSettings().masterVolume);
    }
  });
});
