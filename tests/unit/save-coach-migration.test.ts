/**
 * **An old save must not be coached on its owner's own game, and must not
 * become NaN on the way in.**
 *
 * `docs/plans/onboarding-review.md` REQUIRED 7 and `critic/CHECKS.md` CHK-024.
 * Bailey's own save has cleared chapters; merged naively, the first time he
 * replayed one he would be taught what turn order is. The rule is a single
 * decision taken once, at the upgrade: a blob that predates the fields **and**
 * has a cleared chapter belongs to a veteran — every id seen, help off. A blob
 * that predates them with nothing cleared belongs to a first-timer and gets the
 * briefing exactly once.
 *
 * Game case: both. The seen-set and the switch are shared plumbing (CHK-020).
 */

import { describe, expect, it } from 'vitest';
import {
  defaultSave,
  defaultSettings,
  migrate,
  SaveStore,
  type SaveData,
} from '../../src/app/SaveData.ts';
import { ALL_COACH_IDS } from '../../src/ui/coach/coachCopy.ts';

/** A save blob from before onboarding existed. */
function legacy(cleared: boolean): Partial<SaveData> {
  return {
    version: 1,
    updatedAt: 1,
    chapters: {
      'seymour-flux': {
        id: 'seymour-flux',
        cleared,
        bestTimeMs: cleared ? 120_000 : null,
        bestTurns: cleared ? 14 : null,
        attempts: cleared ? 3 : 0,
        playTimeMs: cleared ? 400_000 : 0,
      },
    },
    unlocked: [],
    settings: { ...defaultSettings(), battleHelp: undefined as unknown as boolean },
    flags: {},
  };
}

/** A storage double that behaves like a real one. */
function memoryStorage(seed?: string): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  if (seed) map.set('k', seed);
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('onboarding save migration', () => {
  it('a pre-onboarding save with a cleared chapter is a veteran: nothing is taught', () => {
    const out = migrate(legacy(true));
    expect(out.settings.battleHelp).toBe(false);
    for (const id of ALL_COACH_IDS) expect(out.seenCoach, `${id} pre-seen`).toContain(id);
  });

  it('a pre-onboarding save with nothing cleared is a first-timer: the briefing is still due', () => {
    const out = migrate(legacy(false));
    expect(out.settings.battleHelp).toBe(true);
    expect(out.seenCoach).toEqual([]);
  });

  it('a save that already carries the fields is left exactly as it is', () => {
    const raw: Partial<SaveData> = {
      ...legacy(true),
      seenCoach: ['briefing'],
      settings: { ...defaultSettings(), battleHelp: true },
    };
    const out = migrate(raw);
    // The veteran rule fires once, at the upgrade, and never re-decides.
    expect(out.seenCoach).toEqual(['briefing']);
    expect(out.settings.battleHelp).toBe(true);
  });

  it('a corrupt seenCoach never throws and never yields NaN (CHK-024)', () => {
    const out = migrate({
      ...legacy(false),
      seenCoach: ['briefing', 7, null, { a: 1 }] as unknown as string[],
      settings: { ...defaultSettings(), battleHelp: 'yes' as unknown as boolean },
    });
    expect(out.seenCoach).toEqual(['briefing']);
    expect(typeof out.settings.battleHelp).toBe('boolean');
    expect(Number.isNaN(out.updatedAt)).toBe(false);
  });

  it('a fresh save ships with help on and nothing seen', () => {
    const fresh = defaultSave();
    expect(fresh.settings.battleHelp).toBe(true);
    expect(fresh.seenCoach).toEqual([]);
  });

  it('the store marks an id seen once, persists it, and reads it back after a reload', () => {
    const storage = memoryStorage();
    const store = new SaveStore('k', storage);
    expect(store.hasSeenCoach('briefing')).toBe(false);
    store.markCoachSeen('briefing');
    store.markCoachSeen('briefing');
    expect(store.seenCoach).toEqual(['briefing']);

    const reloaded = new SaveStore('k', storage);
    expect(reloaded.hasSeenCoach('briefing')).toBe(true);
    expect(reloaded.hasSeenCoach('ffx-turn-order')).toBe(false);
  });

  it('a save blob that is total rubbish still loads with the briefing due', () => {
    const store = new SaveStore('k', memoryStorage('{not json at all'));
    expect(store.settings.battleHelp).toBe(true);
    expect(store.hasSeenCoach('briefing')).toBe(false);
  });
});
